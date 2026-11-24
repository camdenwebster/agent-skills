#!/usr/bin/env node
'use strict';
// Author-side native qualification, never run automatically by the model harness or Ubuntu CI.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
function checkRun({ status, output }, expectedPass, parameters, expectedFunctions = 2) {
 const completions = [...output.matchAll(/Test run with (\d+) tests?(?: in \d+ suites?)? (passed|failed)\b/g)];
 if (completions.length !== 1) throw new Error('Missing or ambiguous Swift Testing completion');
 if (Number(completions[0][1]) !== expectedFunctions) throw new Error('Unexpected executed test-function count');
 if (status !== (expectedPass ? 0 : 1) || completions[0][2] !== (expectedPass ? 'passed' : 'failed')) throw new Error('Native status/completion differs from expected defect/control result');
 const cases = [...output.matchAll(/^PARAMETER_TITLE:(Desk|Lamp|Chair)\r?$/gm)].map(m=>m[1]).sort();
 if (parameters && JSON.stringify(cases) !== JSON.stringify(['Chair','Desk','Lamp'])) throw new Error('Missing or duplicate parameter argument invocations');
 return { functions: expectedFunctions, argument_invocations: parameters ? cases.length : 0, passed: expectedPass };
}
function canonicalFix(name, root) {
 const file = path.join(root,'Tests/TestingExtensionTests/SubjectTests.swift');
 let source = fs.readFileSync(file,'utf8');
 if(name==='import-events') {
  const old='    }\n    await gate.open()\n    await work?.value\n}';
  if(!source.includes(old))throw new Error('Canonical confirmation repair no longer matches fixture');
  source=source.replace(old,'        await gate.open()\n        await work?.value\n    }\n}');
 } else {
  const old='    await sharedLookup.configure(title: title)\n    return LabelFormatter { await sharedLookup.lookup($0) }';
  if(!source.includes(old))throw new Error('Canonical dependency repair no longer matches fixture');
  source=source.replace('private let sharedLookup = LookupStub()\n','').replace(old,'    let lookup = LookupStub(title: title)\n    return LabelFormatter { await lookup.lookup($0) }');
 }
 fs.writeFileSync(file,source);
}
function runNativeValidation() {
 const temporary = fs.mkdtempSync(path.join(os.tmpdir(),'swift-testing-extension-native-'));
 const base = path.join(__dirname,'../evals/fixtures/swift-benchmarks/testing-extension');
 const results=[];
 try {
  for (const [name,expectedPass,parameters] of [['import-events',false,false],['scan-events',true,false],['label-lookup',false,true],['location-lookup',true,true]]) {
   const root=path.join(temporary,name);fs.cpSync(path.join(base,name),root,{recursive:true});
   for(const variant of expectedPass ? ['control'] : ['defect','canonical-repair']) {
    if(variant==='canonical-repair')canonicalFix(name,root);
    const filtered = name==='label-lookup' && variant==='defect';
    const args=[path.join(root,'run-tests.sh'),...(filtered ? ['--filter','independentFormattersKeepTheirInjectedValues'] : [])];
    const run=spawnSync('/bin/sh',args,{cwd:root,encoding:'utf8',timeout:120000,maxBuffer:16*1024*1024});
    const output=String(run.stdout||'')+String(run.stderr||'');
    console.log(`\n=== ${name}: ${variant} ===\n${output}`);
    if(run.error||run.signal)throw new Error(`Incomplete native validation: ${run.error?.message||run.signal}`);
    results.push({fixture:name,variant,filtered,...checkRun({status:run.status,output},variant!=='defect',parameters && !filtered,filtered ? 1 : 2)});
   }
  }
  console.log(JSON.stringify({native_validation:'complete',runs:results},null,2));
  return results;
 } finally {fs.rmSync(temporary,{recursive:true,force:true});}
}
if(require.main===module){try{runNativeValidation();}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={checkRun,runNativeValidation};
