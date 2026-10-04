// devsecshop/tests/deserialization.test.js
// Abuse-case : un cookie prefs piégé (payload node-serialize) ne doit PAS exécuter de code.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const app = require('../src/app');
const { sign } = require('../src/lib/auth');

function get(server, path, cookie) {
  return new Promise((resolve) => {
    http.get({ port: server.address().port, path, headers: { Cookie: cookie } },
      (res) => { let b=''; res.on('data',c=>b+=c); res.on('end',()=>resolve({status:res.statusCode, body:b})); });
  });
}

test('payload node-serialize inerte', async () => {
  const server = app.listen(0);
  const marker = '/tmp/deser_pwn_' + Date.now() + '.txt';
  // Payload node-serialize classique (_$$ND_FUNC$$_ + IIFE). JSON.stringify gère l'échappement.
  const fn = '_$$ND_FUNC$$_function(){require("child_process").execSync("touch ' + marker + '")}()';
  const b64 = Buffer.from(JSON.stringify({ x: fn })).toString('base64');
  const cookie = 'session=' + sign({ id: 2, username: 'alice', is_admin: 0 }) + '; prefs=' + b64;
  await get(server, '/account/prefs', cookie);
  await new Promise((r) => setTimeout(r, 200));
  assert.ok(!fs.existsSync(marker), 'aucun code ne doit s\'exécuter à la lecture des prefs');
  server.close();
});

test('prefs JSON légitimes round-trip', async () => {
  const server = app.listen(0);
  const b64 = Buffer.from(JSON.stringify({ theme: 'dark', lang: 'en' })).toString('base64');
  const cookie = 'session=' + sign({ id: 2, username: 'alice', is_admin: 0 }) + '; prefs=' + b64;
  const r = await get(server, '/account/prefs', cookie);
  assert.strictEqual(r.status, 200);
  assert.match(r.body, /"theme":"dark"/);
  server.close();
});
