// devsecshop/src/routes/auth.js
// Authentification — VERSION CORRIGÉE (TP3).
//
// FIX SQLi : toutes les requêtes utilisent des paramètres liés (?), jamais de
//            concaténation de chaînes.
// FIX brute force : limiteur de tentatives (express-rate-limit) sur /login.
//            En complément, on renvoie un message d'erreur générique.

'use strict';

const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { db } = require('../lib/db');
const { sign } = require('../lib/auth');

function md5(s) {
  return crypto.createHash('md5').update(s).digest('hex');
}

// Max 5 tentatives par IP sur 15 minutes, puis 429.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Trop de tentatives de connexion. Réessayez plus tard.'
});

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  const hash = md5(password || '');

  // FIX : requête paramétrée — les entrées ne peuvent plus altérer la requête.
  const user = db
    .prepare('SELECT * FROM users WHERE username = ? AND password = ?')
    .get(username, hash);

  if (!user) {
    return res.status(401).render('login', { error: 'Identifiants invalides.' });
  }

  res.cookie('session', sign(user), { httpOnly: true });
  res.redirect('/');
});

router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

router.post('/register', (req, res) => {
  const { username, password, email } = req.body;
  try {
    const info = db
      .prepare('INSERT INTO users (username, password, email, is_admin) VALUES (?, ?, ?, 0)')
      .run(username, md5(password || ''), email || null);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.cookie('session', sign(user), { httpOnly: true });
    res.redirect('/');
  } catch (e) {
    res.status(400).render('register', { error: 'Inscription impossible.' });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('session');
  res.redirect('/');
});

module.exports = router;
