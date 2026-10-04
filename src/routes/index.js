// devsecshop/src/routes/index.js
// Page d'accueil : liste des produits.

'use strict';

const express = require('express');
const router = express.Router();
const { db } = require('../lib/db');

router.get('/', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY id').all();
  res.render('index', { products });
});

module.exports = router;
