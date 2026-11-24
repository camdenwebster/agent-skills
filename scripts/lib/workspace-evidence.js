'use strict';
const fs=require('node:fs');const path=require('node:path');const {execFileSync}=require('node:child_process');
const EXCLUDED=new Set(['.git','.build','.swiftpm','node_modules','DerivedData','build']);
const TEXT=/\.(?:swift|md|txt|sql|json|[cm]?js|jsx|tsx?|py|[hm]|ya?ml|toml)$/i;
function allowed(rel){return rel&& !path.isAbsolute(rel)&&!rel.split(/[\\/]/).some(x=>x==='..'||EXCLUDED.has(x)||x.startsWith('.'));}
function captureWorkspaceEvidence(root,baseline,limits={}){
 const caps={max_diff_bytes:128*1024,max_file_bytes:64*1024,max_total_bytes:256*1024,max_files:64,...limits};
 const result={version:1,baseline_commit:baseline,diff:'',files:[],omissions:[],errors:[],limits:caps,complete:false};let remaining=caps.max_total_bytes;
 const bounded=(text,max)=>{const bytes=Buffer.from(text);const cap=Math.max(0,Math.min(max,remaining));const truncated=bytes.length>cap;const kept=bytes.subarray(0,cap).toString('utf8');remaining-=Math.min(bytes.length,cap);return {text:kept,truncated};};
 const git=(args)=>execFileSync('git',['-c','core.fsmonitor=false','-c','core.hooksPath=/dev/null','-C',root,...args],{encoding:'utf8',timeout:10000,maxBuffer:2*1024*1024,stdio:['ignore','pipe','pipe']});
 const safeFile=(rel)=>{let current=root;for(const segment of rel.split('/')){current=path.join(current,segment);if(fs.lstatSync(current).isSymbolicLink())throw new Error('symbolic link');}return current;};
 const candidates=new Set();
 if(!/^[0-9a-f]{40,64}$/.test(baseline||'')){result.errors.push('missing or invalid baseline commit');return result;}
 try{const diff=bounded(git(['diff','--no-ext-diff','--no-textconv',baseline,'--','.']),caps.max_diff_bytes);result.diff=diff.text;if(diff.truncated)result.omissions.push('baseline diff truncated at capture limit');}catch(error){result.errors.push(`baseline diff unavailable: ${error.code||'git-error'}`);}
 try{for(const rel of git(['ls-files','--others','--exclude-standard','-z']).split('\0'))if(allowed(rel)&&TEXT.test(rel))candidates.add(rel);}catch(error){result.errors.push(`untracked source inventory unavailable: ${error.code||'git-error'}`);}
 let visited=0;
 const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(++visited>2000){result.omissions.push('RESULT search entry limit reached');return;}if(entry.name.startsWith('.')||EXCLUDED.has(entry.name))continue;const absolute=path.join(dir,entry.name);if(entry.isSymbolicLink()){result.omissions.push(`symbolic path excluded: ${path.relative(root,absolute)}`);continue;}if(entry.isDirectory())walk(absolute);else if(entry.isFile()&&entry.name==='RESULT.md')candidates.add(path.relative(root,absolute).split(path.sep).join('/'));}};
 try{walk(root);}catch(error){result.errors.push(`RESULT inventory unavailable: ${error.code||'read-error'}`);}
 for(const rel of [...candidates].sort()){
  if(result.files.length>=caps.max_files||remaining<=0){result.omissions.push('file/total capture limit reached');break;}
  try{
   const file=safeFile(rel);const stat=fs.lstatSync(file);if(!stat.isFile()){result.omissions.push(`nonregular path excluded: ${rel}`);continue;}
   const fd=fs.openSync(file,fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));let bytes;try{const count=Math.min(stat.size,caps.max_file_bytes,remaining);bytes=Buffer.alloc(count);const read=fs.readSync(fd,bytes,0,count,0);bytes=bytes.subarray(0,read);}finally{fs.closeSync(fd);}
   if(bytes.includes(0)){result.omissions.push(`binary path excluded: ${rel}`);continue;}
   const output=bounded(bytes.toString('utf8'),caps.max_file_bytes);const truncated=stat.size>bytes.length||output.truncated;
   result.files.push({path:rel,text:output.text,truncated});if(truncated)result.omissions.push(`file truncated: ${rel}`);
  }catch(error){result.omissions.push(`file unavailable: ${rel} (${error.code||error.message})`);}
 }
 result.complete=!result.errors.length&&!result.omissions.length;return result;
}
module.exports={captureWorkspaceEvidence};
