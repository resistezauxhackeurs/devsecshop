// devsecshop/src/lib/config.js
// Centralise la configuration de l'appli.
//
// ⚠️ VULN (TP2 - Secrets) : une clé API de paiement est codée EN DUR ci-dessous,
// et le secret JWT a une valeur par défaut faible. En conditions réelles, ces
// valeurs doivent venir de variables d'environnement injectées au déploiement
// (jamais du code source, jamais du dépôt git).

'use strict';

module.exports = {
  port: process.env.PORT || 3000,

  // ⚠️ Secret codé en dur — c'est exactement ce que gitleaks doit détecter (TP2).
  // Ressemble à une clé secrète Stripe de test pour être attrapée par les règles de détection.
  paymentApiKey: 'sk_lab_51MxConfidential0RealLookingKeyAbCdEf1234567890',

  // ⚠️ Secret JWT faible + valeur par défaut présente dans le code.
  jwtSecret: process.env.JWT_SECRET || 'devsecshop-super-secret-2023',

  // Base de données SQLite (fichier local).
  dbFile: process.env.DB_FILE || '/tmp/devsecshop.db',

  // Active/désactive le mode debug (laisse fuiter des stacktraces en prod si à true).
  debug: process.env.DEBUG === 'true' || true
};
