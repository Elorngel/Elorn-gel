// Création d'un compte client, côté serveur. Elle évite la confirmation par email de Supabase,
// qui ne peut pas fonctionner tant que le domaine bontin.fr n'est pas vérifié dans Resend :
// le compte est actif tout de suite, puis le site connecte le client avec son mot de passe.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const texte = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ erreur: 'Méthode non autorisée.' }, 405)

  let d: Record<string, unknown>
  try {
    d = await req.json()
  } catch {
    return json({ erreur: 'Demande illisible.' }, 400)
  }

  const email = texte(d.email, 254).toLowerCase()
  const motDePasse = typeof d.motDePasse === 'string' ? d.motDePasse : ''
  const fiche = {
    prenom: texte(d.prenom, 80),
    nom: texte(d.nom, 80),
    telephone: texte(d.telephone, 30),
    date_naissance: texte(d.dateNaissance, 10),
    adresse: texte(d.adresse, 200),
    code_postal: texte(d.codePostal, 5),
    ville: texte(d.ville, 100),
    complement: texte(d.complement, 200) || null,
    accepte_offres: d.accepteOffres === true,
    source: texte(d.source, 60) || null,
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ erreur: 'Adresse email invalide.' }, 400)
  if (motDePasse.length < 8) return json({ erreur: 'Le mot de passe doit faire au moins 8 caractères.' }, 400)
  if (!fiche.prenom || !fiche.nom) return json({ erreur: 'Prénom et nom obligatoires.' }, 400)
  if (fiche.telephone.replace(/\D/g, '').length < 10) return json({ erreur: 'Numéro de téléphone invalide.' }, 400)
  if (!/^\d{5}$/.test(fiche.code_postal)) return json({ erreur: 'Code postal invalide.' }, 400)
  if (!fiche.adresse || !fiche.ville) return json({ erreur: 'Adresse incomplète.' }, 400)
  if (d.accepteCgv !== true) return json({ erreur: 'Merci d’accepter les conditions générales de vente.' }, 400)

  const naissance = new Date(`${fiche.date_naissance}T12:00:00`)
  const age = (Date.now() - naissance.getTime()) / (365.25 * 24 * 3600 * 1000)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fiche.date_naissance) || isNaN(age) || age < 10 || age > 110) {
    return json({ erreur: 'Date de naissance invalide.' }, 400)
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Parrainage : code facultatif d'un client existant. On le vérifie AVANT de créer le compte.
  const codeParrain = texte(d.codeParrain, 30).toUpperCase().replace(/\s/g, '')
  let parrain: { id: string; telephone: string; adresse: string; code_postal: string } | null = null
  const { data: reglages } = await admin
    .from('parametres_site')
    .select('parrainage_actif, parrainage_montant, parrainage_minimum, parrainage_validite_mois')
    .eq('id', 1)
    .single()
  if (codeParrain && reglages?.parrainage_actif) {
    const { data } = await admin
      .from('clients')
      .select('id, telephone, adresse, code_postal')
      .eq('code_parrain', codeParrain)
      .maybeSingle()
    if (!data) return json({ erreur: 'Code parrain inconnu : vérifiez-le, ou laissez la case vide.' }, 400)
    // Garde-fou : on ne se parraine pas soi-même (même téléphone, ou même adresse).
    const chiffres = (t: string) => (t || '').replace(/\D/g, '').slice(-9)
    const adresseSimple = (a: string, cp: string) => `${(a || '').toLowerCase().replace(/[^a-z0-9]/g, '')}|${cp}`
    if (
      chiffres(data.telephone) === chiffres(fiche.telephone) ||
      adresseSimple(data.adresse, data.code_postal) === adresseSimple(fiche.adresse, fiche.code_postal)
    ) {
      return json({ erreur: 'Ce code parrain ne peut pas être utilisé pour ce compte (même foyer que le parrain).' }, 400)
    }
    parrain = data
  }

  const { data: cree, error: errCreation } = await admin.auth.admin.createUser({
    email,
    password: motDePasse,
    email_confirm: true,
    user_metadata: { prenom: fiche.prenom, nom: fiche.nom },
  })
  if (errCreation || !cree?.user) {
    const deja = /already|registered|exists/i.test(errCreation?.message || '')
    return json(
      { erreur: deja ? 'Un compte existe déjà avec cet email : connectez-vous.' : 'Création du compte impossible.', deja },
      deja ? 409 : 500
    )
  }

  const { error: errFiche } = await admin
    .from('clients')
    .insert({ id: cree.user.id, email, ...fiche, parrain_id: parrain?.id ?? null })
  if (errFiche) {
    // Pas de compte à moitié créé : on annule.
    await admin.auth.admin.deleteUser(cree.user.id)
    console.error('Fiche client non enregistrée :', errFiche)
    return json({ erreur: 'Création du compte impossible.' }, 500)
  }

  // Bon de bienvenue du filleul (valable N mois, à partir d'un minimum de commande).
  if (parrain && reglages) {
    const fin = new Date()
    fin.setMonth(fin.getMonth() + (reglages.parrainage_validite_mois || 1))
    const { error: errBon } = await admin.from('bons_achat').insert({
      client_id: cree.user.id,
      montant: reglages.parrainage_montant,
      minimum_commande: reglages.parrainage_minimum,
      motif: 'parrainage_filleul',
      valable_jusqu_au: fin.toISOString(),
    })
    if (errBon) console.error('Bon de parrainage non créé :', errBon)
  }

  return json({ ok: true, parraine: !!parrain })
})
