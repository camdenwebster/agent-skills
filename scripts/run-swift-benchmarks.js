#!/usr/bin/env node
'use strict';

// Controlled content-efficacy comparison, reusing the existing behavioral runner.
// This does not measure automatic skill routing or establish a sandbox boundary.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const { executionFailure } = require('./lib/execution-status');
const { codexExecutionFailure, codexUsage } = require('./lib/codex-eval');
const { execFileSync, spawnSync } = require('node:child_process');
const { parseGrading } = require('./run-evals');
const { validateEval } = require('./lib/behavioral-record');
const { codexModelPreflight } = require('./lib/codex-model-preflight');
const ROOT = path.resolve(__dirname, '..');
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const nonempty = x => typeof x === 'string' && x.trim().length > 0;
const movingModel = x => /^(?:auto|default|latest|(?:claude-)?(?:opus|sonnet|haiku|fable))$/i.test(x) || /(?:^|[-_:])latest(?:$|[-_:])/i.test(x);
const observedModel = x => nonempty(x) && !movingModel(x) ? x : null;
function relative(x) { return nonempty(x) && !path.isAbsolute(x) && !x.includes('\\') && x.split('/').every(p => p && p !== '.' && p !== '..'); }
function validateSuite(s) {
  if (!s || s.schema_version !== 1 || !nonempty(s.name) || !Array.isArray(s.candidates) || !Array.isArray(s.evals) || !s.evals.length) throw new Error('Invalid Swift benchmark suite');
  if (s.runtime_profile !== undefined && s.runtime_profile !== 'swiftpm-isolated-v1') throw new Error('Unsupported runtime profile');
  const ids = new Set(['baseline']);
  for (const c of s.candidates) {
    if (!c || !ID.test(c.id) || ids.has(c.id) || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(c.repository) || !/^[a-f0-9]{40}$/.test(c.revision) || c.license !== 'MIT' || !relative(c.skill_path) || !Array.isArray(c.domains) || !c.domains.length || c.domains.some(d => !ID.test(d))) throw new Error('Invalid candidate or unsupported license/pin/path');
    ids.add(c.id);
  }
  const cases = new Set();
  for (const ev of s.evals) {
    validateEval(ev);
    if (ev.runtime_profile !== s.runtime_profile) throw new Error('Case runtime profile must match the suite profile');
    if (!Number.isSafeInteger(ev.id) || ev.id < 1 || cases.has(ev.id) || ev.kind !== 'execution' || !ID.test(ev.domain) || !nonempty(ev.prompt) || !nonempty(ev.expected_output) || !ev.files?.length || ev.files.some(f => !relative(f)) || !Array.isArray(ev.critical_expectations) || ev.critical_expectations.some(i => !Number.isInteger(i) || i < 1 || i > ev.expectations.length) || new Set(ev.critical_expectations).size !== ev.critical_expectations.length) throw new Error('Invalid case, fixture path or critical expectation');
    cases.add(ev.id);
  }
  return s;
}
function parseArgs(args) {
  const o = { suiteFile: path.join(ROOT, 'evals/swift-benchmarks/suite.json'), selected: [], sources: {}, runs: 3, dryRun: false, validate: false, all: false, exploratory: false, engine: 'claude' };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (['--dry-run', '--validate', '--all', '--exploratory'].includes(a)) { const key = { '--dry-run': 'dryRun', '--validate': 'validate', '--all': 'all', '--exploratory': 'exploratory' }[a]; o[key] = true; continue; }
    if (!['--suite', '--candidate', '--source', '--model', '--runs', '--case', '--engine'].includes(a)) throw new Error(`Unknown option: ${a}`);
    const v = args[++i]; if (!v || v.startsWith('--')) throw new Error(`${a} requires a value`);
    if (a === '--suite') o.suiteFile = path.resolve(v);
    if (a === '--candidate') { if (!ID.test(v) || o.selected.includes(v)) throw new Error('Invalid/duplicate candidate'); o.selected.push(v); }
    if (a === '--engine') { if (!['claude', 'codex'].includes(v)) throw new Error('--engine must be claude or codex'); o.engine = v; }
    if (a === '--model') { if (o.model) throw new Error('Duplicate model'); o.model = v; }
    if (a === '--source') { const at = v.indexOf('='); const id = v.slice(0, at), root = v.slice(at + 1); if (at < 1 || !ID.test(id) || id === 'baseline' || !path.isAbsolute(root) || o.sources[id]) throw new Error('--source must be unique id=/absolute/checkout'); o.sources[id] = root; }
    if (a === '--runs' || a === '--case') { if (!/^\d+$/.test(v) || !Number.isSafeInteger(Number(v)) || Number(v) < 1) throw new Error(`${a} must be a positive integer`); o[a === '--runs' ? 'runs' : 'caseId'] = Number(v); }
  }
  if (!o.validate && (!o.model || movingModel(o.model))) throw new Error('--model requires a concrete version; moving aliases are not supported');
  if (o.all && o.selected.length) throw new Error('--all and --candidate cannot be combined');
  return o;
}
function planMatrix(s, selected, runs, caseId) {
  validateSuite(s);
  const wanted = ['baseline', ...selected.filter(id => id !== 'baseline')];
  if (new Set(wanted).size !== wanted.length) throw new Error('Duplicate candidate selection');
  for (const id of wanted) if (id !== 'baseline' && !s.candidates.some(c => c.id === id)) throw new Error(`Unknown candidate: ${id}`);
  const cases = s.evals.filter(e => caseId === undefined || e.id === caseId);
  if (!cases.length) throw new Error(`Unknown case: ${caseId}`);
  for (const id of wanted.filter(x => x !== 'baseline')) if (!cases.some(e => s.candidates.find(c => c.id === id).domains.includes(e.domain))) throw new Error(`Candidate ${id} has no selected cases in its declared domains`);
  const rows = [];
  for (let repeat = 1; repeat <= runs; repeat++) for (const ev of cases) {
    const eligible = wanted.filter(id => id === 'baseline' || s.candidates.find(c => c.id === id).domains.includes(ev.domain));
    const rotate = (repeat - 1) % eligible.length;
    const ordered = [...eligible.slice(rotate), ...eligible.slice(0, rotate)];
    for (const candidate of ordered) rows.push({ repeat, candidate, case_id: ev.id, domain: ev.domain });
  }
  return rows;
}
function comparisonStatus(rows) {
  const cases = [];
  for (const caseId of new Set(rows.map(r => r.case_id))) {
    const group = rows.filter(r => r.case_id === caseId);
    const models = [...new Set(group.filter(r => r.status === 'scored').map(r => observedModel(r.observed_executor_model)).filter(Boolean))];
    const reasons = [];
    if (group.some(r => !observedModel(r.observed_executor_model))) reasons.push('unknown-observed-model');
    if (models.length > 1) reasons.push('mixed-observed-models');
    if (new Set(group.map(r => r.engine || 'claude')).size > 1) reasons.push('mixed-engines');
    if (group.some(r => r.status !== 'scored')) reasons.push('incomplete-runs');
    if (new Set(group.map(r => r.candidate)).size < 2) reasons.push('baseline-only-or-unmatched-case');
    cases.push({ case_id: caseId ?? null, observed_executor_models: models, comparable: reasons.length === 0, reasons });
  }
  return { comparable: cases.length > 0 && cases.every(c => c.comparable), cases, interpretation: 'Compare only matched cases with a single known observed executor identity. Model cohorts remain separate; unknown identities are excluded from comparative inference. Grader identity is not reported by the CLI and remains an explicit limitation.' };
}
function summarize(rows) {
  const groups = new Map();
  const comparisons = comparisonStatus(rows);
  for (const r of rows) {
    const model = observedModel(r.observed_executor_model);
    const key = JSON.stringify([r.engine || 'claude', r.candidate, r.domain, model]);
    if (!groups.has(key)) groups.set(key, { candidate: r.candidate, domain: r.domain, engine: r.engine || 'claude', observed_executor_model: model, comparable: model !== null, planned: 0, completed: 0, incomplete: 0, passed: 0, failed: 0, critical_failure_runs: 0 });
    const g = groups.get(key); g.planned++;
    g.comparable &&= comparisons.cases.find(c => c.case_id === (r.case_id ?? null)).comparable;
    if (r.status !== 'scored') { g.incomplete++; continue; }
    g.completed++; g[r.passed ? 'passed' : 'failed']++;
    if (r.critical_failures.length) g.critical_failure_runs++;
  }
  return [...groups.values()];
}
function filesUnder(root) {
  const files = [];
  function walk(file) {
    const st = fs.lstatSync(file);
    if (st.isSymbolicLink()) throw new Error(`symbolic link in resources: ${file}`);
    if (st.isDirectory()) for (const name of fs.readdirSync(file).sort()) walk(path.join(file, name));
    else if (st.isFile()) files.push(file);
    else throw new Error(`Nonregular resource: ${file}`);
  }
  walk(root); return files;
}
function safePath(root, rel) {
  if (!relative(rel)) throw new Error(`Unsafe resource path: ${rel}`);
  let current = root;
  if (fs.lstatSync(root).isSymbolicLink()) throw new Error(`symbolic resource root: ${root}`);
  for (const p of rel.split('/')) { current = path.join(current, p); if (fs.lstatSync(current).isSymbolicLink()) throw new Error(`symbolic resource path: ${current}`); }
  return current;
}
function digestFiles(root, files, includeMode = false) {
  return files.map(file => ({
    path: path.relative(root, file).split(path.sep).join('/'),
    sha256: hash(fs.readFileSync(file)),
    ...(includeMode ? { executable_mode: fs.statSync(file).mode & 0o111 } : {}),
  })).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}
