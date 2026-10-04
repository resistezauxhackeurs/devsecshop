<?php
// app_intro-compromission/cible/src/db.php
// LAB VOLONTAIREMENT VULNÉRABLE - ne pas corriger, ne pas réutiliser en production.
// Initialise une base SQLite avec des comptes FACTICES (domaine corp.lab).

function db(): PDO {
    $file = '/var/data/lab.db';
    $fresh = !file_exists($file);
    $pdo = new PDO('sqlite:' . $file);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($fresh) {
        $pdo->exec("CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password TEXT NOT NULL,   -- stocké EN CLAIR (volontairement : 2e leçon)
            role TEXT NOT NULL,
            email TEXT
        )");
        // Données factices. Mots de passe bidon, aucun secret réel.
        $pdo->exec("INSERT INTO users (username, password, role, email) VALUES
            ('admin', 'S3cr3t-Adm1n-2024!', 'admin', 'admin@corp.lab'),
            ('marie', 'printemps',          'user',  'marie@corp.lab'),
            ('paul',  'azerty',             'user',  'paul@corp.lab')");
    }
    return $pdo;
}
