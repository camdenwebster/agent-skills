'use strict';
// Opt-in host inventory for one bounded fixture. Not a general archive or sandbox.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { isDeepStrictEqual } = require('node:util');
const FIXTURE = 'swift-benchmarks/inventory-import';
const GENERATED = `${FIXTURE}/Tests/InventoryImportTests/GeneratedRegressionTests.swift`;
const RESULT = `${FIXTURE}/RESULT.md`;
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const safe = value => typeof value === 'string' && value.length && !path.isAbsolute(value) && !value.includes('\\') && value.split('/').every(x => x && x !== '.' && x !== '..');
function captureInventoryImportSubmission(root, baselineCommit, limits = {}) {
    const caps = { max_entries: 512, max_file_bytes: 256 * 1024, max_total_bytes: 2 * 1024 * 1024, ...limits };
    const result = { version: 1, profile: 'inventory-import-tests-v1', complete: false, errors: [], baseline_commit: baselineCommit, baseline_files: [], inventory: [], artifacts: [], limits: caps };
    const git = args => execFileSync('git', ['-c', 'core.fsmonitor=false', '-c', 'core.hooksPath=/dev/null', '-C', root, ...args], { timeout: 10000, maxBuffer: caps.max_total_bytes, stdio: ['ignore', 'pipe', 'pipe'] });
    let total = 0;
    try {
        if (!/^[a-f0-9]{40}$/.test(baselineCommit || '')) throw new Error('invalid baseline commit');
        if (fs.lstatSync(root).isSymbolicLink()) throw new Error('symbolic workspace root');
        result.head = git(['rev-parse', 'HEAD']).toString('utf8').trim();
        result.index_clean = git(['diff', '--cached', '--no-ext-diff', '--no-textconv', '--raw', baselineCommit, '--']).length === 0;
        result.tracked_clean = git(['diff', '--no-ext-diff', '--no-textconv', '--raw', baselineCommit, '--']).length === 0;
        for (const line of git(['ls-tree', '-r', '-z', baselineCommit]).toString('utf8').split('\0').filter(Boolean)) {
            const match = /^(100644|100755) blob ([a-f0-9]+)\t(.+)$/.exec(line);
            if (!match || !safe(match[3])) throw new Error('unsafe baseline entry');
            const bytes = git(['cat-file', 'blob', match[2]]);
            result.baseline_files.push({ path: match[3], sha256: hash(bytes), executable_mode: parseInt(match[1], 8) & 0o111 });
        }
        result.baseline_files.sort((a,b) => a.path.localeCompare(b.path, 'en'));
        const walk = (directory, prefix = '') => {
            for (const name of fs.readdirSync(directory).sort()) {
                const rel = prefix ? `${prefix}/${name}` : name;
                if (rel === '.git' || rel === `${FIXTURE}/.build`) continue;
                if (!safe(rel)) throw new Error('unsafe inventory path');
                if (result.inventory.length >= caps.max_entries) throw new Error('inventory entry limit');
                const absolute = path.join(directory, name), stat = fs.lstatSync(absolute);
                if (stat.isSymbolicLink()) { result.inventory.push({ path: rel, type: 'symlink', target: fs.readlinkSync(absolute) }); continue; }
                if (stat.isDirectory()) { result.inventory.push({ path: rel, type: 'directory' }); walk(absolute, rel); continue; }
                if (!stat.isFile()) throw new Error(`nonregular inventory path: ${rel}`);
                if (stat.size > caps.max_file_bytes || total + stat.size > caps.max_total_bytes) throw new Error('inventory byte limit');
                const fd = fs.openSync(absolute, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
                let bytes;
                try {
                    // Hard allocation bound even if a file grows between lstat and read.
                    bytes = Buffer.alloc(stat.size + 1);
                    let used = 0;
                    while (used < bytes.length) { const count = fs.readSync(fd, bytes, used, bytes.length - used, used); if (!count) break; used += count; }
                    bytes = bytes.subarray(0, used);
                } finally { fs.closeSync(fd); }
                total += bytes.length;
                if (bytes.length !== stat.size || total > caps.max_total_bytes) throw new Error('inventory changed or byte limit');
                result.inventory.push({ path: rel, type: 'file', sha256: hash(bytes), executable_mode: stat.mode & 0o111, bytes: bytes.length });
                if (rel === GENERATED || rel === RESULT) {
                    if (bytes.length > 64 * 1024) throw new Error('artifact byte limit');
                    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
                    result.artifacts.push({ path: rel, text, sha256: hash(bytes), truncated: false });
                }
            }
        };
        walk(root);
        result.complete = true;
    } catch (error) { result.errors.push(error.message); }
    return result;
}
function verifyInventoryImportSubmission(submission, frozenFiles) {
    const s = submission;
    if (!s || s.version !== 1 || s.profile !== 'inventory-import-tests-v1' || s.complete !== true || !Array.isArray(s.errors) || s.errors.length) throw new Error('incomplete submission inventory');
    if (s.head !== s.baseline_commit) throw new Error('HEAD changed');
    if (s.index_clean !== true) throw new Error('index/staged changes');
    if (s.tracked_clean !== true) throw new Error('tracked frozen files changed');
    const sort = list => [...list].sort((a,b) => a.path.localeCompare(b.path, 'en'));
    if (!isDeepStrictEqual(sort(s.baseline_files), sort(frozenFiles))) throw new Error('frozen baseline hashes mismatch');
    const originals = new Map(frozenFiles.map(f => [f.path, f]));
    const parents = new Set();
    for (const rel of [...originals.keys(), GENERATED, RESULT]) { const parts = rel.split('/'); parts.pop(); while (parts.length) { parents.add(parts.join('/')); parts.pop(); } }
    const seen = new Set(), artifacts = new Map();
    for (const a of s.artifacts) {
        if (![GENERATED, RESULT].includes(a.path) || artifacts.has(a.path) || a.truncated !== false || typeof a.text !== 'string' || Buffer.byteLength(a.text) > 64 * 1024 || hash(a.text) !== a.sha256) throw new Error('invalid artifact digest/path/truncation');
        artifacts.set(a.path, a);
    }
    for (const entry of s.inventory) {
        if (!safe(entry.path) || seen.has(entry.path)) throw new Error('unsafe or duplicate inventory path');
        seen.add(entry.path);
        if (entry.type === 'symlink') throw new Error('symbolic path in submission');
        if (entry.type === 'directory' && parents.has(entry.path)) continue;
        const original = originals.get(entry.path);
        if (original && entry.type === 'file' && original.sha256 === entry.sha256 && original.executable_mode === entry.executable_mode) continue;
        const artifact = artifacts.get(entry.path);
        if (artifact && entry.type === 'file' && entry.executable_mode === 0 && entry.sha256 === artifact.sha256 && entry.bytes === Buffer.byteLength(artifact.text)) continue;
        throw new Error(`unexpected or changed frozen path: ${entry.path}`);
    }
    for (const rel of originals.keys()) if (!seen.has(rel)) throw new Error('missing frozen file');
    for (const rel of artifacts.keys()) if (!seen.has(rel)) throw new Error('artifact absent from inventory');
    if (!artifacts.has(GENERATED)) throw new Error('missing generated regression tests');
    if (!artifacts.has(RESULT)) throw new Error('missing required RESULT.md report');
    return artifacts.get(GENERATED);
}
module.exports = { captureInventoryImportSubmission, verifyInventoryImportSubmission, FIXTURE, GENERATED, RESULT, hash };
