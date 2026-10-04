// devsecshop/tests/sqli.test.js
// Abuse-case : la SQLi de bypass d'authentification ne doit plus fonctionner.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');

function post(server, path, body, cookies) {
  const data = new URLSearchParams(body).toString();
  return new Promise((resolve) => {
    const req = http.request({ port: server.address().port, path, method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) } },
      (res) => { let b=''; res.on('data',c=>b+=c); res.on('end',()=>resolve({ status: res.statusCode, body: b, headers: res.headers })); });
    req.write(data); req.end();
  });
}

test('SQLi bypass auth neutralisée', async () => {
  const server = app.listen(0);
  const r = await post(server, '/login', { username: "admin'-- -", password: 'peu importe' });
  // Avant le fix : 302 (connecté). Après : 401.
  assert.strictEqual(r.status, 401, 'le bypass SQLi ne doit plus connecter');
  server.close();
});
