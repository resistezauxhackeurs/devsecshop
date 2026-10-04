// devsecshop/tests/abuse-cases.test.js
// Abuse-cases logique métier (Niveau 3) + ReDoS.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');
const { sign } = require('../src/lib/auth');

function call(server, method, path, body, cookie) {
  const data = body ? new URLSearchParams(body).toString() : '';
  return new Promise((resolve) => {
    const r = http.request({ port: server.address().port, path, method,
      headers: Object.assign({ Cookie: cookie || '' },
        body ? { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) } : {}) },
      (res) => { let b=''; res.on('data',c=>b+=c); res.on('end',()=>resolve({status:res.statusCode, body:b})); });
    if (body) r.write(data); r.end();
  });
}
// alice = id 2, bob = id 3 (cf. seed)
const alice = () => 'session=' + sign({ id: 2, username: 'alice', is_admin: 0 });
const bob = () => 'session=' + sign({ id: 3, username: 'bob', is_admin: 0 });

test('IDOR : bob ne voit pas la commande d\'alice', async () => {
  const s = app.listen(0);
  const r = await call(s, 'GET', '/account/orders/1', null, bob()); // #1 appartient à alice
  assert.strictEqual(r.status, 404);
  s.close();
});
test('Mass assignment : is_admin non forçable', async () => {
  const s = app.listen(0);
  const r = await call(s, 'POST', '/account/profile', { email: 'b@x.t', is_admin: '1' }, bob());
  assert.match(r.body, /Admin : <strong>non/);
  s.close();
});
test('Quantité négative : total >= 0', async () => {
  const s = app.listen(0);
  const cart = encodeURIComponent(JSON.stringify([{ product_id: 1, qty: -5 }]));
  const r = await call(s, 'POST', '/cart/checkout', { coupon: 'PROMO-2024' }, alice() + '; cart=' + cart);
  const m = r.body.match(/Montant débité : ([\-0-9.,]+)/);
  const amount = m ? parseFloat(m[1].replace(',', '.')) : 0;
  assert.ok(amount >= 0, 'montant: ' + amount);
  s.close();
});
test('ReDoS : checkout rapide', async () => {
  const s = app.listen(0);
  const start = Date.now();
  await call(s, 'POST', '/cart/checkout', { coupon: 'A'.repeat(50) + '!' }, alice());
  assert.ok(Date.now() - start < 1000);
  s.close();
});
