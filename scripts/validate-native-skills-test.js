'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { test, afterEach } = require('node:test');
const { validate } = require('./validate-native-skills');
const roots = [];
const sourceSuite = require('../evals/swift-benchmarks/suite.json');
const ids = ['avdlee-concurrency', 'avdlee-testing', 'avdlee-swiftui', 'devesa-accessibility', 'ricouard-performance', 'matt-codebase-design'];
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
function write(root, p, text) { fs.mkdirSync(path.dirname(path.join(root,p)), {recursive:true}); fs.writeFileSync(path.join(root,p),text); }
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'native-skills-test-')); roots.push(root);
  write(root,'evals/swift-benchmarks/suite.json',JSON.stringify(sourceSuite));
  const skills = sourceSuite.candidates.filter(c => ids.includes(c.id)).map(c => {
    const name=c.skill_path.split('/').at(-1);
    const files=[{path:'SKILL.md', text:`---\nname: ${name}\ndescription: Test fixture guidance\n---\nSee references/details.md\n`},{path:'references/details.md',text:'Supporting reference\n'},{path:'UPSTREAM-LICENSE.txt',text:'MIT License\nPermission is hereby granted, free of charge\n'}];
    files.forEach(f => write(root,`.agents/skills/${name}/${f.path}`,f.text));
    fs.mkdirSync(path.join(root,'.claude/skills'),{recursive:true});
    fs.symlinkSync(`../../.agents/skills/${name}`,path.join(root,'.claude/skills',name),'dir');
    return {id:c.id,name,repository:c.repository,revision:c.revision,skill_path:c.skill_path,license:'MIT',license_source:'LICENSE',license_file:'UPSTREAM-LICENSE.txt',files:files.map(f=>({path:f.path,sha256:hash(f.text),executable:false}))};
  });
  write(root,'.agents/native-skills.json',JSON.stringify({version:1,skills}));
  const entry='## Native workflow\nRead [native routing](docs/native-skill-routing.md) before selecting native skills or delegating native work.\n';
  write(root,'AGENTS.md',entry); write(root,'CLAUDE.md',entry);
  write(root,'docs/native-skill-routing.md',skills.map(c=>`.agents/skills/${c.name}/SKILL.md`).join('\n')+'\nLead Architect Coder Reviewer QA\n');
  return {root,skills};
}
afterEach(()=>{for(const r of roots.splice(0))fs.rmSync(r,{recursive:true,force:true});});
test('accepts complete pinned resources, licenses and both entrypoints',()=>{assert.deepEqual(validate(fixture().root),[]);});
test('rejects a tampered supporting reference',()=>{const {root,skills}=fixture();write(root,`.agents/skills/${skills[0].name}/references/details.md`,'changed');assert.match(validate(root).join('\n'),/hash mismatch/);});
test('rejects a missing supporting reference',()=>{const {root,skills}=fixture();fs.unlinkSync(path.join(root,'.agents/skills',skills[0].name,'references/details.md'));assert.match(validate(root).join('\n'),/missing.*references\/details.md/);});
test('rejects an unexpected imported file',()=>{const {root,skills}=fixture();write(root,`.agents/skills/${skills[0].name}/new.md`,'new');assert.match(validate(root).join('\n'),/unexpected.*new.md/);});
test('rejects an unpinned source revision',()=>{const {root}=fixture();const p=path.join(root,'.agents/native-skills.json');const m=JSON.parse(fs.readFileSync(p));m.skills[0].revision='0'.repeat(40);fs.writeFileSync(p,JSON.stringify(m));assert.match(validate(root).join('\n'),/source mismatch.*revision/);});
test('rejects missing and unrecorded skill directories',()=>{const {root,skills}=fixture();fs.rmSync(path.join(root,'.agents/skills',skills[0].name),{recursive:true});fs.mkdirSync(path.join(root,'.agents/skills','extra'));assert.match(validate(root).join('\n'),/skill directory inventory/);});
test('rejects symlinked resource contents',()=>{const {root,skills}=fixture();const p=path.join(root,'.agents/skills',skills[0].name,'references/details.md');fs.unlinkSync(p);fs.symlinkSync('../SKILL.md',p);assert.match(validate(root).join('\n'),/symlink.*references\/details.md/);});
test('rejects a wrong Claude discovery link even when its target exists',()=>{const {root,skills}=fixture();const p=path.join(root,'.claude/skills',skills[0].name);fs.unlinkSync(p);fs.symlinkSync(`../../.agents/skills/${skills[1].name}`,p,'dir');assert.match(validate(root).join('\n'),/Claude link mismatch/);});
test('rejects symlink checkout placeholders as runtime discovery',()=>{const {root,skills}=fixture();const p=path.join(root,'.claude/skills',skills[0].name);fs.unlinkSync(p);fs.writeFileSync(p,`../../.agents/skills/${skills[0].name}`);assert.match(validate(root).join('\n'),/Claude link is not a symlink/);});
test('rejects missing MIT notice even with a matching updated hash',()=>{const {root,skills}=fixture();const p=path.join(root,'.agents/native-skills.json');const m=JSON.parse(fs.readFileSync(p));const text='Unlicensed';write(root,`.agents/skills/${skills[0].name}/UPSTREAM-LICENSE.txt`,text);m.skills[0].files.find(f=>f.path==='UPSTREAM-LICENSE.txt').sha256=hash(text);fs.writeFileSync(p,JSON.stringify(m));assert.match(validate(root).join('\n'),/MIT notice missing/);});
test('rejects name collision in imported frontmatter',()=>{const {root,skills}=fixture();const p=path.join(root,'.agents/native-skills.json');const m=JSON.parse(fs.readFileSync(p));const text='---\nname: wrong\ndescription: fixture\n---\n';write(root,`.agents/skills/${skills[0].name}/SKILL.md`,text);m.skills[0].files.find(f=>f.path==='SKILL.md').sha256=hash(text);fs.writeFileSync(p,JSON.stringify(m));assert.match(validate(root).join('\n'),/frontmatter name mismatch/);});
test('rejects ledger path traversal',()=>{const {root}=fixture();const p=path.join(root,'.agents/native-skills.json');const m=JSON.parse(fs.readFileSync(p));m.skills[0].files[0].path='../outside';fs.writeFileSync(p,JSON.stringify(m));assert.match(validate(root).join('\n'),/unsafe resource path/);});
test('rejects removed role wiring at an entrypoint',()=>{const {root}=fixture();write(root,'AGENTS.md','# No route\n');assert.match(validate(root).join('\n'),/AGENTS.md.*routing/);});
test('rejects missing canonical skill path in routing',()=>{const {root}=fixture();write(root,'docs/native-skill-routing.md','Lead Architect Coder Reviewer QA\n');assert.match(validate(root).join('\n'),/routing missing canonical/);});

test('rejects an extra valid Claude discovery link', () => {
  const {root, skills} = fixture();
  fs.symlinkSync(`../../.agents/skills/${skills[0].name}`, path.join(root, '.claude/skills/extra-native'), 'dir');
  assert.match(validate(root).join('\n'), /Claude skill directory inventory/);
});
