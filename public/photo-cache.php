<?php
// Copie locale des photos du site sur l'hébergement IONOS (trafic illimité), pour ne pas consommer le quota
// de l'offre gratuite Supabase à chaque visite.
// - Une photo déjà copiée est servie directement par le serveur (règle dans .htaccess), sans passer ici.
// - Une photo pas encore copiée arrive ici : on la télécharge UNE fois chez Supabase, on la garde dans
//   photos/, et on l'envoie au visiteur.
// - En cas de problème, on renvoie le visiteur vers la photo chez Supabase (roue de secours).
// Les noms de photos sont uniques (ils contiennent la date d'envoi) : une copie n'est jamais périmée.

$SOURCE = 'https://kydlnfchsgwsitwjonah.supabase.co/storage/v1/object/public/photos-produits/';
$DOSSIER = __DIR__ . '/photos/';
$TYPES = array('jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'gif' => 'image/gif');
$TAILLE_MAX = 15 * 1024 * 1024;

$nom = isset($_GET['f']) ? (string) $_GET['f'] : '';
$ext = strtolower(pathinfo($nom, PATHINFO_EXTENSION));
// Noms autorisés : lettres, chiffres, point, tiret, souligné (pas de dossier, pas de « .. »).
if (!preg_match('/^[A-Za-z0-9._-]{1,200}$/', $nom) || strpos($nom, '..') !== false || !isset($TYPES[$ext])) {
    http_response_code(404);
    exit;
}

$source = $SOURCE . $nom;
$cible = $DOSSIER . $nom;

function secours($url)
{
    header('Cache-Control: no-store');
    header('Location: ' . $url, true, 302);
    exit;
}

function telecharger($url, $tailleMax)
{
    $donnees = false;
    $code = 0;
    $type = '';
    if (function_exists('curl_init')) {
        $c = curl_init($url);
        curl_setopt($c, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($c, CURLOPT_FOLLOWLOCATION, false);
        curl_setopt($c, CURLOPT_CONNECTTIMEOUT, 8);
        curl_setopt($c, CURLOPT_TIMEOUT, 25);
        $donnees = curl_exec($c);
        $code = (int) curl_getinfo($c, CURLINFO_HTTP_CODE);
        $type = (string) curl_getinfo($c, CURLINFO_CONTENT_TYPE);
        curl_close($c);
    } elseif (ini_get('allow_url_fopen')) {
        $contexte = stream_context_create(array('http' => array('timeout' => 25, 'follow_location' => 0)));
        $donnees = @file_get_contents($url, false, $contexte);
        if (isset($http_response_header) && is_array($http_response_header)) {
            foreach ($http_response_header as $ligne) {
                if (preg_match('#^HTTP/\S+\s+(\d{3})#', $ligne, $m)) $code = (int) $m[1];
                if (stripos($ligne, 'Content-Type:') === 0) $type = trim(substr($ligne, 13));
            }
        }
    }
    if ($donnees === false || $code !== 200 || stripos($type, 'image/') !== 0 || strlen($donnees) > $tailleMax) {
        return null;
    }
    return $donnees;
}

$donnees = null;
if (!is_file($cible)) {
    $donnees = telecharger($source, $TAILLE_MAX);
    if ($donnees === null) secours($source);

    if (!is_dir($DOSSIER)) {
        @mkdir($DOSSIER, 0755, true);
        // Page vide : empêche d'afficher la liste des photos du dossier.
        @file_put_contents($DOSSIER . 'index.html', '');
    }
    // Écriture dans un fichier temporaire puis renommage : jamais de photo à moitié écrite.
    $temporaire = $cible . '.' . getmypid() . '-' . mt_rand() . '.tmp';
    if (@file_put_contents($temporaire, $donnees) !== false) {
        @rename($temporaire, $cible);
    } else {
        @unlink($temporaire);
    }
}

header('Content-Type: ' . $TYPES[$ext]);
header('Cache-Control: public, max-age=31536000, immutable');
header('X-Content-Type-Options: nosniff');
if ($donnees !== null) {
    header('Content-Length: ' . strlen($donnees));
    echo $donnees;
} else {
    header('Content-Length: ' . filesize($cible));
    readfile($cible);
}
