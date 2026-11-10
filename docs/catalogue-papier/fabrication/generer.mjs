// Catalogue Bontin septembre–novembre 2026, style « colonne verte » (essai B validé le 07/11/2026)
// node generer.mjs [fp]   fp = fond perdu en mm (0 = version écran, 3 = version imprimeur)
// MISE=alterne node generer.mjs [fp]  -> version alternée : pages BANDES en « bandes » (disposition 5 choisie le 07/11/2026)
import { readFileSync, writeFileSync } from 'node:fs'

const FP = Number(process.argv[2] ?? 0)
const data = JSON.parse(readFileSync('catalogue.json', 'utf8'))
const ALTERNE = process.env.MISE === 'alterne'
// pages en « bandes » : celles où l'ancien catalogue avait déjà deux zones de couleur (la dernière zone va dans le bandeau vert)
const BANDES = [3, 5, 10]

// ---------------------------------------------------------------- réglages par page
// cols = nombre de produits dans la colonne verte puis dans la 2e colonne (le reste va dans la 3e)
const PAGES = {
  2: { titre: 'INCONTOURNABLES SALÉS', rayon: 'Incontournables salés', cols: [6, 6] },
  3: { titre: 'PLATS PRÉPARÉS', rayon: 'Plats préparés', cols: [6, 6] },
  4: { rayon: 'Plats préparés', cols: [7, 7] },
  5: { titre: 'PRODUITS DE LA MER', rayon: 'Produits de la mer', cols: [7, 6] },
  6: { titre: 'VIANDES', rayon: 'Viandes', cols: [6, 5] },
  7: { rayon: 'Viandes', cols: [5, 5] },
  8: { titre: 'VOLAILLES', rayon: 'Volailles', cols: [6, 6] },
  9: { titre: 'ACCOMPAGNEMENTS', rayon: 'Accompagnements', cols: [10, 12] },
  10: { titre: 'DESSERTS', rayon: 'Desserts', cols: [8, 9] },
  11: { rayon: 'Glaces', cols: [10, 6], bacs: true },
}

