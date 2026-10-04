// devsecshop/tests/ssrf.test.js
// Abuse-case : l'import d'image ne doit plus atteindre une IP interne.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');
const { sign } = require('../src/lib/auth');

function get(server, path, cookie) {
  return new Promise((resolve) => {
    http.get({ port: server.address().port, path, headers: { Cookie: cookie } },
      (res) => { let b=''; res.on('data',c=>b+=c); res.on('end',()=>resolve({status:res.statusCode, body:b})); });
  });
}

test('SSRF vers 127.0.0.1 bloquée', async () => {
  const server = app.listen(0);
  const admin = 'session=' + sign({ id: 1, username: 'admin', is_admin: 1 });
  const r = await get(server, '/admin/import-image?url=' + encodeURIComponent('http://127.0.0.1:5678/'), admin);
  assert.strictEqual(r.status, 403, 'une destination loopback doit être refusée (403)');
  server.close();
});

test('SSRF vers 169.254.169.254 (métadonnées cloud) bloquée', async () => {
  const server = app.listen(0);
  const admin = 'session=' + sign({ id: 1, username: 'admin', is_admin: 1 });
  const r = await get(server, '/admin/import-image?url=' + encodeURIComponent('http://169.254.169.254/latest/meta-data/'), admin);
  assert.strictEqual(r.status, 403, 'les métadonnées cloud doivent être refusées (403)');
  server.close();
});
