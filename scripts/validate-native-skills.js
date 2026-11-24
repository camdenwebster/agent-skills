#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const IDS = ['avdlee-concurrency', 'avdlee-testing', 'avdlee-swiftui', 'devesa-accessibility', 'ricouard-performance', 'matt-codebase-design'];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const safe = value => typeof value === 'string' && value.length > 0 && !value.includes('\\') && !path.posix.isAbsolute(value) && value.split('/').every(part => part && part !== '.' && part !== '..');
function validate(root) {
  const errors = [];
  try {
    const ledger = JSON.parse(fs.readFileSync(path.join(root, '.agents/native-skills.json'), 'utf8'));
    const suite = JSON.parse(fs.readFileSync(path.join(root, 'evals/swift-benchmarks/suite.json'), 'utf8'));
    if (ledger.version !== 1 || !Array.isArray(ledger.skills)) throw new Error('unsupported native skill ledger');
    if (ledger.skills.length !== IDS.length || new Set(ledger.skills.map(s => s.id)).size !== IDS.length || IDS.some(id => !ledger.skills.some(s => s.id === id))) throw new Error('native skill inventory must contain the six selected IDs exactly once');
    const canonical = path.join(root, '.agents/skills');
    for (const directory of [path.join(root, '.agents'), canonical, path.join(root, '.claude'), path.join(root, '.claude/skills')]) {
      if (!fs.lstatSync(directory).isDirectory()) throw new Error(`discovery root is not a regular directory: ${path.relative(root, directory)}`);
    }
    const expectedNames = ledger.skills.map(s => s.name).sort();
    if (new Set(expectedNames).size !== IDS.length || expectedNames.some(name => !safe(name) || name.includes('/'))) throw new Error('invalid or duplicate skill name');
    if (JSON.stringify(fs.readdirSync(canonical).sort()) !== JSON.stringify(expectedNames)) errors.push('skill directory inventory differs from the six pinned names');
    if (JSON.stringify(fs.readdirSync(path.join(root, '.claude/skills')).sort()) !== JSON.stringify(expectedNames)) errors.push('Claude skill directory inventory differs from the six pinned names');
    const routing = fs.readFileSync(path.join(root, 'docs/native-skill-routing.md'), 'utf8');
    for (const role of ['Lead', 'Architect', 'Coder', 'Reviewer', 'QA']) if (!routing.includes(role)) errors.push(`routing missing role: ${role}`);
    for (const entry of ['AGENTS.md', 'CLAUDE.md']) {
      const text = fs.readFileSync(path.join(root, entry), 'utf8');
      if (!text.includes('docs/native-skill-routing.md')) errors.push(`${entry} missing native skill routing entrypoint`);
    }
    for (const skill of ledger.skills) {
      const source = suite.candidates.find(c => c.id === skill.id);
      for (const key of ['repository', 'revision', 'skill_path', 'license']) if (!source || skill[key] !== source[key]) errors.push(`${skill.id}: source mismatch for ${key}`);
      if (skill.name !== skill.skill_path.split('/').at(-1)) errors.push(`${skill.id}: name differs from pinned source directory`);
      const base = path.join(canonical, skill.name);
      const collected = new Map();
      function walk(dir, relative = '') {
        for (const name of fs.readdirSync(dir)) {
          const local = path.posix.join(relative, name);
          const file = path.join(dir, name);
          const st = fs.lstatSync(file);
          if (st.isSymbolicLink()) errors.push(`${skill.name}: symlink resource ${local}`);
          else if (st.isDirectory()) walk(file, local);
          else if (st.isFile()) collected.set(local, {bytes: fs.readFileSync(file), executable: !!(st.mode & 0o111)});
          else errors.push(`${skill.name}: non-file resource ${local}`);
        }
      }
      if (!fs.existsSync(base) || !fs.lstatSync(base).isDirectory()) { errors.push(`${skill.name}: missing regular skill directory`); continue; }
      walk(base);
      if (!Array.isArray(skill.files) || !skill.files.length) { errors.push(`${skill.name}: missing resource ledger`); continue; }
      const recorded = new Set();
      for (const f of skill.files) {
        if (!safe(f.path)) { errors.push(`${skill.name}: unsafe resource path ${f.path}`); continue; }
        if (recorded.has(f.path)) errors.push(`${skill.name}: duplicate resource ${f.path}`);
        recorded.add(f.path);
        if (!/^[a-f0-9]{64}$/.test(f.sha256) || typeof f.executable !== 'boolean') errors.push(`${skill.name}: invalid resource digest/mode ${f.path}`);
        const actual = collected.get(f.path);
        if (!actual) errors.push(`${skill.name}: missing resource ${f.path}`);
        else {
          if (hash(actual.bytes) !== f.sha256) errors.push(`${skill.name}: hash mismatch ${f.path}`);
          if (actual.executable !== f.executable) errors.push(`${skill.name}: executable mode mismatch ${f.path}`);
        }
      }
      for (const local of collected.keys()) if (!recorded.has(local)) errors.push(`${skill.name}: unexpected resource ${local}`);
      const front = collected.get('SKILL.md')?.bytes.toString('utf8') || '';
      const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(front)?.[1] || '';
      const name = /^name:\s*["']?([^\r\n"']+)["']?\s*$/m.exec(fm)?.[1];
      if (name !== skill.name) errors.push(`${skill.name}: frontmatter name mismatch`);
      if (!/^description:\s*\S/m.test(fm)) errors.push(`${skill.name}: missing frontmatter description`);
      if (skill.license_source !== 'LICENSE' || skill.license_file !== 'UPSTREAM-LICENSE.txt') errors.push(`${skill.name}: invalid source license provenance`);
      const notice = collected.get('UPSTREAM-LICENSE.txt')?.bytes.toString('utf8') || '';
      if (!notice.includes('MIT License') || !notice.includes('Permission is hereby granted, free of charge')) errors.push(`${skill.name}: MIT notice missing`);
      const target = `../../.agents/skills/${skill.name}`;
      const link = path.join(root, '.claude/skills', skill.name);
      if (!fs.existsSync(link) && !fs.lstatSync(link, {throwIfNoEntry:false})) errors.push(`${skill.name}: missing Claude link`);
      else if (!fs.lstatSync(link).isSymbolicLink()) errors.push(`${skill.name}: Claude link is not a symlink`);
      else if (fs.readlinkSync(link) !== target) errors.push(`${skill.name}: Claude link mismatch`);
      if (!routing.includes(`.agents/skills/${skill.name}/SKILL.md`)) errors.push(`${skill.name}: routing missing canonical skill path`);
    }
  } catch (error) { errors.push(error.message); }
  return errors;
}
if (require.main === module) {
  const errors = validate(path.resolve(__dirname, '..'));
  if (errors.length) { errors.forEach(e => console.error(`ERROR: ${e}`)); process.exitCode = 1; }
  else console.log('Six pinned project-native skills, supporting resources, MIT notices and routing links verified.');
}
module.exports = { validate };
