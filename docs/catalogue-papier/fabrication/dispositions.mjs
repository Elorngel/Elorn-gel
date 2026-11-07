// 5 dispositions alternatives (même charte que le catalogue « colonne verte »), rendues sur 2 pages d'exemple.
// node dispositions.mjs   -> fabrique disposition-1.html … disposition-5.html
// Le catalogue validé (generer.mjs) n'est pas modifié.
import { readFileSync, writeFileSync } from 'node:fs'

const data = JSON.parse(readFileSync('catalogue.json', 'utf8'))
const PAGES_EX = [2, 10]
const INFO = {
  2: { titre: 'INCONTOURNABLES SALÉS', rayon: 'Incontournables salés' },
  10: { titre: 'DESSERTS', rayon: 'Desserts' },
}

const base = `
@font-face{font-family:'Bebas Neue';src:url(bebas-neue-latin-400-normal.woff2)}
@font-face{font-family:'Public Sans';font-weight:400;src:url(public-sans-latin-400-normal.woff2)}
@font-face{font-family:'Public Sans';font-weight:600;src:url(public-sans-latin-600-normal.woff2)}
@font-face{font-family:'Roboto Condensed';font-weight:700;src:url(roboto-condensed-latin-700-normal.woff2)}
:root{--encre:#1B231A;--foret:#23422B;--vert:#3C6B46;--pierre:#E7E2D3;--papier:#FBFAF6;--brique:#A34428;--gris:#6B7264;--filet:#DDD8C8}
@page{size:210mm 297mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{-webkit-print-color-adjust:exact;print-color-adjust:exact;font-family:'Public Sans';color:var(--encre)}
.page{width:210mm;height:297mm;position:relative;overflow:hidden;background:var(--pierre);display:flex;flex-direction:column;break-after:page}
.page:last-child{break-after:auto}
.bandeau{flex:none;height:8mm;background:var(--encre);color:#fff;font:700 7.5pt 'Roboto Condensed';letter-spacing:.18em;display:flex;align-items:center;justify-content:center}
.bandeau b{color:#E2B49F;margin:0 .6em}
.nom{font:700 10.5pt/1.05 'Roboto Condensed';letter-spacing:.03em;text-transform:uppercase;color:var(--encre)}
.desc{font:400 8.5pt/1.22 'Public Sans';color:var(--gris)}
.poids{font:400 8pt/1.2 'Public Sans';color:var(--gris)}
.prix{font:400 20pt/0.9 'Bebas Neue';color:var(--brique);white-space:nowrap;letter-spacing:.01em}
.etiq{display:inline-block;background:var(--brique);color:#fff;font:400 16pt/1 'Bebas Neue';padding:1.1mm 1.5mm .5mm;white-space:nowrap}
.ligne{display:flex;justify-content:space-between;align-items:baseline;gap:2mm;margin-top:.8mm}
.pied{flex:none;height:9mm;margin:0 10mm;display:flex;align-items:center;justify-content:space-between;border-top:.5pt solid #CFC9B6;font:700 8pt 'Roboto Condensed';letter-spacing:.14em;text-transform:uppercase}
.pied em{font-style:normal;color:var(--brique)}
.pied .num{display:flex;align-items:center;gap:3mm;color:var(--gris)}
.pied .num span{font:400 16pt 'Bebas Neue';letter-spacing:0;color:var(--foret)}
.h1{font:400 54pt/0.85 'Bebas Neue';color:var(--foret);white-space:nowrap}
.trait{display:block;width:34mm;height:3pt;background:var(--brique);margin-top:2mm}
img.photo{object-fit:contain;display:block}
`
const bandeau = `<div class="bandeau">SURGELÉS EN LIVRAISON OU EN RETRAIT<b>·</b>02 56 31 11 97<b>·</b>BONTIN.FR</div>`
const pied = (n) => `<div class="pied"><span>Commandez en ligne sur <em>bontin.fr</em> ou au <em>02 56 31 11 97</em></span><span class="num">${INFO[n].rayon}<span>${n}</span></span></div>`
const LOGO = { france: '<img class="logo" src="img/logo-france.png" alt="">', porc: '<img class="logo porc" src="img/logo-porc.png" alt="">' }
const nom = (p) => {
  if (!p.badges?.length) return `<div class="nom">${p.nom}</div>`
  const i = p.nom.lastIndexOf(' ')
  return `<div class="nom">${p.nom.slice(0, i + 1)}<span style="white-space:nowrap">${p.nom.slice(i + 1)}${p.badges.map((b) => LOGO[b]).join('')}</span></div>`
}
const desc = (p) => (p.desc ? `<div class="desc">${p.desc}</div>` : '')
const photo = (p) => (p.photo ? `<img class="photo" src="img/${p.photo}.png" alt="">` : '')
const decouper = (l, n) => { const t = Math.ceil(l.length / n); return Array.from({ length: n }, (_, i) => l.slice(i * t, (i + 1) * t)) }
// hauteur estimée d'un produit (mm) pour une colonne de largeur `larg` avec photo de `ph` mm
const hauteur = (p, larg, ph) => {
  const w = larg - (p.photo ? ph + 2 : 0)
  const h = Math.ceil(p.nom.length * 2.0 / w) * 4.1 + (p.desc ? Math.ceil(p.desc.length * 1.6 / w) * 3.7 : 0) + 8
  return p.photo ? Math.max(h, ph + 4) : h
}
// découpe en n colonnes consécutives (ordre conservé) de hauteurs les plus proches possible
const carte = (p, larg, ph) => (p.photo ? ph + 7 : 0) + Math.ceil(p.nom.length * 2.0 / larg) * 4.1 + (p.desc ? Math.ceil(p.desc.length * 1.6 / larg) * 3.7 : 0) + 13
const equilibrer = (l, n, larg, ph, mesure = hauteur) => {
  const hs = l.map((p) => mesure(p, larg, ph)), pre = [0]; hs.forEach((h) => pre.push(pre.at(-1) + h))
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
const doc = (css, pages) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${base}${css}</style></head><body>${pages.join('\n')}</body></html>`

// ------------------------------------------------ 1. ENSEIGNE : grand bandeau vert en haut, 3 colonnes en liste
const d1 = doc(`
.tete{flex:none;background:var(--foret);padding:8mm 10mm 7mm;display:flex;align-items:flex-end;justify-content:space-between}
.tete .h1{color:#fff;font-size:60pt}
.tete .trait{margin-top:2.5mm}
.tete .n{font:400 60pt/0.85 'Bebas Neue';color:var(--brique);opacity:.9}
.grille{flex:1;min-height:0;display:grid;grid-template-columns:repeat(3,1fr);gap:0 6mm;padding:3mm 10mm 3mm}
.col{display:flex;flex-direction:column;min-height:0}
.p{flex:1;border-bottom:.5pt solid #CFC9B6;padding:1.6mm 0;display:grid;grid-template-columns:1fr auto;column-gap:2mm;align-content:center}
.col .p:last-child{border-bottom:0}
.p img{grid-row:1;grid-column:2;width:var(--ph);height:var(--ph);margin-right:-1mm}
.p .ligne{grid-column:1/3}
.logo{height:3.3mm;vertical-align:-.45mm;margin-left:1.4mm}
`, PAGES_EX.map((n) => {
  const l = data.pages[n]
  const ph = Math.max(14, Math.min(22, 250 / Math.ceil(l.length / 3) - 9))
  const cols = equilibrer(l, 3, 59, ph)
  return `<div class="page" style="--ph:${ph}mm">${bandeau}
<div class="tete"><div><div class="h1">${INFO[n].titre}</div><i class="trait"></i></div></div>
<div class="grille">${cols.map((c) => `<div class="col">${c.map((p) => `<div class="p"><div>${nom(p)}${desc(p)}</div>${photo(p)}<div class="ligne"><span class="poids">${p.poids}</span><span class="prix">${p.prix}</span></div></div>`).join('')}</div>`).join('')}</div>
${pied(n)}</div>`
}))

// ------------------------------------------------ 2. VITRINE : grandes photos, cartes en colonnes
const d2 = doc(`
.titre{flex:none;padding:6mm 10mm 0}
.zone{flex:1;min-height:0;padding:4mm 10mm 3mm;display:grid;grid-template-columns:repeat(4,1fr);gap:0 3mm}
.zone .col{display:flex;flex-direction:column;gap:3mm;min-height:0}
.carte{background:var(--papier);display:flex;flex-direction:column}
.carte .im{height:var(--ph);background:#fff;border-bottom:3pt solid var(--brique);display:flex;align-items:center;justify-content:center;padding:1.5mm}
.carte .im img{width:100%;height:100%}
.carte .t{padding:2mm 2.4mm 2.2mm}
.carte .ligne{align-items:center;margin-top:1.4mm}
.carte:not(.ph) .t{border-top:3pt solid var(--brique)}
.logo{height:3.3mm;vertical-align:-.45mm;margin-left:1.2mm}
`, PAGES_EX.map((n) => {
  const l = data.pages[n]
  const nc = 4
  const ph = n === 2 ? 30 : 22
  const cols = equilibrer(l, 4, 40, ph, carte)
  return `<div class="page" style="--nc:${nc};--ph:${ph}mm">${bandeau}
<div class="titre"><div class="h1">${INFO[n].titre}</div><i class="trait"></i></div>
<div class="zone">${cols.map((c) => `<div class="col">${c.map((p) => `<div class="carte${p.photo ? ' ph' : ''}">${p.photo ? `<div class="im">${photo(p)}</div>` : ''}<div class="t">${nom(p)}${desc(p)}<div class="ligne"><span class="poids">${p.poids}</span><span class="etiq">${p.prix}</span></div></div></div>`).join('')}</div>`).join('')}</div>
${pied(n)}</div>`
}))

// ------------------------------------------------ 3. TARIF : lignes horizontales sur 2 colonnes, titre vertical dans une bande brique
const d3 = doc(`
.corps{flex:1;min-height:0;display:grid;grid-template-columns:1fr 17mm}
.bande{background:var(--brique);display:flex;align-items:flex-end;justify-content:center;padding:8mm 0}
.bande .h1{color:#fff;writing-mode:vertical-rl;transform:rotate(180deg);font-size:58pt;line-height:1}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:0 5mm;padding:5mm 6mm 4mm 10mm;min-height:0}
.col{display:flex;flex-direction:column;min-height:0;background:var(--papier)}
.p{flex:1;display:grid;grid-template-columns:var(--ph) 1fr auto;column-gap:2.5mm;align-items:center;padding:1.2mm 2.5mm;border-bottom:.5pt solid var(--filet)}
.p:last-child{border-bottom:0}
.p .ph{width:var(--ph);height:var(--ph);display:flex;align-items:center;justify-content:center}
.p .ph.vide{border-left:3pt solid var(--foret);width:0;height:55%;justify-self:start;margin-left:1mm}
.p img{width:calc(var(--ph) + 3mm);height:calc(var(--ph) + 3mm);max-width:none}
.p .d{text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:.8mm}
.p .d .poids{font-size:7.5pt;white-space:nowrap}
.logo{height:3.3mm;vertical-align:-.45mm;margin-left:1.2mm}
`, PAGES_EX.map((n) => {
  const l = data.pages[n]
  const ph = Math.max(13, Math.min(22, 262 / Math.ceil(l.length / 2) - 7))
  const cols = equilibrer(l, 2, 52, ph)
  return `<div class="page" style="--ph:${ph}mm">${bandeau}
<div class="corps"><div class="cols">${cols.map((c) => `<div class="col">${c.map((p) => `<div class="p"><div class="ph${p.photo ? '' : ' vide'}">${photo(p)}</div><div>${nom(p)}${desc(p)}</div><div class="d"><span class="etiq">${p.prix}</span><span class="poids">${p.poids}</span></div></div>`).join('')}</div>`).join('')}</div>
<div class="bande"><div class="h1">${INFO[n].titre}</div></div></div>
${pied(n)}</div>`
}))

// ------------------------------------------------ 4. DAMIER : cases carrées alternées vert forêt / papier
const d4 = doc(`
.titre{flex:none;padding:6mm 10mm 0;display:flex;align-items:flex-end;justify-content:space-between}
.grille{flex:1;min-height:0;display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:1fr;gap:2mm;padding:4mm 10mm 3mm}
.c{background:var(--papier);padding:2.2mm 2.6mm 2mm;display:grid;grid-template-columns:1fr auto;grid-template-rows:1fr auto;column-gap:2mm;min-height:0;overflow:hidden}
.c.v{background:var(--foret)}
.c.v .nom{color:#fff}.c.v .desc,.c.v .poids{color:#C9D3C3}
.c.v .prix{color:#fff;background:var(--brique);padding:1mm 1.4mm .4mm;font-size:17pt}
.c img{grid-row:1;grid-column:2;width:var(--ph);height:var(--ph);align-self:start}
.c .ligne{grid-column:1/3;align-items:flex-end}
.logo{height:3.3mm;vertical-align:-.45mm;margin-left:1.2mm}
.c.v .logo{background:var(--papier);padding:.35mm}
`, PAGES_EX.map((n) => {
  const l = data.pages[n]
  const rangs = Math.ceil(l.length / 3)
  const ph = Math.max(13, Math.min(26, 232 / rangs - 12))
  return `<div class="page" style="--ph:${ph}mm">${bandeau}
<div class="titre"><div><div class="h1">${INFO[n].titre}</div><i class="trait"></i></div></div>
<div class="grille">${l.map((p, i) => `<div class="c${i % 2 ? ' v' : ''}"><div>${nom(p)}${desc(p)}</div>${photo(p)}<div class="ligne"><span class="poids">${p.poids}</span><span class="prix">${p.prix}</span></div></div>`).join('')}</div>
${pied(n)}</div>`
}))

// ------------------------------------------------ 5. BANDES : haut sur fond pierre, bas en bandeau vert pleine largeur
const d5 = doc(`
.titre{flex:none;padding:6mm 10mm 0}
.haut{flex:var(--fh);min-height:0;display:grid;grid-template-columns:repeat(3,1fr);gap:0 6mm;padding:3mm 10mm 4mm}
.bas{flex:var(--fb);min-height:0;background:var(--foret);display:grid;grid-template-columns:repeat(3,1fr);gap:0 6mm;padding:4mm 10mm}
.col{display:flex;flex-direction:column;min-height:0}
.p{flex:1;border-top:.5pt solid #CFC9B6;padding:1.5mm 0;display:grid;grid-template-columns:1fr auto;column-gap:2mm;align-content:center}
.bas .p{border-top-color:#3C6B46}
.p img{grid-row:1;grid-column:2;width:var(--ph);height:var(--ph);margin-right:-1mm}
.p .ligne{grid-column:1/3}
.bas .nom{color:#fff}.bas .desc,.bas .poids{color:#C9D3C3}
.bas .prix{color:#fff;background:var(--brique);padding:1mm 1.4mm .4mm;font-size:17pt}
.logo{height:3.3mm;vertical-align:-.45mm;margin-left:1.2mm}
.bas .logo{background:var(--papier);padding:.35mm}
`, PAGES_EX.map((n) => {
  const l = data.pages[n]
  // la séparation reprend les bandes de l'ancien catalogue quand il y en a (page 10 : desserts / viennoiseries et glaces)
  const coupe = l.some((p) => p.bande) ? l.findIndex((p) => p.bande) : Math.round(l.length * 0.6)
  const ph = Math.max(13, Math.min(20, 130 / Math.ceil(coupe / 3) - 8))
  const h = equilibrer(l.slice(0, coupe), 3, 59, ph), b = equilibrer(l.slice(coupe), 3, 59, ph)
  const hh = Math.max(...h.map((c) => c.reduce((s, p) => s + hauteur(p, 59, ph), 0))), hb = Math.max(...b.map((c) => c.reduce((s, p) => s + hauteur(p, 59, ph), 0)))
  const col = (c) => `<div class="col">${c.map((p) => `<div class="p"><div>${nom(p)}${desc(p)}</div>${photo(p)}<div class="ligne"><span class="poids">${p.poids}</span><span class="prix">${p.prix}</span></div></div>`).join('')}</div>`
  return `<div class="page" style="--ph:${ph}mm;--fh:${hh.toFixed(0)};--fb:${(hb + 8).toFixed(0)}">${bandeau}
<div class="titre"><div class="h1">${INFO[n].titre}</div><i class="trait"></i></div>
<div class="haut">${h.map(col).join('')}</div><div class="bas">${b.map(col).join('')}</div>
${pied(n)}</div>`
}))

;[d1, d2, d3, d4, d5].forEach((h, i) => writeFileSync(`disposition-${i + 1}.html`, h))
