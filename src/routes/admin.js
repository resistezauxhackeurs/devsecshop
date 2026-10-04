// devsecshop/src/routes/admin.js
// Back-office administrateur.
//
// ⚠️ VULN (TP4 - SSRF)  : /admin/import-image?url= récupère une URL arbitraire
//    côté serveur (accès réseau interne, métadonnées cloud, ports internes).
// ⚠️ VULN (TP4 - XXE)   : /admin/import-catalog parse du XML avec entités
//    externes activées (noent) -> lecture de fichiers, SSRF via entité.
// ⚠️ VULN (TP6 - YAML)  : /admin/import-settings parse du YAML avec js-yaml 3
//    load() (schéma complet) -> exécution de !!js/function.
// ⚠️ VULN (TP7 - RCE)   : /admin/export construit une commande shell à partir
//    d'une entrée utilisateur (injection de commande).

'use strict';

const express = require('express');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const yaml = require('js-yaml');
const router = express.Router();
const { db } = require('../lib/db');
const { requireAdmin } = require('../lib/auth');

router.get('/', requireAdmin, (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY id').all();
  res.render('admin', { products, result: null });
});

// --- SSRF -----------------------------------------------------------------
// Récupère une image depuis une URL fournie par l'admin et renvoie sa taille.
router.get('/import-image', requireAdmin, (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('Paramètre url manquant.');

  const client = url.startsWith('https') ? https : http;
  // ⚠️ SSRF : aucune validation de l'hôte/ IP de destination.
  client
    .get(url, (r) => {
      let data = '';
      r.on('data', (chunk) => (data += chunk));
      r.on('end', () => {
        res.send(
          `Récupéré ${data.length} octets depuis ${url}\n\n` +
            data.slice(0, 2000)
        );
      });
    })
    .on('error', (e) => res.status(502).send('Erreur fetch : ' + e.message));
});

// --- XXE ------------------------------------------------------------------
// Importe un catalogue produit au format XML (corps application/xml).
router.post('/import-catalog', requireAdmin, (req, res) => {
  const xml = req.body; // texte brut (middleware express.text)
  try {
    // Chargé à la demande (module natif, requis seulement pour cet import).
    const libxml = require('libxmljs2');
    // ⚠️ XXE : noent=true résout les entités externes ; dtdload autorise le DTD.
    const doc = libxml.parseXml(xml, { noent: true, dtdload: true, nonet: false });
    const names = doc.find('//product/name').map((n) => n.text());
    res.send('Produits importés : ' + JSON.stringify(names));
  } catch (e) {
    res.status(400).send('XML invalide : ' + e.message);
  }
});

// --- Désérialisation YAML -------------------------------------------------
// Importe des réglages de boutique au format YAML.
router.post('/import-settings', requireAdmin, (req, res) => {
  const text = req.body.yaml || '';
  try {
    // ⚠️ js-yaml 3 : load() utilise le schéma complet et accepte !!js/function.
    const settings = yaml.load(text);
    // La concaténation ci-dessous appelle settings.toString() : si le YAML a
    // défini toString via !!js/function, le code est exécuté ici (RCE).
    console.log('Réglages importés : ' + settings);
    res.json({ ok: true, applied: Object.keys(settings || {}) });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// --- Injection de commande ------------------------------------------------
// Exporte le catalogue dans un format choisi (génère un fichier via un outil shell).
router.post('/export', requireAdmin, (req, res) => {
  const format = req.body.format || 'csv';
  try {
    // ⚠️ Injection : `format` est concaténé dans une commande shell.
    const out = execSync('echo "Export au format ' + format + '" ', {
      encoding: 'utf8'
    });
    res.send('<pre>' + out + '</pre>');
  } catch (e) {
    res.status(500).send('Erreur export : ' + e.message);
  }
});

module.exports = router;
