// devsecshop/tests/xxe.test.js
// Abuse-case XXE : une entité externe ne doit PAS être résolue (pas de fuite de fichier).
// Nécessite libxmljs2 (donc Node 20). Sous une stack sans libxmljs2, le test est ignoré.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

let libxmlAvailable = true;
try { require('libxmljs2'); } catch (e) { libxmlAvailable = false; }

const app = require('../src/app');
const { sign } = require('../src/lib/auth');

function postXml(server, path, xml, cookie) {
  return new Promise((resolve) => {
    const req = http.request({ port: server.address().port, path, method: 'POST',
      headers: { 'Content-Type': 'application/xml', 'Content-Length': Buffer.byteLength(xml), Cookie: cookie } },
      (res) => { let b=''; res.on('data',c=>b+=c); res.on('end',()=>resolve({status:res.statusCode, body:b})); });
    req.write(xml); req.end();
  });
}

test('XXE : entité externe non résolue', { skip: !libxmlAvailable }, async () => {
  const server = app.listen(0);
  const admin = 'session=' + sign({ id: 1, username: 'admin', is_admin: 1 });
  const payload = `<?xml version="1.0"?>
<!DOCTYPE catalog [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
<catalog><product><name>&xxe;</name></product></catalog>`;
  const r = await postXml(server, '/admin/import-catalog', payload, admin);
  assert.ok(!/root:.*:0:0:/.test(r.body), 'le contenu de /etc/passwd ne doit pas fuiter');
  server.close();
});
