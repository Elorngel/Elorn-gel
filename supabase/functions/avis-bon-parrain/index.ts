// Email au parrain quand son bon de parrainage est créé (06/11/2026).
// Le bon lui-même est créé par la base (déclencheur SQL recompenser_parrain) quand l'admin passe la
// 1re commande du filleul en « Livrée / retirée ». Juste après, l'admin (useOrders.updateStatus) appelle
// cette fonction avec le numéro de la commande : elle retrouve le bon du parrain et lui envoie l'email,
// une seule fois par bon (bons_achat.email_envoye_le). Réservée aux admins.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import { emailBonParrain } from '../send-order-emails/gabarit.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'onboarding@resend.dev'
const REPLY_TO = Deno.env.get('REPLY_TO') ?? 'contact@bontin.fr'
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://bontin.fr'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, erreur: 'Méthode non autorisée.' }, 405)

  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const jeton = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
    const { data: auth } = await admin.auth.getUser(jeton)
    const user = auth?.user
    if (!user) return json({ ok: false, erreur: 'Connexion requise.' }, 401)
    const { data: ligneAdmin } = await admin.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
    if (!ligneAdmin) return json({ ok: false, erreur: 'Accès refusé.' }, 403)

    const corps = await req.json().catch(() => null)
    const commandeId = typeof corps?.commandeId === 'string' ? corps.commandeId : ''
    if (!/^[0-9a-f-]{36}$/i.test(commandeId)) return json({ ok: false, erreur: 'Commande inconnue.' }, 400)

    const { data: commande } = await admin.from('commandes').select('client_id').eq('id', commandeId).maybeSingle()
    if (!commande?.client_id) return json({ ok: true, rien: 'pas de compte client' })

    // Bon du parrain lié à ce filleul, pas encore annoncé.
    const { data: bon } = await admin
      .from('bons_achat')
      .select('*')
      .eq('motif', 'parrainage_parrain')
      .eq('filleul_id', commande.client_id)
      .is('email_envoye_le', null)
      .maybeSingle()
    if (!bon) return json({ ok: true, rien: 'aucun bon à annoncer' })

    const [{ data: parrain }, { data: filleul }, { data: reglages }] = await Promise.all([
      admin.from('clients').select('prenom, email').eq('id', bon.client_id).maybeSingle(),
      admin.from('clients').select('prenom').eq('id', commande.client_id).maybeSingle(),
      admin.from('parametres_site').select('logo_url, contact_telephone, adresse').eq('id', 1).maybeSingle(),
    ])
    if (!parrain?.email) return json({ ok: true, rien: 'parrain sans email' })

    // Un seul envoi par bon : on le « réserve » avant d'envoyer.
    const { data: reserve } = await admin
      .from('bons_achat')
      .update({ email_envoye_le: new Date().toISOString() })
      .eq('id', bon.id)
      .is('email_envoye_le', null)
      .select('id')
    if (!reserve?.length) return json({ ok: true, dejaEnvoye: true })

    const infos = {
      logo: reglages?.logo_url || `${SITE_URL}/logo.png`,
      telephone: reglages?.contact_telephone || '02 56 31 11 97',
      adresse: reglages?.adresse || 'ZI de Keriel Nord, 29800 Plouédern',
      site: SITE_URL,
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `Bontin <${FROM_EMAIL}>`,
        to: parrain.email,
        reply_to: REPLY_TO,
        subject: `${Number(bon.montant)} € offerts : merci pour votre parrainage !`,
        html: emailBonParrain(bon, parrain, filleul?.prenom, infos),
      }),
    })
    const resultat = { status: res.status, body: await res.text() }
    if (res.status >= 300) {
      // Échec chez Resend : on libère le bon pour pouvoir réessayer.
      await admin.from('bons_achat').update({ email_envoye_le: null }).eq('id', bon.id)
    }
    console.log('Email bon parrain :', JSON.stringify(resultat))
    return json({ ok: res.status < 300, resultat })
  } catch (err) {
    console.error('Erreur fonction avis-bon-parrain :', err)
    return json({ ok: false, erreur: 'Envoi impossible.' }, 500)
  }
})
