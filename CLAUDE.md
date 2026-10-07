# ELORN GEL — Contexte projet

## Qui je suis / contexte
Romuald est Responsable Logistique chez ELORN GEL (AUDACIER holding), vente de
surgelés à domicile à Ploudiry/Plouédern (Finistère). Il n'est **pas
développeur de métier** — explique chaque étape technique simplement, donne
des commandes Terminal précises et complètes (pas de raccourcis supposant des
connaissances déjà acquises).

## Stack technique
- Frontend : React + Vite + Tailwind CSS v4
- Backend/BDD : Supabase (Postgres + Storage pour les photos, Auth, Edge
  Functions)
- Dépôt : GitHub privé `Elorngel/Elorn-gel`
- Déploiement : Vercel, connecté à GitHub (push = mise en ligne automatique)
- Emails transactionnels : Resend, via une Supabase Edge Function

## Direction design
Volontairement à l'opposé des codes visuels "IA générique" (pas de fond
crème + serif + terracotta, pas de pilules ou d'icônes rondes pastel). Palette :
vert forêt / pierre / brique, coins carrés, typographie condensée façon
étiquette de commerçant (Bebas Neue + Public Sans + Roboto Condensed).

## Habitudes de travail
- Romuald travaille depuis deux machines (PC Windows + Mac), synchronisées via
  git. Sur Mac, le Terminal s'authentifie sous un autre compte GitHub que
  celui qu'il utilise réellement — **toujours utiliser GitHub Desktop pour
  les opérations Git sur Mac**, jamais le Terminal.
- Quand il dit "on push", lui donner directement le bloc de commandes complet
  (`git status`, `git add .`, `git commit -m "..."`, `git push`) sans détailler
  chaque étape séparément.
- Toujours vérifier que le code compile (`npm run build`) avant de considérer
  une tâche terminée.
- L'admin (`/admin`) est la source de vérité pour la config du site — éviter
  de coder en dur des valeurs qui devraient être des réglages Supabase.
- Ne jamais committer de fichiers sensibles — `.gitignore` à jour dès le début.

## État d'avancement (au 17/09/2026)

**Fait** : catalogue complet, double prix livraison/retrait, créneaux,
panier + commande sans paiement en ligne, promotions (taux % OU prix promo,
colonnes `taux_promo`/`prix_promo`, avec dates de début/fin incluses
`promo_debut`/`promo_fin` — logique centralisée dans `src/lib/pricing.js` :
`getPromoStatus`/`isPromoActive`), variantes de
conditionnement, logos fournisseurs (avec option fond blanc par fournisseur),
modes de cuisson (Four/Poêle/Airfryer/Friteuse/Micro-ondes : durée en plage
possible "10-15 min", réglage en °C (four, airfryer, friteuse), en W
(micro-ondes) ou en texte "feu doux/moyen/vif" (poêle), plusieurs étapes
possibles "5 min à feu vif puis 10 min à feu moyen" ; cases "Décongélation
préalable nécessaire" / "Sans décongélation préalable"), admin complet, **liens Facebook/Instagram** (réglables dans l'admin → Réglages du site, colonnes `lien_facebook`/`lien_instagram`, affichés via `SocialIcon.jsx` dans le bandeau du haut et le pied de page), **photo vitrine au format fixe 16:9** (même cadre dans l'éditeur admin et sur le site, `Hero.jsx` + `PhotoEditorModal aspect`), **déstockage** (case + prix sur la fiche produit admin → rubrique « Déstockage » du menu, route `#destockage`, colonnes `en_destockage`/`prix_destockage`, logique dans `src/lib/pricing.js`, passe avant la promo), **adresse de livraison** (adresse/code postal/ville demandés en mode
Livraison, colonnes `adresse_livraison`/`code_postal`/`ville` de `commandes`).
⚠ Les **comptes clients** (Supabase Auth, `#mes-commandes`) annoncés ici
n'existent PAS dans ce dépôt (aucun code d'auth) : peut-être sur l'autre
machine (PC Windows) non poussé — à vérifier avant de les considérer faits.

