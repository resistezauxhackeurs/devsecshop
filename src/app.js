// devsecshop/src/app.js
// Point d'entrée de l'application Express.
//
// Rôle : configurer les middlewares, exposer les vues EJS, monter les routeurs,
// et initialiser la base. Volontairement minimaliste et "à plat" pour rester
// lisible en formation.

'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const config = require('./lib/config');
const { init } = require('./lib/db');
const { currentUser } = require('./lib/auth');

const app = express();

// Moteur de vues.
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Parsers de corps de requête.
app.use(express.urlencoded({ extended: true })); // formulaires HTML
app.use(express.json());                          // API JSON
// ⚠️ On lit aussi le XML brut pour l'import catalogue (vuln XXE, TP4).
app.use(express.text({ type: ['application/xml', 'text/xml'] }));
app.use(cookieParser());

// Fichiers statiques (images produits, favicon).
app.use(express.static(path.join(__dirname, '..', 'public')));

// Expose l'utilisateur courant (décodé du cookie JWT) à toutes les vues.
app.use((req, res, next) => {
  req.user = currentUser(req);
  res.locals.user = req.user;
  next();
});

// Montage des routeurs.
app.use('/', require('./routes/index'));
app.use('/', require('./routes/auth'));
app.use('/products', require('./routes/products'));
app.use('/cart', require('./routes/cart'));
app.use('/account', require('./routes/account'));
app.use('/admin', require('./routes/admin'));

// Démarrage (sauf si importé par les tests).
// NB : les tests ne passent pas par ici (require.main !== module) ; ils seedent
// la base via `npm run seed` avant la passe de tests (voir script "test").
if (require.main === module) {
  init();
  app.listen(config.port, () => {
    console.log(`DevSecShop démarré sur http://localhost:${config.port}`);
  });
}

module.exports = app;
