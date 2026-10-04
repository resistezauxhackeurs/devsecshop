// devsecshop/src/routes/cart.js
// Panier — VERSION TP8 (ReDoS + logique métier corrigés).
//
// FIX ReDoS : la regex de validation du coupon est linéaire et bornée.
// FIX logique métier : la quantité est validée (entier 1..99) à l'ajout
//   comme au checkout -> plus de quantité négative ni de total négatif.

'use strict';

const express = require('express');
const router = express.Router();
const { db } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

function readCart(req) {
  try { return JSON.parse(req.cookies.cart || '[]'); } catch (e) { return []; }
}
function writeCart(res, cart) {
  res.cookie('cart', JSON.stringify(cart), { httpOnly: true });
}

// FIX : borne la quantité à un entier entre 1 et 99.
function cleanQty(v) {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 99);
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
  const qty = cleanQty(req.body.qty); // FIX : jamais négatif
  if (!Number.isFinite(product_id)) return res.status(400).send('Produit invalide.');
  const cart = readCart(req);
  cart.push({ product_id, qty });
  writeCart(res, cart);
  res.redirect('/cart');
});

// FIX ReDoS : regex linéaire, longueur bornée, pas de quantificateur imbriqué.
function validateCoupon(code) {
  if (typeof code !== 'string' || code.length > 32) return false;
  return /^[A-Za-z0-9-]{3,32}$/.test(code);
}

router.post('/checkout', requireAuth, (req, res) => {
  const coupon = req.body.coupon || 'PROMO-2024';
  const validCoupon = validateCoupon(coupon);

  const cart = readCart(req);
  let total = 0;
  const items = cart.map((line) => {
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(line.product_id);
    const unit = p ? p.price_cents : 0;
    const qty = cleanQty(line.qty); // FIX : re-borne côté serveur
    total += unit * qty;
    return { product_id: line.product_id, qty, unit_cents: unit };
  });
  if (validCoupon) total = Math.round(total * 0.9);
  total = Math.max(0, total); // jamais négatif

  const info = db
    .prepare('INSERT INTO orders (user_id, items_json, total_cents) VALUES (?, ?, ?)')
    .run(req.user.uid, JSON.stringify(items), total);

  res.clearCookie('cart');
  res.render('order-confirm', { orderId: info.lastInsertRowid, total });
});

module.exports = router;
