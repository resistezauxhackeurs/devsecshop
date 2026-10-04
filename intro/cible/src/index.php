<?php
// app_intro-compromission/cible/src/index.php
// LAB VOLONTAIREMENT VULNÉRABLE - ne pas corriger, ne pas réutiliser en production.
// VULN 1 (SQLi) : la requête de login est construite par concaténation de chaînes.
//   Payload type : username = admin'-- -   (commente la vérification du mot de passe)
session_start();
require __DIR__ . '/db.php';

$err = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $u = $_POST['username'] ?? '';
    $p = $_POST['password'] ?? '';

    // ⚠️ Entrées collées directement dans la requête SQL.
    $sql = "SELECT * FROM users WHERE username = '$u' AND password = '$p'";

    $row = false;
    try {
        $row = db()->query($sql)->fetch(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        // L'erreur SQL est renvoyée telle quelle (aide à l'exploitation).
        $err = 'Erreur SQL : ' . $e->getMessage();
    }

    if ($row) {
        $_SESSION['user'] = $row['username'];
        $_SESSION['role'] = $row['role'];
        header('Location: admin.php');
        exit;
    } elseif (!$err) {
        $err = 'Identifiants invalides.';
    }
}

require __DIR__ . '/header.php';
?>
<div class="card">
  <h1>Connexion au portail</h1>
  <?php if ($err): ?><div class="err"><?= htmlspecialchars($err) ?></div><?php endif; ?>
  <form method="post" action="index.php">
    <label>Identifiant</label>
    <input type="text" name="username" autofocus>
    <label>Mot de passe</label>
    <input type="password" name="password">
    <button type="submit">Se connecter</button>
  </form>
</div>
<div class="card" style="font-size:13px;color:#667">
  Portail interne CorpLab (démo). Réservé au personnel autorisé.
</div>
</main></body></html>
