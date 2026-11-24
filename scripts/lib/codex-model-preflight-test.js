'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { codexModelPreflight } = require('./codex-model-preflight');
const raw = JSON.stringify({ models: [{ slug: 'gpt-fixed', visibility: 'list', base_instructions: 'do not retain' }, { slug: 'hidden', visibility: 'hide' }] });
test('catalogue preflight records bounded availability evidence without promoting requested identity', () => {
  const result = codexModelPreflight('gpt-fixed', (command, args, options) => {
    assert.equal(command, 'codex'); assert.deepEqual(args, ['debug', 'models']);
    assert.equal(options.timeout, 20000); assert.equal(options.maxBuffer, 8 * 1024 * 1024); return raw;
  });
  assert.deepEqual(result.available_models, ['gpt-fixed']);
  assert.equal(result.catalogue_sha256, createHash('sha256').update(raw).digest('hex'));
  assert.equal(result.source, 'codex debug models'); assert.ok(Date.parse(result.collected_at));
  assert.equal(result.observed_model, undefined); assert.doesNotMatch(JSON.stringify(result), /do not retain/);
});
test('unavailable, hidden, malformed and failed catalogue probes reject before execution', () => {
  for (const model of ['missing', 'hidden']) assert.throws(() => codexModelPreflight(model, () => raw), /not listed/);
  for (const invalid of ['broken', '{}', '{"models":[]}', '{"models":[{}]}', '{"models":[{"slug":"x","visibility":"list"},{"slug":"x","visibility":"list"}]}']) assert.throws(() => codexModelPreflight('gpt-fixed', () => invalid), /catalogue/);
  assert.throws(() => codexModelPreflight('gpt-fixed', () => { const error = new Error('private details'); error.code='ETIMEDOUT'; throw error; }), /ETIMEDOUT/);
});
