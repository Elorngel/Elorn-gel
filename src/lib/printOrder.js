// Ouvre un onglet séparé avec un bon de commande propre, prêt à imprimer.
// Utilisé à la fois côté client (confirmation) et côté admin (préparation).
export function printBonDeCommande(commande, lignes) {
  const dateStr = new Date(commande.created_at || Date.now()).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  const lignesHtml = lignes
    .map(
      (l) => `
        <tr>
          <td style="padding:6px 4px;border-bottom:1px solid #ddd;">${l.nom_produit || l.nom}</td>
          <td style="padding:6px 4px;border-bottom:1px solid #ddd;text-align:center;">${l.quantite || l.quantity}</td>
          <td style="padding:6px 4px;border-bottom:1px solid #ddd;text-align:right;">${(l.prix_unitaire ?? l.unitPrice).toFixed(2)} €</td>
          <td style="padding:6px 4px;border-bottom:1px solid #ddd;text-align:right;">${((l.prix_unitaire ?? l.unitPrice) * (l.quantite || l.quantity)).toFixed(2)} €</td>
        </tr>`
    )
    .join('')

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>Bon de commande — ${commande.nom_client}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #1b231a; max-width: 700px; margin: 30px auto; padding: 0 20px; }
        h1 { font-size: 22px; border-bottom: 3px solid #23422b; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { text-align: left; padding: 6px 4px; border-bottom: 2px solid #1b231a; font-size: 12px; text-transform: uppercase; }
        .total-row td { font-weight: bold; font-size: 16px; padding-top: 10px; }
        .infos { margin-top: 16px; font-size: 14px; line-height: 1.6; }
        .infos strong { display: inline-block; width: 140px; }
        .paiement { margin-top: 20px; padding: 10px; background: #e7e2d3; font-size: 13px; }
      </style>
    </head>
    <body>
      <h1>ELORN GEL — Bon de commande</h1>
      <div class="infos">
        <div><strong>Date :</strong> ${dateStr}</div>
        <div><strong>Client :</strong> ${commande.nom_client}</div>
        <div><strong>Téléphone :</strong> ${commande.telephone}</div>
        ${commande.email ? `<div><strong>Email :</strong> ${commande.email}</div>` : ''}
        <div><strong>Mode :</strong> ${commande.mode === 'retrait' ? 'Retrait au dépôt' : 'Livraison'}</div>
        ${commande.creneau_retrait ? `<div><strong>Créneau :</strong> ${commande.creneau_retrait}</div>` : ''}
        ${commande.creneau_livraison ? `<div><strong>Créneau :</strong> ${commande.creneau_livraison}</div>` : ''}
        ${commande.note ? `<div><strong>Note :</strong> ${commande.note}</div>` : ''}
      </div>

      <table>
        <thead>
          <tr>
            <th>Produit</th>
            <th style="text-align:center;">Qté</th>
            <th style="text-align:right;">Prix unit.</th>
            <th style="text-align:right;">Sous-total</th>
          </tr>
        </thead>
        <tbody>
          ${lignesHtml}
          ${
            commande.frais_livraison > 0
              ? `<tr><td colspan="3" style="padding:6px 4px;">Frais de livraison</td><td style="padding:6px 4px;text-align:right;">${commande.frais_livraison.toFixed(2)} €</td></tr>`
              : ''
          }
          <tr class="total-row">
            <td colspan="3">Total</td>
            <td style="text-align:right;">${commande.total.toFixed(2)} €</td>
          </tr>
        </tbody>
      </table>

      <p class="paiement">
        Paiement sur place, à ${commande.mode === 'retrait' ? 'la récupération de la commande' : 'la livraison'}.
      </p>
    </body>
    </html>
  `

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert("Le navigateur a bloqué l'ouverture de la fenêtre d'impression. Autorise les pop-ups pour ce site.")
    return
  }
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.onload = () => printWindow.print()
}
