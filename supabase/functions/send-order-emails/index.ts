import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
// Pendant les tests (avant vérification de domaine), Resend impose cet
// expéditeur. Une fois le domaine elorngel.fr vérifié dans Resend, on
// pourra le remplacer par ex. par "commandes@elorngel.fr".
const FROM_EMAIL = 'onboarding@resend.dev'
const ADMIN_EMAIL = 'logistique@elorngel.fr'

function buildHtml(order: any) {
  const lignesHtml = (order.lignes || [])
    .map(
      (l: any) => `
        <tr>
          <td style="padding:4px 8px;border-bottom:1px solid #eee;">${l.nom}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center;">${l.quantite}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;">${(l.prix_unitaire * l.quantite).toFixed(2)} €</td>
        </tr>`
    )
    .join('')

  const creneau = order.mode === 'retrait' ? order.creneauRetrait : order.creneauLivraison

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1b231a;">
      <h2 style="color:#23422b;">ELORN GEL</h2>
      <p>
        <strong>Client :</strong> ${order.nomClient}<br/>
        <strong>Téléphone :</strong> ${order.telephone}<br/>
        ${order.email ? `<strong>Email :</strong> ${order.email}<br/>` : ''}
        <strong>Mode :</strong> ${order.mode === 'retrait' ? 'Retrait au dépôt' : 'Livraison'}<br/>
        ${creneau ? `<strong>Créneau :</strong> ${creneau}<br/>` : ''}
        ${order.note ? `<strong>Note :</strong> ${order.note}<br/>` : ''}
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
      ${
        order.fraisLivraison > 0
          ? `<p style="text-align:right;">Frais de livraison : ${order.fraisLivraison.toFixed(2)} €</p>`
          : ''
      }
      <p style="text-align:right;font-size:18px;font-weight:bold;">
        Total : ${order.total.toFixed(2)} €
      </p>
      <p style="font-size:13px;color:#666;">
        Paiement sur place, à ${order.mode === 'retrait' ? 'la récupération' : 'la livraison'}.
      </p>
    </div>
  `
}

serve(async (req) => {
  // Le navigateur envoie d'abord une requête OPTIONS de vérification
  // (CORS) avant la vraie requête POST — il faut lui répondre correctement,
  // sinon le navigateur bloque tout le reste.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const order = await req.json()
    const html = buildHtml(order)
    const results: any[] = []

    if (order.email) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `ELORN GEL <${FROM_EMAIL}>`,
          to: order.email,
          subject: 'Votre commande ELORN GEL est confirmée',
          html: `<p>Bonjour ${order.nomClient},</p><p>Votre commande a bien été enregistrée, merci !</p>${html}`,
        }),
      })
      results.push({ target: 'client', status: res.status, body: await res.text() })
    }

    const resAdmin = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Site ELORN GEL <${FROM_EMAIL}>`,
        to: ADMIN_EMAIL,
        reply_to: order.email || undefined,
        subject: `Nouvelle commande — ${order.nomClient}`,
        html,
      }),
    })
    results.push({ target: 'admin', status: resAdmin.status, body: await resAdmin.text() })

    console.log('Résultat envoi emails :', JSON.stringify(results))

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Erreur fonction send-order-emails :', err)
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})