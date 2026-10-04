// devsecshop/src/routes/products.js
// Catalogue — VERSION CORRIGÉE (TP3).
// FIX SQLi : la recherche utilise un paramètre lié pour le motif LIKE.

'use strict';

const express = require('express');
const router = express.Router();
const { db } = require('../lib/db');

router.get('/search', (req, res) => {
  const q = req.query.q || '';
  // FIX : paramètre lié ; le motif LIKE est construit côté valeur, pas côté SQL.
  const products = db
    .prepare("SELECT * FROM products WHERE name LIKE ?")
    .all('%' + q + '%');
  res.render('search', { products, q, error: null });
});

router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).send('Produit introuvable.');
  res.render('product', { product });
});

module.exports = router;
