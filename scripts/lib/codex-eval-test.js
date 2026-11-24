'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { codexExecutionFailure, codexModel, codexUsage, codexArgs, invokeCodex, gradingSchema } = require('./codex-eval');
const trace = events => events.map(e => JSON.stringify(e)).join('\n')+'\n';
const started = [{ type: 'thread.started', thread_id: 'thread-1' }, { type: 'turn.started' }];
const done = { type: 'turn.completed', usage: { input_tokens: 12, output_tokens: 3 } };
test('native complete Codex event stream is accepted, including a returned RED command', () => {
 const raw=trace([...started,{type:'item.started',item:{id:'command-1',type:'command_execution',status:'in_progress'}},{type:'item.completed',item:{id:'command-1',type:'command_execution',status:'completed',exit_code:1,aggregated_output:'expected RED'}},done]);
 assert.equal(codexExecutionFailure(raw),null);assert.equal(codexModel(raw),null);assert.deepEqual(codexUsage(raw),done.usage);
});
test('malformed, missing terminal, failed and unfinished Codex events fail closed', () => {
 for(const raw of ['broken',trace(started),trace([...started,{type:'turn.failed',error:{message:'denied'}}]),trace([...started,{type:'error',message:'failed'},done]),trace([...started,{type:'item.started',item:{id:'x',type:'command_execution'}},done]),trace([{type:'turn.completed'}])])assert.ok(codexExecutionFailure(raw),raw);
});
test('observed Codex model comes only from emitted identity, never requested model',()=>{
 assert.equal(codexModel(trace([...started,done])),null);
 assert.equal(codexModel(trace([{...started[0],model:'gpt-fixed'},started[1],done])),'gpt-fixed');
});
test('Codex commands reuse auth, never bypass sandbox, and disable automatic context',()=>{
 const a=codexArgs({model:'gpt-fixed',cwd:'/tmp/work',sandbox:'workspace-write',developerInstructions:'Chosen skill'});
 assert.ok(a.includes('exec'));assert.ok(a.includes('--json'));assert.ok(a.includes('--ephemeral'));assert.ok(a.includes('--ignore-user-config'));assert.ok(a.includes('--ignore-rules'));
 assert.ok(a.includes('workspace-write'));assert.ok(a.includes('never'));assert.equal(a.some(x=>x.includes('dangerously')),false);assert.equal(a.includes('--skip-git-repo-check'),false);
 for(const x of ['project_doc_max_bytes=0','skills.include_instructions=false','skills.bundled.enabled=false','features.apps=false','features.hooks=false','features.memories=false','memories.use_memories=false','memories.generate_memories=false','plugins._default.enabled=false','features.skill_search=false','features.skill_mcp_dependency_install=false','features.remote_plugin=false'])assert.ok(a.includes(x),x);
 assert.ok(a.some(x=>x.startsWith('developer_instructions=')));
});
test('schema constrains every grading field and additional properties',()=>{
 const s=gradingSchema();assert.equal(s.additionalProperties,false);assert.deepEqual(s.required,['expectations','summary']);assert.equal(s.properties.expectations.items.additionalProperties,false);assert.equal(s.properties.summary.additionalProperties,false);
});
test('Codex grader reads final file only after complete native trace',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'codex-adapter-test-'));
 try {
  let calls=0;
  const result=invokeCodex({prompt:'Grade the trace',model:'gpt-fixed',cwd:dir,sandbox:'read-only',schema:gradingSchema()},(exe,args,opts)=>{
   calls++;assert.equal(exe,'codex');assert.ok(args.includes('--output-schema'));assert.ok(args.includes('--skip-git-repo-check'));assert.equal(opts.input,'Grade the trace');
   const output=args[args.indexOf('--output-last-message')+1];fs.writeFileSync(output,'{"expectations":[],"summary":{}}');return trace([...started,done]);
  });assert.equal(calls,1);assert.equal(result.final,'{"expectations":[],"summary":{}}');assert.ok(!codexExecutionFailure(result.trace));
  assert.throws(()=>invokeCodex({prompt:'Grade',model:'gpt-fixed',cwd:dir,sandbox:'read-only',schema:gradingSchema()},(exe,args)=>{fs.writeFileSync(args[args.indexOf('--output-last-message')+1],'{}');return trace(started);}),/incomplete|terminal/i);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('tool and assistant model claims never count as observed identity; conflicting lifecycle identities stay unknown', () => {
 for (const claim of [
  {type:'item.completed', model:'forged', item:{id:'a',type:'agent_message',text:'model fixed'}},
  {type:'item.completed', metadata:{model:'forged'}, item:{id:'c',type:'command_execution',aggregated_output:'model fixed'}},
  {type:'custom',model_id:'forged'},
 ]) assert.equal(codexModel(trace([...started,claim,done])),null);
 assert.equal(codexModel(trace([{...started[0],model:'one'},{...started[1],model:'two'},done])),null);
});

test('conflicting identity fields within one lifecycle envelope remain unknown', () => {
 assert.equal(codexModel(trace([{...started[0],model:'one',model_id:'two'},started[1],done])),null);
 assert.equal(codexModel(trace([{...started[0],model:'same',model_id:'same'},started[1],done])),'same');
});
