'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { saveRecord, listStaged } = require('./lib/behavioral-record');
const { test } = require('node:test');
const { validateSuite, parseArgs, planMatrix, summarize, runComparison, probeVersions, comparisonStatus } = require('./run-swift-benchmarks');

const ev = { id: 1, domain: 'concurrency', kind: 'execution', prompt: 'Fix the cancellation bug.', expected_output: 'An owned task that cancels.', files: ['sample'], expectations: ['The operation cancels.', 'The existing test passes.'], critical_expectations: [1] };
const candidate = { id: 'expert', repository: 'https://github.com/example/skills', revision: 'a'.repeat(40), license: 'MIT', skill_path: 'expert', domains: ['concurrency'] };
const suite = () => ({ schema_version: 1, name: 'swift-pilot', candidates: [candidate], evals: [ev] });
function scratch(fn) { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'swift-bench-test-')); try { return fn(root); } finally { fs.rmSync(root, { recursive: true, force: true }); } }
function fixture(root) { fs.mkdirSync(path.join(root, 'evals/fixtures/sample'), { recursive: true }); fs.writeFileSync(path.join(root, 'evals/fixtures/sample/README.md'), 'Fix the operation.\n'); fs.mkdirSync(path.join(root, 'scripts'), { recursive: true }); fs.writeFileSync(path.join(root, 'scripts/run-evals.js'), '// trusted harness placeholder\n'); }
function config(root, overrides = {}) { return { root, suite: suite(), selected: ['baseline'], sources: {}, model: 'fixed-model', runs: 2, dryRun: false, ...overrides }; }
function grade(expectations, failed = []) { const rows = expectations.map((text, i) => ({ id: i + 1, text, passed: !failed.includes(i + 1), evidence: 'Observed in the retained trace.' })); const passed = rows.filter(r => r.passed).length; return { expectations: rows, summary: { passed, failed: rows.length - passed, total: rows.length, pass_rate: passed / rows.length } }; }
function executor(failures = [], incomplete = false, observedModel = 'fixed-model') {
  return ({ harness, testCase }) => {
    const result = path.join(harness, 'evals/results'); fs.mkdirSync(result, { recursive: true });
    if (incomplete) { fs.writeFileSync(path.join(result, 'swift-benchmark.eval-1.execution.error.txt'), 'permission denied'); return { status: 1, stdout: '', stderr: '' }; }
    fs.writeFileSync(path.join(result, `swift-benchmark.eval-${testCase.id}.grading.json`), JSON.stringify(grade(testCase.expectations, failures)));
    const skill = fs.readFileSync(path.join(harness, 'skills/swift-benchmark/SKILL.md'), 'utf8');
    saveRecord(path.join(result, `swift-benchmark.eval-${testCase.id}`), {
      skill_name: 'swift-benchmark', skill_text: skill, eval: testCase,
      trace: JSON.stringify({ type: 'result', subtype: 'success', is_error: false }) + '\n',
      run: { requested_model: 'fixed-model', safe_mode: true, executor_model: observedModel },
      staged: [...listStaged(path.join(harness, 'skills/swift-benchmark')).map(entry => ({ ...entry, path: 'skills/swift-benchmark/' + entry.path })), ...(fs.existsSync(path.join(harness, 'references')) ? listStaged(path.join(harness, 'references')).map(entry => ({ ...entry, path: 'references/' + entry.path })) : [])].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0),
    });
    return { status: failures.length ? 1 : 0, stdout: 'finished', stderr: '' };
  };
}
function sourceRepo(root) {
  const source = path.join(root, 'candidate'); fs.mkdirSync(path.join(source, 'expert'), { recursive: true });
  fs.writeFileSync(path.join(source, 'expert/SKILL.md'), '---\nname: expert\ndescription: Reviews Swift.\n---\n# Expert\n');
  fs.writeFileSync(path.join(source, 'LICENSE'), 'MIT License\nPermission is hereby granted, free of charge.');
  const git = (...args) => execFileSync('git', args, { cwd: source, stdio: 'pipe' }).toString().trim();
  git('init', '-q'); git('config', 'user.name', 'Test'); git('config', 'user.email', 'test@example.invalid'); git('config', 'commit.gpgsign', 'false'); git('remote', 'add', 'origin', candidate.repository); git('add', '.'); git('commit', '-qm', 'source');
  const s = suite(); s.candidates[0].revision = git('rev-parse', 'HEAD');
  return { source, suite: s };
}

