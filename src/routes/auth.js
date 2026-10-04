// devsecshop/src/routes/auth.js
// Authentification : login, logout, register.
//
// ⚠️ VULN (TP3 - SQLi) : la requête de login est construite par concaténation
//    de chaînes à partir des entrées utilisateur -> injection SQL possible.
// ⚠️ VULN (TP3 - Brute force) : aucune limite de tentatives, aucun verrouillage
//    de compte -> le login peut être brute-forcé (ex. Burp Intruder).

'use strict';

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { db } = require('../lib/db');
const { sign } = require('../lib/auth');

function md5(s) {
  return crypto.createHash('md5').update(s).digest('hex');
}

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const hash = md5(password || '');

  // ⚠️ SQLi : concaténation directe. Payload type : username = admin' --
  const sql =
    "SELECT * FROM users WHERE username = '" + username +
    "' AND password = '" + hash + "'";

  let user;
  try {
    user = db.prepare(sql).get();
  } catch (e) {
    return res.status(500).render('login', { error: 'Erreur SQL : ' + e.message });
  }

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
    res.status(400).render('register', { error: 'Inscription impossible : ' + e.message });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('session');
  res.redirect('/');
});

module.exports = router;
