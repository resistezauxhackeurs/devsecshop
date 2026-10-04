// devsecshop/src/routes/cart.js
// Panier et validation de commande.
//
// ⚠️ VULN (Niveau 3 - logique métier) : la quantité n'est pas validée. Une
//    quantité négative produit un total négatif (avoir / remboursement indu).
// ⚠️ VULN (TP8 - ReDoS) : la validation du code promo utilise une regex à
//    backtracking catastrophique. Une entrée bien choisie fige l'event loop.

'use strict';

const express = require('express');
const router = express.Router();
const { db } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

// Panier stocké en clair dans un cookie JSON (simplifié pour le cours).
function readCart(req) {
  try {
    return JSON.parse(req.cookies.cart || '[]');
  } catch (e) {
    return [];
  }
}
function writeCart(res, cart) {
  res.cookie('cart', JSON.stringify(cart), { httpOnly: true });
}

router.get('/', (req, res) => {
  const cart = readCart(req);
  const detailed = cart.map((line) => {
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(line.product_id);
    return { ...line, product: p, line_cents: (p ? p.price_cents : 0) * line.qty };
  });
  const total = detailed.reduce((s, l) => s + l.line_cents, 0);
  res.render('cart', { cart: detailed, total });
});

router.post('/add', (req, res) => {
  const product_id = parseInt(req.body.product_id, 10);

  // ⚠️ Logique métier : parseInt accepte les négatifs, aucune borne min.
  const qty = parseInt(req.body.qty, 10) || 1;

  const cart = readCart(req);
  cart.push({ product_id, qty });
  writeCart(res, cart);
  res.redirect('/cart');
});

// Validation du code promo avant application.
function validateCoupon(code) {
  // ⚠️ ReDoS : quantificateur imbriqué (groupe répété contenant lui-même un +)
  // -> backtracking exponentiel. Entrée piège : ~35 x 'A' suivies d'un '!'.
  // Intention (légitime en apparence) : "le code promo doit être alphanumérique".
  const re = /^([A-Za-z0-9]+)+$/;
  return re.test(code);
}

router.post('/checkout', requireAuth, (req, res) => {
  const coupon = req.body.coupon || 'PROMO-2024';
  const validCoupon = validateCoupon(coupon); // peut geler l'appli (ReDoS)

  const cart = readCart(req);
  let total = 0;
  const items = cart.map((line) => {
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(line.product_id);
    const unit = p ? p.price_cents : 0;
    total += unit * line.qty; // ⚠️ total peut devenir négatif
    return { product_id: line.product_id, qty: line.qty, unit_cents: unit };
  });
  if (validCoupon) total = Math.round(total * 0.9);

  const info = db
    .prepare('INSERT INTO orders (user_id, items_json, total_cents) VALUES (?, ?, ?)')
    .run(req.user.uid, JSON.stringify(items), total);

  res.clearCookie('cart');
  res.render('order-confirm', { orderId: info.lastInsertRowid, total });
});

module.exports = router;