const css = `
@font-face{font-family:'Bebas Neue';src:url(bebas-neue-latin-400-normal.woff2)}
@font-face{font-family:'Public Sans';font-weight:400;src:url(public-sans-latin-400-normal.woff2)}
@font-face{font-family:'Public Sans';font-weight:600;src:url(public-sans-latin-600-normal.woff2)}
@font-face{font-family:'Public Sans';font-weight:700;src:url(public-sans-latin-700-normal.woff2)}
@font-face{font-family:'Roboto Condensed';font-weight:600;src:url(roboto-condensed-latin-600-normal.woff2)}
@font-face{font-family:'Roboto Condensed';font-weight:700;src:url(roboto-condensed-latin-700-normal.woff2)}
:root{--encre:#1B231A;--foret:#23422B;--vert:#3C6B46;--pierre:#E7E2D3;--papier:#FBFAF6;--brique:#A34428;--gris:#6B7264;--filet:#DDD8C8;--fp:${FP}mm}
@page{size:calc(210mm + 2*var(--fp)) calc(297mm + 2*var(--fp));margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{-webkit-print-color-adjust:exact;print-color-adjust:exact;font-family:'Public Sans';color:var(--encre)}
.page{width:calc(210mm + 2*var(--fp));height:calc(297mm + 2*var(--fp));padding:var(--fp);position:relative;overflow:hidden;background:var(--pierre);display:flex;flex-direction:column;break-after:page}
.page:last-child{break-after:auto}
.bandeau{flex:none;height:calc(8mm + var(--fp));margin:calc(-1*var(--fp)) calc(-1*var(--fp)) 0;padding-top:var(--fp);background:var(--encre);color:#fff;font:700 7.5pt 'Roboto Condensed';letter-spacing:.18em;display:flex;align-items:center;justify-content:center}
.bandeau b{color:#E2B49F;margin:0 .6em}
.nom{font:700 10.5pt/1.05 'Roboto Condensed';letter-spacing:.03em;text-transform:uppercase;color:var(--encre)}
.nom .logo{height:3.3mm;width:auto;vertical-align:-.45mm;margin-left:1.4mm}
.nom .logo.porc{height:5.4mm;vertical-align:-1.4mm}
.gauche .nom .logo{background:var(--papier);padding:.35mm}
.gauche .nom .logo.porc{padding:.2mm}
.desc{font:400 8.5pt/1.22 'Public Sans';color:var(--gris)}
.poids{font:400 8pt/1.2 'Public Sans';color:var(--gris)}
.prix{font:400 20pt/0.9 'Bebas Neue';color:var(--brique);white-space:nowrap;letter-spacing:.01em}
.pied{flex:none;height:9mm;margin:0 10mm;display:flex;align-items:center;justify-content:space-between;border-top:.5pt solid #CFC9B6;font:700 8pt 'Roboto Condensed';letter-spacing:.14em;text-transform:uppercase;color:var(--encre)}
.pied em{font-style:normal;color:var(--brique)}
.pied .num{display:flex;align-items:center;gap:3mm;color:var(--gris)}
.pied .num span{font:400 16pt 'Bebas Neue';letter-spacing:0;color:var(--foret)}

/* pages produits */
.corps{flex:1;display:grid;grid-template-columns:76mm 1fr;min-height:0}
.gauche{background:var(--foret);margin-left:calc(-1*var(--fp));padding:4mm 6mm 4mm var(--fp);display:flex;flex-direction:column;justify-content:space-between;min-height:0}
.gauche .p{display:grid;grid-template-columns:var(--ph-g) 1fr;column-gap:2.5mm;align-items:center;flex:1}
.gauche .ph{width:var(--ph-g);display:flex;justify-content:center}
.gauche img.photo{width:calc(var(--ph-g) + 6mm);height:calc(var(--ph-g) + 6mm);object-fit:contain;margin-left:-6mm;flex:none}
.gauche .nom{color:#fff}
.gauche .desc,.gauche .poids{color:#C9D3C3}
.gauche .poids{min-width:0;white-space:nowrap;font-size:7.5pt}
.gauche .p > div:last-child{min-width:0}
.gauche .prix{color:#fff;background:var(--brique);padding:1.1mm 1.4mm .5mm;font-size:16pt}
.gauche .ligne{display:flex;justify-content:space-between;align-items:center;margin-top:1mm;gap:1.5mm}
.droite{padding:5mm 10mm 4mm 7mm;display:flex;flex-direction:column;min-height:0}
.droite h1{font:400 54pt/0.85 'Bebas Neue';color:var(--foret);white-space:nowrap}
.droite h1.long{font-size:44pt}
.droite h1+i{display:block;width:34mm;height:3pt;background:var(--brique);margin:2mm 0 2mm;flex:none}
.cols{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:0 6mm;min-height:0}
.col{display:flex;flex-direction:column;justify-content:space-between;min-height:0}
.droite .p{border-top:.5pt solid #CFC9B6;padding:1.6mm 0 1.4mm;display:grid;grid-template-columns:1fr auto;column-gap:1.5mm;flex:1;align-content:center}
.droite .p.ph{grid-template-columns:1fr calc(var(--ph-d) - 2mm)}
.droite .p.ph .ligne{grid-column:1/3}
.droite .p img.photo{grid-row:1;grid-column:2;width:var(--ph-d);height:var(--ph-d);object-fit:contain;align-self:center;margin-right:-2mm}
.droite .ligne{grid-column:1;display:flex;justify-content:space-between;align-items:baseline;margin-top:.6mm;gap:2mm}
.droite .p:not(.ph) .ligne{grid-column:1/3}

/* mise en page « bandes » */
.bd .titre{flex:none;padding:5mm 10mm 0}
.bd .titre h1{font:400 54pt/0.85 'Bebas Neue';color:var(--foret);white-space:nowrap}
.bd .titre i{display:block;width:34mm;height:3pt;background:var(--brique);margin-top:2mm}
.bd .haut{flex:var(--fh);min-height:0;display:grid;grid-template-columns:repeat(3,1fr);gap:0 6mm;padding:3mm 10mm 4mm}
.bd .bas{flex:var(--fb);min-height:0;background:var(--foret);display:grid;grid-template-columns:repeat(3,1fr);gap:0 6mm;margin:0 calc(-1*var(--fp));padding:4mm calc(10mm + var(--fp))}
.bd .col{display:flex;flex-direction:column;min-height:0}
.bd .p{flex:1;border-top:.5pt solid #CFC9B6;padding:1.5mm 0;display:grid;grid-template-columns:1fr auto;column-gap:2mm;align-content:center}
.bd .bas .p{border-top-color:#3C6B46}
.bd .p img.photo{grid-row:1;grid-column:2;width:var(--ph);height:var(--ph);object-fit:contain;margin-right:-1mm}
.bd .ligne{grid-column:1/3;display:flex;justify-content:space-between;align-items:baseline;gap:2mm;margin-top:.8mm}
.bd .bas .nom{color:#fff}.bd .bas .desc,.bd .bas .poids{color:#C9D3C3}
.bd .bas .prix{color:#fff;background:var(--brique);padding:1mm 1.4mm .4mm;font-size:17pt}
.bd .bas .nom .logo{background:var(--papier);padding:.35mm}
.bd + .pied, .bd .pied{margin-top:0}

/* bacs de glace (page 11) */
.bacs{flex:none;background:var(--papier);border-top:3pt solid var(--brique);padding:2.6mm 3mm 2.4mm;margin-top:2mm}
.bacs .entete{display:flex;justify-content:center;margin-bottom:1mm}
.bacs .entete img{width:40mm;height:30mm;object-fit:contain}
.bacs .entete .prix{font-size:24pt}
.bacs .entete .t{font:700 8pt/1.2 'Roboto Condensed';letter-spacing:.1em;color:var(--gris);text-transform:uppercase}
.bacs ul{list-style:none}
.bacs li{display:flex;justify-content:space-between;align-items:baseline;font:700 9pt/1.6 'Roboto Condensed';letter-spacing:.04em;border-bottom:.5pt solid var(--filet)}
.bacs li:last-child{border-bottom:0}
.bacs li span{font:400 14pt/1.3 'Bebas Neue';color:var(--brique)}

/* couverture */
.couv{background:var(--foret)}
.couv .fond{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.couv .haut{position:relative;margin:calc(-1*var(--fp)) calc(-1*var(--fp)) 0;padding:calc(var(--fp) + 9mm) 12mm 7mm;background:var(--foret);display:flex;align-items:center;justify-content:space-between}
.couv .cartouche{background:var(--papier);padding:5mm 7mm}
.couv .cartouche img{height:26mm;display:block}
.couv .tel{text-align:right;color:#fff}
.couv .tel b{display:block;font:400 40pt/0.9 'Bebas Neue';letter-spacing:.02em}
.couv .tel span{display:block;font:700 8.5pt 'Roboto Condensed';letter-spacing:.18em;color:#C9D3C3;margin-top:2mm}
.couv .tel i{display:block;width:30mm;height:3pt;background:var(--brique);margin:3mm 0 0 auto}
.couv .date{position:absolute;left:0;bottom:0;padding:6mm 9mm 6mm calc(var(--fp) + 12mm);padding-bottom:calc(var(--fp) + 7mm);background:var(--brique);color:#fff;font:400 34pt/0.9 'Bebas Neue';letter-spacing:.02em}
.couv .date small{display:block;font:700 8.5pt 'Roboto Condensed';letter-spacing:.18em;margin-bottom:2mm;color:#F0D5C9}

/* dernière page */
.fin .tete{flex:none;padding:8mm 12mm 0;display:flex;justify-content:center}
.fin .tete img{height:22mm;display:block}
.fin .tete .tel{font:400 30pt/0.9 'Bebas Neue';color:var(--foret);text-align:right}
.fin .tete .tel small{display:block;font:700 8pt 'Roboto Condensed';letter-spacing:.16em;color:var(--gris);margin-top:1.5mm}
.fin .trait{flex:none;height:3pt;background:var(--brique);width:34mm;margin:4mm auto 0}
.parrain{flex:none;display:grid;grid-template-columns:1fr 12mm 1fr;align-items:stretch;margin:6mm 12mm 0}
.parrain .c{color:#fff;padding:5mm 6mm;display:flex;align-items:center;gap:5mm}
.parrain .c.v{background:var(--foret)}.parrain .c.b{background:var(--brique)}
.parrain .c b{font:400 54pt/0.8 'Bebas Neue'}
.parrain .c span{font:400 17pt/1 'Bebas Neue';letter-spacing:.02em}
.parrain .plus{display:flex;align-items:center;justify-content:center;font:400 34pt 'Bebas Neue';color:var(--encre)}
.vins{flex:1;display:flex;flex-direction:column;margin:6mm 12mm 0;min-height:0;gap:3mm}
.rang{display:grid;gap:3mm;min-height:0}
.rang.r3{flex:1.25}.rang.r4{flex:1}
.rang.r3{grid-template-columns:repeat(3,1fr)}.rang.r4{grid-template-columns:repeat(4,1fr)}
.vin{background:var(--papier);padding:3mm;display:flex;flex-direction:column;gap:2mm;min-height:0}
.vin .im{flex:1;position:relative;min-height:0}
.vin .im img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
.vin .sous{font:600 8.5pt/1.2 'Public Sans';color:var(--encre);margin-top:.5mm}
.vin .info{margin-top:1.2mm}
.vin .l{display:flex;justify-content:space-between;align-items:baseline;gap:1mm;margin-top:1mm}
.vin .l .prix{font-size:17pt}
.vin .l .poids{white-space:nowrap}
.autres{flex:none;display:grid;grid-template-columns:repeat(3,1fr);gap:0 6mm;margin:5mm 12mm 0}
.autres > div{border-top:.5pt solid #CFC9B6;padding-top:2mm}
.autres .l{display:flex;justify-content:space-between;align-items:baseline;margin-top:.8mm}
.legal{flex:none;margin:4mm 12mm 0;font:400 7pt/1.3 'Public Sans';color:var(--gris)}
`

