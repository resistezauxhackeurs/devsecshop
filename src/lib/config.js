// devsecshop/src/lib/config.js
// Configuration de l'appli — VERSION CORRIGÉE (TP2).
//
// Plus aucun secret en dur. Les secrets viennent exclusivement de
// l'environnement (injecté au déploiement par un gestionnaire de secrets).
// En l'absence de JWT_SECRET, on génère un secret éphémère aléatoire au
// démarrage : l'appli tourne en dev, mais aucune valeur secrète n'est écrite
// dans le code ni dans le dépôt. En production, JWT_SECRET DOIT être fourni.

'use strict';

const crypto = require('crypto');

module.exports = {
  port: process.env.PORT || 3000,

  // Clé de paiement : uniquement depuis l'environnement, pas de valeur par défaut.
  paymentApiKey: process.env.STRIPE_SECRET_KEY || null,

  // Secret JWT : env en priorité ; sinon secret aléatoire éphémère (dev only).
  jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),

  dbFile: process.env.DB_FILE || '/tmp/devsecshop.db',

  debug: process.env.DEBUG === 'true'
};
