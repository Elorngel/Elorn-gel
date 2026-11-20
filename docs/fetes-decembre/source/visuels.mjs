// Fabrique les pages HTML des visuels (charte « Le menu des fêtes » du site : vert forêt, arcs et étoiles dorés,
// carte papier à coins coupés avec filet or, Bebas Neue / Roboto Condensed / Public Sans).
import { VISUELS } from './publications.mjs'

export const FORMATS = { post: [1080, 1350], story: [1080, 1920], couv: [1640, 624] }

const OR = '#d9b86a'
const ETOILE = 'M10 0 L11.6 8.4 L20 10 L11.6 11.6 L10 20 L8.4 11.6 L0 10 L8.4 8.4 Z'
const ARCS = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='40' viewBox='0 0 80 40'%3E%3Cg fill='none' stroke='%23d9b86a' stroke-width='1'%3E%3Cpath d='M0 40 A40 40 0 0 1 80 40'/%3E%3Cpath d='M10 40 A30 30 0 0 1 70 40'/%3E%3Cpath d='M20 40 A20 20 0 0 1 60 40'/%3E%3Cpath d='M30 40 A10 10 0 0 1 50 40'/%3E%3C/g%3E%3C/svg%3E")`
const coins = (c) => `polygon(${c}px 0,calc(100% - ${c}px) 0,100% ${c}px,100% calc(100% - ${c}px),calc(100% - ${c}px) 100%,${c}px 100%,0 calc(100% - ${c}px),0 ${c}px)`

// Étoiles autour de la carte : [gauche %, haut %, taille px, opacité]
const ETOILES = {
  post: [[6, 7, 30, 0.9], [92, 10, 40, 1], [3, 44, 16, 0.7], [96, 55, 22, 0.8], [5, 95, 24, 0.9], [94, 96, 14, 0.7], [30, 2.5, 12, 0.6], [70, 98, 12, 0.6]],
  story: [[8, 5, 34, 0.9], [90, 7, 44, 1], [4, 40, 18, 0.7], [95, 52, 24, 0.8], [7, 94, 28, 0.9], [92, 96, 16, 0.7], [30, 12, 12, 0.6], [72, 88, 14, 0.6]],
  couv: [[8, 15, 26, 0.9], [92, 20, 34, 1], [18, 80, 16, 0.7], [84, 78, 20, 0.8], [4, 55, 12, 0.6], [97, 50, 12, 0.6]],
}

const etoile = (style, cls = 'etoile') =>
  `<svg class="${cls}" viewBox="0 0 20 20" style="${style}"><path d="${ETOILE}" fill="${OR}"/></svg>`