**En cours / à faire avant le vrai nom de domaine** :
1. Mentions légales / CGV / CGU : rédigées mais retirées du site en attendant
   le nom de domaine définitif et la désignation d'un médiateur de la
   consommation (à vérifier si le groupe AUDACIER en a déjà un).

**En sommeil (code et données conservés, juste désactivé le 02/10/2026)** :
- Questionnaire de conseil produit ("Besoin d'un conseil ?" → occasions type
  "Apéro" → suggestions ciblées, avec recours à l'IA en dernier ressort). Build
  complet et fonctionnel (admin "Occasions", assistant client, fonction
  Supabase `conseil-produit`, journal des interactions) mais pas d'utilité
  perçue pour l'instant. Désactivé en retirant simplement le bouton d'accès
  dans `Header.jsx` (desktop + mobile) — tout le reste (table `occasions` et
  son contenu, la fonction Edge, `ConseilProvider`/`ConseilAssistant` montés
  dans `App.jsx`) est intact. À la réactivation, penser à aligner le calcul de
  promo de la fonction Edge (`conseil.ts`) sur `pricing.js` (prix promo + dates). Pour réactiver : remettre le bouton "Besoin d'un
  conseil ?" dans `Header.jsx` (voir l'historique git pour le code exact
  retiré).

## Points de vigilance connus
- **Quota Supabase (incident du 01/10/2026)** : le projet (offre Free) a
  dépassé son quota gratuit "Cached Egress" à cause des photos produits
  stockées en pleine résolution (522 Mo, jusqu'à 8 Mo/photo, souvent en PNG
  pour des photos). Nettoyé une fois (bucket ramené à ~41 Mo) et corrigé pour
  l'avenir : tout envoi de photo (produit, bannière, logo fournisseur) passe
  désormais par `src/lib/imageResize.js` (redimensionnement + compression
  côté navigateur avant envoi), et remplacer/supprimer une photo supprime
  maintenant l'ancien fichier du stockage (`updateProduct`/`updateSettings`
  dans les hooks, + policy SQL `supabase-suppression-photos.sql` nécessaire
  pour que la suppression soit autorisée). Pendant le nettoyage, les logos
  fournisseurs (table `fournisseurs`, même bucket `photos-produits`) ont été
  supprimés par erreur puis restaurés — si un futur nettoyage du stockage est
  refait, bien vérifier les **trois** sources avant de considérer un fichier
  orphelin : `produits.photo_url`, `parametres_site.hero_url`/`logo_url`, et
  `fournisseurs.logo_url`.
- **Bascule vers bontin.fr** : la fonction `send-order-emails` lit `FROM_EMAIL`
  et `ADMIN_EMAIL` dans les secrets Supabase (défaut : expéditeur de test Resend
  + `logistique@elorngel.fr`). Une fois `bontin.fr` vérifié dans Resend :
  `supabase secrets set FROM_EMAIL=commandes@bontin.fr ADMIN_EMAIL=logistique@bontin.fr`.
- **Resend** : le domaine `elorngel.fr` n'est pas encore vérifié → les emails
  clients (confirmation de commande, réinitialisation de mot de passe) ne
  partent pas encore. Ne pas être surpris si un test d'email échoue
  silencieusement, c'est attendu tant que ce n'est pas débloqué.
- **Sécurité admin (connu, non corrigé)** : `AdminGate` n'est qu'un mot de
  passe côté client (pas une vraie auth Supabase). La clé anonyme utilisée
  par l'admin peut en théorie lire toutes les commandes (RLS permissif sur
  `commandes`/`commande_lignes`, policy `for all using (true)`). Ne pas
  aggraver cette ouverture ; en discuter avec Romuald avant de la resserrer,
  car ça toucherait au fonctionnement de l'admin actuel.
