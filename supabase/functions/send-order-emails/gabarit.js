// Mise en page des emails de commande (client et Bontin), aux couleurs du site.
// HTML « à l'ancienne » (tableaux, styles écrits sur chaque élément) : c'est ce que les logiciels de
// messagerie (Gmail, Outlook, Mail…) affichent le mieux.

const C = { ink: '#1b231a', forest: '#23422b', stone: '#e7e2d3', paper: '#fbfaf6', rust: '#a34428', muted: '#5f665d', ligne: '#ddd8c8' }
const TITRE = "'Bebas Neue','Arial Narrow',Impact,Arial,sans-serif"
const TEXTE = 'Arial,Helvetica,sans-serif'

// Les champs saisis par les clients sont insérés dans du HTML : on les échappe
// pour qu'un nom ou une note ne puisse pas injecter de code dans l'email.
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const euros = (v) => `${Number(v ?? 0).toFixed(2).replace('.', ',')}&nbsp;€`
export const numeroCommande = (c) => String(c.id || '').slice(0, 8).toUpperCase()
const dateCommande = (c) =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(
    new Date(c.created_at || Date.now())
  )

function cadre({ infos, apercu, titre, sousTitre, contenu, pied }) {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">
<title>${esc(titre)}</title></head>
<body style="margin:0;padding:0;background:${C.stone};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(apercu)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.stone};">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.paper};">
    <tr><td style="background:${C.ink};color:${C.stone};font:bold 11px ${TEXTE};letter-spacing:2px;text-transform:uppercase;padding:9px 24px;">
      Surgelés en livraison ou en retrait
    </td></tr>
    <tr><td style="padding:18px 24px;border-bottom:1px solid ${C.ligne};">
      <img src="${esc(infos.logo)}" alt="Bontin" height="48" style="display:block;height:48px;width:auto;border:0;">
    </td></tr>
    <tr><td style="background:${C.forest};padding:22px 24px;">
      <div style="font:400 38px/1 ${TITRE};color:${C.paper};letter-spacing:1px;text-transform:uppercase;">${esc(titre)}</div>
      <div style="font:14px/1.4 ${TEXTE};color:${C.stone};padding-top:6px;">${sousTitre}</div>
    </td></tr>
    <tr><td style="padding:24px;font:15px/1.55 ${TEXTE};color:${C.ink};">
      ${contenu}
    </td></tr>
    <tr><td style="background:${C.ink};padding:18px 24px;font:13px/1.6 ${TEXTE};color:${C.stone};">
      ${pied}
      <div style="padding-top:10px;color:#9aa096;font-size:12px;">Bontin · ${esc(infos.adresse)}</div>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`
}

function blocCreneau(c, infos) {
  const retrait = c.mode === 'retrait'
  const creneau = retrait ? c.creneau_retrait : c.creneau_livraison
  const lieu = retrait
    ? `Au dépôt Bontin : ${esc(infos.adresse)}`
    : `${esc(c.adresse_livraison)}, ${esc(c.code_postal)} ${esc(c.ville)}`
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px solid ${C.forest};margin:0 0 20px;">
    <tr><td style="padding:12px 16px;">
      <div style="font:bold 11px ${TEXTE};letter-spacing:1.5px;text-transform:uppercase;color:${C.forest};">${retrait ? 'Retrait au dépôt' : 'Livraison à domicile'}</div>
      ${creneau ? `<div style="font:400 24px/1.15 ${TITRE};color:${C.ink};padding-top:4px;">${esc(creneau)}</div>` : ''}
      <div style="font:14px/1.45 ${TEXTE};color:${C.muted};padding-top:4px;">${lieu}</div>
    </td></tr>
  </table>`
}

