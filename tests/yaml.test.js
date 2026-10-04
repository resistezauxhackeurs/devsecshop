// devsecshop/tests/yaml.test.js
// Abuse-case : un YAML avec !!js/function ne doit plus exécuter de code (js-yaml v4).
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

test('YAML !!js/function inerte', async () => {
  const server = app.listen(0);
  const admin = 'session=' + sign({ id: 1, username: 'admin', is_admin: 1 });
  const marker = '/tmp/yaml_pwn_' + Date.now() + '.txt';
  const payload = '"toString": !<tag:yaml.org,2002:js/function> "function(){process.mainModule.require(\'child_process\').execSync(\'touch ' + marker + '\')}"';
  await post(server, '/admin/import-settings', { yaml: payload }, admin);
  await new Promise((r) => setTimeout(r, 200));
  assert.ok(!fs.existsSync(marker), 'aucune exécution via !!js/function');
  server.close();
});

test('YAML légitime accepté', async () => {
  const server = app.listen(0);
  const admin = 'session=' + sign({ id: 1, username: 'admin', is_admin: 1 });
  const r = await post(server, '/admin/import-settings', { yaml: 'currency: EUR\ntaxRate: 20' }, admin);
  assert.strictEqual(r.status, 200);
  assert.match(r.body, /currency/);
  server.close();
});