const CSS = `
:root{--forest:#23422b;--paper:#fbfaf6;--rust:#a34428;--ink:#1b231a;--or:${OR};--gris:#4c5248}
*{box-sizing:border-box;margin:0;padding:0}
body{width:var(--w);height:var(--h);overflow:hidden;background:var(--forest);position:relative;font-family:'Public Sans',sans-serif;color:var(--ink)}
.arcs{position:absolute;inset:0;opacity:.2;background-image:${ARCS};background-size:80px 40px}
.etoile{position:absolute}
.logo{position:absolute;left:50%;transform:translateX(-50%);filter:brightness(0) invert(1)}
.carte{position:absolute;background:var(--paper);clip-path:${coins(28)};text-align:center}
.carte:before{content:'';position:absolute;inset:14px;border:2px solid var(--or);clip-path:${coins(22)};pointer-events:none}
.carte>.etoile{position:absolute;top:24px;left:calc(50% - 14px);width:28px;height:28px}
.sur{font:700 24px 'Roboto Condensed';letter-spacing:8px;text-transform:uppercase;color:var(--rust)}
.titre span{color:var(--rust)}
.titre{font:400 104px/.92 'Bebas Neue';color:var(--forest);letter-spacing:1px;margin:12px 0 6px;white-space:nowrap}
.sep{display:flex;align-items:center;justify-content:center;gap:18px;color:var(--or);font-size:26px;margin:10px 0 14px}
.sep:before,.sep:after{content:'';width:110px;height:2px;background:var(--or)}
.phrase{font:400 28px/1.42 'Public Sans';color:var(--gris)}
.bas{display:flex;align-items:center;justify-content:center;gap:22px;margin-top:26px}
.prix{background:var(--rust);color:var(--paper);font:400 70px/1 'Bebas Neue';padding:10px 22px 4px;letter-spacing:1px}
.infos{font:700 23px/1.3 'Roboto Condensed';text-transform:uppercase;letter-spacing:1px;text-align:left;color:var(--ink)}
.bandeau{background:var(--forest);color:var(--paper);font:700 22px 'Roboto Condensed';letter-spacing:2px;text-transform:uppercase;padding:14px 22px;border-bottom:5px solid var(--or)}
.pied{position:absolute;left:0;right:0;text-align:center;color:var(--or);font:700 23px 'Roboto Condensed';letter-spacing:6px;text-transform:uppercase}
.photo{position:absolute;background-size:cover;background-repeat:no-repeat;box-shadow:0 0 0 3px var(--or)}
.chip{position:absolute;left:0;top:30px;background:var(--forest);color:var(--or);font:700 22px 'Roboto Condensed';letter-spacing:5px;text-transform:uppercase;padding:13px 22px 12px 26px}
.tuile{position:absolute;overflow:hidden;background-size:cover;box-shadow:0 0 0 3px var(--or)}
.tuile:after{content:'';position:absolute;inset:auto 0 0 0;height:58%;background:linear-gradient(180deg,rgba(19,38,25,0) 0%,rgba(19,38,25,.55) 45%,rgba(19,38,25,.92) 100%)}
.tuile .txt{position:absolute;left:22px;right:18px;bottom:18px;z-index:1;text-align:left}
.tuile small{display:block;font:700 18px 'Roboto Condensed';letter-spacing:3px;text-transform:uppercase;color:var(--or)}
.tuile b{display:block;font:400 44px/1 'Bebas Neue';color:var(--paper);letter-spacing:.5px;margin-top:4px}
.tuile .p{position:absolute;top:0;right:0;z-index:1;background:var(--rust);color:var(--paper);font:400 40px/1 'Bebas Neue';padding:8px 14px 3px}
.bouton{display:inline-block;background:var(--rust);color:var(--paper);font:400 64px/1 'Bebas Neue';letter-spacing:1px;padding:14px 30px 8px}
.ligne{display:grid;grid-template-columns:150px 1fr;background:#fff;border:1px solid rgba(27,35,26,.15);text-align:left;position:relative}
.ligne .d{background:var(--forest);color:var(--paper);text-align:center;padding:12px 4px 8px;border-bottom:6px solid var(--or)}
.ligne .d small{display:block;font:700 17px 'Roboto Condensed';text-transform:uppercase;letter-spacing:1px}
.ligne .d b{display:block;font:400 72px/1 'Bebas Neue';font-weight:400}
.ligne .c{padding:18px 24px;display:flex;flex-direction:column;justify-content:center}
.ligne .c strong{font:700 27px 'Roboto Condensed';text-transform:uppercase;letter-spacing:.5px}
.ligne .c span{font:400 24px/1.35 'Public Sans';color:var(--gris);margin-top:4px}
.ligne .etoile{top:10px;right:12px;width:16px;height:16px}
.compte{display:flex;gap:10px;justify-content:center;margin:6px 0 4px}
.compte b{background:var(--forest);color:var(--paper);font:400 120px/150px 'Bebas Neue';width:116px;text-align:center;font-weight:400}
.info{background:var(--forest);color:var(--paper);font:400 26px/1.45 'Roboto Condensed';letter-spacing:1px;text-transform:uppercase;padding:20px 30px 18px;border-bottom:6px solid var(--or)}
.info b{color:var(--or);font-weight:700}
`

// Réduit la taille de police des éléments .fit jusqu'à ce qu'ils tiennent sur leur largeur.
const AJUSTE = `<script>
document.fonts.ready.then(function(){
  document.querySelectorAll('.fit').forEach(function(el){
    var t=parseFloat(getComputedStyle(el).fontSize);
    while(el.scrollWidth>el.clientWidth+1&&t>30){t-=2;el.style.fontSize=t+'px'}
  });
  document.body.setAttribute('data-pret','1');
});
</script>`

