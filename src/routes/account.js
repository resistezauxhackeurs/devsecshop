// devsecshop/src/routes/account.js
// Espace client — VERSION TP5 (désérialisation corrigée).
//
// FIX désérialisation : les préférences sont encodées/décodées en JSON pur.
//   node-serialize est supprimé (format maison qui exécute du code à la lecture).
//
// FIX TP8 (Niveau 3) :
//   - IDOR : /orders/:id filtre sur user_id.
//   - Mass assignment + prototype pollution : plus de merge du body ; seul
//     le champ email est mis à jour, is_admin n'est jamais pris du client.

'use strict';

const express = require('express');
const router = express.Router();
const { db } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

router.get('/orders', requireAuth, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC').all(req.user.uid);
  res.render('orders', { orders });
});

// FIX IDOR : on filtre sur l'utilisateur courant.
router.get('/orders/:id', requireAuth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.uid);
  if (!order) return res.status(404).send('Commande introuvable.');
  res.render('order-detail', { order });
});

router.get('/profile', requireAuth, (req, res) => {
  const u = db.prepare('SELECT id, username, email, is_admin FROM users WHERE id = ?').get(req.user.uid);
  res.render('profile', { profile: u, saved: false });
});

// FIX mass assignment : liste blanche explicite ; is_admin jamais pris du body.
router.post('/profile', requireAuth, (req, res) => {
  const u = db.prepare('SELECT id, username, email, is_admin FROM users WHERE id = ?').get(req.user.uid);
  const email = typeof req.body.email === 'string' ? req.body.email : u.email;
  db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, u.id);
  const updated = db.prepare('SELECT id, username, email, is_admin FROM users WHERE id = ?').get(u.id);
  res.render('profile', { profile: updated, saved: true });
});

// Préférences — FIX : JSON pur, aucune exécution de code à la lecture.
router.post('/prefs', requireAuth, (req, res) => {
  const prefs = { theme: req.body.theme || 'light', lang: req.body.lang || 'fr' };
  const encoded = Buffer.from(JSON.stringify(prefs)).toString('base64');
  res.cookie('prefs', encoded);
  res.redirect('/account/profile');
});

router.get('/prefs', requireAuth, (req, res) => {
  const raw = req.cookies.prefs;
  if (!raw) return res.json({ theme: 'light', lang: 'fr' });
  try {
    // FIX : JSON.parse ne construit que des données, jamais de fonctions.
    const prefs = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    // On ne renvoie que des champs connus (défense en profondeur).
    res.json({ theme: String(prefs.theme || 'light'), lang: String(prefs.lang || 'fr') });
  } catch (e) {
    res.status(400).json({ error: 'Préférences illisibles.' });
  }
});

module.exports = router;
