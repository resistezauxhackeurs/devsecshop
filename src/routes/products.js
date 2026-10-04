// devsecshop/src/routes/products.js
// Catalogue : recherche et détail produit.
//
// ⚠️ VULN (TP3 - SQLi) : la recherche concatène le terme `q` dans le LIKE.
//    Seconde surface d'injection, utile pour l'UNION-based (exfiltrer users).

'use strict';

const express = require('express');
const router = express.Router();
const { db } = require('../lib/db');

// Recherche produit : /products/search?q=...
router.get('/search', (req, res) => {
  const q = req.query.q || '';

  // ⚠️ SQLi : le terme de recherche est concaténé sans échappement.
  const sql = "SELECT * FROM products WHERE name LIKE '%" + q + "%'";

  let products = [];
  let error = null;
  try {
    products = db.prepare(sql).all();
  } catch (e) {
    error = e.message;
  }
  res.render('search', { products, q, error });
});

// Détail produit : /products/:id
router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).send('Produit introuvable.');
  res.render('product', { product });
});

module.exports = router;
