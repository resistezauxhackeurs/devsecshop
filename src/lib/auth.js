// devsecshop/src/lib/auth.js
// Helpers d'authentification basés sur un JWT stocké en cookie.

'use strict';

const jwt = require('jsonwebtoken');
const config = require('./config');

// Signe un token pour un utilisateur.
function sign(user) {
  return jwt.sign(
    { uid: user.id, username: user.username, is_admin: !!user.is_admin },
    config.jwtSecret,
    { expiresIn: '2h' }
  );
}

// Décode le cookie et renvoie l'utilisateur courant, ou null.
function currentUser(req) {
  const token = req.cookies && req.cookies.session;
  if (!token) return null;
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (e) {
    return null;
  }
}

// Middleware : exige un utilisateur connecté.
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).send('Connexion requise.');
  next();
}

// Middleware : exige un compte admin.
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).send('Accès réservé aux administrateurs.');
  }
  next();
}

module.exports = { sign, currentUser, requireAuth, requireAdmin };
