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
panier + commande sans paiement en ligne, promotions, variantes de
conditionnement, logos fournisseurs (avec option fond blanc par fournisseur),
modes de cuisson (Four/Poêle/Airfryer/Friteuse/Micro-ondes : durée en plage
possible "10-15 min", réglage en °C (four, airfryer, friteuse), en W
(micro-ondes) ou en texte "feu doux/moyen/vif" (poêle), plusieurs étapes
possibles "5 min à feu vif puis 10 min à feu moyen" ; cases "Décongélation
préalable nécessaire" / "Sans décongélation préalable"), admin complet, **comptes clients** (Supabase Auth,
email+mot de passe, historique de commandes sur `#mes-commandes`, panier
toujours utilisable sans compte).

**En cours / à faire avant le vrai nom de domaine** :
1. Questionnaire de conseil produit (occasions type "Apéro" → suggestions
   ciblées, avec un recours à l'IA seulement si le questionnaire ne suffit
   pas — voir décision du 17/09 dans l'historique de conversation si besoin
   de redétailler).
2. Mentions légales / CGV / CGU : rédigées mais retirées du site en attendant
   le nom de domaine définitif et la désignation d'un médiateur de la
   consommation (à vérifier si le groupe AUDACIER en a déjà un).

## Points de vigilance connus
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