test('suite requires distinct cases and rejects unsafe paths, bad pins and paid sources', () => { validateSuite(suite()); for (const mutate of [s => s.evals.push({ ...ev }), s => s.evals[0].files = ['../secret'], s => s.candidates[0].skill_path = '/private', s => s.candidates[0].revision = 'main', s => s.candidates[0].license = 'Proprietary', s => s.evals[0].critical_expectations = [3]]) { const s = structuredClone(suite()); mutate(s); assert.throws(() => validateSuite(s)); } });
test('CLI rejects ambiguous or unpinned execution settings', () => { assert.throws(() => parseArgs(['--runs', '0'])); assert.throws(() => parseArgs(['--dry-run'])); assert.throws(() => parseArgs(['--model', 'x', '--unknown'])); assert.deepEqual(parseArgs(['--validate']).validate, true); assert.equal(parseArgs(['--model', 'fixed', '--source', 'expert=/tmp/source']).sources.expert, '/tmp/source'); });
test('matrix rotates arm order, pairs cases and filters candidates by declared domain', () => { const s = suite(); s.evals.push({ ...ev, id: 2, domain: 'accessibility' }); const matrix = planMatrix(s, ['expert'], 2); assert.deepEqual(matrix.map(r => [r.repeat, r.candidate, r.case_id]), [[1, 'baseline', 1], [1, 'expert', 1], [1, 'baseline', 2], [2, 'expert', 1], [2, 'baseline', 1], [2, 'baseline', 2]]); });
test('summary separates incomplete runs from scored failures and retains critical failures', () => { const report = summarize([{ candidate: 'baseline', domain: 'concurrency', status: 'scored', passed: false, critical_failures: [1] }, { candidate: 'baseline', domain: 'concurrency', status: 'incomplete', error: 'denied' }, { candidate: 'baseline', domain: 'concurrency', status: 'scored', passed: true, critical_failures: [] }]); assert.deepEqual(report[0], { candidate: 'baseline', domain: 'concurrency', engine: 'claude', observed_executor_model: null, comparable: false, planned: 3, completed: 2, incomplete: 1, passed: 1, failed: 1, critical_failure_runs: 1 }); });
test('dry run validates fixtures without invoking executor or writing output', () => scratch(root => { fixture(root); let invoked = false; const r = runComparison(config(root, { dryRun: true }), { execute() { invoked = true; throw new Error('must not run'); } }); assert.equal(invoked, false); assert.equal(r.dry_run, true); assert.equal(r.matrix.length, 2); assert.equal(fs.existsSync(path.join(root, 'evals/results')), false); }));
test('run preserves scored failures, raw artifacts and unique evidence directories', () => scratch(root => { fixture(root); const r = runComparison(config(root), { execute: executor([1]), versions: () => ({ claude: 'test-cli' }) }); assert.equal(r.summary[0].failed, 2); assert.equal(r.summary[0].critical_failure_runs, 2); assert.equal(r.summary[0].incomplete, 0); assert.ok(fs.existsSync(path.join(r.output, 'report.json'))); assert.ok(fs.existsSync(path.join(r.output, '0001', 'harness-results', 'swift-benchmark.eval-1.grading.json'))); const second = runComparison(config(root, { runs: 1 }), { execute: executor(), versions: () => ({}) }); assert.notEqual(second.output, r.output); }));
test('incomplete execution and invalid grading cannot become scored passes', () => scratch(root => { fixture(root); const r = runComparison(config(root, { runs: 1 }), { execute: executor([], true), versions: () => ({}) }); assert.equal(r.summary[0].incomplete, 1); assert.equal(r.summary[0].completed, 0); const invalid = runComparison(config(root, { runs: 1 }), { execute({ harness }) { const dir = path.join(harness, 'evals/results'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'swift-benchmark.eval-1.grading.json'), '{}'); return { status: 0 }; }, versions: () => ({}) }); assert.equal(invalid.summary[0].incomplete, 1); }));
test('missing source, dirty/pin-mismatched source and symlink resources fail closed', () => scratch(root => { fixture(root); assert.throws(() => runComparison(config(root, { selected: ['expert'], dryRun: true })), /source/); const source = path.join(root, 'candidate'); fs.mkdirSync(path.join(source, 'expert'), { recursive: true }); fs.writeFileSync(path.join(source, 'expert/SKILL.md'), '---\nname: expert\ndescription: Reviews Swift.\n---\n# Expert\n'); const git = (...args) => execFileSync('git', args, { cwd: source, stdio: 'pipe' }).toString().trim(); git('init', '-q'); git('config', 'user.name', 'Test'); git('config', 'user.email', 'test@example.invalid'); git('config', 'commit.gpgsign', 'false'); git('remote', 'add', 'origin', candidate.repository); fs.writeFileSync(path.join(source, 'LICENSE'), 'MIT License\nPermission is hereby granted, free of charge.'); git('add', '.'); git('commit', '-qm', 'source'); const s = suite(); s.candidates[0].revision = git('rev-parse', 'HEAD'); const opts = config(root, { suite: s, selected: ['expert'], sources: { expert: source }, dryRun: true }); assert.equal(runComparison(opts).matrix.length, 4); fs.writeFileSync(path.join(source, 'expert/extra.md'), 'untracked'); assert.throws(() => runComparison(opts), /clean|tracked/); fs.rmSync(path.join(source, 'expert/extra.md')); fs.symlinkSync('/etc/passwd', path.join(source, 'expert/external')); assert.throws(() => runComparison(opts), /clean|symbolic|tracked/); }));

