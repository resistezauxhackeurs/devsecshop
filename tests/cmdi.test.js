// devsecshop/tests/cmdi.test.js
// Abuse-case : l'export ne doit plus permettre d'exécuter de commande.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const app = require('../src/app');
const { sign } = require('../src/lib/auth');

function post(server, path, body, cookie) {
  const data = new URLSearchParams(body).toString();
  return new Promise((resolve) => {
    const req = http.request({ port: server.address().port, path, method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data), Cookie: cookie } },
      (res) => { let b=''; res.on('data',c=>b+=c); res.on('end',()=>resolve({status:res.statusCode, body:b})); });
    req.write(data); req.end();
  });
}

test('injection de commande neutralisée', async () => {
  const server = app.listen(0);
  const admin = 'session=' + sign({ id: 1, username: 'admin', is_admin: 1 });
  const marker = '/tmp/cmdi_pwn_' + Date.now() + '.txt';
  const r = await post(server, '/admin/export', { format: 'csv"; touch ' + marker + '; echo "' }, admin);
  await new Promise((x) => setTimeout(x, 200));
  assert.ok(!fs.existsSync(marker), 'aucune commande ne doit s\'exécuter');
  assert.strictEqual(r.status, 400, 'un format non blanc-listé est refusé');
  server.close();
});

test('export csv légitime fonctionne', async () => {
  const server = app.listen(0);
  const admin = 'session=' + sign({ id: 1, username: 'admin', is_admin: 1 });
  const r = await post(server, '/admin/export', { format: 'csv' }, admin);
  assert.strictEqual(r.status, 200);
  assert.match(r.body, /id,name,price_cents,stock/);
  server.close();
});
