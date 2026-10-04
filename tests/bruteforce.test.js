// devsecshop/tests/bruteforce.test.js
// Abuse-case : le login doit limiter les tentatives (rate-limit).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');

function post(server, path, body) {
  const data = new URLSearchParams(body).toString();
  return new Promise((resolve) => {
    const req = http.request({ port: server.address().port, path, method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) } },
      (res) => { let b=''; res.on('data',c=>b+=c); res.on('end',()=>resolve(res.statusCode)); });
    req.write(data); req.end();
  });
}

test('rate-limit déclenché après plusieurs tentatives', async () => {
  const server = app.listen(0);
  let got429 = false;
  for (let i = 0; i < 8; i++) {
    const code = await post(server, '/login', { username: 'alice', password: 'faux' + i });
    if (code === 429) { got429 = true; break; }
  }
  assert.ok(got429, 'un 429 doit finir par apparaître (limiteur actif)');
  server.close();
});