test('valid grading without a complete recorded execution is unscored', () => scratch(root => {
  fixture(root);
  const report = runComparison(config(root, { runs: 1 }), { versions: () => ({}), execute({ harness, testCase }) {
    const dir = path.join(harness, 'evals/results'); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'swift-benchmark.eval-1.grading.json'), JSON.stringify(grade(testCase.expectations)));
    return { status: 0 };
  } });
  assert.equal(report.summary[0].incomplete, 1);
}));

test('the real comparison and behavioral CLIs preserve safe-mode records using a stub Claude binary', () => scratch(root => {
  fixture(root);
  fs.cpSync(__dirname, path.join(root, 'scripts'), { recursive: true });
  const bin = path.join(root, 'bin'); fs.mkdirSync(bin);
  const calls = path.join(root, 'calls.jsonl');
  fs.writeFileSync(path.join(bin, 'claude'), `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(calls)}, JSON.stringify(args)+'\\n');
if(args.includes('--help')) { console.log('--safe-mode'); }
else if(args.includes('--version')) { console.log('test-cli 1.0'); }
else {
 if(!args.includes('--safe-mode')) process.exit(9);
 if(args.includes('--output-format')) {
 console.log(JSON.stringify({type:'system',subtype:'init',model:'fixed-model'}));
 console.log(JSON.stringify({type:'result',subtype:'success',is_error:false}));
 } else console.log(${JSON.stringify(JSON.stringify(grade(ev.expectations)))});
}
`, { mode: 0o700 });
  for (const command of ['xcrun', 'xcodebuild', 'xcode-select']) fs.writeFileSync(path.join(bin, command), '#!/bin/sh\necho stub-native-toolchain\n', { mode: 0o700 });
  const oldPath = process.env.PATH;
  try {
    process.env.PATH = bin + path.delimiter + oldPath;
    const report = runComparison(config(root, { runs: 1 }));
    assert.equal(report.summary[0].passed, 1);
    assert.equal(report.results[0].observed_executor_model, 'fixed-model');
    assert.equal(report.versions.claude, 'test-cli 1.0');
    const invoked = fs.readFileSync(calls, 'utf8').trim().split('\n').map(JSON.parse);
    const prompts = invoked.filter(a => a.includes('-p'));
    assert.equal(prompts.length, 2);
    assert.ok(prompts.every(a => a.includes('--safe-mode')));
  } finally { process.env.PATH = oldPath; }
}));

