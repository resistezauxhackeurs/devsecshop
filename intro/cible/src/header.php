<?php
// app_intro-compromission/cible/src/header.php
// LAB VOLONTAIREMENT VULNÉRABLE - ne pas corriger, ne pas réutiliser en production.
// Bannière d'avertissement + en-tête commun.
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CorpLab Portail</title>
<style>
  *{box-sizing:border-box}
  body{font-family:system-ui,Segoe UI,sans-serif;margin:0;background:#eef1f4;color:#1c2430}
  .lab-banner{background:#8b1a1a;color:#fff;padding:.6rem 1rem;font:600 14px/1.4 system-ui;text-align:center}
  header.app{background:#16213e;color:#fff;padding:14px 22px;display:flex;gap:18px;align-items:center}
  header.app .brand{font-weight:700;font-size:18px}
  header.app a{color:#cdd6e6;text-decoration:none;font-size:14px}
  main{max-width:720px;margin:28px auto;padding:0 18px}
  .card{background:#fff;border:1px solid #dfe4ea;border-radius:10px;padding:22px 24px;margin-bottom:18px}
  h1{font-size:22px;margin:.2em 0 .6em}
  label{display:block;font-size:13px;font-weight:600;margin:10px 0 4px;color:#44505f}
  input[type=text],input[type=password]{width:100%;padding:9px 11px;border:1px solid #c7ced6;border-radius:7px;font-size:15px}
  button{margin-top:16px;background:#a85f2e;color:#fff;border:0;padding:10px 18px;border-radius:7px;font-size:15px;font-weight:600;cursor:pointer}
  button:hover{background:#c47c46}
  .err{background:#fdecef;border-left:4px solid #e94560;padding:10px 14px;border-radius:6px;color:#8b1a1a;font-size:14px;margin:12px 0;word-break:break-word}
  .ok{background:#eaf6ef;border-left:4px solid #1b7f4b;padding:10px 14px;border-radius:6px;font-size:14px;margin:12px 0;word-break:break-word}
  table{border-collapse:collapse;width:100%;margin-top:10px;font-size:14px}
  th,td{border:1px solid #dfe4ea;padding:7px 9px;text-align:left}
  th{background:#f0f2f5}
  code{background:#eef0f3;padding:1px 6px;border-radius:4px;font-family:ui-monospace,Consolas,monospace;font-size:90%}
</style>
</head>
<body>
<div class="lab-banner">
  Application volontairement vulnérable - usage pédagogique en environnement isolé. Ne jamais déployer sur un réseau accessible.
</div>
<header class="app">
  <span class="brand">CorpLab</span>
  <a href="index.php">Accueil</a>
  <?php if (!empty($_SESSION['user'])): ?>
    <a href="admin.php">Admin</a>
    <a href="logout.php">Déconnexion (<?= htmlspecialchars($_SESSION['user']) ?>)</a>
  <?php endif; ?>
</header>
<main>
