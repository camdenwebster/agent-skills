'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { checkRun } = require('./validate-swift-testing-extension');
const completed = 'Executed 0 tests, with 0 failures\nTest run with 2 tests in 0 suites passed after 0.01 seconds.\n';
test('native verifier requires Swift Testing completion and distinguishes functions from parameter rows', () => {
 assert.doesNotThrow(()=>checkRun({status:0,output:completed},true,false));
 for(const output of ['', 'Executed 0 tests, with 0 failures', 'Test run with 0 tests in 0 suites passed after 0.01 seconds.', 'Test run with 1 test in 0 suites passed after 0.01 seconds.'])assert.throws(()=>checkRun({status:0,output},true,false),/completion|count/);
 assert.throws(()=>checkRun({status:1,output:completed},true,false),/status/);
 for (const status of [null,9])assert.throws(()=>checkRun({status,output:completed.replace('passed','failed')},false,false),/status/);
 assert.throws(()=>checkRun({status:0,output:completed},true,true),/parameter/);
 assert.doesNotThrow(()=>checkRun({status:0,output:completed+'PARAMETER_TITLE:Desk\nPARAMETER_TITLE:Lamp\nPARAMETER_TITLE:Chair\n'},true,true));
 assert.doesNotThrow(()=>checkRun({status:1,output:completed.replace('passed','failed')},false,false));
 assert.doesNotThrow(()=>checkRun({status:1,output:completed.replace('2 tests','1 test').replace('passed','failed')},false,false,1));
});
test('isolated wrapper scopes caches/build output to each fixture and retains outer sandbox boundary', () => {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'swift-profile-test-'));
 try {
  const bin=path.join(root,'bin');fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin,'swift'),'#!/usr/bin/env node\nconsole.log(JSON.stringify({args:process.argv.slice(2),clang:process.env.CLANG_MODULE_CACHE_PATH,module:process.env.SWIFTPM_MODULECACHE_OVERRIDE,home:process.env.HOME}));\n',{mode:0o700});
  const source=path.join(__dirname,'../evals/fixtures/swift-benchmarks/testing-extension/import-events/run-tests.sh');
  const seen=[];
  for(const name of ['one with spaces','two']) {
   const dir=path.join(root,name);fs.mkdirSync(dir);fs.copyFileSync(source,path.join(dir,'run-tests.sh'));
   const result=JSON.parse(execFileSync('/bin/sh',[path.join(dir,'run-tests.sh')],{encoding:'utf8',env:{...process.env,PATH:bin+path.delimiter+process.env.PATH}}));
   assert.equal(result.home,process.env.HOME);assert.ok(result.args.includes('--disable-sandbox'));
   for(const key of ['--scratch-path','--cache-path'])assert.ok(result.args[result.args.indexOf(key)+1].startsWith(dir+path.sep));
   assert.ok(result.clang.startsWith(dir+path.sep));assert.ok(result.module.startsWith(dir+path.sep));seen.push(result.clang);
  }
  assert.notEqual(seen[0],seen[1]);
 } finally { fs.rmSync(root,{recursive:true,force:true}); }
});