test('a CLI without safe-mode support cannot start a comparison or create result evidence', () => scratch(root => {
  fixture(root);
  const bin = path.join(root, 'bin'); fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, 'claude'), '#!/bin/sh\necho old-cli\n', { mode: 0o700 });
  const oldPath = process.env.PATH;
  try { process.env.PATH = bin + path.delimiter + oldPath; assert.throws(() => runComparison(config(root)), /isolation|safe-mode/); assert.equal(fs.existsSync(path.join(root, 'evals/results')), false); }
  finally { process.env.PATH = oldPath; }
}));

test('version probes record optional native toolchain availability without requiring native tools', () => {
  const calls = [];
  const invoke = (command, args, options) => {
    calls.push({ command, args, timeout: options.timeout });
    if (command === 'claude') return args.includes('--help') ? '--safe-mode' : 'Claude test';
    if (command === 'xcrun') return 'Swift version test';
    if (command === 'xcodebuild') return 'Xcode test';
    return '/Applications/Xcode-test.app/Contents/Developer';
  };
  const available = probeVersions(invoke);
  assert.equal(available.swift, 'Swift version test');
  assert.equal(available.xcode, 'Xcode test');
  assert.equal(available.developer_directory, '/Applications/Xcode-test.app/Contents/Developer');
  assert.equal(available.architecture, process.arch);
  assert.ok(available.os_release);
  assert.ok(calls.every(call => call.timeout > 0 && call.timeout <= 10000));
  assert.deepEqual(calls.find(c => c.command === 'xcrun').args, ['swift', '--version']);
  const unavailable = probeVersions((command, args) => {
    if (command === 'claude') return args.includes('--help') ? '--safe-mode' : 'Claude test';
    throw new Error('native tool unavailable');
  });
  assert.equal(unavailable.swift, null);
  assert.equal(unavailable.xcode, null);
  assert.equal(unavailable.developer_directory, null);
  assert.equal(unavailable.claude, 'Claude test');
});

test('moving model aliases are rejected before execution', () => {
  for (const model of ['opus', 'sonnet', 'haiku', 'fable', 'claude-opus', 'claude-sonnet-latest', 'custom-latest']) {
    assert.throws(() => parseArgs(['--model', model, '--dry-run']), /model/);
  }
  assert.equal(parseArgs(['--model', 'claude-sonnet-4-6', '--dry-run']).model, 'claude-sonnet-4-6');
});

test('mixed or missing observed identities cannot be pooled into comparable model cohorts', () => {
  const rows = [
    { case_id: 1, candidate: 'baseline', domain: 'testing', status: 'scored', passed: true, critical_failures: [], observed_executor_model: 'model-1' },
    { case_id: 1, candidate: 'expert', domain: 'testing', status: 'scored', passed: true, critical_failures: [], observed_executor_model: 'model-2' },
    { case_id: 1, candidate: 'expert', domain: 'testing', status: 'scored', passed: true, critical_failures: [], observed_executor_model: null },
  ];
  const status = comparisonStatus(rows);
  assert.equal(status.comparable, false);
  assert.ok(status.cases[0].reasons.includes('mixed-observed-models'));
  assert.ok(status.cases[0].reasons.includes('unknown-observed-model'));
  const summary = summarize(rows);
  assert.equal(summary.length, 3);
  assert.ok(summary.every(cohort => cohort.comparable === false));
  rows[1].observed_executor_model = rows[2].observed_executor_model = 'model-1';
  assert.equal(comparisonStatus(rows).comparable, true);
});

