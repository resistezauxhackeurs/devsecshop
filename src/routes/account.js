// devsecshop/src/routes/account.js
// Espace client : commandes, profil, préférences.
//
// ⚠️ VULN (Niveau 3 - IDOR) : GET /account/orders/:id ne vérifie pas que la
//    commande appartient à l'utilisateur connecté.
// ⚠️ VULN (Niveau 3 - Mass assignment / Bonus prototype pollution) :
//    la mise à jour de profil fusionne req.body dans l'objet via lodash.merge,
//    ce qui permet d'injecter is_admin, et __proto__ (lodash 4.17.4 vulnérable).
// ⚠️ VULN (TP5 - Désérialisation) : les préférences sont restaurées depuis un
//    cookie via node-serialize.unserialize() -> RCE avec payload _$$ND_FUNC$$_.

'use strict';

const express = require('express');
const serialize = require('node-serialize');
const _ = require('lodash');
const router = express.Router();
const { db } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

// Liste des commandes de l'utilisateur courant.
router.get('/orders', requireAuth, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC').all(req.user.uid);
  res.render('orders', { orders });
});

// ⚠️ IDOR : on charge la commande par id sans filtrer sur user_id.
router.get('/orders/:id', requireAuth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).send('Commande introuvable.');
  res.render('order-detail', { order });
});

// Profil : affichage.
router.get('/profile', requireAuth, (req, res) => {
  const u = db.prepare('SELECT id, username, email, is_admin FROM users WHERE id = ?').get(req.user.uid);
  res.render('profile', { profile: u, saved: false });
});

// Profil : mise à jour.
router.post('/profile', requireAuth, (req, res) => {
  const u = db.prepare('SELECT id, username, email, is_admin FROM users WHERE id = ?').get(req.user.uid);

  // ⚠️ Mass assignment + prototype pollution : on fusionne tout le body.
  const merged = {};
  _.merge(merged, u, req.body);

  db.prepare('UPDATE users SET email = ?, is_admin = ? WHERE id = ?')
    .run(merged.email, merged.is_admin ? 1 : 0, u.id);

  const updated = db.prepare('SELECT id, username, email, is_admin FROM users WHERE id = ?').get(u.id);
  res.render('profile', { profile: updated, saved: true });
});

// Préférences d'affichage, encodées dans un cookie "prefs".
router.post('/prefs', requireAuth, (req, res) => {
  const prefs = { theme: req.body.theme || 'light', lang: req.body.lang || 'fr' };
  // Sérialisation avec node-serialize (format maison).
  const encoded = Buffer.from(serialize.serialize(prefs)).toString('base64');
  res.cookie('prefs', encoded);
  res.redirect('/account/profile');
});

// Lecture des préférences : désérialisation du cookie.
router.get('/prefs', requireAuth, (req, res) => {
  const raw = req.cookies.prefs;
  if (!raw) return res.json({ theme: 'light', lang: 'fr' });
  // ⚠️ Désérialisation non fiable -> RCE si le cookie contient _$$ND_FUNC$$_.
  const prefs = serialize.unserialize(Buffer.from(raw, 'base64').toString('utf8'));
  res.json(prefs);
});

module.exports = router;
