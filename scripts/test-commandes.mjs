// Test complet des commandes sur la vraie base (comptes, prix, code promo, parrainage, sécurité).
// Crée des comptes et commandes « test.claude… » puis les SUPPRIME à la fin, même en cas d'erreur.
// N'envoie aucun email. Lancement (la clé « service_role » n'est jamais écrite dans un fichier) :
//   SUPABASE_SERVICE_ROLE_KEY=… node scripts/test-commandes.mjs
// (Claude la récupère avec : supabase projects api-keys --project-ref kydlnfchsgwsitwjonah)
import fs from 'node:fs'
import { calculerCommande } from '../supabase/functions/_shared/calculCommande.js'

const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
)
const URL_ = env.VITE_SUPABASE_URL
const KEY = env.VITE_SUPABASE_ANON_KEY
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SR) throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante')
const MDP = 'Essai-' + Math.random().toString(36).slice(2, 10)
const PREFIXE = 'test.claude.'
let echecs = 0
const ok = (cond, msg) => {
  if (!cond) echecs++
  console.log(`${cond ? 'OK   ' : 'ÉCHEC'} ${msg}`)
}
const h = (j) => ({ apikey: KEY, Authorization: `Bearer ${j || KEY}`, 'Content-Type': 'application/json' })
const hs = { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': 'application/json' }
const post = async (c, b, j) => {
  const r = await fetch(URL_ + c, { method: 'POST', headers: h(j), body: JSON.stringify(b) })
  return { status: r.status, d: await r.json().catch(() => null) }
}
const get = async (c, headers = hs) => (await fetch(URL_ + c, { headers })).json()
const compte = (email, tel, adresse, codeParrain) =>
  post('/functions/v1/creer-compte', { email, motDePasse: MDP, prenom: 'Testclaude', nom: 'ESSAI', telephone: tel, dateNaissance: '1990-01-01', adresse, codePostal: '29800', ville: 'Plouedern', accepteCgv: true, codeParrain })
const jeton = async (email) => (await post('/auth/v1/token?grant_type=password', { email, password: MDP })).d.access_token

async function nettoyer() {
  await fetch(`${URL_}/rest/v1/commandes?nom_client=like.TEST%20CLAUDE*`, { method: 'DELETE', headers: hs })
  const { users } = await get('/auth/v1/admin/users?per_page=200')
  for (const u of users.filter((x) => x.email?.startsWith(PREFIXE))) {
    await fetch(`${URL_}/rest/v1/bons_achat?client_id=eq.${u.id}`, { method: 'DELETE', headers: hs })
    await fetch(`${URL_}/rest/v1/clients?id=eq.${u.id}`, { method: 'DELETE', headers: hs })
    await fetch(`${URL_}/auth/v1/admin/users/${u.id}`, { method: 'DELETE', headers: hs })
  }
}

async function tests() {
  // Sécurité de base
  ok((await post('/auth/v1/signup', { email: `${PREFIXE}intrus@example.com`, password: 'Abcdefgh123!' })).status >= 400, 'inscription directe refusée')
  ok((await post('/rest/v1/commandes', { nom_client: 'TEST CLAUDE', telephone: '0', mode: 'retrait', total: 0 })).status >= 400, 'écriture directe d’une commande refusée')
  ok((await get('/rest/v1/clients?select=id', h())).length === 0, 'un visiteur ne voit aucune fiche client')

  // Comptes et parrainage
  await compte(`${PREFIXE}parrain@example.com`, '0611111111', '1 rue du Parrain')
  const P = (await get(`/rest/v1/clients?select=id,code_parrain&email=eq.${PREFIXE}parrain@example.com`))[0]
  ok(!!P?.code_parrain, `code parrain généré (${P?.code_parrain})`)
  let r = await compte(`${PREFIXE}fraude@example.com`, '06 11 11 11 11', '2 rue Autre', P.code_parrain)
  ok(r.status === 400, 'même téléphone que le parrain refusé')
  r = await compte(`${PREFIXE}filleul@example.com`, '0622222222', '3 rue du Filleul', P.code_parrain.toLowerCase())
  ok(r.d?.parraine, 'filleul créé avec le code parrain')
  const F = (await get(`/rest/v1/clients?select=id,parrain_id&email=eq.${PREFIXE}filleul@example.com`))[0]
  const bonsF = await get(`/rest/v1/bons_achat?select=*&client_id=eq.${F.id}`)
  ok(bonsF.length === 1, `bon de bienvenue du filleul : ${bonsF[0]?.montant} € dès ${bonsF[0]?.minimum_commande} €`)
  const JF = await jeton(`${PREFIXE}filleul@example.com`)
  const rr = await fetch(`${URL_}/rest/v1/clients?id=eq.${F.id}`, { method: 'PATCH', headers: { ...h(JF), Prefer: 'return=representation' }, body: JSON.stringify({ parrain_id: null }) })
  ok(rr.status >= 400, 'un client ne peut pas changer son parrain')
  ok((await get('/rest/v1/codes_promo?select=code', h(JF))).length === 0, 'la liste des codes promo est invisible')

  // Commande au prix du serveur, code promo et bon
  const reglages = (await get('/rest/v1/parametres_site?select=remise_retrait,frais_livraison&id=eq.1'))[0]
  const avecVariantes = new Set((await get('/rest/v1/variantes_produit?select=produit_id')).map((v) => v.produit_id))
  const produits = (await get('/rest/v1/produits?select=id,nom,nom_retrait,actif,en_rupture,en_promo,taux_promo,prix_promo,promo_debut,promo_fin,en_destockage,prix_destockage,prix_livraison,dispo_livraison,dispo_retrait&actif=eq.true&en_rupture=eq.false&dispo_retrait=neq.false&prix_livraison=gt.5&order=prix_livraison.desc&limit=40')).filter((p) => !avecVariantes.has(p.id))
  const choix = produits.slice(0, 4)
  const lignes = choix.map((p) => ({ produit: p, variante: null, quantite: 1 }))
  const code = await post('/rest/v1/rpc/verifier_code_promo', { p_code: 'bienvenue10' }, JF)
  const prevu = calculerCommande({ lignes, mode: 'retrait', remiseRetrait: reglages.remise_retrait, fraisLivraison: reglages.frais_livraison, code: code.d?.ok ? { code: code.d.code, pourcentage: code.d.pourcentage } : null, bon: bonsF[0] })
  const demande = { mode: 'retrait', lignes: choix.map((p) => ({ produitId: p.id, varianteId: null, quantite: 1 })), nom: 'TEST CLAUDE (essai)', telephone: '0622222222', creneau: 'essai', codePromo: code.d?.ok ? 'bienvenue10' : null }
  r = await post('/functions/v1/passer-commande', { ...demande, totalAttendu: prevu.total + 5 }, JF)
  ok(r.status === 409, 'total différent de celui du serveur refusé')
  r = await post('/functions/v1/passer-commande', { ...demande, totalAttendu: prevu.total }, JF)
  ok(r.d?.ok && Number(r.d.commande.total) === prevu.total, `commande enregistrée au prix du serveur (${prevu.total} €, bon -${r.d?.commande?.remise_bon}, code -${r.d?.commande?.remise_code})`)
  const C1 = r.d?.commande
  if (demande.codePromo) {
    r = await post('/functions/v1/passer-commande', demande, JF)
    ok(r.status === 409, 'deuxième utilisation du code par le même compte refusée')
  }
  r = await post('/functions/v1/passer-commande', { ...demande, codePromo: null, lignes: [{ produitId: '00000000-0000-0000-0000-000000000000', varianteId: null, quantite: 1 }] }, JF)
  ok(r.status === 409, 'produit inexistant refusé')

  // Livraison → bon du parrain
  if (C1) await fetch(`${URL_}/rest/v1/commandes?id=eq.${C1.id}`, { method: 'PATCH', headers: hs, body: JSON.stringify({ statut: 'livree' }) })
  const bonsP = await get(`/rest/v1/bons_achat?select=*&client_id=eq.${P.id}`)
  ok(bonsP.length === 1 && bonsP[0].motif === 'parrainage_parrain', 'bon du parrain créé à la livraison de la commande du filleul')
  ok((await get(`/rest/v1/commandes?select=id`, h(JF))).length >= 1 && (await get(`/rest/v1/commandes?select=id&client_id=neq.${F.id}`, h(JF))).length === 0, 'le client ne voit que ses propres commandes')
}

try {
  await tests()
} catch (e) {
  echecs++
  console.log('ÉCHEC (erreur inattendue)', e.message)
} finally {
  await nettoyer()
  const { users } = await get('/auth/v1/admin/users?per_page=200')
  console.log(`Nettoyage fait : ${users.filter((u) => u.email?.startsWith(PREFIXE)).length} compte de test restant.`)
  console.log(echecs ? `${echecs} test(s) en échec` : 'Tous les tests sont bons.')
  process.exitCode = echecs ? 1 : 0
}