const bandeau = `<div class="bandeau">SURGELÉS EN LIVRAISON OU EN RETRAIT<b>·</b>02 56 31 11 97<b>·</b>BONTIN.FR</div>`
const pied = (n, rayon) => `<div class="pied"><span>Commandez en ligne sur <em>bontin.fr</em> ou au <em>02 56 31 11 97</em></span><span class="num">${rayon || ''}<span>${n}</span></span></div>`
const LOGO = { france: '<img class="logo" src="img/logo-france.png" alt="Origine France">', porc: '<img class="logo porc" src="img/logo-porc.png" alt="Le Porc Français">' }
const nom = (p) => {
  if (!p.badges?.length) return `<div class="nom">${p.nom}</div>`
  const i = p.nom.lastIndexOf(' ')
  return `<div class="nom">${p.nom.slice(0, i + 1)}<span style="white-space:nowrap">${p.nom.slice(i + 1)}${p.badges.map((b) => LOGO[b]).join('')}</span></div>`
}
const desc = (p) => (p.desc ? `<div class="desc">${p.desc}</div>` : '')
const ligne = (p) => `<div class="ligne"><span class="poids">${p.poids}</span><span class="prix">${p.prix}</span></div>`
const photo = (p) => (p.photo ? `<img class="photo" src="img/${p.photo}.png" alt="">` : '')