test('campaign inputs stay frozen when live candidate and fixture sources change during the first row', () => scratch(root => {
  fixture(root);
  const s = sourceRepo(root);
  const originalSkill = fs.readFileSync(path.join(s.source, 'expert/SKILL.md'), 'utf8');
  let count = 0;
  const report = runComparison(config(root, { suite: s.suite, selected: ['expert'], sources: { expert: s.source } }), {
    versions: () => ({}),
    execute(args) {
      assert.equal(fs.readFileSync(path.join(args.harness, 'evals/fixtures/sample/README.md'), 'utf8'), 'Fix the operation.\n');
      const skill = fs.readFileSync(path.join(args.harness, 'skills/swift-benchmark/SKILL.md'), 'utf8');
      if (skill.includes('# Expert')) {
        assert.equal(skill, originalSkill);
        assert.match(fs.readFileSync(path.join(args.harness, 'skills/swift-benchmark/UPSTREAM-LICENSE'), 'utf8'), /MIT License/);
      }
      if (count++ === 0) {
        fs.writeFileSync(path.join(root, 'evals/fixtures/sample/README.md'), 'DIFFERENT FIXTURE');
        fs.writeFileSync(path.join(s.source, 'expert/SKILL.md'), 'DIFFERENT SKILL');
      }
      return executor()(args);
    },
  });
  assert.equal(count, 4);
  assert.equal(report.results.filter(r => r.status === 'scored').length, 4);
  assert.equal(report.comparability.comparable, true);
}));

test('frozen candidate helpers retain executable permission and recorded content/mode provenance', () => scratch(root => {
  fixture(root);
  const s = sourceRepo(root);
  const helper = path.join(s.source, 'expert/scripts/fixture-helper.sh');
  fs.mkdirSync(path.dirname(helper));
  fs.writeFileSync(helper, '#!/bin/sh\necho helper-ready\n', { mode: 0o700 });
  execFileSync('git', ['add', '.'], { cwd: s.source });
  execFileSync('git', ['commit', '-qm', 'executable helper'], { cwd: s.source });
  s.suite.candidates[0].revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: s.source, encoding: 'utf8' }).trim();
  let helpersExecuted = 0;
  const report = runComparison(config(root, { suite: s.suite, selected: ['expert'], sources: { expert: s.source }, runs: 1 }), {
    versions: () => ({}),
    execute(args) {
      const stagedHelper = path.join(args.harness, 'skills/swift-benchmark/scripts/fixture-helper.sh');
      if (fs.existsSync(stagedHelper)) {
        assert.equal(execFileSync(stagedHelper, [], { encoding: 'utf8' }).trim(), 'helper-ready');
        helpersExecuted++;
      }
      return executor()(args);
    },
  });
  assert.equal(helpersExecuted, 1);
  assert.ok(report.results.every(r => r.status === 'scored'));
  const frozen = path.join(report.output, 'inputs/candidates/expert/expert/scripts/fixture-helper.sh');
  assert.ok(fs.statSync(frozen).mode & 0o100);
  const resource = report.candidates[0].resources.find(r => r.path === 'expert/scripts/fixture-helper.sh');
  assert.equal(resource.executable_mode, 0o100);
  assert.equal(resource.sha256, createHash('sha256').update(fs.readFileSync(frozen)).digest('hex'));
}));

test('engine is explicit in dry-run and unsupported engines fail before work', () => scratch(root => {
 fixture(root);
 assert.equal(parseArgs(['--engine','codex','--model','gpt-fixed']).engine,'codex');
 assert.throws(()=>parseArgs(['--engine','other','--model','fixed']),/engine/i);
 const plan=runComparison(config(root,{engine:'codex',dryRun:true}));assert.equal(plan.engine,'codex');assert.match(plan.command,/--engine codex/);
}));