function tableauProduits(c) {
  const ligne = (gauche, droite, style = '') =>
    `<tr><td colspan="2" style="padding:5px 0;${style}">${gauche}</td><td align="right" style="padding:5px 0;white-space:nowrap;${style}">${droite}</td></tr>`
  const lignes = (c.commande_lignes || [])
    .map(
      (l) => `<tr>
        <td style="padding:9px 8px 9px 0;border-bottom:1px solid ${C.ligne};">${esc(l.nom_produit)}</td>
        <td align="center" style="padding:9px 8px;border-bottom:1px solid ${C.ligne};white-space:nowrap;color:${C.muted};">× ${Number(l.quantite)}</td>
        <td align="right" style="padding:9px 0;border-bottom:1px solid ${C.ligne};white-space:nowrap;">${euros(Number(l.prix_unitaire) * Number(l.quantite))}</td>
      </tr>`
    )
    .join('')
  const sousTotal = c.sous_total ?? (c.commande_lignes || []).reduce((s, l) => s + Number(l.prix_unitaire) * Number(l.quantite), 0)
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font:14px/1.4 ${TEXTE};color:${C.ink};">
    <tr>
      <td style="padding:0 8px 6px 0;border-bottom:2px solid ${C.ink};font:bold 11px ${TEXTE};letter-spacing:1px;text-transform:uppercase;color:${C.muted};">Produit</td>
      <td align="center" style="padding:0 8px 6px;border-bottom:2px solid ${C.ink};font:bold 11px ${TEXTE};letter-spacing:1px;text-transform:uppercase;color:${C.muted};">Qté</td>
      <td align="right" style="padding:0 0 6px;border-bottom:2px solid ${C.ink};font:bold 11px ${TEXTE};letter-spacing:1px;text-transform:uppercase;color:${C.muted};">Prix</td>
    </tr>
    ${lignes}
    <tr><td colspan="3" style="height:8px;"></td></tr>
    ${ligne('Sous-total', euros(sousTotal))}
    ${Number(c.remise_code) > 0 ? ligne(`Code promo ${esc(c.code_promo)}`, `−${euros(c.remise_code)}`, `color:${C.forest};`) : ''}
    ${Number(c.remise_bon) > 0 ? ligne("Bon d'achat", `−${euros(c.remise_bon)}`, `color:${C.forest};`) : ''}
    ${Number(c.frais_livraison) > 0 ? ligne('Frais de livraison', euros(c.frais_livraison)) : ''}
    <tr><td colspan="2" style="padding:12px 0 0;border-top:2px solid ${C.ink};font:bold 12px ${TEXTE};letter-spacing:1px;text-transform:uppercase;">Total</td>
      <td align="right" style="padding:10px 0 0;border-top:2px solid ${C.ink};font:400 30px/1 ${TITRE};white-space:nowrap;">${euros(c.total)}</td></tr>
  </table>`
}

const bouton = (lien, texte) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px;"><tr>
    <td style="background:${C.rust};"><a href="${esc(lien)}" style="display:inline-block;padding:13px 22px;font:bold 13px ${TEXTE};letter-spacing:1.5px;text-transform:uppercase;color:${C.paper};text-decoration:none;">${texte}</a></td>
  </tr></table>`

// Confirmation envoyée au client.
export function emailClient(c, infos) {
  const retrait = c.mode === 'retrait'
  const creneau = retrait ? c.creneau_retrait : c.creneau_livraison
  const contenu = `
    <p style="margin:0 0 12px;">Bonjour ${esc(c.nom_client)},</p>
    <p style="margin:0 0 20px;">Merci pour votre commande, elle est bien enregistrée. Nous la préparons avec soin
      ${retrait ? 'et elle vous attend au dépôt au créneau choisi.' : 'et nous vous la livrons au créneau choisi.'}</p>
    ${blocCreneau(c, infos)}
    ${tableauProduits(c)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.stone};margin-top:22px;">
      <tr><td style="padding:12px 16px;font:14px/1.45 ${TEXTE};">
        <strong>Paiement ${retrait ? 'au retrait' : 'à la livraison'}</strong> : carte bancaire, chèque ou espèces.
        Rien n'a été débité en ligne.
      </td></tr>
    </table>
    ${bouton(`${infos.site}/mon-compte`, 'Voir mes commandes')}`
  return cadre({
    infos,
    apercu: `Commande n° ${numeroCommande(c)} — ${retrait ? 'retrait' : 'livraison'}${creneau ? ` ${creneau}` : ''}`,
    titre: 'Merci pour votre commande',
    sousTitre: `Commande n° ${numeroCommande(c)} · ${esc(dateCommande(c))}`,
    contenu,
    pied: `Une question, un changement ? Répondez simplement à cet email ou appelez-nous au
      <a href="tel:${esc(infos.telephone.replace(/\s/g, ''))}" style="color:${C.paper};font-weight:bold;white-space:nowrap;">${esc(infos.telephone).replace(/ /g, '&nbsp;')}</a>.`,
  })
}

// Avis de nouvelle commande envoyé à Bontin.
export function emailAdmin(c, infos) {
  const retrait = c.mode === 'retrait'
  const ligneInfo = (label, valeur) =>
    valeur
      ? `<tr><td style="padding:4px 12px 4px 0;font:bold 11px ${TEXTE};letter-spacing:1px;text-transform:uppercase;color:${C.muted};white-space:nowrap;vertical-align:top;">${label}</td><td style="padding:4px 0;font:15px/1.4 ${TEXTE};">${valeur}</td></tr>`
      : ''
  const tel = esc(c.telephone)
  const contenu = `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
      ${ligneInfo('Client', `<strong>${esc(c.nom_client)}</strong>`)}
      ${ligneInfo('Téléphone', `<a href="tel:${tel.replace(/\s/g, '')}" style="color:${C.ink};">${tel}</a>`)}
      ${ligneInfo('Email', c.email ? `<a href="mailto:${esc(c.email)}" style="color:${C.ink};">${esc(c.email)}</a>` : '')}
      ${ligneInfo('Saisie', c.saisie_par_admin ? "par l'administration (téléphone)" : '')}
    </table>
    ${blocCreneau(c, infos)}
    ${c.note ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6e3dc;border-left:4px solid ${C.rust};margin:0 0 20px;"><tr><td style="padding:10px 14px;font:14px/1.45 ${TEXTE};"><strong>Note du client :</strong> ${esc(c.note)}</td></tr></table>` : ''}
    ${tableauProduits(c)}
    ${bouton(`${infos.site}/admin`, "Ouvrir l'administration")}`
  return cadre({
    infos,
    apercu: `${c.nom_client} — ${retrait ? 'retrait' : 'livraison'} — ${Number(c.total).toFixed(2)} €`,
    titre: retrait ? 'Nouvelle commande · retrait' : 'Nouvelle commande · livraison',
    sousTitre: `N° ${numeroCommande(c)} · ${esc(dateCommande(c))}`,
    contenu,
    pied: `Répondre à cet email écrit directement au client${c.email ? ` (${esc(c.email)})` : ''}.`,
  })
}