function pageProduits(n) {
  const cfg = PAGES[n]
  const liste = data.pages[n]
  const [a, b] = cfg.cols
  const g = liste.slice(0, a), c2 = liste.slice(a, a + b), c3 = liste.slice(a + b)
  // taille des photos selon la place disponible (hauteur utile ≈ 268 mm à gauche, 240 mm à droite sous le titre)
  const hautD = cfg.titre ? 236 : 262
  const phG = Math.max(18, Math.min(26, 268 / g.length - 9))
  const nD = Math.max(c2.length, c3.length + (cfg.bacs ? 6 : 0))
  const phD = Math.max(14, Math.min(30, hautD / nD - 14))
  const colD = (c) => `<div class="col">${c.map((p) => `<div class="p${p.photo ? ' ph' : ''}"><div>${nom(p)}${desc(p)}</div>${photo(p)}${ligne(p)}</div>`).join('')}${cfg.bacs && c === c3 ? bacs() : ''}</div>`
  return `<div class="page" style="--ph-g:${phG.toFixed(1)}mm;--ph-d:${phD.toFixed(1)}mm">${bandeau}
<div class="corps">
<div class="gauche">${g.map((p) => `<div class="p"><div class="ph">${photo(p)}</div><div>${nom(p)}${desc(p)}${ligne(p)}</div></div>`).join('')}</div>
<div class="droite">${cfg.titre ? `<h1${cfg.titre.length > 16 ? ' class="long"' : ''}>${cfg.titre}</h1><i></i>` : ''}
<div class="cols">${colD(c2)}${colD(c3)}</div>
</div></div>
${pied(n, cfg.rayon)}</div>`
}

// hauteur estimée d'un produit (mm) dans une colonne de `larg` mm avec photo de `ph` mm
const hauteur = (p, larg, ph) => {
  const w = larg - (p.photo ? ph + 2 : 0)
  const h = Math.ceil(p.nom.length * 2.0 / w) * 4.1 + (p.desc ? Math.ceil(p.desc.length * 1.6 / w) * 3.7 : 0) + 8
  return p.photo ? Math.max(h, ph + 4) : h
}
// découpe en n colonnes consécutives (ordre conservé) de hauteurs les plus proches possible
const equilibrer = (l, n, larg, ph) => {
  const hs = l.map((p) => hauteur(p, larg, ph)), pre = [0]; hs.forEach((h) => pre.push(pre.at(-1) + h))
  const memo = new Map()
  const best = (i, k) => {
    if (k === 1) return [pre[l.length] - pre[i], [l.length]]
    const key = i + ',' + k; if (memo.has(key)) return memo.get(key)
    let r = [Infinity, []]
    for (let j = i + 1; j <= l.length - k + 1; j++) {
      const [m, cuts] = best(j, k - 1); const v = Math.max(pre[j] - pre[i], m)
      if (v < r[0]) r = [v, [j, ...cuts]]
    }
    memo.set(key, r); return r
  }
  const cuts = [0, ...best(0, n)[1]]
  return cuts.slice(0, -1).map((c, i) => l.slice(c, cuts[i + 1]))
}