test('real Codex comparison uses native JSONL records and schema grader with no Claude dependency', () => scratch(root => {
 fixture(root);fs.cpSync(__dirname,path.join(root,'scripts'),{recursive:true});
 const bin=path.join(root,'bin');fs.mkdirSync(bin);const calls=path.join(root,'calls.jsonl');
 fs.writeFileSync(path.join(bin,'claude'),'#!/bin/sh\nexit 98\n',{mode:0o700});
 fs.writeFileSync(path.join(bin,'codex'),`#!/usr/bin/env node
const fs=require('node:fs');const a=process.argv.slice(2);fs.appendFileSync(${JSON.stringify(calls)},JSON.stringify(a)+'\\n');
if(a.includes('--help'))console.log('--json --ephemeral --ignore-user-config --ignore-rules --sandbox --output-schema --output-last-message --skip-git-repo-check');
else if(a.includes('--version'))console.log('codex-test 1.0');
else if(a[0]==='debug'&&a[1]==='models')console.log(JSON.stringify({models:[{slug:'gpt-fixed',visibility:'list'}]}));
else {
 if(!a.includes('--ignore-user-config')||!a.includes('never')||a.some(v=>v.includes('dangerously')))process.exit(97);
 console.log(JSON.stringify({type:'thread.started',thread_id:'test-thread',model:'gpt-fixed'}));console.log(JSON.stringify({type:'turn.started'}));
 if(a.includes('--output-schema')&&!a.includes('--skip-git-repo-check'))process.exit(96);
 if(a.includes('--output-schema')) { const prompt=fs.readFileSync(0,'utf8');if(!prompt.includes('HOST CAPTURE START')||!prompt.includes('Host captured real result'))process.exit(95); }
 if(a.includes('--output-schema'))fs.writeFileSync(a[a.indexOf('--output-last-message')+1],${JSON.stringify(JSON.stringify(grade(ev.expectations)))});
 else { const work=a[a.indexOf('--cd')+1];fs.writeFileSync(require('node:path').join(work,'sample','RESULT.md'),'Host captured real result');fs.writeFileSync(require('node:path').join(work,'sample','Added.swift'),'let changed = true');console.log(JSON.stringify({type:'item.completed',item:{id:'message-1',type:'agent_message',text:'Performed task'}})); }
 console.log(JSON.stringify({type:'turn.completed',usage:{input_tokens:12,output_tokens:3}}));
}
`,{mode:0o700});
 for(const command of ['xcrun','xcodebuild','xcode-select'])fs.writeFileSync(path.join(bin,command),'#!/bin/sh\necho stub-native-toolchain\n',{mode:0o700});
 const previous=process.env.PATH;
 try{
  process.env.PATH=bin+path.delimiter+previous;
  const report=runComparison(config(root,{engine:'codex',exploratory:true,model:'gpt-fixed',runs:1}));
  assert.equal(report.engine,'codex');assert.equal(report.summary[0].passed,1);assert.equal(report.results[0].engine,'codex');assert.equal(report.results[0].observed_executor_model,'gpt-fixed');assert.equal(report.results[0].observed_executor_usage.input_tokens,12);
  const invoked=fs.readFileSync(calls,'utf8').trim().split('\n').map(JSON.parse);const actual=invoked.filter(a=>a.includes('exec')&&!a.includes('--help'));assert.equal(actual.length,2);assert.ok(actual.some(a=>a.includes('workspace-write')));assert.ok(actual.some(a=>a.includes('read-only')));
  const recordFile=fs.readdirSync(path.join(report.output,'0001/harness-results')).find(f=>f.endsWith('.record.json'));const record=JSON.parse(fs.readFileSync(path.join(report.output,'0001/harness-results',recordFile),'utf8'));assert.equal(record.evidence.run.engine,'codex');assert.ok(record.evidence.workspace_evidence.files.some(f=>f.path==='sample/RESULT.md'&&f.text==='Host captured real result'));assert.ok(record.evidence.workspace_evidence.files.some(f=>f.path==='sample/Added.swift'));assert.match(record.evidence.trace,/thread.started/);assert.doesNotMatch(record.evidence.trace,/"subtype":"success"/);
 }finally{process.env.PATH=previous;}
}));

test('zero-exit truncated Codex record is unscored even beside a valid grade',()=>scratch(root=>{
 fixture(root);
 const report=runComparison(config(root,{engine:'codex',exploratory:true,model:'gpt-fixed',runs:1}),{versions:()=>({codex:'test-cli'}),modelPreflight:()=>({source:'stub catalogue'}),execute({harness,testCase}){
  const result=path.join(harness,'evals/results');fs.mkdirSync(result,{recursive:true});
  fs.writeFileSync(path.join(result,'swift-benchmark.eval-1.grading.json'),JSON.stringify(grade(testCase.expectations)));
  const skill=fs.readFileSync(path.join(harness,'skills/swift-benchmark/SKILL.md'),'utf8');
  saveRecord(path.join(result,'swift-benchmark.eval-1'),{skill_name:'swift-benchmark',skill_text:skill,eval:testCase,trace:JSON.stringify({type:'thread.started',thread_id:'truncated'})+'\n',run:{engine:'codex',safe_mode:true,requested_model:'gpt-fixed'},staged:[{path:'skills/swift-benchmark/SKILL.md',sha256:createHash('sha256').update(skill).digest('hex')}]});
  return {status:0};
 }});
 assert.equal(report.summary[0].incomplete,1);assert.equal(report.summary[0].completed,0);assert.equal(report.results[0].status,'incomplete');
}));

