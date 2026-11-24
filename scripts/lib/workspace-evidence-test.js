'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const {execFileSync}=require('node:child_process');
const {captureWorkspaceEvidence}=require('./workspace-evidence');
function fixture(fn){const root=fs.mkdtempSync(path.join(os.tmpdir(),'workspace-evidence-test-'));const git=(...args)=>execFileSync('git',['-c','core.hooksPath=/dev/null','-C',root,...args],{encoding:'utf8'}).trim();try{git('init','-q');git('config','user.name','Test');git('config','user.email','test@example.invalid');git('config','commit.gpgsign','false');fs.writeFileSync(path.join(root,'Source.swift'),'let count = 0\n');git('add','.');git('commit','-qm','baseline');const baseline=git('rev-parse','HEAD');return fn(root,git,baseline);}finally{fs.rmSync(root,{recursive:true,force:true});}}
test('capture includes committed source diff, actual RESULT and new source absent from native events',()=>fixture((root,git,baseline)=>{
 fs.writeFileSync(path.join(root,'Source.swift'),'let count = 1\n');git('add','.');git('commit','-qm','agent change');
 fs.mkdirSync(path.join(root,'feature'));fs.writeFileSync(path.join(root,'feature/RESULT.md'),'Actual findings and evidence.\n');fs.writeFileSync(path.join(root,'feature/AddedTests.swift'),'#expect(count == 1)\n');
 const evidence=captureWorkspaceEvidence(root,baseline);assert.match(evidence.diff,/\+let count = 1/);assert.equal(evidence.baseline_commit,baseline);assert.ok(evidence.files.some(f=>f.path==='feature/RESULT.md'&&f.text.includes('Actual findings')));assert.ok(evidence.files.some(f=>f.path==='feature/AddedTests.swift'));assert.deepEqual(evidence.errors,[]);
}));
test('capture does not follow symlinks or build trees, and reports bounded omissions',()=>fixture((root,git,baseline)=>{
 fs.mkdirSync(path.join(root,'.build'));fs.writeFileSync(path.join(root,'.build/RESULT.md'),'should not capture');fs.writeFileSync(path.join(root,'RESULT.md'),'x'.repeat(500));
 if(process.platform!=='win32')fs.symlinkSync(path.join(root,'Source.swift'),path.join(root,'external.swift'));
 const evidence=captureWorkspaceEvidence(root,baseline,{max_file_bytes:32,max_total_bytes:128});assert.equal(evidence.files.some(f=>f.path.includes('.build')),false);assert.ok(evidence.files.some(f=>f.path==='RESULT.md'&&f.truncated));assert.ok(evidence.omissions.length);
}));
test('missing baseline or deleted git metadata is explicit capture failure, not empty success',()=>fixture((root,git,baseline)=>{const e=captureWorkspaceEvidence(root,'f'.repeat(40));assert.ok(e.errors.length);assert.equal(e.complete,false);}));

// Replay must use saved capture rather than reading a contemporary workspace.
test('recorded grading forwards saved host evidence unchanged',()=>{
 const {saveRecord,gradeRecorded}=require('./behavioral-record');const root=fs.mkdtempSync(path.join(os.tmpdir(),'workspace-replay-test-'));
 try{const evidence={version:1,baseline_commit:'a'.repeat(40),diff:'+old saved source',files:[{path:'RESULT.md',text:'Historical result',truncated:false}],omissions:[],errors:[],complete:true};
 const saved=saveRecord(path.join(root,'case'),{run:{},trace:'saved trace',workspace_evidence:evidence});fs.writeFileSync(path.join(root,'RESULT.md'),'Different present-day result');let observed;gradeRecorded(saved.file,saved.record,{expectations:['x']},'fixed',true,(trace,ev,model,capture)=>{observed=capture;return {raw:'{}',grading:null};});assert.deepEqual(observed,evidence);assert.equal(observed.files[0].text,'Historical result');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
