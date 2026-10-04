<?php
// app_intro-compromission/cible/src/admin.php
// LAB VOLONTAIREMENT VULNÉRABLE - ne pas corriger, ne pas réutiliser en production.
// VULN 2 (stockage en clair) : le tableau de bord affiche les mots de passe.
// VULN 3 (upload) : le filtre ne vérifie QUE le Content-Type déclaré par le client.
//   Contournement : envoyer shell.php avec un en-tête Content-Type: image/png.
// VULN 4 (RCE) : /uploads est servi par Apache qui exécute le .php déposé.
session_start();
require __DIR__ . '/db.php';

if (($_SESSION['role'] ?? '') !== 'admin') {
    http_response_code(403);
    echo 'Accès réservé aux administrateurs. <a href="index.php">Connexion</a>';
    exit;
}

$msg = null;
$msgClass = 'ok';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['image'])) {
    $f = $_FILES['image'];
    $declaredType = $f['type'] ?? '';

    // ⚠️ Seul le Content-Type ANNONCÉ PAR LE CLIENT est vérifié (falsifiable).
    if (strpos($declaredType, 'image/') !== 0) {
        $msg = "Refusé : seules les images sont acceptées (type reçu : " . htmlspecialchars($declaredType) . ").";
        $msgClass = 'err';
    } else {
        $name = basename($f['name']);
        $dest = __DIR__ . '/uploads/' . $name;
        if (move_uploaded_file($f['tmp_name'], $dest)) {
            $url = 'uploads/' . rawurlencode($name);
            $msg = "Visuel enregistré : <a href=\"$url\">$url</a>";
        } else {
            $msg = "Échec de l'enregistrement du fichier.";
            $msgClass = 'err';
        }
    }
}

$users = db()->query("SELECT username, password, role, email FROM users")->fetchAll(PDO::FETCH_ASSOC);
require __DIR__ . '/header.php';
?>
<div class="card">
  <h1>Tableau de bord administrateur</h1>
  <p>Comptes du portail :</p>
  <table>
    <tr><th>Utilisateur</th><th>Mot de passe</th><th>Rôle</th><th>Email</th></tr>
    <?php foreach ($users as $u): ?>
      <tr>
        <td><?= htmlspecialchars($u['username']) ?></td>
        <td><code><?= htmlspecialchars($u['password']) ?></code></td>
        <td><?= htmlspecialchars($u['role']) ?></td>
        <td><?= htmlspecialchars($u['email']) ?></td>
      </tr>
    <?php endforeach; ?>
  </table>
</div>
<div class="card">
  <h1>Ajouter un visuel produit</h1>
  <?php if ($msg): ?><div class="<?= $msgClass ?>"><?= $msg ?></div><?php endif; ?>
  <form method="post" action="admin.php" enctype="multipart/form-data">
    <label>Image (jpg, png, gif)</label>
    <input type="file" name="image">
    <button type="submit">Téléverser</button>
  </form>
</div>
</main></body></html>