test('engine identity separates otherwise identical model cohorts',()=>{
 const base={candidate:'baseline',domain:'testing',case_id:1,status:'scored',passed:true,critical_failures:[],observed_executor_model:'same-label'};
 const rows=[{...base,engine:'claude'},{...base,engine:'codex'}];
 assert.equal(summarize(rows).length,2);assert.equal(comparisonStatus(rows).comparable,false);assert.ok(comparisonStatus(rows).cases[0].reasons.includes('mixed-engines'));
});

test('Codex live matrices require explicit exploratory acknowledgement before any work', () => scratch(root => {
 fixture(root); let probed=false;
 assert.throws(()=>runComparison(config(root,{engine:'codex'}),{versions(){probed=true;return{};}}),/exploratory/);
 assert.equal(probed,false); assert.equal(fs.existsSync(path.join(root,'evals/results')),false);
 assert.equal(parseArgs(['--engine','codex','--model','gpt-fixed','--exploratory']).exploratory,true);
}));
test('Codex availability preflight fails before matrix/output and is skipped by dry-run', () => scratch(root => {
 fixture(root); let executed=false; let probes=0;
 const opts=config(root,{engine:'codex',exploratory:true,runs:1});
 const hooks={versions:()=>({codex:'test'}),modelPreflight(){probes++;throw new Error('not listed');},execute(){executed=true;}};
 assert.throws(()=>runComparison(opts,hooks),/not listed/);assert.equal(executed,false);assert.equal(probes,1);assert.equal(fs.existsSync(path.join(root,'evals/results')),false);
 runComparison({...opts,dryRun:true},hooks); assert.equal(probes,1);
}));
test('runtime profile is explicit known metadata and cannot differ between cases', () => {
 const s=suite();s.runtime_profile='swiftpm-isolated-v1';s.evals[0].runtime_profile='swiftpm-isolated-v1';validateSuite(s);
 s.runtime_profile='anything';assert.throws(()=>validateSuite(s),/profile/);
 s.runtime_profile='swiftpm-isolated-v1';delete s.evals[0].runtime_profile;assert.throws(()=>validateSuite(s),/profile/);
});
test('exploratory purpose and catalogue metadata never resolve unknown executor identity', () => scratch(root => {
 fixture(root);
 const s=suite();s.runtime_profile='swiftpm-isolated-v1';s.evals[0].runtime_profile=s.runtime_profile;
 const catalogue={source:'stub CLI catalogue',collected_at:'2026-11-23T00:00:00Z',available_models:['fixed-model']};
 const report=runComparison(config(root,{suite:s,engine:'codex',exploratory:true,runs:1}),{
  versions:()=>({codex:'stub'}),modelPreflight:()=>catalogue,
  execute(context){
   const result=executor()(context);
   const dir=path.join(context.harness,'evals/results');const file=path.join(dir,fs.readdirSync(dir).find(f=>f.endsWith('.record.json')));const record=JSON.parse(fs.readFileSync(file,'utf8'));
   record.evidence.trace=[{type:'thread.started',thread_id:'native'},{type:'turn.started'},{type:'turn.completed'}].map(JSON.stringify).join('\n')+'\n';
   record.evidence.run.engine='codex';record.evidence.run.executor_model=null;
   record.sha256=createHash('sha256').update(JSON.stringify(record.evidence)).digest('hex');fs.writeFileSync(file,JSON.stringify(record));return result;
  }
 });
 assert.equal(report.exploratory,true);assert.equal(report.runtime_profile,'swiftpm-isolated-v1');assert.deepEqual(report.model_preflight,catalogue);
 assert.equal(report.results[0].status,'scored');assert.equal(report.results[0].observed_executor_model,null);assert.equal(report.comparability.comparable,false);assert.ok(report.comparability.cases[0].reasons.includes('unknown-observed-model'));
}));
