// Emails de commande (confirmation au client + avis à Bontin).
// Sécurité (23/10/2026) : le navigateur n'envoie plus que le numéro de la commande. La fonction
// relit la commande dans la base, vérifie qu'elle appartient à la personne connectée (ou que
// c'est un admin), n'envoie qu'une seule fois par commande, et le client ne peut recevoir
// l'email qu'à l'adresse de son propre compte. Sans ça, n'importe qui aurait pu faire partir
// des emails « Bontin » au contenu inventé vers n'importe quelle adresse.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import { emailClient, emailAdmin, numeroCommande } from './gabarit.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
// Tant que le domaine bontin.fr n'est pas vérifié dans Resend, Resend impose
// l'expéditeur de test ci-dessous et n'autorise l'envoi qu'à l'adresse du
// compte Resend. Une fois le domaine vérifié, il suffit de régler la variable
// (sans toucher au code) :
//   supabase secrets set FROM_EMAIL=commandes@bontin.fr
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'onboarding@resend.dev'
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') ?? 'logistique@elorngel.fr'
// Adresse qui reçoit les réponses des clients à leur confirmation (l'expéditeur commandes@ n'a pas de boîte).
const REPLY_TO = Deno.env.get('REPLY_TO') ?? 'contact@bontin.fr'
// Adresse du site dans les boutons des emails (à passer sur https://bontin.fr le jour de la bascule).
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://elorn-gel.vercel.app'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

async function envoyer(message: Record<string, unknown>) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  })
  return { status: res.status, body: await res.text() }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, erreur: 'Méthode non autorisée.' }, 405)

  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Qui appelle ? (jeton de connexion envoyé automatiquement par le site)
    const jeton = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
    const { data: auth } = await admin.auth.getUser(jeton)
    const user = auth?.user
    if (!user) return json({ ok: false, erreur: 'Connexion requise.' }, 401)

    const corps = await req.json().catch(() => null)
    const commandeId = typeof corps?.commandeId === 'string' ? corps.commandeId : ''
    if (!/^[0-9a-f-]{36}$/i.test(commandeId)) return json({ ok: false, erreur: 'Commande inconnue.' }, 400)

    const [{ data: commande }, { data: ligneAdmin }] = await Promise.all([
      admin.from('commandes').select('*, commande_lignes(*)').eq('id', commandeId).maybeSingle(),
      admin.from('admins').select('user_id').eq('user_id', user.id).maybeSingle(),
    ])
    const estAdmin = !!ligneAdmin
    if (!commande) return json({ ok: false, erreur: 'Commande inconnue.' }, 404)
    if (commande.client_id !== user.id && !estAdmin) return json({ ok: false, erreur: 'Accès refusé.' }, 403)

    // Une seule fois par commande : on « réserve » l'envoi, et un second appel ne fait rien.
    const { data: reserve } = await admin
      .from('commandes')
      .update({ email_envoye_le: new Date().toISOString() })
      .eq('id', commandeId)
      .is('email_envoye_le', null)
      .select('id')
    if (!reserve?.length) return json({ ok: true, dejaEnvoye: true })

    // Coordonnées et logo : réglages du site (admin), comme sur le site.
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
    const retrait = commande.mode === 'retrait'
    const creneau = retrait ? commande.creneau_retrait : commande.creneau_livraison

    // Client : uniquement l'adresse de son compte. Commande saisie par un admin (au téléphone) :
    // l'adresse notée sur la commande.
    const destinataire = estAdmin ? commande.email : user.email
    const results: Record<string, unknown>[] = []

    if (destinataire) {
      results.push({
        cible: 'client',
        ...(await envoyer({
          from: `Bontin <${FROM_EMAIL}>`,
          to: destinataire,
          reply_to: REPLY_TO,
          subject: `Votre commande Bontin n° ${numeroCommande(commande)} est confirmée`,
          html: emailClient(commande, infos),
        })),
      })
    }

    results.push({
      cible: 'admin',
      ...(await envoyer({
        from: `Site Bontin <${FROM_EMAIL}>`,
        to: ADMIN_EMAIL,
        reply_to: destinataire || undefined,
        subject: `Nouvelle commande ${retrait ? 'retrait' : 'livraison'} — ${String(commande.nom_client).slice(0, 80)}${creneau ? ` — ${String(creneau).slice(0, 60)}` : ''}`,
        html: emailAdmin(commande, infos),
      })),
    })

    console.log('Résultat envoi emails :', JSON.stringify(results))
    return json({ ok: true, results })
  } catch (err) {
    console.error('Erreur fonction send-order-emails :', err)
    return json({ ok: false, erreur: 'Envoi impossible.' }, 500)
  }
})
