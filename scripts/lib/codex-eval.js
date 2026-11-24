'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function events(trace) {
 try {
  const rows=trace.split('\n').filter(l=>l.trim()).map(l=>JSON.parse(l));
  return rows.length && rows.every(e=>e && typeof e==='object' && !Array.isArray(e)) ? rows : null;
 } catch { return null; }
}
function codexExecutionFailure(trace) {
 const rows=events(trace);if(!rows)return 'invalid Codex execution JSON';
 if(rows.some(e=>e.type==='turn.failed'||e.type==='error'))return 'Codex execution failed';
 if(rows.at(-1)?.type!=='turn.completed')return 'missing successful Codex terminal result';
 if(!rows.some(e=>e.type==='thread.started'&&typeof e.thread_id==='string')||!rows.some(e=>e.type==='turn.started'))return 'missing Codex thread/turn start';
 const pending=new Set();const completed=new Set();
 for(const e of rows){
  if(['item.started','item.updated','item.completed'].includes(e.type)){
   if(!e.item||typeof e.item.id!=='string'||!e.item.id||typeof e.item.type!=='string')return 'invalid Codex item';
   if(e.type==='item.started') {if(pending.has(e.item.id)||completed.has(e.item.id))return 'duplicate Codex item';pending.add(e.item.id);}
   if(e.type==='item.updated'&&!pending.has(e.item.id))return 'unmatched Codex item update';
   if(e.type==='item.completed') {if(completed.has(e.item.id))return 'duplicate Codex completion';pending.delete(e.item.id);completed.add(e.item.id);if(e.item.status==='in_progress')return 'unfinished Codex item';}
  }
 }
 return pending.size?'missing Codex item result':null;
}
function codexModel(trace) {
 // Only engine lifecycle envelopes may supply identity, never item payloads or prose.
 const identities = (events(trace)||[]).filter(e => ['thread.started','turn.started','turn.completed'].includes(e.type)).flatMap(e => [e.model, e.model_id]).filter(v => typeof v === 'string' && v.trim());
 const unique = [...new Set(identities)];
 return unique.length === 1 ? unique[0] : null;
}
function codexUsage(trace) {return (events(trace)||[]).filter(e=>e.type==='turn.completed').at(-1)?.usage||null;}
function codexArgs({model,cwd,sandbox='workspace-write',developerInstructions,schemaFile,outputFile,skipGitRepoCheck=false}){
 const args=['-a','never','exec','--json','--ephemeral','--ignore-user-config','--ignore-rules','--sandbox',sandbox,'--cd',cwd,'--model',model,'--color','never'];
 const config=['project_doc_max_bytes=0','skills.include_instructions=false','skills.bundled.enabled=false','features.apps=false','features.hooks=false','features.memories=false','memories.use_memories=false','memories.generate_memories=false','plugins._default.enabled=false','features.skill_search=false','features.skill_mcp_dependency_install=false','features.remote_plugin=false','web_search="disabled"'];
 if(developerInstructions)config.push(`developer_instructions=${JSON.stringify(developerInstructions)}`);
 if(sandbox==='read-only')config.push('features.shell_tool=false');
 for(const value of config)args.push('-c',value);
 if(skipGitRepoCheck)args.push('--skip-git-repo-check');
 if(schemaFile)args.push('--output-schema',schemaFile);
 if(outputFile)args.push('--output-last-message',outputFile);
 args.push('-');return args;
}
function gradingSchema(){
 const item={type:'object',properties:{id:{type:'integer'},text:{type:'string'},passed:{type:'boolean'},evidence:{type:'string'}},required:['id','text','passed','evidence'],additionalProperties:false};
 return {type:'object',properties:{expectations:{type:'array',items:item},summary:{type:'object',properties:{passed:{type:'integer'},failed:{type:'integer'},total:{type:'integer'},pass_rate:{type:'number'}},required:['passed','failed','total','pass_rate'],additionalProperties:false}},required:['expectations','summary'],additionalProperties:false};
}
function invokeCodex(options,invoke=execFileSync){
 const {prompt,model,cwd,sandbox='workspace-write',developerInstructions,schema,timeout=15*60*1000}=options;
 const temporary=schema?fs.mkdtempSync(path.join(os.tmpdir(),'codex-eval-grading-')):null;
 try {
  const schemaFile=temporary?path.join(temporary,'schema.json'):null;
  const outputFile=temporary?path.join(temporary,'final.json'):null;
  if(schemaFile)fs.writeFileSync(schemaFile,JSON.stringify(schema),{mode:0o600});
  const trace=invoke('codex',codexArgs({model,cwd,sandbox,developerInstructions,schemaFile,outputFile,skipGitRepoCheck:Boolean(schema)}),{input:prompt,encoding:'utf8',maxBuffer:64*1024*1024,cwd,timeout});
  if(schema){const failure=codexExecutionFailure(trace);if(failure){const e=new Error(`Codex grader incomplete: ${failure}`);e.stdout=trace;throw e;}if(!fs.existsSync(outputFile))throw new Error('Codex grader omitted final output');}
  return {trace,...(schema?{final:fs.readFileSync(outputFile,'utf8')}:{})};
 }finally{if(temporary)fs.rmSync(temporary,{recursive:true,force:true});}
}
module.exports={codexExecutionFailure,codexModel,codexUsage,codexArgs,invokeCodex,gradingSchema};