function git(root, args) { return execFileSync('git', ['-c', 'core.fsmonitor=false', '-c', 'core.hooksPath=/dev/null', '-C', root, ...args], { encoding: 'utf8', timeout: 10000, maxBuffer: 16 * 1024 * 1024 }).trim(); }
function inspectCandidate(c, source) {
  if (!source) throw new Error(`Missing --source ${c.id}=/absolute/checkout`);
  if (!path.isAbsolute(source)) throw new Error('Candidate source must be absolute');
  if (fs.lstatSync(source).isSymbolicLink()) throw new Error('symbolic candidate root');
  const root = fs.realpathSync(source);
  if (git(root, ['rev-parse', 'HEAD']) !== c.revision) throw new Error(`Candidate ${c.id} revision mismatch`);
  if (git(root, ['status', '--porcelain', '--untracked-files=all'])) throw new Error(`Candidate ${c.id} must have a clean checkout`);
  const normalize = u => u.replace(/^git@github.com:/, 'https://github.com/').replace(/\.git$/, '').replace(/\/$/, '').toLowerCase();
  const remotes = git(root, ['config', '--get-regexp', '^remote\\..*\\.url$']).split('\n').map(line => line.trim().split(/\s+/).at(-1));
  if (!remotes.some(url => normalize(url) === normalize(c.repository))) throw new Error(`Candidate ${c.id} repository provenance mismatch`);
  const licenseName = ['LICENSE', 'LICENSE.md', 'LICENSE.txt'].find(f => fs.existsSync(path.join(root, f)));
  if (!licenseName) throw new Error(`Candidate ${c.id} needs a tracked MIT license file`);
  const license = safePath(root, licenseName);
  const licenseText = fs.readFileSync(license, 'utf8');
  if (!/MIT License/i.test(licenseText) || !/Permission is hereby granted/i.test(licenseText)) throw new Error('Candidate license does not match declared MIT license');
  const skill = safePath(root, c.skill_path);
  if (!fs.statSync(skill).isDirectory() || !fs.statSync(safePath(skill, 'SKILL.md')).isFile()) throw new Error('Candidate needs SKILL.md');
  const roots = [skill]; if (fs.existsSync(path.join(root, 'references'))) roots.push(safePath(root, 'references'));
  const files = [...roots.flatMap(filesUnder), license];
  for (const f of files) {
    const rel = path.relative(root, f).split(path.sep).join('/');
    // Reject ignored/untracked files and ignored tracked-file edits as well.
    const expected = execFileSync('git', ['-c', 'core.fsmonitor=false', '-c', 'core.hooksPath=/dev/null', '-C', root, 'show', `${c.revision}:${rel}`], { maxBuffer: 16 * 1024 * 1024 });
    if (hash(expected) !== hash(fs.readFileSync(f))) throw new Error(`Candidate resource is not pinned/tracked: ${rel}`);
  }
  const resources = digestFiles(root, files, true);
  return { ...c, source: root, skill, license_path: licenseName, resources, resource_sha256: hash(JSON.stringify(resources)) };
}
function copy(source, dest) { filesUnder(source); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.cpSync(source, dest, { recursive: true }); }
function freezeFiles(sourceRoot, files, destinationRoot) {
  for (const entry of files) {
    const source = safePath(sourceRoot, entry.path);
    const bytes = fs.readFileSync(source);
    if ((fs.statSync(source).mode & 0o111) !== entry.executable_mode) throw new Error(`Input executable mode changed before freezing: ${entry.path}`);
    if (hash(bytes) !== entry.sha256) throw new Error(`Input changed before freezing: ${entry.path}`);
    const destination = path.join(destinationRoot, entry.path);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, bytes, { flag: 'wx', mode: 0o600 | entry.executable_mode });
  }
}
function writeJson(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', { flag: 'wx', mode: 0o600 }); }
function probeVersions(invoke = execFileSync, engine = 'claude') {
  const probe = (command, args) => invoke(command, args, { encoding: 'utf8', timeout: 10000 }).trim();
  if (!['claude', 'codex'].includes(engine)) throw new Error('Unsupported evaluation engine');
  const help = probe(engine, engine === 'codex' ? ['exec', '--help'] : ['--help']);
  const required = engine === 'codex' ? ['--json', '--ephemeral', '--ignore-user-config', '--ignore-rules', '--sandbox', '--output-schema', '--output-last-message', '--skip-git-repo-check'] : ['--safe-mode'];
  if (required.some(flag => !help.includes(flag))) throw new Error(`Installed ${engine} lacks required isolation/output flags; refusing a contaminated comparison`);
  const optional = (command, args) => { try { return probe(command, args) || null; } catch { return null; } };
  return {
    [engine]: probe(engine, ['--version']),
    swift: optional('xcrun', ['swift', '--version']),
    xcode: optional('xcodebuild', ['-version']),
    developer_directory: optional('xcode-select', ['-p']),
    architecture: process.arch,
    os_release: os.release(),
  };
}
function executeHarness({ harness, testCase, model, engine = 'claude' }) {
  return spawnSync(process.execPath, [path.join(harness, 'scripts/run-evals.js'), '--behavioral', 'swift-benchmark', '--model', model, '--eval', String(testCase.id), '--record', '--safe-mode', '--engine', engine], { cwd: harness, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, timeout: 25 * 60 * 1000 });
}
function runComparison(options, hooks = {}) {
  const { root = ROOT, suite, selected = ['baseline'], sources = {}, model, runs = 3, caseId, dryRun = false, engine = 'claude', exploratory = false } = options;
  if (!['claude', 'codex'].includes(engine)) throw new Error('Unsupported evaluation engine');
  validateSuite(suite);
  if (engine === 'codex' && !dryRun && !exploratory) throw new Error('Codex exec may omit resolved model identity; pass --exploratory to acknowledge that such results remain non-comparable');
  if (!nonempty(model) || movingModel(model) || !Number.isSafeInteger(runs) || runs < 1) throw new Error('Pinned model and positive runs required');
  const matrix = planMatrix(suite, selected, runs, caseId);
  const used = [...new Set(matrix.map(r => r.candidate))];
  const candidates = used.filter(id => id !== 'baseline').map(id => inspectCandidate(suite.candidates.find(c => c.id === id), sources[id]));
  const fixtures = new Map();
  for (const e of suite.evals.filter(e => matrix.some(r => r.case_id === e.id))) for (const rel of e.files) { const source = safePath(path.join(root, 'evals/fixtures'), rel); fixtures.set(rel, source); filesUnder(source); }
  const fixtureFiles = digestFiles(path.join(root, 'evals/fixtures'), [...new Set([...fixtures.values()].flatMap(filesUnder))], true);
  const harnessFiles = digestFiles(path.join(root, 'scripts'), filesUnder(path.join(root, 'scripts')), true);
  const manifest = { schema_version: 1, engine, exploratory, runtime_profile: suite.runtime_profile || null, harness_sha256: hash(JSON.stringify(harnessFiles)), suite: suite.name, suite_sha256: hash(JSON.stringify(suite)), model, node: process.version, platform: process.platform, safe_mode: true, comparison: 'instructed-content-efficacy-not-routing', isolation_limits: engine === 'codex' ? 'Explicit config disables automatic instruction/catalog/bundled skill, memory, hooks, apps and plugin defaults; user config ignored. Managed policy or other discovery may remain. Workspace-write sandbox; not a total host isolation boundary.' : 'Safe mode disables user customizations; administrator-managed policy and host capabilities may remain. Not a sandbox.', repetitions: runs, candidates: candidates.map(({ source, skill, ...rest }) => rest), fixture_files: fixtureFiles, matrix };
  if (dryRun) return { ...manifest, dry_run: true, command: `node <isolated>/scripts/run-evals.js --behavioral swift-benchmark --model <pinned> --eval <case> --record --safe-mode --engine ${engine}` };
  const versions = hooks.versions ? hooks.versions() : probeVersions(undefined, engine);
  const modelPreflight = engine === 'codex' ? (hooks.modelPreflight || codexModelPreflight)(model) : null;
  const outputBase = path.join(root, 'evals/results/swift-benchmarks'); fs.mkdirSync(outputBase, { recursive: true });
  const output = fs.mkdtempSync(path.join(outputBase, `${new Date().toISOString().replace(/[:.]/g, '-')}-`));
  const runMeta = { ...manifest, timestamp: new Date().toISOString(), versions, model_preflight: modelPreflight, output };
  const inputs = path.join(output, 'inputs');
  freezeFiles(path.join(root, 'scripts'), harnessFiles, path.join(inputs, 'scripts'));
  freezeFiles(path.join(root, 'evals/fixtures'), fixtureFiles, path.join(inputs, 'fixtures'));
  const frozenCandidates = new Map();
  for (const candidate of candidates) {
    const frozen = path.join(inputs, 'candidates', candidate.id);
    freezeFiles(candidate.source, candidate.resources, frozen);
    frozenCandidates.set(candidate.id, frozen);
  }
  writeJson(path.join(output, 'manifest.json'), { ...runMeta, inputs: 'Hash-verified frozen snapshots; original live sources are not read during rows.' });
  const rows = [];
  for (const [i, row] of matrix.entries()) {
    const slot = path.join(output, String(i + 1).padStart(4, '0')); fs.mkdirSync(slot);
    const harness = fs.mkdtempSync(path.join(os.tmpdir(), 'swift-benchmark-harness-'));
    const testCase = suite.evals.find(e => e.id === row.case_id);
    const started = Date.now(); let result; let grading; let error; let executorModel = null; let observedUsage = null; let observedCost = null;
    try {
      copy(path.join(inputs, 'scripts'), path.join(harness, 'scripts'));
      for (const rel of testCase.files) copy(path.join(inputs, 'fixtures', rel), path.join(harness, 'evals/fixtures', rel));
      const skillDir = path.join(harness, 'skills/swift-benchmark');
      if (row.candidate === 'baseline') { fs.mkdirSync(skillDir, { recursive: true }); fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '---\nname: swift-benchmark\ndescription: No additional domain skill guidance.\n---\n'); }
      else {
        const c = candidates.find(c => c.id === row.candidate);
        const frozen = frozenCandidates.get(c.id);
        copy(path.join(frozen, c.skill_path), skillDir);
        if (fs.existsSync(path.join(frozen, 'references'))) copy(path.join(frozen, 'references'), path.join(harness, 'references'));
        let notice = 'UPSTREAM-LICENSE'; let suffix = 1;
        while (fs.existsSync(path.join(skillDir, notice))) notice = `UPSTREAM-LICENSE-${++suffix}`;
        fs.writeFileSync(path.join(skillDir, notice), fs.readFileSync(path.join(frozen, c.license_path)), { flag: 'wx', mode: 0o600 });
      }
      fs.mkdirSync(path.join(harness, 'evals/cases'), { recursive: true });
      writeJson(path.join(harness, 'evals/cases/swift-benchmark.json'), { skill_name: 'swift-benchmark', evals: [testCase] });
      result = (hooks.execute || executeHarness)({ harness, testCase, model, engine });
      if (result?.error) error = String(result.error);
      if (result?.signal) error = `Harness interrupted: ${result.signal}`;
      const results = path.join(harness, 'evals/results');
      if (fs.existsSync(results)) copy(results, path.join(slot, 'harness-results'));
      const gradeFile = path.join(results, `swift-benchmark.eval-${testCase.id}.grading.json`);
      if (!error && ![0, 1].includes(result?.status)) error = 'Unexpected harness exit status';
      if (!error && fs.existsSync(gradeFile)) {
        const records = fs.readdirSync(results).filter(f => f.startsWith(`swift-benchmark.eval-${testCase.id}.`) && f.endsWith('.record.json'));
        if (records.length !== 1) throw new Error('Missing or ambiguous recorded execution');
        const record = JSON.parse(fs.readFileSync(path.join(results, records[0]), 'utf8'));
        const evidence = record.evidence;
        const resourceFiles = [...filesUnder(skillDir), ...(fs.existsSync(path.join(harness, 'references')) ? filesUnder(path.join(harness, 'references')) : [])];
        const expectedResources = digestFiles(harness, resourceFiles);
        if (record.version !== 1 || !evidence || record.sha256 !== hash(JSON.stringify(evidence)) || !isDeepStrictEqual(evidence.eval, testCase) || evidence.skill_name !== 'swift-benchmark' || evidence.skill_text !== fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8') || !isDeepStrictEqual(evidence.staged, expectedResources) || (evidence.run?.engine || 'claude') !== engine || evidence.run?.requested_model !== model || evidence.run?.safe_mode !== true || typeof evidence.trace !== 'string' || (engine === 'codex' ? codexExecutionFailure(evidence.trace) : executionFailure(evidence.trace))) throw new Error('Invalid, incomplete or mismatched recorded execution');
        executorModel = evidence.run.executor_model || null;
        const terminal = evidence.trace.trim().split('\n').map(line => JSON.parse(line)).filter(event => event.type === (engine === 'codex' ? 'turn.completed' : 'result')).at(-1);
        observedUsage = terminal?.usage && typeof terminal.usage === 'object' ? terminal.usage : null;
        observedCost = engine === 'claude' && typeof terminal?.total_cost_usd === 'number' ? terminal.total_cost_usd : null;
        grading = parseGrading(fs.readFileSync(gradeFile, 'utf8'), testCase.expectations);
      }
      if (!grading) error ||= 'No valid complete grading; inspect retained harness output';
    } catch (e) { error = e.message; }
    finally { fs.rmSync(harness, { recursive: true, force: true }); }
    fs.writeFileSync(path.join(slot, 'stdout.txt'), String(result?.stdout || ''));
    fs.writeFileSync(path.join(slot, 'stderr.txt'), String(result?.stderr || ''));
    const outcome = { ...row, engine, duration_ms: Date.now() - started, observed_executor_model: executorModel, observed_executor_usage: observedUsage, observed_executor_cost_usd: observedCost, observed_grader_model: 'unknown', exit_status: result?.status ?? null, status: grading ? 'scored' : 'incomplete', ...(grading ? { passed: grading.summary.failed === 0, critical_failures: testCase.critical_expectations.filter(id => !grading.expectations.find(e => e.id === id).passed), grading } : { error }) };
    rows.push(outcome); writeJson(path.join(slot, 'outcome.json'), outcome);
  }
  const report = { ...runMeta, results: rows, comparability: comparisonStatus(rows), summary: summarize(rows), interpretation: 'No overall winner. Compare domain/case outcomes and critical failures on matched repeated tasks. Incomplete executions are unscored, not zero-quality results. LLM grading is not independent compiler/runtime verification.' };
  writeJson(path.join(output, 'report.json'), report); return report;
}
function main(args = process.argv.slice(2)) {
  const o = parseArgs(args); const suite = validateSuite(JSON.parse(fs.readFileSync(o.suiteFile, 'utf8')));
  if (o.validate) { for (const ev of suite.evals) for (const rel of ev.files) filesUnder(safePath(path.join(ROOT, 'evals/fixtures'), rel)); console.log(`Validated ${suite.name}: ${suite.evals.length} cases, ${suite.candidates.length} candidates`); return; }
  const selected = o.all ? suite.candidates.map(c => c.id) : o.selected;
  const report = runComparison({ ...o, suite, selected }); console.log(JSON.stringify(report, null, 2));
  if (!o.dryRun && report.results.some(r => r.status !== 'scored' || !r.passed)) process.exitCode = 1;
}
if (require.main === module) { try { main(); } catch (e) { console.error(e.message); process.exitCode = 1; } }
module.exports = { validateSuite, parseArgs, planMatrix, summarize, runComparison, probeVersions, comparisonStatus };
