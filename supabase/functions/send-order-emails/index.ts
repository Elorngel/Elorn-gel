// Emails de commande (confirmation au client + avis à Bontin).
// Sécurité (23/10/2026) : le navigateur n'envoie plus que le numéro de la commande. La fonction
// relit la commande dans la base, vérifie qu'elle appartient à la personne connectée (ou que
// c'est un admin), n'envoie qu'une seule fois par commande, et le client ne peut recevoir
// l'email qu'à l'adresse de son propre compte. Sans ça, n'importe qui aurait pu faire partir
// des emails « Bontin » au contenu inventé vers n'importe quelle adresse.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

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

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

// Les champs saisis par les clients sont insérés dans du HTML : on les échappe
// pour qu'un nom ou une note ne puisse pas injecter de code dans l'email.
function esc(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const euros = (v: unknown) => `${Number(v ?? 0).toFixed(2)} €`

function buildHtml(c: any) {
  const lignesHtml = (c.commande_lignes || [])
    .map(
      (l: any) => `
        <tr>
          <td style="padding:4px 8px;border-bottom:1px solid #eee;">${esc(l.nom_produit)}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center;">${Number(l.quantite)}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;">${euros(Number(l.prix_unitaire) * Number(l.quantite))}</td>
        </tr>`
    )
    .join('')

  const retrait = c.mode === 'retrait'
  const creneau = retrait ? c.creneau_retrait : c.creneau_livraison

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1b231a;">
      <h2 style="color:#23422b;">BONTIN</h2>
      <p>
        <strong>Client :</strong> ${esc(c.nom_client)}<br/>
        <strong>Téléphone :</strong> ${esc(c.telephone)}<br/>
        ${c.email ? `<strong>Email :</strong> ${esc(c.email)}<br/>` : ''}
        <strong>Mode :</strong> ${retrait ? 'Retrait au dépôt' : 'Livraison'}<br/>
        ${creneau ? `<strong>Créneau :</strong> ${esc(creneau)}<br/>` : ''}
        ${c.adresse_livraison ? `<strong>Adresse :</strong> ${esc(c.adresse_livraison)}, ${esc(c.code_postal)} ${esc(c.ville)}<br/>` : ''}
        ${c.note ? `<strong>Note :</strong> ${esc(c.note)}<br/>` : ''}
      </p>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left;padding:4px 8px;">Produit</th>
            <th style="padding:4px 8px;">Qté</th>
            <th style="text-align:right;padding:4px 8px;">Sous-total</th>
          </tr>
        </thead>
        <tbody>${lignesHtml}</tbody>
      </table>
      ${Number(c.frais_livraison) > 0 ? `<p style="text-align:right;">Frais de livraison : ${euros(c.frais_livraison)}</p>` : ''}
      <p style="text-align:right;font-size:18px;font-weight:bold;">
        Total : ${euros(c.total)}
      </p>
      <p style="font-size:13px;color:#666;">
        Paiement sur place, à ${retrait ? 'la récupération' : 'la livraison'}.
      </p>
    </div>
  `
}

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

    const html = buildHtml(commande)
    // Client : uniquement l'adresse de son compte. Commande saisie par un admin (au téléphone) :
    // l'adresse notée sur la commande.
    const emailClient = estAdmin ? commande.email : user.email
    const results: Record<string, unknown>[] = []

    if (emailClient) {
      results.push({
        cible: 'client',
        ...(await envoyer({
          from: `Bontin <${FROM_EMAIL}>`,
          to: emailClient,
          subject: 'Votre commande Bontin est confirmée',
          html: `<p>Bonjour ${esc(commande.nom_client)},</p><p>Votre commande a bien été enregistrée, merci !</p>${html}`,
        })),
      })
    }

    results.push({
      cible: 'admin',
      ...(await envoyer({
        from: `Site Bontin <${FROM_EMAIL}>`,
        to: ADMIN_EMAIL,
        reply_to: emailClient || undefined,
        subject: `Nouvelle commande — ${String(commande.nom_client).slice(0, 80)}`,
        html,
      })),
    })

    console.log('Résultat envoi emails :', JSON.stringify(results))
    return json({ ok: true, results })
  } catch (err) {
    console.error('Erreur fonction send-order-emails :', err)
    return json({ ok: false, erreur: 'Envoi impossible.' }, 500)
  }
})
