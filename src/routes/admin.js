// devsecshop/src/routes/admin.js
// Back-office — VERSION TP6 (SSRF + XXE + désérialisation YAML corrigées).
//
// FIX SSRF  : l'URL d'import est validée (schéma http/https) et l'hôte est
//             résolu puis refusé s'il pointe vers une IP privée/loopback/
//             link-local. Les redirections ne sont pas suivies.
// FIX XXE   : le XML est parsé SANS substitution d'entités ni chargement de
//             DTD externe, et sans accès réseau (nonet).
//
// FIX js-yaml : passage à js-yaml v4 (load() sûr par défaut, plus de !!js/function).
//
// ⚠️ RESTE VULNÉRABLE (corrigé au TP7) :
//    - /export (injection de commande)

'use strict';

const express = require('express');
const http = require('http');
const https = require('https');
const dns = require('dns').promises;
const net = require('net');
const { execSync } = require('child_process');
const yaml = require('js-yaml');
const router = express.Router();
const { db } = require('../lib/db');
const { requireAdmin } = require('../lib/auth');

router.get('/', requireAdmin, (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY id').all();
  res.render('admin', { products, result: null });
});

// --- Helpers SSRF ---------------------------------------------------------
// Vrai si l'IP est privée, loopback, link-local ou réservée.
function isBlockedIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10) return true;                       // 10.0.0.0/8
    if (a === 127) return true;                      // loopback
    if (a === 169 && b === 254) return true;         // link-local (métadonnées cloud)
    if (a === 172 && b >= 16 && b <= 31) return true;// 172.16.0.0/12
    if (a === 192 && b === 168) return true;         // 192.168.0.0/16
    if (a === 0) return true;                        // 0.0.0.0/8
    return false;
  }
  if (net.isIPv6(ip)) {
    const low = ip.toLowerCase();
    if (low === '::1') return true;                  // loopback
    if (low.startsWith('fe80')) return true;         // link-local
    if (low.startsWith('fc') || low.startsWith('fd')) return true; // unique local
    if (low.startsWith('::ffff:')) return isBlockedIp(low.replace('::ffff:', '')); // IPv4-mapped
    return false;
  }
  return true; // format inconnu -> on refuse
}

// --- SSRF (corrigé) -------------------------------------------------------
router.get('/import-image', requireAdmin, async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('Paramètre url manquant.');

  let parsed;
  try { parsed = new URL(url); } catch (e) { return res.status(400).send('URL invalide.'); }

  // FIX : seuls http/https sont autorisés (bloque file:, gopher:, etc.).
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return res.status(400).send('Schéma non autorisé.');
  }

  // FIX : on résout l'hôte et on refuse toute IP interne.
  try {
    const records = await dns.lookup(parsed.hostname, { all: true });
    if (records.some((r) => isBlockedIp(r.address))) {
      return res.status(403).send('Destination interne interdite.');
    }
  } catch (e) {
    return res.status(400).send('Hôte introuvable.');
  }

  const client = parsed.protocol === 'https:' ? https : http;
  // On ne suit pas les redirections (une 3xx vers une IP interne serait un contournement).
  const request = client.get(url, { headers: { Accept: 'image/*' } }, (r) => {
    if (r.statusCode >= 300 && r.statusCode < 400) {
      r.destroy();
      return res.status(400).send('Redirection refusée.');
    }
    let size = 0;
    r.on('data', (c) => (size += c.length));
    r.on('end', () => res.send(`Image récupérée (${size} octets) depuis ${parsed.hostname}`));
  });
  request.on('error', (e) => res.status(502).send('Erreur fetch.'));
  request.setTimeout(5000, () => { request.destroy(); res.status(504).send('Timeout.'); });
});

// --- XXE (corrigé) --------------------------------------------------------
router.post('/import-catalog', requireAdmin, (req, res) => {
  const xml = req.body;
  try {
    const libxml = require('libxmljs2');
    // FIX : pas de substitution d'entités (noent défaut=false), pas de DTD
    // externe (dtdload=false), pas d'accès réseau (nonet=true).
    const doc = libxml.parseXml(xml, { noent: false, dtdload: false, nonet: true });
    const names = doc.find('//product/name').map((n) => n.text());
    res.send('Produits importés : ' + JSON.stringify(names));
  } catch (e) {
    res.status(400).send('XML invalide.');
  }
});

// --- Import de réglages YAML (corrigé TP6) --------------------------------
router.post('/import-settings', requireAdmin, (req, res) => {
  const text = req.body.yaml || '';
  try {
    // FIX : js-yaml v4, load() est sûr par défaut (schéma sans !!js/function).
    const settings = yaml.load(text) || {};
    res.json({ ok: true, applied: Object.keys(settings) });
  } catch (e) {
    res.status(400).json({ ok: false, error: 'YAML invalide.' });
  }
});

// --- Injection de commande (⚠️ ENCORE VULNÉRABLE — corrigé au TP7) ---------
router.post('/export', requireAdmin, (req, res) => {
  const format = req.body.format || 'csv';
  try {
    const out = execSync('echo "Export au format ' + format + '" ', { encoding: 'utf8' });
    res.send('<pre>' + out + '</pre>');
  } catch (e) {
    res.status(500).send('Erreur export.');
  }
});

module.exports = router;
