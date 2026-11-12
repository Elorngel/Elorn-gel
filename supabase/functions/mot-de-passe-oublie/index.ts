// « Mot de passe oublié » (12/11/2026).
// Le client tape son email ; s'il a un compte client, on lui envoie (depuis contact@bontin.fr, aux couleurs du
// site) un lien vers https://bontin.fr/nouveau-mot-de-passe?jeton=… où il choisit un nouveau mot de passe.
// - Réponse TOUJOURS identique, qu'il y ait un compte ou non (on ne peut pas savoir qui est client).
// - Comptes admin (…@admin.bontin.fr) exclus.
// - Limite : 3 demandes par heure et par adresse, 30 par heure en tout (table demandes_mot_de_passe).
// - Le jeton n'est utilisé qu'au moment où le client valide son nouveau mot de passe (verifyOtp sur la page) :
//   les antivirus de messagerie qui « ouvrent » les liens ne peuvent pas le consommer. Valable 1 heure.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import { emailMotDePasse } from '../send-order-emails/gabarit.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_CONTACT = Deno.env.get('FROM_CONTACT') ?? 'contact@bontin.fr'
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://bontin.fr'
const REPONSE = { ok: true, message: 'Si un compte existe avec cette adresse, un email vient de partir.' }

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, erreur: 'Méthode non autorisée.' }, 405)

  try {
    const corps = await req.json().catch(() => null)
    const email = String(corps?.email || '').trim().toLowerCase().slice(0, 254)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, erreur: 'Adresse email invalide.' }, 400)
    if (email.endsWith('@admin.bontin.fr')) return json(REPONSE)

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Limites d'envoi.
    const ilYaUneHeure = new Date(Date.now() - 3600_000).toISOString()
    const [{ count: pourEmail }, { count: total }] = await Promise.all([
      admin.from('demandes_mot_de_passe').select('id', { count: 'exact', head: true }).eq('email', email).gt('created_at', ilYaUneHeure),
      admin.from('demandes_mot_de_passe').select('id', { count: 'exact', head: true }).gt('created_at', ilYaUneHeure),
    ])
    if ((pourEmail ?? 0) >= 3 || (total ?? 0) >= 30) return json(REPONSE)
    await admin.from('demandes_mot_de_passe').insert({ email })

    // Seulement les comptes clients du site.
    const { data: client } = await admin.from('clients').select('prenom').eq('email', email).maybeSingle()
    if (!client) return json(REPONSE)

    const { data: lien, error } = await admin.auth.admin.generateLink({ type: 'recovery', email })
    const jeton = lien?.properties?.hashed_token
    if (error || !jeton) {
      console.error('Lien de réinitialisation impossible :', error)
      return json(REPONSE)
    }

    const { data: reglages } = await admin
      .from('parametres_site')
      .select('logo_url, contact_telephone, adresse')
      .eq('id', 1)
      .maybeSingle()
    const infos = {
      logo: reglages?.logo_url || `${SITE_URL}/logo.png`,
      telephone: reglages?.contact_telephone || '02 56 31 11 97',
      adresse: reglages?.adresse || 'ZI de Keriel Nord, 29800 Plouédern',
      site: SITE_URL,
    }
    const url = `${SITE_URL}/nouveau-mot-de-passe?jeton=${encodeURIComponent(jeton)}`
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `Bontin <${FROM_CONTACT}>`,
        to: email,
        subject: 'Bontin : choisissez un nouveau mot de passe',
        html: emailMotDePasse(client.prenom, url, infos),
      }),
    })
    if (res.status >= 300) console.error('Envoi Resend refusé :', res.status, await res.text())
    return json(REPONSE)
  } catch (err) {
    console.error('Erreur fonction mot-de-passe-oublie :', err)
    return json({ ok: false, erreur: 'Envoi impossible pour le moment, réessayez ou appelez-nous.' }, 500)
  }
})
