// Enregistrement d'une commande, côté serveur (23/10/2026).
// Le navigateur n'envoie que les produits choisis, les quantités et les coordonnées : les prix, le
// code promo et le bon d'achat sont recalculés ici à partir de la base (même calcul que le panier,
// fichier partagé ../_shared/calculCommande.js). Un client ne peut donc ni changer un prix, ni
// réutiliser un code, ni utiliser un bon qui n'est pas le sien.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import { calculerCommande, articleIndisponible, nomLigne, aujourdhuiParis } from '../_shared/calculCommande.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const texte = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const COLONNES_PRODUIT =
  'id, nom, nom_retrait, actif, en_rupture, en_promo, taux_promo, prix_promo, promo_debut, promo_fin, en_destockage, prix_destockage, prix_livraison, dispo_livraison, dispo_retrait'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ erreur: 'Méthode non autorisée.' }, 405)

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    // 1. Qui commande ?
    const jeton = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
    const { data: auth } = await admin.auth.getUser(jeton)
    const user = auth?.user
    if (!user) return json({ erreur: 'Connectez-vous pour valider votre commande.' }, 401)

    const d = await req.json().catch(() => null)
    if (!d) return json({ erreur: 'Demande illisible.' }, 400)

    const mode = d.mode === 'retrait' ? 'retrait' : d.mode === 'livraison' ? 'livraison' : ''
    if (!mode) return json({ erreur: 'Choisissez livraison ou retrait.' }, 400)

    const demandes = Array.isArray(d.lignes) ? d.lignes.slice(0, 100) : []
    if (demandes.length === 0) return json({ erreur: 'Votre panier est vide.' }, 400)
    for (const l of demandes) {
      if (!UUID.test(String(l?.produitId)) || (l.varianteId != null && !UUID.test(String(l.varianteId)))) {
        return json({ erreur: 'Panier illisible : videz-le et recommencez.' }, 400)
      }
      if (!Number.isInteger(l.quantite) || l.quantite < 1 || l.quantite > 99) {
        return json({ erreur: 'Quantité invalide.' }, 400)
      }
    }

    const nom = texte(d.nom, 120)
    const telephone = texte(d.telephone, 30)
    if (!nom || telephone.replace(/\D/g, '').length < 10) return json({ erreur: 'Nom ou téléphone manquant.' }, 400)
    const creneau = texte(d.creneau, 120)
    if (!creneau) return json({ erreur: 'Choisissez un jour et un créneau.' }, 400)
    const adresse = texte(d.adresse, 300)
    const codePostal = texte(d.codePostal, 5)
    const ville = texte(d.ville, 100)
    if (mode === 'livraison' && (!adresse || !/^\d{5}$/.test(codePostal) || !ville)) {
      return json({ erreur: 'Adresse de livraison incomplète.' }, 400)
    }

    // 2. Données à jour : réglages, produits, conditionnements, compte, admin ?
    const produitIds = [...new Set(demandes.map((l: any) => l.produitId))]
    const varianteIds = [...new Set(demandes.map((l: any) => l.varianteId).filter(Boolean))]
    const [reglagesR, produitsR, variantesR, ficheR, adminR] = await Promise.all([
      admin.from('parametres_site').select('remise_retrait, frais_livraison, en_maintenance').eq('id', 1).single(),
      admin.from('produits').select(COLONNES_PRODUIT).in('id', produitIds),
      varianteIds.length
        ? admin.from('variantes_produit').select('id, produit_id, poids, prix_livraison, dispo_livraison, dispo_retrait').in('id', varianteIds)
        : Promise.resolve({ data: [] as any[] }),
      admin.from('clients').select('email').eq('id', user.id).maybeSingle(),
      admin.from('admins').select('user_id').eq('user_id', user.id).maybeSingle(),
    ])
    const reglages = reglagesR.data
    const estAdmin = !!adminR.data
    if (!reglages) throw new Error('réglages illisibles')
    if (reglages.en_maintenance && !estAdmin) {
      return json({ erreur: 'Le site est en maintenance : les commandes reprennent très vite.' }, 503)
    }

    const produits = new Map((produitsR.data || []).map((p: any) => [p.id, p]))
    const variantes = new Map((variantesR.data || []).map((v: any) => [v.id, v]))
    const lignes = []
    for (const l of demandes) {
      const produit = produits.get(l.produitId)
      const variante = l.varianteId ? variantes.get(l.varianteId) : null
      if (l.varianteId && (!variante || variante.produit_id !== l.produitId)) {
        return json({ erreur: 'Un conditionnement de votre panier n\'existe plus : retirez-le.' }, 409)
      }
      const raison = articleIndisponible(produit, variante, mode)
      if (raison) return json({ erreur: `${produit?.nom ?? 'Un produit'} : ${raison}` }, 409)
      lignes.push({ produit, variante, quantite: l.quantite })
    }

    // 3. Code promo
    const today = aujourdhuiParis()
    let code = null
    const codeSaisi = texte(d.codePromo, 30).toUpperCase()
    if (codeSaisi) {
      const { data: c } = await admin.from('codes_promo').select('*').eq('code', codeSaisi).maybeSingle()
      const valable = c && c.actif && (!c.debut || today >= c.debut) && (!c.fin || today <= c.fin)
      if (!valable) return json({ erreur: 'Ce code promo n\'existe pas ou n\'est plus valable.' }, 409)
      const { count } = await admin.from('commandes').select('id', { count: 'exact', head: true }).eq('code_promo', c.code)
      if (c.max_utilisations && (count ?? 0) >= c.max_utilisations) {
        return json({ erreur: 'Ce code promo a déjà été utilisé le nombre maximum de fois.' }, 409)
      }
      if (!estAdmin) {
        const { count: deja } = await admin
          .from('commandes')
          .select('id', { count: 'exact', head: true })
          .eq('code_promo', c.code)
          .eq('client_id', user.id)
          .eq('saisie_par_admin', false)
        if ((deja ?? 0) > 0) return json({ erreur: 'Vous avez déjà utilisé ce code promo.' }, 409)
      }
      code = c
    }

    // 4. Bon d'achat du client (le plus proche de son expiration), s'il atteint le minimum.
    let bon = null
    if (!estAdmin) {
      const { data: bons } = await admin
        .from('bons_achat')
        .select('id, montant, minimum_commande, motif, valable_jusqu_au')
        .eq('client_id', user.id)
        .is('commande_id', null)
        .gt('valable_jusqu_au', new Date().toISOString())
        .order('valable_jusqu_au', { ascending: true })
      const avant = calculerCommande({ lignes, mode, remiseRetrait: reglages.remise_retrait, fraisLivraison: reglages.frais_livraison, code, today })
      bon = (bons || []).find((b: any) => avant.sousTotal >= Number(b.minimum_commande || 0)) || null
    }

    const calcul = calculerCommande({
      lignes,
      mode,
      remiseRetrait: reglages.remise_retrait,
      fraisLivraison: reglages.frais_livraison,
      code,
      bon,
      today,
    })

    // Le panier affichait un autre total (prix modifié entre-temps) : on prévient au lieu d'enregistrer.
    if (typeof d.totalAttendu === 'number' && Math.abs(d.totalAttendu - calcul.total) > 0.01) {
      return json({ erreur: 'Les prix de votre panier viennent d\'être mis à jour : vérifiez le total et validez à nouveau.', total: calcul.total }, 409)
    }

    // 5. Enregistrement
    const { data: commande, error: errCommande } = await admin
      .from('commandes')
      .insert({
        client_id: user.id,
        saisie_par_admin: estAdmin,
        nom_client: nom,
        telephone,
        email: estAdmin ? texte(d.email, 254) || null : ficheR.data?.email || user.email,
        mode,
        note: texte(d.note, 1000) || null,
        adresse_livraison: mode === 'livraison' ? adresse : null,
        code_postal: mode === 'livraison' ? codePostal : null,
        ville: mode === 'livraison' ? ville : null,
        creneau_retrait: mode === 'retrait' ? creneau : null,
        creneau_livraison: mode === 'livraison' ? creneau : null,
        sous_total: calcul.sousTotal,
        code_promo: code ? code.code : null,
        remise_code: calcul.remiseCode,
        bon_id: calcul.remiseBon > 0 ? bon.id : null,
        remise_bon: calcul.remiseBon,
        frais_livraison: calcul.frais,
        total: calcul.total,
      })
      .select()
      .single()
    if (errCommande) {
      if (errCommande.code === '23505') return json({ erreur: 'Vous avez déjà utilisé ce code promo.' }, 409)
      throw errCommande
    }

    const annuler = async (message: string, status = 409) => {
      await admin.from('commandes').delete().eq('id', commande.id)
      return json({ erreur: message }, status)
    }

    const lignesBase = calcul.lignes.map((l: any) => ({
      commande_id: commande.id,
      produit_id: l.produit.id,
      variante_id: l.variante?.id ?? null,
      nom_produit: nomLigne(l.produit, l.variante, mode),
      prix_unitaire: l.prixUnitaire,
      quantite: l.quantite,
    }))
    const { data: lignesEnregistrees, error: errLignes } = await admin.from('commande_lignes').insert(lignesBase).select()
    if (errLignes) {
      console.error('Lignes non enregistrées :', errLignes)
      return await annuler("La commande n'a pas pu être enregistrée, réessayez.", 500)
    }

    // Le bon n'est utilisé qu'une fois, même si deux commandes partent en même temps.
    if (calcul.remiseBon > 0) {
      const { data: pris } = await admin
        .from('bons_achat')
        .update({ commande_id: commande.id })
        .eq('id', bon.id)
        .is('commande_id', null)
        .select('id')
      if (!pris?.length) return await annuler('Votre bon d\'achat vient déjà d\'être utilisé : validez à nouveau.')
    }

    // Plafond du code promo : on recompte après coup (deux commandes simultanées).
    if (code?.max_utilisations) {
      const { count } = await admin.from('commandes').select('id', { count: 'exact', head: true }).eq('code_promo', code.code)
      if ((count ?? 0) > code.max_utilisations) {
        return await annuler('Ce code promo vient d\'atteindre son nombre maximum d\'utilisations.')
      }
    }

    return json({ ok: true, commande: { ...commande, commande_lignes: lignesEnregistrees } })
  } catch (err) {
    console.error('Erreur fonction passer-commande :', err)
    return json({ erreur: "La commande n'a pas pu être enregistrée, réessayez." }, 500)
  }
})
