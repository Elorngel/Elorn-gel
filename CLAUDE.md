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
préalable nécessaire" / "Sans décongélation préalable"), admin complet, **liens Facebook/Instagram** (réglables dans l'admin → Réglages du site, colonnes `lien_facebook`/`lien_instagram`, affichés via `SocialIcon.jsx` dans le bandeau du haut et le pied de page), **zone de livraison** (admin → onglet « Zone de livraison » : liste des communes cochées dans `parametres_site.zone_livraison` ; liste des communes et codes postaux dans `src/data/communesZone.js`, contrôle dans `src/lib/zoneLivraison.js` appelé par `CartPage` : le code postal est vérifié, et le nom de la ville quand le code est partagé avec une commune non desservie ; liste vide = aucune restriction), **photo vitrine au format fixe 16:9** (+ bouton « Choisir une photo déjà sur le site » : copie côté stockage d'une photo produit, `ExistingPhotoPicker.jsx` / `copySiteImage` — surtout ne pas faire pointer deux champs vers le même fichier, le nettoyage à chaque changement supprimerait l'autre) (même cadre dans l'éditeur admin et sur le site, `Hero.jsx` + `PhotoEditorModal aspect`), **déstockage** (case + prix sur la fiche produit admin → rubrique « Déstockage » du menu, route `#destockage`, colonnes `en_destockage`/`prix_destockage`, logique dans `src/lib/pricing.js`, passe avant la promo), **adresse de livraison** (adresse/code postal/ville demandés en mode
Livraison, colonnes `adresse_livraison`/`code_postal`/`ville` de `commandes`).
**Comptes clients** (21/10/2026) : compte obligatoire pour commander, créé dans le formulaire du
panier (onglets « Je crée mon compte » / « J'ai déjà un compte ») ou dans « Mon compte »
(`#mon-compte` : historique des commandes, modification des informations, désinscription des
offres, suppression du compte). Création côté serveur par la fonction Supabase `creer-compte`
(compte actif tout de suite, sans email de confirmation) ; fiche dans la table `clients`
(prénom, nom, email, téléphone, date de naissance, adresse, offres, « connu par ») ; commandes
rattachées par `commandes.client_id`. Connexion partagée site/admin : `src/context/AuthContext.jsx`.
Champs du formulaire : `ChampsCompte.jsx`. Admin → onglet « Clients » (`ClientsPanel.jsx`).
Politique de confidentialité : `#confidentialite` (`legalContent.js`), à faire valider.
En attente de l'accès IONOS : « mot de passe oublié » (aujourd'hui : « appelez-nous ») et le
bon d'anniversaire de 10 € (valable 14 jours après l'anniversaire), qui demandent des emails.

**Reste à faire avant la bascule sur www.bontin.fr et la publicité** (audit du 19/10/2026) :
1. Photos / quota Supabase : FAIT le 19/10/2026 sans toucher à la qualité des photos produits —
   chargement différé (`loading="lazy"` dans `CroppableImage`, sauf bannière et photo de la fiche),
   logos fournisseurs réduits à 400 px max (6,45 → 2,28 Mo ; les originaux restent dans le bucket
   sous leur ancien nom, sans le suffixe `-allege` : ne pas les supprimer comme « orphelins » sans
   accord), compression automatique des futurs logos (`useSuppliers`). Supabase impose
   `no-cache` côté navigateur (revalidation sans retéléchargement). Supabase Pro reste conseillé avant la pub.
   Vitesse d'ouverture (21/10/2026) : requêtes partagées entre composants (`src/lib/requeteMemo.js`,
   5 s), produits + conditionnements en parallèle, catalogue du site chargé sans ingrédients ni
   description (`useProducts({ leger: true })`, l'admin charge tout), photos de la 1re rangée
   chargées tout de suite (`ProductCard prioritaire`). 13 → 7 requêtes, 1res photos à 0,3 s au lieu de 3,5 s.
   Calendrier : FAIT le 19/10/2026 (admin → onglet « Calendrier », `CalendarPanel.jsx` : jours
   fermés au retrait, à la livraison ou aux deux + bouton « Fermer les jours fériés » ; créneaux
   indisponibles par jour de la semaine ; horaires spéciaux d'une date précise (matin, après-midi,
   de telle heure à telle heure, séparément livraison/retrait, prioritaires sur la semaine) ;
   colonnes `jours_fermes`/`creneaux_indisponibles`/`horaires_speciaux` ;
   logique dans `src/lib/pickupSlots.js`, utilisée par `CartPage`). Vide au départ : à régler par Romuald.
2. Abonnements : Supabase Pro avant la pub ; Vercel Pro (Hobby = non commercial) ou Cloudflare Pages.
3. Emails : domaine bontin.fr à vérifier dans Resend, puis secrets `FROM_EMAIL`/`ADMIN_EMAIL`.
4. IONOS (domaine, DNS et mails y sont) : créer logistique@ et contact@bontin.fr ; bascule DNS
   (A vers Vercel, supprimer l'AAAA, www en CNAME, ne pas toucher MX/SPF/DMARC) ; garder
   l'ancien PrestaShop un mois + export clients.
5. CGV = copie de l'ancien site (19/10/2026), paiement et contact RGPD corrigés à la demande de
   Romuald. Médiateur : CM2C conseillé, décision avec la direction prévue le 22/10/2026 ; une fois
   inscrit, mettre à jour l'article 9 des CGV (et retirer le lien vers la plateforme européenne,
   fermée) + mention sur le bon de commande. Pas de politique de confidentialité (l'ancien site
   n'en avait pas).
6. Données : 5 commandes test du 10/09, un produit publié à 0 €, 16 sans ingrédients (INCO).
7. Plus tard : redirections des anciennes adresses PrestaShop + robots/sitemap,
   tarifs de livraison selon la distance, mesure d'audience, fiche Google.

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
- **Sécurité admin et base (21/10/2026)** : l'admin passe par de vrais comptes Supabase
  (`AdminGate.jsx` : nom d'utilisateur « sylvie » → identifiant interne
  `sylvie@admin.bontin.fr`, voir `emailAdmin`), reconnus par la table `admins` et la
  fonction SQL `is_admin()` (comptes : sylvie, romuald). Base VERROUILLÉE le 21/10/2026
  (`supabase-securisation.sql` : catalogue modifiable par les seuls admins, chaque client ne
  voit que ses commandes et sa fiche, photos envoyées par les seuls admins) — vérifié en ligne
  (visiteur, client, admin). Créer un admin : compte via l'API admin de Supabase (clé
  service_role récupérée par `supabase projects api-keys`, jamais écrite) + ligne dans `admins`. Accès admin par
  `/#admin` ; le lien « Administration » n'apparaît que pour un admin connecté.
