// Guide HTML (kit-fetes.html), programme texte et dossier « Fetes Bontin 2026 » sur le Bureau.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { PUBLICATIONS, PRODUITS, VISUELS, texteFacebook, texteInstagram } from './publications.mjs'

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const MOIS = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const MOIS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const jour = (iso) => new Date(iso + 'T12:00:00')
const dateLongue = (iso) => { const d = jour(iso); return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS_LONG[d.getMonth()]}` }
const sansAccent = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ').replace(/[^A-Za-z0-9 +,€-]/g, '').replace(/\s+/g, ' ').trim()
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const num = (i) => String(i + 1).padStart(2, '0')

// Nom lisible d'un fichier pour le dossier du Bureau : « 02 - Jeu 3 dec 12h - Buche Breizh.jpg »
function nomsBureau() {
  const noms = {}
  PUBLICATIONS.forEach((p, i) => {
    const d = jour(p.date)
    const quand = `${JOURS[d.getDay()].slice(0, 3)} ${d.getDate()} ${sansAccent(MOIS[d.getMonth()]).replace('.', '')} ${p.heure.replace(/ /g, '')}`
    const base = `${num(i)} - ${quand} - ${sansAccent(p.titre)}`
    p.visuels.forEach((v, k) => { noms[v] = k === 0 ? `${base}.jpg` : `${num(i)}b - ${quand} - ${sansAccent(p.titre)} (2e photo du carrousel).jpg` })
    if (p.story) noms[p.story] = `${num(i)}s - ${quand} - Story ${sansAccent(p.titre)}.jpg`
    if (p.couverture) noms[p.couverture] = `${num(i)}c - ${quand} - Photo de couverture Facebook (jusqu au 3 janvier).jpg`
  })
  return noms
}

const CSS = `
:root{--ink:#1b231a;--forest:#23422b;--stone:#e7e2d3;--paper:#fbfaf6;--rust:#a34428;--or:#d9b86a;--muted:#6b7264;--ligne:#d6d1c2}
*{box-sizing:border-box}
body{margin:0;background:var(--stone);color:var(--ink);font:16px/1.55 'Public Sans',sans-serif}
header{background:var(--forest);color:var(--paper);padding:36px 20px;position:relative;overflow:hidden}
header:before{content:'';position:absolute;inset:0;opacity:.18;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='40' viewBox='0 0 80 40'%3E%3Cg fill='none' stroke='%23d9b86a' stroke-width='1'%3E%3Cpath d='M0 40 A40 40 0 0 1 80 40'/%3E%3Cpath d='M10 40 A30 30 0 0 1 70 40'/%3E%3Cpath d='M20 40 A20 20 0 0 1 60 40'/%3E%3Cpath d='M30 40 A10 10 0 0 1 50 40'/%3E%3C/g%3E%3C/svg%3E")}
header .in,main{max-width:980px;margin:0 auto;position:relative}
h1{font:400 64px/.9 'Bebas Neue';margin:6px 0 10px;letter-spacing:1px}
h1 span{color:var(--or)}
.sur{font:700 13px 'Roboto Condensed';text-transform:uppercase;letter-spacing:5px;color:var(--or)}
header p{color:#d8d3c4;max-width:700px;margin:0}
main{padding:10px 20px 60px}
h2{font:400 40px/1 'Bebas Neue';margin:44px 0 14px;display:flex;align-items:center;gap:12px}
h2:after{content:'';flex:1;height:1px;background:var(--or)}
h3{font:700 15px 'Roboto Condensed';text-transform:uppercase;letter-spacing:.5px;margin:22px 0 6px}
.chiffres{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.chiffres div{background:var(--paper);border:1px solid var(--ligne);padding:14px 16px}
.chiffres b{display:block;font:400 38px/1 'Bebas Neue';color:var(--rust)}
table{width:100%;border-collapse:collapse;background:var(--paper);font-size:15px}
th,td{border-bottom:1px solid var(--ligne);padding:8px 10px;text-align:left;vertical-align:top}
th{font:700 12px 'Roboto Condensed';text-transform:uppercase;letter-spacing:.5px;color:var(--muted);background:#f3f0e6}
td.n{text-align:right;white-space:nowrap}
.attention{border-left:4px solid var(--rust);background:#fbeee9;padding:12px 16px;margin:14px 0}
.ok{border-left:4px solid var(--forest);background:#e9efe6;padding:12px 16px;margin:14px 0}
ol li,ul li{margin:4px 0}
.semaine{font:700 13px 'Roboto Condensed';text-transform:uppercase;letter-spacing:4px;color:var(--rust);margin:30px 0 4px}
.jour{display:grid;grid-template-columns:120px 1fr;gap:16px;background:var(--paper);border:1px solid var(--ligne);margin:12px 0}
.jour .d{background:var(--forest);color:var(--paper);text-align:center;padding:12px 6px;border-bottom:5px solid var(--or)}
.jour .d small{display:block;font:700 11px 'Roboto Condensed';text-transform:uppercase;letter-spacing:1px}
.jour .d b{font:400 46px/1 'Bebas Neue'}
.jour .c{padding:14px 16px 16px 0;min-width:0}
.jour .c .titre{font:700 16px 'Roboto Condensed';text-transform:uppercase}
.jour .c .meta{font-size:13px;color:var(--muted);margin:2px 0 8px}
.vis{display:flex;gap:10px;flex-wrap:wrap;margin:8px 0}
.vis a{display:block;width:130px;font-size:11px;color:var(--muted);text-decoration:none}
.vis img{width:130px;height:auto;display:block;border:1px solid var(--ligne)}
.onglets{display:flex;gap:4px;margin-top:10px}
.onglets button{border:1px solid var(--ligne);background:#f3f0e6;font:700 12px 'Roboto Condensed';text-transform:uppercase;letter-spacing:1px;padding:7px 12px;cursor:pointer;color:var(--ink)}
.onglets button.actif{background:var(--forest);color:var(--paper);border-color:var(--forest)}
.texte{position:relative;background:#fff;border:1px dashed #b9b4a4;padding:14px 16px;white-space:pre-wrap;font-size:15px;margin:0 0 8px}
.texte[hidden]{display:none}
.copier{position:absolute;top:8px;right:8px;background:var(--ink);color:var(--paper);border:0;font:700 11px 'Roboto Condensed';text-transform:uppercase;letter-spacing:1px;padding:6px 10px;cursor:pointer}
.copier.fait{background:var(--forest)}
.galerie{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}
.galerie a{background:var(--paper);border:1px solid var(--ligne);padding:8px;color:var(--ink);text-decoration:none;font-size:13px}
.galerie img{width:100%;display:block;margin-bottom:6px}
code{background:#fff;border:1px solid var(--ligne);padding:1px 5px;font-size:14px}
@media (max-width:600px){h1{font-size:46px}.jour{grid-template-columns:84px 1fr;gap:10px}.jour .d b{font-size:36px}.vis a,.vis img{width:100px}}
@media print{.copier,.onglets{display:none}.texte[hidden]{display:block}}
`

function blocPublication(p, i) {
  const d = jour(p.date)
  const images = [...p.visuels, p.story, p.couverture].filter(Boolean)
  const legende = (v) => v === p.story ? 'story' : v === p.couverture ? 'couverture Facebook' : p.carrousel && v !== p.visuels[0] ? '2e photo' : 'publication'
  const vis = images.map((v) => `<a href="visuels/${v}.jpg"><img src="visuels/${v}.jpg" alt="">${legende(v)}</a>`).join('')
  const meta = [
    p.heure,
    p.carrousel ? 'carrousel de 2 photos (les 2 dans la même publication)' : '1 photo',
    p.story ? '+ story' : '',
    p.couverture ? '+ changer la photo de couverture Facebook' : '',
  ].filter(Boolean).join(' · ')
  const produits = (p.produits || []).map((k) => PRODUITS[k].nom.trim()).join(' · ')
  return `<div class="jour" id="p${num(i)}"><div class="d"><small>${JOURS[d.getDay()]}</small><b>${d.getDate()}</b><small>${MOIS[d.getMonth()]}</small></div><div class="c">
  <div class="titre">${num(i)} · ${esc(p.titre)}</div><div class="meta">${esc(meta)}${produits ? `<br>Produit${p.produits.length > 1 ? 's' : ''} : ${esc(produits)}` : ''}</div>
  <div class="vis">${vis}</div>
  <div class="onglets"><button class="actif" data-cible="fb">Facebook</button><button data-cible="ig">Instagram</button></div>
  <div class="texte" data-type="fb">${esc(texteFacebook(p))}</div>
  <div class="texte" data-type="ig" hidden>${esc(texteInstagram(p))}</div>
</div></div>`
}

export function ecrireGuide(dossier) {
  const utilises = PUBLICATIONS.flatMap((p) => p.produits || [])
  const nbBuches = utilises.filter((k) => /BÛCHE/.test(PRODUITS[k].nom)).length
  let semaine = ''
  const calendrier = PUBLICATIONS.map((p, i) => {
    const d = jour(p.date)
    const lundi = new Date(d); lundi.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    const dimanche = new Date(lundi); dimanche.setDate(lundi.getDate() + 6)
    const s = p.date >= '2026-12-25' ? 'Fermeture (le dépôt est fermé, seuls les vœux sont publiés)' : `Semaine du ${lundi.getDate()} ${MOIS_LONG[lundi.getMonth()]} au ${dimanche.getDate()} ${MOIS_LONG[dimanche.getMonth()]}`
    const titre = s !== semaine ? `<div class="semaine">${s}</div>` : ''
    semaine = s
    return titre + blocPublication(p, i)
  }).join('\n')

  const lignesProduits = PUBLICATIONS.flatMap((p) => (p.produits || []).map((k) => ({ p, k })))
    .map(({ p, k }) => `<tr${/BÛCHE/.test(PRODUITS[k].nom) ? ' style="background:#fbf3e3"' : ''}><td>${esc(PRODUITS[k].nom.trim())}</td><td>${dateLongue(p.date)}</td></tr>`).join('')

  const tous = Object.keys(VISUELS)
  const galerie = tous.map((v) => `<a href="visuels/${v}.jpg"><img src="visuels/${v}.jpg" alt="" loading="lazy"><b>${v}</b></a>`).join('')

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kit des fêtes Bontin</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Public+Sans:wght@400;600;700&family=Roboto+Condensed:wght@700&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body>
<header><div class="in">
  <div class="sur">✦ Bontin · décembre 2026 ✦</div>
  <h1>Kit Facebook &amp; Instagram <span>des fêtes</span></h1>
  <p>Toutes les publications du 1er au 24 décembre, plus le réveillon et le jour de l'an : le calendrier, les visuels aux couleurs du menu des fêtes et les textes prêts à copier, en version Facebook et Instagram.</p>
</div></header>
<main>

<h2>En bref</h2>
<div class="chiffres">
  <div><b>${PUBLICATIONS.length} publications</b>3 à 4 par semaine jusqu'au 24, puis le 31 décembre et le 1er janvier</div>
  <div><b>${nbBuches} bûches</b>Une seule fois chacune, en carrousel avec l'intérieur pour les grandes bûches</div>
  <div><b>${utilises.length} produits</b>Du rayon « Fêtes », jamais deux fois le même dans le mois</div>
  <div><b>25/12 → 03/01</b>Fermeture. Réouverture le lundi 4 janvier</div>
</div>
<div class="ok"><b>Les dates répétées partout</b> (vérifiées dans le calendrier de l'admin le 20/11) : dernières livraisons le <b>mercredi 23</b>, dernier retrait le <b>jeudi 24 jusqu'à midi</b>, commande au plus tard la veille (le site propose les créneaux à partir du lendemain), fermeture du 25 décembre au 3 janvier, réouverture le <b>lundi 4 janvier</b>. Le site reste ouvert pendant la fermeture : les clients peuvent commander pour le 4 janvier et après.</div>

<h2>1. À faire avant le 1er décembre</h2>
<ul>
  <li>☐ <b>Programmer toutes les publications</b> dans Meta Business Suite (pas à pas ci-dessous). Facebook et Instagram en même temps.</li>
  <li>☐ <b>Instagram → Modifier le profil → Liens</b> : mettre <code>https://bontin.fr/fetes</code> (Instagram n'accepte pas de lien cliquable dans les publications, d'où le « lien dans la bio »).</li>
  <li>☐ <b>Admin → Fêtes → Les dates à retenir</b> : la date du 25/12 s'appelle « Réveillon » avec le texte « Joyeux Noël, on se retrouve le 4 Janvier 2027 ». Je propose de la renommer <b>« Fermeture »</b> avec le texte « Du 25 décembre au 3 janvier. Réouverture le lundi 4 janvier. »</li>
  <li>☐ <b>Stocks</b> avec Sylvie : les ${utilises.length} produits du tableau de la partie 4, surtout les bûches.</li>
</ul>
<div class="attention"><b>Prix relevés sur le site le 20 novembre.</b> La veille de chaque publication de produit, jetez un œil à sa fiche sur bontin.fr : si le prix a changé ou si le produit est en rupture, dites-le-moi et je refais le visuel en 2 minutes (ou décalez la publication).</div>

<h3>Programmer dans Meta Business Suite, pas à pas</h3>
<ol>
  <li>business.facebook.com → <b>Planificateur</b> (ou « Créer une publication »).</li>
  <li>En haut, « Publier sur » : cocher <b>la page Facebook Bontin ET le compte Instagram</b>.</li>
  <li><b>Ajouter une photo</b> : le visuel de la publication. Pour les bûches, ajouter <b>les 2 photos</b> (la bûche puis « l'intérieur ») : Facebook les affiche ensemble, Instagram en fait un carrousel qu'on fait glisser.</li>
  <li>Texte : coller la version <b>Facebook</b>. Puis activer <b>« Personnaliser le texte pour chaque plateforme »</b> et coller la version <b>Instagram</b> dans l'onglet Instagram (lien dans la bio + hashtags).</li>
  <li>En bas : flèche à côté de « Publier » → <b>Programmer</b> → date et heure du calendrier → Programmer.</li>
  <li><b>Stories</b> (6 jours marqués « + story ») : « Créer une story » → Facebook + Instagram → le visuel « story » → Programmer à la même heure. Sur Instagram, on peut ajouter à la main un autocollant « Lien » vers bontin.fr/fetes.</li>
</ol>
<p>Tout est programmé d'un coup : il ne restera à faire à la main que la photo de couverture du 24 décembre, et répondre aux commentaires.</p>

<h2>2. Le calendrier</h2>
<p>Horaires choisis comme pour la Black Week : <b>11 h - 13 h</b> ou <b>18 h - 19 h</b>, quand vos clients regardent leur téléphone. Chaque texte existe en deux versions : cliquez sur « Instagram » pour voir la seconde.</p>
${calendrier}

<h2>3. Le jour de la fermeture (jeudi 24 décembre)</h2>
<ul>
  <li>☐ Après le dernier retrait : <b>photo de couverture Facebook</b> → visuel « couverture » (« On se retrouve le 4 janvier »), à la place de la couverture des fêtes.</li>
  <li>☐ <b>Lundi 4 janvier</b> : remettre votre photo de couverture habituelle.</li>
  <li>Rien d'autre à faire : les vœux du 31 et du 1er sont programmés, la bannière des fêtes du site s'arrête toute seule le 2 janvier à minuit.</li>
</ul>

<h2>4. Les produits mis en avant</h2>
<p>Tous viennent du rayon « Fêtes » de l'admin, <b>chacun une seule fois</b> dans le mois. Les bûches sont surlignées.</p>
<table><tr><th>Produit (nom sur le site)</th><th>Publié le</th></tr>${lignesProduits}</table>
<h3>Volontairement laissés de côté</h3>
<ul>
  <li><b>Bûche profiteroles et noix de Saint-Jacques de Saint-Brieuc</b> : déjà sur la publication « Merci + place aux fêtes » du 30 novembre et sur la photo de couverture Facebook, visible tout le mois. (La pintade farcie et les mini feuilletés y sont aussi, mais ils ont leur publication en décembre, à la demande de Romuald.)</li>
  <li><b>Les vins de la « Cave de Noël »</b> : la loi Évin encadre strictement la publicité pour l'alcool sur les réseaux sociaux. Mieux vaut ne pas les mettre en avant.</li>
  <li>Les coquilles Saint-Jacques ont été le « prix choc » de la Black Week. Les macarons, en promo pendant la Black Week, reviennent seulement comme dessert du menu du 16 décembre, à leur prix normal.</li>
</ul>

<h2>5. Publicité payante (facultatif, ≈ 45 €)</h2>
<table>
  <tr><th>Publication à booster</th><th>Objectif</th><th>Budget</th></tr>
  <tr><td>01 · Les dates à retenir (1er déc.)</td><td>« Plus de visites sur le site » → https://bontin.fr/fetes</td><td>3 € par jour du 1er au 7 ≈ 21 €</td></tr>
  <tr><td>09 · Un réveillon pour 4 à moins de 50 € (16 déc.)</td><td>« Plus de visites sur le site » → https://bontin.fr/fetes</td><td>4 € par jour du 16 au 21 ≈ 24 €</td></tr>
</table>
<p>Même audience que pour la Black Week : personnes vivant à 25 km autour de Plouédern, 25 à 65 ans et plus, centres d'intérêt vides. Comparez le coût par clic avec celui de la Black Week (noté le 30 novembre).</p>

<h2>6. Réponses toutes prêtes</h2>
<h3>« Vous livrez le 24 ? »</h3>
<div class="texte">Bonjour [Prénom] ! Les dernières livraisons avant Noël sont le mercredi 23 décembre (commande au plus tard le mardi 22). Le jeudi 24, le retrait au dépôt de Plouédern est possible jusqu'à midi 😉</div>
<h3>« Comment on conserve une bûche glacée ? »</h3>
<div class="texte">Bonjour [Prénom] ! Elle se garde au congélateur jusqu'au jour J, comme une glace. Le conseil de service est indiqué sur l'emballage et sur sa fiche sur bontin.fr 😊</div>
<h3>« Vous êtes ouverts entre Noël et le jour de l'an ? »</h3>
<div class="texte">Bonjour [Prénom] ! Le dépôt est fermé du 25 décembre au 3 janvier. On rouvre le lundi 4 janvier, et vous pouvez déjà commander sur bontin.fr pour une livraison ou un retrait à partir de cette date.</div>
<h3>« Vous livrez à … ? »</h3>
<div class="texte">Bonjour [Prénom] ! Oui, nous livrons autour de Landerneau et Plouédern : le site vérifie votre code postal au moment de commander. Sinon, le retrait au dépôt de Plouédern est toujours possible 😉</div>
<h3>« Il en reste ? »</h3>
<div class="texte">Bonjour [Prénom] ! Oui, il en reste pour le moment 😊 Si le produit est visible sur bontin.fr, c'est qu'il est disponible.</div>
<h3>Une réclamation ou une question sur une commande</h3>
<div class="texte">Bonjour [Prénom], merci pour votre message. Nous vous répondons en message privé pour regarder ça ensemble.</div>

<h2>Tous les visuels</h2>
<p>Publications au format 4:5 (1080 × 1350, parfait pour Facebook et Instagram), stories en 1080 × 1920, couverture en 1640 × 624. Ils sont aussi dans le dossier <code>Fetes Bontin 2026</code> du Bureau, nommés avec le jour et l'heure.</p>
<div class="galerie">${galerie}</div>
</main>
<script>
document.querySelectorAll('.texte').forEach(function (bloc) {
  var b = document.createElement('button')
  b.className = 'copier'; b.textContent = 'Copier'
  b.onclick = function () {
    var t = bloc.cloneNode(true); t.querySelector('.copier').remove()
    navigator.clipboard.writeText(t.textContent.trim()).then(function () {
      b.textContent = 'Copié ✓'; b.classList.add('fait')
      setTimeout(function () { b.textContent = 'Copier'; b.classList.remove('fait') }, 1800)
    })
  }
  bloc.appendChild(b)
})
document.querySelectorAll('.onglets').forEach(function (o) {
  o.querySelectorAll('button').forEach(function (btn) {
    btn.onclick = function () {
      o.querySelectorAll('button').forEach(function (x) { x.classList.toggle('actif', x === btn) })
      o.parentNode.querySelectorAll('.texte[data-type]').forEach(function (t) { t.hidden = t.dataset.type !== btn.dataset.cible })
    }
  })
})
</script>
</body></html>`
  fs.writeFileSync(path.join(dossier, 'kit-fetes.html'), html)
}

export function ecrireProgramme(dossier) {
  const noms = nomsBureau()
  const trait = '━'.repeat(30)
  const jours = PUBLICATIONS.map((p, i) => {
    const fichiers = [...p.visuels, p.story, p.couverture].filter(Boolean).map((v) => `   visuel : ${noms[v]}`).join('\n')
    return `${dateLongue(p.date).toUpperCase()} · ${p.heure} — ${num(i)} · ${p.titre}${p.carrousel ? ' (carrousel : les 2 photos dans la même publication)' : ''}
${fichiers}

— Texte Facebook —
${texteFacebook(p)}

— Texte Instagram —
${texteInstagram(p)}
`
  }).join(`\n${'·'.repeat(30)}\n\n`)
  const txt = `BONTIN — KIT FACEBOOK / INSTAGRAM DES FÊTES (DÉCEMBRE 2026)
Guide avec visuels : docs/fetes-decembre/kit-fetes.html · Visuels : dossier « Fetes Bontin 2026 » sur le Bureau

${trait}
LES DATES RÉPÉTÉES PARTOUT
${trait}
• Dernières livraisons : mercredi 23 décembre (commande au plus tard le mardi 22)
• Dernier retrait au dépôt : jeudi 24 décembre jusqu'à midi (commande au plus tard le mercredi 23)
• Fermeture du 25 décembre au 3 janvier, réouverture le lundi 4 janvier (le site reste ouvert)

${trait}
AVANT LE 1ER DÉCEMBRE
${trait}
☐ Meta Business Suite : programmer les ${PUBLICATIONS.length} publications (Facebook + Instagram, textes personnalisés par plateforme) et les 6 stories
☐ Instagram : lien du profil = https://bontin.fr/fetes
☐ Admin → Fêtes : renommer la date du 25/12 « Réveillon » en « Fermeture » (texte : Du 25 décembre au 3 janvier. Réouverture le lundi 4 janvier.)
☐ Stocks des ${PUBLICATIONS.flatMap((p) => p.produits || []).length} produits mis en avant avec Sylvie (surtout les bûches)
☐ La veille de chaque publication produit : vérifier prix et stock sur bontin.fr (prix relevés le 20/11)
☐ Jeudi 24 après le dernier retrait : photo de couverture Facebook « On se retrouve le 4 janvier »
☐ Lundi 4 janvier : remettre la photo de couverture habituelle

${trait}
JOUR PAR JOUR
${trait}

${jours}`
  fs.writeFileSync(path.join(dossier, 'programme-decembre-2026.txt'), txt)
}

export function copierBureau(dossier) {
  const bureau = path.join(os.homedir(), 'Desktop', 'Fetes Bontin 2026')
  fs.mkdirSync(bureau, { recursive: true })
  // On repart d'un dossier propre : les visuels d'une ancienne version du calendrier sont retirés.
  for (const f of fs.readdirSync(bureau)) if (/^\d\d[bsc]? - .*\.jpg$/.test(f)) fs.rmSync(path.join(bureau, f))
  const noms = nomsBureau()
  for (const [cle, nom] of Object.entries(noms)) {
    const source = path.join(dossier, 'visuels', cle + '.jpg')
    if (fs.existsSync(source)) fs.copyFileSync(source, path.join(bureau, nom))
  }
  fs.copyFileSync(path.join(dossier, 'programme-decembre-2026.txt'), path.join(bureau, '00 - Programme complet.txt'))
  fs.writeFileSync(path.join(bureau, '00 - A lire.txt'), `FÊTES BONTIN 2026 — LES VISUELS FACEBOOK / INSTAGRAM

Un fichier par publication, dans l'ordre. Le nom donne le jour et l'heure de publication.
Les textes à copier (Facebook ET Instagram) sont dans « 00 - Programme complet.txt ».
Le guide avec les boutons « Copier » : docs/fetes-decembre/kit-fetes.html dans le projet.

• « b » = 2e photo du carrousel (à mettre dans la MÊME publication que la photo principale)
• « s » = story, à programmer le même jour
• « c » = photo de couverture Facebook, à changer à la main le jeudi 24 après le dernier retrait

Formats : publications en 4:5 (1080 × 1350, Facebook et Instagram), stories en 1080 × 1920,
couverture Facebook en 1640 × 624.
`)
}