function pageHtml(format, contenu, { logo, fond = true } = {}) {
  const [w, h] = FORMATS[format]
  const etoiles = (ETOILES[format] || [])
    .map(([g, t, s, o]) => etoile(`left:${g}%;top:${t}%;width:${s}px;height:${s}px;opacity:${o};transform:translate(-50%,-50%)`))
    .join('')
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Public+Sans:wght@400;600;700&family=Roboto+Condensed:wght@400;700&display=block" rel="stylesheet">
<style>${CSS}</style></head>
<body style="--w:${w}px;--h:${h}px">${fond ? '<div class="arcs"></div>' + etoiles : ''}
${logo ? `<img class="logo" src="${logo.src}" style="top:${logo.top}px;height:${logo.h}px">` : ''}
${contenu}${AJUSTE}</body></html>`
}

const img = (photos, cle, n = 1) => photos[cle + (n === 2 ? '-2' : '')]

function produit(v, photos, logoSrc) {
  const fond = img(photos, v.produit)
  return pageHtml('post', `
<div class="photo" style="left:80px;top:138px;width:920px;height:650px;background-image:url('${fond}');background-position:${v.pos || '50% 55%'}">
  <div class="chip">✦ ${v.chip}</div>
</div>
<div class="carte" style="left:118px;right:118px;top:740px;padding:62px 50px 50px">
  ${etoile('', 'etoile')}
  <div class="sur">${v.sur}</div>
  <div class="titre fit">${v.titre}</div>
  <div class="sep">✦</div>
  <div class="phrase">${v.phrase}</div>
  <div class="bas"><span class="prix">${v.prix}</span><span class="infos">${v.infos}</span></div>
</div>
<div class="pied" style="bottom:42px">Commandez sur bontin.fr · livraison ou retrait</div>`,
  { logo: { src: logoSrc, top: 44, h: 66 } })
}

function interieur(v, photos, logoSrc) {
  const fond = img(photos, v.produit, 2)
  return pageHtml('post', `
<div style="position:absolute;left:0;right:0;top:150px;text-align:center">
  <div class="sur" style="color:var(--or)">✦ Ce qu'il y a dedans ✦</div>
  <div class="titre fit" style="color:var(--paper);font-size:96px;margin:14px 60px 0">${v.titre}</div>
</div>
<div class="photo" style="left:120px;top:330px;width:840px;height:840px;background-image:url('${fond}');background-position:50% 50%"></div>
<div class="pied" style="bottom:56px">bontin.fr · rubrique « Les fêtes »</div>`,
  { logo: { src: logoSrc, top: 44, h: 66 } })
}

function duo(v, photos, logoSrc) {
  const tuiles = v.tuiles.map((t, i) => `
<div class="tuile" style="left:${80 + i * 470}px;top:138px;width:450px;height:520px;background-image:url('${img(photos, t.produit)}');background-position:${t.pos || '50% 50%'}">
  <span class="p">${t.prix}</span>
  <div class="txt"><small>✦ ${t.role}</small><b>${t.nom}</b></div>
</div>`).join('')
  return pageHtml('post', `${tuiles}
<div class="carte" style="left:118px;right:118px;top:705px;padding:58px 50px 48px">
  ${etoile('', 'etoile')}
  <div class="sur">${v.sur}</div>
  <div class="titre fit">${v.titre}</div>
  <div class="sep">✦</div>
  <div class="phrase">${v.phrase}</div>
  <div class="bas">${v.bas}</div>
</div>
<div class="pied" style="bottom:42px">Commandez sur bontin.fr · livraison ou retrait</div>`,
  { logo: { src: logoSrc, top: 44, h: 66 } })
}

function menu(v, photos, logoSrc) {
  const tuiles = v.plats.map((t, i) => `
<div class="tuile" style="left:${80 + (i % 2) * 470}px;top:${486 + Math.floor(i / 2) * 340}px;width:450px;height:320px;background-image:url('${img(photos, t.produit)}');background-position:50% 50%">
  <span class="p">${t.prix}</span>
  <div class="txt"><small>✦ ${t.role}</small><b style="font-size:40px">${t.nom}</b></div>
</div>`).join('')
  return pageHtml('post', `
<div class="carte" style="left:118px;right:118px;top:132px;padding:56px 50px 40px">
  ${etoile('', 'etoile')}
  <div class="sur">${v.sur}</div>
  <div class="titre fit" style="margin-bottom:2px">${v.titre}</div>
  <div class="phrase" style="font-size:26px">Tout se garde au congélateur jusqu'au jour J.</div>
</div>
${tuiles}
<div style="position:absolute;left:0;right:0;top:1176px;display:flex;justify-content:center;align-items:center;gap:20px">
  <span class="infos" style="color:var(--paper);text-align:right">Le repas<br>complet</span><span class="prix" style="font-size:76px">${v.total}</span>
</div>
<div class="pied" style="bottom:36px">bontin.fr · livraison ou retrait à Plouédern</div>`,
  { logo: { src: logoSrc, top: 44, h: 66 } })
}

function dates(v, format, logoSrc) {
  const story = format === 'story'
  const lignes = v.lignes.map((l) => `
<div class="ligne">${etoile('', 'etoile')}
  <div class="d"><small>${l.j}</small><b>${l.n}</b><small>${l.m}</small></div>
  <div class="c"><strong>${l.t}</strong><span>${l.x}</span></div>
</div>`).join('')
  const compte = v.compte
    ? `<div class="compte">${['J', '-', ...String(v.compte).split('')].map((x) => `<b>${x}</b>`).join('')}</div>`
    : ''
  return pageHtml(format, `
<div class="carte" style="left:72px;right:72px;top:${story ? 330 : 140}px;bottom:${story ? 330 : 112}px;padding:64px 56px 52px;display:flex;flex-direction:column;justify-content:center;gap:${story ? 26 : 14}px">
  ${etoile('', 'etoile')}
  <div class="sur">${v.sur}</div>
  <div class="titre fit" style="font-size:${story ? 124 : 112}px;margin:0">${v.titre}</div>
  ${compte}
  <div class="sep" style="margin:0">✦</div>
  <div style="display:flex;flex-direction:column;gap:${story ? 22 : 16}px;margin:${story ? 10 : 4}px 0">${lignes}</div>
  <div><span class="bouton">bontin.fr</span></div>
</div>
${story ? '<div class="pied" style="bottom:210px">Livraison ou retrait à Plouédern</div>' : '<div class="pied" style="bottom:40px">Livraison ou retrait à Plouédern</div>'}`,
  { logo: { src: logoSrc, top: story ? 200 : 42, h: story ? 84 : 66 } })
}

function voeux(v, format, logoSrc) {
  const story = format === 'story'
  const annee = v.annee
    ? `<div style="font:400 ${story ? 300 : 250}px/.85 'Bebas Neue';color:var(--or);letter-spacing:6px;margin:4px 0 0">${v.annee}</div>`
    : ''
  return pageHtml(format, `
<div class="carte" style="left:80px;right:80px;top:${story ? 340 : 150}px;bottom:${story ? 340 : 120}px;padding:70px 60px 60px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:${story ? 30 : 18}px">
  ${etoile('', 'etoile')}
  <div class="sur" style="letter-spacing:6px;font-size:23px">${v.sur}</div>
  <div class="titre" style="font-size:${v.annee ? 150 : story ? 230 : 190}px;line-height:1;margin:0;white-space:normal">${v.titre}</div>
  ${annee}
  <div class="sep" style="margin:0">✦</div>
  <div class="phrase" style="font-size:30px">${v.texte}</div>
  <div class="info" style="margin-top:${story ? 20 : 8}px">${v.info}</div>
</div>
<div class="pied" style="bottom:${story ? 220 : 46}px">bontin.fr</div>`,
  { logo: { src: logoSrc, top: story ? 210 : 46, h: story ? 84 : 66 } })
}

function couverture(v, logoSrc) {
  return pageHtml('couv', `
<div class="carte" style="left:440px;right:440px;top:64px;bottom:64px;padding:46px 40px 34px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:6px">
  <img src="${logoSrc}" style="height:46px">
  <div class="sur" style="font-size:19px;letter-spacing:6px;margin-top:8px">${v.sur}</div>
  <div class="titre fit" style="font-size:92px;margin:4px 0 0;max-width:100%">${v.titre}</div>
  <div class="sep" style="margin:2px 0;font-size:20px">✦</div>
  <div class="phrase" style="font-size:20px">${v.texte}</div>
</div>`)
}

// Renvoie { cle: html } pour tous les visuels. photos = { 'ecd0f35c': 'file://…', 'ecd0f35c-2': … }, cle produit → id.
export function pagesVisuels(photosParId, PRODUITS, logoSrc) {
  const photos = {}
  for (const [cle, p] of Object.entries(PRODUITS)) {
    photos[cle] = photosParId[p.id]
    if (photosParId[p.id + '-2']) photos[cle + '-2'] = photosParId[p.id + '-2']
  }
  const pages = {}
  for (const [cle, def] of Object.entries(VISUELS)) {
    const v = def.base ? { ...VISUELS[def.base], ...def } : def
    if (v.type === 'produit') pages[cle] = produit(v, photos, logoSrc)
    else if (v.type === 'interieur') pages[cle] = interieur(v, photos, logoSrc)
    else if (v.type === 'duo') pages[cle] = duo(v, photos, logoSrc)
    else if (v.type === 'menu') pages[cle] = menu(v, photos, logoSrc)
    else if (v.type === 'dates') pages[cle] = dates(v, v.format, logoSrc)
    else if (v.type === 'voeux') pages[cle] = voeux(v, v.format, logoSrc)
    else if (v.type === 'couverture') pages[cle] = couverture(v, logoSrc)
  }
  return pages
}

export function formatDe(cle) {
  const def = VISUELS[cle]
  return def.format
}
