# Mettre le site Bontin chez IONOS

Préparé le 27/10/2026. Rien n'est envoyé chez IONOS tant que l'étape 3 n'est pas faite.
L'ancien site PrestaShop n'est touché à aucun moment avant l'étape 5.

## Ce qui est déjà prêt (dans le code)

- `public/.htaccess` : réglages du serveur IONOS (anciennes adresses PrestaShop → page équivalente,
  www et http → https://bontin.fr, protections de sécurité, mise en cache). Testé avec Apache.
- `.github/workflows/envoi-ionos.yml` : robot GitHub qui construit le site et l'envoie en SFTP dans
  un dossier dédié à chaque « Push » sur main. **Éteint** tant que la variable `IONOS_ENVOI` ≠ `oui`.
  Garde-fou : il refuse d'envoyer à la racine de l'espace web (là où est PrestaShop).

- `public/photo-cache.php` + règle dans `.htaccess` : sur bontin.fr, chaque photo est copiée UNE fois
  depuis Supabase dans `/bontin-site/photos/`, puis servie par IONOS (trafic illimité). Roue de secours :
  en cas de souci, la photo vient de Supabase comme avant. Le robot d'envoi n'efface jamais `photos/`.
- `.github/workflows/sauvegarde.yml` : copie chiffrée de la base chaque nuit sur IONOS (dossier non
  visible depuis internet, ~1 mois gardé). **Éteint** tant que la variable `SAUVEGARDE` ≠ `oui`.

## 1. Créer l'accès SFTP (IONOS)

Menu → Hébergement → **SFTP & SSH** → Créer un utilisateur. Noter :
- le **serveur** (ex. `access-5017900580.webspace-host.com`),
- le **nom d'utilisateur** et le **mot de passe** choisi.

## 2. Enregistrer les secrets (GitHub, une seule fois)

github.com → dépôt Elorngel/Elorn-gel → **Settings** → **Secrets and variables** → **Actions**.

Onglet **Secrets** → « New repository secret », six fois :

| Nom | Valeur |
|---|---|
| `IONOS_SFTP_HOTE` | le serveur noté à l'étape 1 |
| `IONOS_SFTP_UTILISATEUR` | le nom d'utilisateur SFTP |
| `IONOS_SFTP_MOT_DE_PASSE` | le mot de passe SFTP |
| `IONOS_DOSSIER` | `/bontin-site` |
| `VITE_SUPABASE_URL` | la même valeur que dans `.env.local` |
| `VITE_SUPABASE_ANON_KEY` | la même valeur que dans `.env.local` |

## 3. Allumer le robot

Même page, onglet **Variables** → « New repository variable » : nom `IONOS_ENVOI`, valeur `oui`.
Puis onglet **Actions** du dépôt → « Envoi du site chez IONOS » → **Run workflow**.
Le site arrive dans le dossier `/bontin-site` de l'espace web (invisible tant qu'aucune adresse n'y mène).

## 3 bis. Allumer la sauvegarde de nuit

1. Supabase → projet Elorn Gel → bouton **Connect** (en haut) → onglet **« Session pooler »** → copier
   l'adresse (URI) qui commence par `postgresql://postgres.kydlnfchsgwsitwjonah:` et remplacer
   `[YOUR-PASSWORD]` par le mot de passe de la base (si oublié : Project Settings → Database →
   Reset database password).
2. GitHub → Secrets, trois de plus :

| Nom | Valeur |
|---|---|
| `SUPABASE_DB_URL` | l'adresse complète de l'étape 1 |
| `SAUVEGARDE_PHRASE` | une longue phrase secrète inventée (à noter en lieu sûr : sans elle, les sauvegardes sont illisibles) |
| `SAUVEGARDE_DOSSIER` | `/sauvegardes-bontin` |

3. Onglet Variables : `SAUVEGARDE` = `oui`. Puis Actions → « Sauvegarde de la base » → **Run workflow**
   pour un premier essai : un fichier `base-JJ.tar.gz.gpg` doit apparaître dans `/sauvegardes-bontin`.
4. Pour relire une sauvegarde (en cas de besoin, Claude s'en charge) :
   `gpg -d base-27.tar.gz.gpg > sauvegarde.tar.gz` puis `tar xzf sauvegarde.tar.gz`.

## 4. Adresse de test (sans toucher à bontin.fr)

IONOS → Domaines & SSL → bontin.fr → **Sous-domaines** → créer `nouveau` → utilisation **Espace web**,
dossier `/bontin-site`. Vérifier le certificat SSL (https). Tester tout sur https://nouveau.bontin.fr
(commande d'essai comprise). Vérifier aussi les photos : après une visite, le dossier `/bontin-site/photos/`
doit se remplir (copies faites par photo-cache.php).

## 5. Jour J : la bascule

1. Exporter clients et commandes de PrestaShop.
2. Emails : déjà faits le 27/10/2026 (Resend vérifié). Seulement passer les boutons des emails sur la vraie
   adresse : `supabase secrets set SITE_URL=https://bontin.fr`.
3. IONOS → Domaines & SSL → bontin.fr (puis www.bontin.fr) → **Modifier le type d'utilisation** →
   Espace web → dossier `/bontin-site`. Aucune ligne DNS ni mail n'est modifiée.
4. Vérifier https://bontin.fr, une ancienne adresse (ex. /pizzas/30-pizza-chorizo.html), une commande,
   les emails ; envoyer https://bontin.fr/sitemap.xml à Google Search Console.

Retour arrière possible à tout moment : remettre bontin.fr sur le dossier de PrestaShop (étape 3 inversée).
Ne jamais résilier l'hébergement IONOS : le domaine et les mails sont dans le même contrat.
