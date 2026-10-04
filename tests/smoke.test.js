// devsecshop/tests/smoke.test.js
// Test "fumée" minimal : l'appli se charge et le module exporte bien un app Express.
// Les abuse-case tests (sécurité) seront ajoutés au Niveau 3 / capstone.

'use strict';

const test = require('node:test');
const assert = require('node:assert');

test('app se charge sans crash', () => {
  const app = require('../src/app');
  assert.ok(app, 'app doit être défini');
  assert.strictEqual(typeof app.listen, 'function', 'app doit être une app Express');
});
