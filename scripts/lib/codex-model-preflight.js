'use strict';
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');

// This is catalogue availability, not proof of account permission or backend identity.
function codexModelPreflight(model, invoke = execFileSync) {
  let raw;
  try {
    raw = invoke('codex', ['debug', 'models'], { encoding: 'utf8', timeout: 20000, maxBuffer: 8 * 1024 * 1024 });
  } catch (error) {
    throw new Error(`Codex model catalogue preflight failed (${error.code || 'process failure'}); no evaluation scheduled`);
  }
  let catalogue;
  try { catalogue = JSON.parse(raw); } catch { throw new Error('Invalid Codex model catalogue JSON'); }
  const models = catalogue?.models;
  if (!Array.isArray(models) || !models.length || models.length > 10000 || models.some(m => !m || typeof m.slug !== 'string' || !/^[a-zA-Z0-9._:/-]{1,200}$/.test(m.slug)) || new Set(models.map(m => m.slug)).size !== models.length) throw new Error('Invalid Codex model catalogue entries');
  const available = models.filter(m => m.visibility === 'list').map(m => m.slug).sort();
  if (!available.includes(model)) throw new Error(`Requested model ${model} is not listed in the current Codex catalogue; no evaluation scheduled`);
  return { source: 'codex debug models', collected_at: new Date().toISOString(), catalogue_sha256: createHash('sha256').update(raw).digest('hex'), available_models: available, limitation: 'CLI-advertised catalogue availability only; it may be cached or stale. Collection time is not provider attestation. Account permission and resolved executor identity are not established.' };
}
module.exports = { codexModelPreflight };
