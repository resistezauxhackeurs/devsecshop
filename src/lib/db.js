// devsecshop/src/lib/db.js
// Accès à la base SQLite via better-sqlite3 (synchrone, simple à lire en cours).
//
// On expose directement l'objet `db` pour que les routes puissent construire
// leurs requêtes elles-mêmes — y compris de façon vulnérable (concaténation),
// ce qui est voulu pour le TP SQLi. Le fix consistera à utiliser des requêtes
// préparées (db.prepare(...).get(param)).

'use strict';

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const db = new Database(config.dbFile);
db.pragma('journal_mode = WAL');

// Crée le schéma s'il n'existe pas, puis insère un jeu de données minimal.
function init() {
  const schemaPath = path.join(__dirname, '..', '..', 'seed', 'schema.sql');
  const seedPath = path.join(__dirname, '..', '..', 'seed', 'seed.sql');

  db.exec(fs.readFileSync(schemaPath, 'utf8'));

  // On ne ré-insère les données que si la table users est vide.
  const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (count === 0) {
    db.exec(fs.readFileSync(seedPath, 'utf8'));
  }
}

module.exports = { db, init };