function pageBandes(n) {
  const cfg = PAGES[n], l = data.pages[n]
  const derniere = Math.max(...l.map((p) => p.bande || 0))
  const coupe = l.findIndex((p) => (p.bande || 0) === derniere)
  const ph = Math.max(13, Math.min(20, 130 / Math.ceil(coupe / 3) - 8))
  const h = equilibrer(l.slice(0, coupe), 3, 59, ph), bl = l.slice(coupe), b = bl.length <= 6 ? [0, 1, 2].map((i) => bl.slice(Math.ceil(bl.length / 3) * i, Math.ceil(bl.length / 3) * (i + 1))) : equilibrer(bl, 3, 59, ph)
  const haut = (cs) => Math.max(...cs.map((c) => c.reduce((s, p) => s + hauteur(p, 59, ph), 0)))
  const col = (c) => `<div class="col">${c.map((p) => `<div class="p"><div>${nom(p)}${desc(p)}</div>${photo(p)}${ligne(p)}</div>`).join('')}</div>`
  return `<div class="page bd" style="--ph:${ph}mm;--fh:${haut(h).toFixed(0)};--fb:${(haut(b) + 8).toFixed(0)}">${bandeau}
${cfg.titre ? `<div class="titre"><h1>${cfg.titre}</h1><i></i></div>` : ''}
<div class="haut">${h.map(col).join('')}</div><div class="bas">${b.map(col).join('')}</div>
${pied(n, cfg.rayon)}</div>`
}

function bacs() {
  const prix = [...new Set(data.bacs.map((b) => b.prix))]
  return `<div class="bacs"><div class="entete"><img src="img/${data.bac_photo}.png" alt=""></div>
<ul>${data.bacs.map((b) => `<li>${b.nom}<span>${b.prix}</span></li>`).join('')}</ul></div>`
}

const couverture = `<div class="page couv"><img class="fond" src="img/p1-1193.png" alt="">
<div class="haut"><div class="cartouche"><img src="img/logo-bontin.png" alt="Bontin"></div>
<div class="tel"><b>02 56 31 11 97</b><span>SURGELÉS EN LIVRAISON OU EN RETRAIT</span><span>BONTIN.FR</span><i></i></div></div>
<div class="date">SEPTEMBRE – NOVEMBRE 2026</div></div>`

const q = data.p12
const ligneV = (l) => `<div class="l"><span class="poids">${l[0]}</span><span class="prix">${l[1]}</span></div>`
const vin = (v) => `<div class="vin"><div><div class="nom">${v.nom}</div>${v.sous ? `<div class="sous">${v.sous}</div>` : ''}${v.info ? `<div class="poids info">${v.info}</div>` : ''}${v.lignes.map(ligneV).join('')}</div><div class="im"><img src="img/${v.photo}.png" alt=""></div></div>`
const derniere = `<div class="page fin">${bandeau}
<div class="tete"><img src="img/logo-bontin.png" alt="Bontin"></div>
<div class="trait"></div>
<div class="parrain"><div class="c v"><b>25€</b><span>OFFERTS SUR VOTRE<br>PROCHAINE COMMANDE</span></div><div class="plus">+</div><div class="c b"><b>25€</b><span>OFFERTS SUR LA<br>COMMANDE DE VOTRE FILLEUL</span></div></div>
<div class="vins"><div class="rang r3">${q.vins.map(vin).join('')}</div><div class="rang r4">${q.bib.map(vin).join('')}</div></div>
<div class="autres">${q.autres.map((a) => `<div><div class="nom">${a.nom}</div>${a.desc ? `<div class="desc">${a.desc}</div>` : ''}${a.lignes.map(ligneV).join('')}</div>`).join('')}</div>
<div class="legal">${q.mentions}</div>
${pied(12, '')}</div>`

const seule = process.argv[3] // numéro de page seul (pour les essais)
const pages = [couverture, ...[2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => (ALTERNE && BANDES.includes(n) ? pageBandes(n) : pageProduits(n))), derniere]
const choix = seule ? [pages[Number(seule) - 1]] : pages
writeFileSync(seule ? `page${seule}.html` : `catalogue${ALTERNE ? '-alterne' : ''}${FP ? '-fp' : ''}.html`,
  `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Catalogue Bontin</title><style>${css}</style></head><body>${choix.join('\n')}</body></html>`)
