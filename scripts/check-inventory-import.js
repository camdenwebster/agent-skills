#!/usr/bin/env node
'use strict';
// One-case native strength oracle. No generic patch replay; never invokes a model.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { isDeepStrictEqual } = require('node:util');
const { FIXTURE, GENERATED, hash, verifyInventoryImportSubmission } = require('./lib/inventory-import-submission');
const SOURCE = 'Sources/InventoryImport/InventoryImporter.swift';
const NEW_TEST = 'Tests/InventoryImportTests/GeneratedRegressionTests.swift';
function files(root, prefix = '') {
    const entries = [];
    if (fs.lstatSync(root).isSymbolicLink()) throw new Error('symbolic frozen input root');
    for (const name of fs.readdirSync(root).sort()) {
        const absolute = path.join(root, name), rel = prefix ? `${prefix}/${name}` : name, stat = fs.lstatSync(absolute);
        if (stat.isSymbolicLink()) throw new Error('symbolic frozen input');
        if (stat.isDirectory()) entries.push(...files(absolute, rel));
        else if (stat.isFile()) entries.push({ path: rel, sha256: hash(fs.readFileSync(absolute)), executable_mode: stat.mode & 0o111 });
        else throw new Error('nonregular frozen input');
    }
    return entries.sort((a,b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}
function verifyFrozenInputs(campaign, manifest) {
    const scripts = files(path.join(campaign, 'inputs/scripts'));
    if (hash(JSON.stringify(scripts)) !== manifest.harness_sha256) throw new Error('frozen harness digest mismatch');
    const fixtures = files(path.join(campaign, 'inputs/fixtures'));
    if (!isDeepStrictEqual(fixtures, manifest.fixture_files)) throw new Error('frozen fixture digest mismatch');
    return { scripts, fixtures };
}
function verifyCheckerIdentity(campaign) {
    for (const [current, relative] of [[__filename, 'check-inventory-import.js'], [require.resolve('./lib/inventory-import-submission'), 'lib/inventory-import-submission.js']]) {
        const frozen = path.join(campaign, 'inputs/scripts', relative);
        if (hash(fs.readFileSync(current)) !== hash(fs.readFileSync(frozen)) || (fs.statSync(current).mode & 0o111) !== (fs.statSync(frozen).mode & 0o111)) throw new Error('checker identity differs from frozen campaign; invoke its frozen inputs/scripts/check-inventory-import.js');
    }
}
function discoverTests(output) {
    return output.split(/\r?\n/).filter(x => /^InventoryImportTests\..+\(.*\)$/.test(x)).sort();
}
function auditGenerated(text) {
    // Targeted conservative audit supplements human review. It is not a Swift parser or security sandbox.
    if (/@testable\b/.test(text)) throw new Error('tests must use public APIs');
    if (/\b(?:Process|ProcessInfo|FileManager|FileHandle|URLSession|URLRequest|UserDefaults|CommandLine|Bundle|NSTask|NSFileHandle|Network|Darwin|Glibc|dlopen|dlsym|system|popen|fork|execv|execve|getenv|setenv|unsetenv|exit|fatalError|unsafeBitCast|Unsafe\w*|_exit)\b/.test(text)) throw new Error('nonhermetic or unsafe generated test');
    if (/\.(?:disabled|enabled|knownIssue|withKnownIssue)\s*\(|\bwithKnownIssue\s*\(|\bSkipInfo\b|#if\b|#sourceLocation\b/.test(text)) throw new Error('disabled/skipped/conditional test evidence is not allowed');
    if (!/@Test\b/.test(text)) throw new Error('missing generated Swift Testing tests');
}
function applyMutation(source, mutation) {
    for (const [before, after] of mutation.replacements) {
        if (!before || source.split(before).length !== 2) throw new Error(`mutation ${mutation.id} anchor must occur exactly once`);
        source = source.replace(before, after);
    }
    return source;
}
function classifyNative(run, identifiers) {
    const generated = identifiers.filter(x => x !== 'InventoryImportTests.smokeImportsOneRow()');
    if (!generated.length) throw new Error('no generated test discovery');
    const output = String(run.output || '');
    const base = { generated_identifiers: generated, total_functions: identifiers.length, exit_status: run.status, signal: run.signal || null };
    const completions = [...output.matchAll(/Test run with (\d+) tests?(?: in \d+ suites?)? (passed|failed)\b/g)];
    if (run.error || run.signal || run.status === null || /\b(?:skipped|disabled|known issue)\b/i.test(output)) return { ...base, verdict: 'incomplete' };
    if (/\berror:/.test(output) && !/recorded an issue/.test(output)) return { ...base, verdict: 'compile-failure' };
    if (completions.length !== 1 || Number(completions[0][1]) !== identifiers.length) return { ...base, verdict: 'incomplete' };
    const started = [...output.matchAll(/\bTest (?!run started\.)(.+?) started\./g)].length;
    const finished = [...output.matchAll(/\bTest (?!run with \d+ tests?(?: in \d+ suites?)? (?:passed|failed) after )(.+?) (?:passed|failed) after /g)].length;
    if (started !== identifiers.length || finished !== identifiers.length) return { ...base, verdict: 'incomplete' };
    if (run.status === 0 && completions[0][2] === 'passed') return { ...base, verdict: 'passed' };
    const assertion = /recorded an issue at [^\n]*GeneratedRegressionTests\.swift:\d+(?::\d+)?:[^\n]*(?:Expectation failed|Issue recorded)/.test(output);
    if (run.status === 1 && completions[0][2] === 'failed' && assertion) return { ...base, verdict: 'assertion-kill' };
    return { ...base, verdict: 'non-generated-failure' };
}
function runVariants({ fixture, oracle, generated, output, timeout = 120000, expectedToolchain }) {
    auditGenerated(generated);
    fs.mkdirSync(output, { recursive: true });
    const version = spawnSync('swift', ['--version'], { encoding: 'utf8', timeout: 10000 });
    if (version.error || version.status !== 0) throw new Error('Swift toolchain unavailable');
    const toolchain = `${version.stdout || ''}${version.stderr || ''}`.trim();
    if (expectedToolchain !== undefined && (typeof expectedToolchain !== 'string' || version.stdout.trim() !== expectedToolchain.trim())) throw new Error('Swift toolchain differs from frozen campaign version');
    const mutations = JSON.parse(fs.readFileSync(path.join(oracle, 'mutations.json'), 'utf8'));
    if (mutations.length !== 4 || new Set(mutations.map(x => x.id)).size !== 4) throw new Error('unexpected mutation definitions');
    const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'inventory-import-native-'));
    const runs = [];
    let baselineIdentifiers;
    try {
        for (const mutation of [null, ...mutations]) {
            const id = mutation?.id || 'correct', root = path.join(temporary, id);
            fs.cpSync(fixture, root, { recursive: true });
            if (fs.existsSync(path.join(root, '.build'))) throw new Error('frozen fixture contains build artifacts');
            fs.writeFileSync(path.join(root, NEW_TEST), generated);
            if (mutation) {
                const file = path.join(root, SOURCE);
                fs.writeFileSync(file, applyMutation(fs.readFileSync(file, 'utf8'), mutation));
            }
            const invoke = args => {
                const result = spawnSync('/bin/sh', [path.join(root, 'run-tests.sh'), ...args], { cwd: root, encoding: 'utf8', timeout, maxBuffer: 16 * 1024 * 1024 });
                return { ...result, output: `${result.stdout || ''}${result.stderr || ''}` };
            };
            // Native discovery is collected independently of RESULT.md or source naming assumptions.
            const listed = invoke(['list']);
            fs.writeFileSync(path.join(output, `${id}.discovery.log`), listed.output);
            const identifiers = discoverTests(listed.output);
            if (listed.error || listed.signal || listed.status !== 0 || !identifiers.length || new Set(identifiers).size !== identifiers.length) {
                runs.push({ variant: id, verdict: listed.status === 1 ? 'compile-failure' : 'incomplete', command: ['sh', 'run-tests.sh', 'list'] });
                break;
            }
            if (!baselineIdentifiers) baselineIdentifiers = identifiers;
            if (!isDeepStrictEqual(identifiers, baselineIdentifiers)) { runs.push({ variant: id, verdict: 'changed-test-discovery' }); break; }
            const native = invoke([]);
            fs.writeFileSync(path.join(output, `${id}.native.log`), native.output);
            const classified = classifyNative(native, identifiers);
            runs.push({ variant: id, command: ['sh', 'run-tests.sh'], discovery_command: ['sh', 'run-tests.sh', 'list'], source_sha256: hash(fs.readFileSync(path.join(root, SOURCE))), ...classified });
            if (!mutation && classified.verdict !== 'passed') break;
        }
    } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
    const killed = runs.filter(x => x.variant !== 'correct' && x.verdict === 'assertion-kill').length;
    const report = { version: 1, toolchain, timeout_ms_per_command: timeout, generated_sha256: hash(generated), mutations_sha256: hash(fs.readFileSync(path.join(oracle, 'mutations.json'))), correct_passed: runs[0]?.variant === 'correct' && runs[0]?.verdict === 'passed', killed, required_kills: 4, qualified: runs.length === 5 && runs[0].verdict === 'passed' && killed === 4, runs, limits: 'One in-memory import fixture; public API test strength only. Conservative source audit requires human review; no general sandbox or broad skill-effectiveness claim.' };
    fs.writeFileSync(path.join(output, 'functional-report.json'), JSON.stringify(report, null, 2) + '\n');
    return report;
}
function checkCampaign(campaign, slot) {
    if (!/^\d{4}$/.test(slot)) throw new Error('slot must be four digits');
    const manifest = JSON.parse(fs.readFileSync(path.join(campaign, 'manifest.json'), 'utf8'));
    if (manifest.runtime_profile !== 'swiftpm-isolated-v1' || manifest.artifact_profile !== 'inventory-import-tests-v1') throw new Error('wrong campaign profile');
    const frozen = verifyFrozenInputs(campaign, manifest);
    verifyCheckerIdentity(campaign);
    const directory = path.join(campaign, slot, 'harness-results');
    const records = fs.readdirSync(directory).filter(x => /^swift-benchmark\.eval-401\..+\.record\.json$/.test(x));
    if (records.length !== 1) throw new Error('missing or ambiguous case 401 record');
    const record = JSON.parse(fs.readFileSync(path.join(directory, records[0]), 'utf8'));
    if (record.version !== 1 || !record.evidence || hash(JSON.stringify(record.evidence)) !== record.sha256) throw new Error('record digest mismatch');
    const ev = record.evidence.eval;
    if (ev.id !== 401 || ev.artifact_profile !== manifest.artifact_profile || ev.runtime_profile !== manifest.runtime_profile || !isDeepStrictEqual(ev.files, [FIXTURE])) throw new Error('record case/profile mismatch');
    const engine = record.evidence.run?.engine || 'claude';
    if (engine !== (manifest.engine || 'claude')) throw new Error('record engine mismatch');
    const executionFailure = engine === 'codex'
        ? require(path.join(campaign, 'inputs/scripts/lib/codex-eval')).codexExecutionFailure
        : require(path.join(campaign, 'inputs/scripts/lib/execution-status')).executionFailure;
    if (typeof record.evidence.trace !== 'string' || executionFailure(record.evidence.trace)) throw new Error('incomplete recorded executor trace');
    const row = manifest.matrix?.[Number(slot) - 1];
    if (!row || row.case_id !== 401 || record.evidence.run?.requested_model !== manifest.model) throw new Error('record slot/model mismatch');
    const artifact = verifyInventoryImportSubmission(record.evidence.workspace_evidence?.inventory_import_submission, frozen.fixtures);
    // Also retain and cross-check the existing generic artifact evidence when available.
    const captured = record.evidence.workspace_evidence?.files?.filter(x => x.path === GENERATED);
    if (captured?.length !== 1 || captured[0].truncated !== false || captured[0].text !== artifact.text) throw new Error('generic captured test artifact mismatch');
    const output = path.join(campaign, slot, `functional-${randomUUID()}`);
    const report = runVariants({ fixture: path.join(campaign, 'inputs/fixtures', FIXTURE), oracle: path.join(campaign, 'inputs/scripts/lib/inventory-import-oracle'), generated: artifact.text, output, expectedToolchain: manifest.versions?.swift ?? null });
    report.record_sha256 = record.sha256;
    report.frozen_harness_sha256 = manifest.harness_sha256;
    report.frozen_fixture_files = frozen.fixtures;
    fs.writeFileSync(path.join(output, 'functional-report.json'), JSON.stringify(report, null, 2) + '\n');
    return { output, ...report };
}
function qualify(output) {
    const root = path.resolve(__dirname, '..'), oracle = path.join(__dirname, 'lib/inventory-import-oracle');
    const fixture = path.join(root, 'evals/fixtures', FIXTURE);
    const reference = runVariants({ fixture, oracle, generated: fs.readFileSync(path.join(oracle, 'GeneratedRegressionTests.swift'), 'utf8'), output: path.join(output, 'canonical') });
    const weak = runVariants({ fixture, oracle, generated: 'import Testing\nimport InventoryImport\n@Test func weakAddition() { #expect(true) }\n', output: path.join(output, 'weak') });
    if (!reference.qualified || !weak.correct_passed || weak.killed !== 0 || weak.runs.length !== 5 || weak.runs.some(r => r.verdict !== 'passed')) throw new Error('native oracle qualification failed; inspect retained logs');
    return { output, canonical: reference, weak };
}
if (require.main === module) {
    try {
        const args = process.argv.slice(2);
        let result;
        if (args.length === 2 && args[0] === '--qualify') result = qualify(path.resolve(args[1]));
        else if (args.length === 4 && args[0] === '--campaign' && args[2] === '--slot') result = checkCampaign(path.resolve(args[1]), args[3]);
        else throw new Error('Usage: node scripts/check-inventory-import.js --campaign PATH --slot 0001 | --qualify OUTPUT');
        console.log(JSON.stringify(result, null, 2));
        if (result.qualified === false) process.exitCode = 1;
    } catch (error) { console.error(error.stack); process.exitCode = 1; }
}
module.exports = { classifyNative, applyMutation, auditGenerated, verifyFrozenInputs, runVariants, checkCampaign, qualify, discoverTests, verifyCheckerIdentity };
