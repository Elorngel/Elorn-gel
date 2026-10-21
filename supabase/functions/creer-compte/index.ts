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

  const { error: errFiche } = await admin.from('clients').insert({ id: cree.user.id, email, ...fiche })
  if (errFiche) {
    // Pas de compte à moitié créé : on annule.
    await admin.auth.admin.deleteUser(cree.user.id)
    console.error('Fiche client non enregistrée :', errFiche)
    return json({ erreur: 'Création du compte impossible.' }, 500)
  }

  return json({ ok: true })
})
