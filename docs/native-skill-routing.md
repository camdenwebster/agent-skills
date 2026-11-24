# Project-local native skill routing

This is the active routing overlay for agents working **in this checkout**. Read it for native work or native workflow integration; web-only tasks keep the existing catalog routing. The six selected snapshots are installed under `.agents/skills/`, with their supporting resources and source MIT notices. This does not install skills into other projects, change `~/.agents/playbooks`, or extend the plugin's root `skills/` catalog for consumers elsewhere.

## Lead and role contract

The Lead must classify the task before loading guidance. Pick the smallest relevant subset below. Do not preload every skill, replace the existing review/TDD process, or choose a Swift skill just because this repository contains Swift eval fixtures.

For each delegated native task, include this routing document, the project rules, the role assignment and the **resolved absolute paths** of the selected `SKILL.md` files in the agent prompt. Tell the delegate to read those exact files and only the supporting references relevant to the task. This is the project overlay for Architect, Coder, Reviewer and QA role playbooks, including those installed under `~/.agents/playbooks/`; it does not edit the shared playbooks. Preserve independent review and the existing Lead-owned orchestration. Imported skills do not authorize unrelated delegation, cleanup or tool execution.

| Role or task | Load when relevant | Canonical path |
|---|---|---|
| Architect: native architecture, dependency interfaces and testability | Matt Pocock — Codebase Design | `.agents/skills/codebase-design/SKILL.md` |
| Coder / Reviewer: SwiftUI implementation, state ownership or view review | Antoine van der Lee — SwiftUI Expert | `.agents/skills/swiftui-expert-skill/SKILL.md` |
| Architect / Coder / Reviewer: tasks, cancellation, actors, isolation or Sendable boundaries | Antoine van der Lee — Swift Concurrency | `.agents/skills/swift-concurrency/SKILL.md` |
| Coder / Reviewer / QA: Swift unit or integration tests | Antoine van der Lee — Swift Testing | `.agents/skills/swift-testing-expert/SKILL.md` |
| Coder / Reviewer / QA: native accessibility work or changed UI semantics | Daniel Devesa — iOS Accessibility | `.agents/skills/ios-accessibility/SKILL.md` |
| Coder / Reviewer: observed performance problem or requested profiling/audit | Thomas Ricouard — SwiftUI Performance Audit | `.agents/skills/swiftui-performance-audit/SKILL.md` |

For example, a concurrent SwiftUI feature normally needs SwiftUI + Concurrency; load Testing when writing or reviewing its tests. A pure Swift package test task needs Testing and possibly Concurrency, not SwiftUI or accessibility. Architect uses Codebase Design for actual architecture work; a small bug fix does not trigger a redesign. QA retains XCTest for UI/performance tests; Swift Testing is not a replacement for XCUITest. A performance source review produces hypotheses until native traces or measurements substantiate them.

## Priority and boundaries

- User instructions, consuming-project policy and the actual SDK/compiler contracts govern conflicts. Discover language mode, strict concurrency/default isolation, deployment targets and checked-in verification commands before applying version-specific advice.
- Preserve project architecture. Do not use imported style preferences as authorization for unrelated rewrites, schema migrations, deployment-target changes or framework adoption.
- For MovingBox-related analysis, its additive shipped synced-schema rules and SyncEngine registration policy override generic migration advice. This installation makes no MovingBox app changes.
- XCTest/Swift Testing test-plan selections, required coverage and failure reporting stay under project policy. Do not silence required failures with disabled tests, known-issue traits or broader serialization.
- No paid/private skill text is installed. Axiom Data/Run Tests remain optional external references from the research ledger, not callable installed skills. Do not assume sibling skills, external helpers or paid tools exist; report a needed capability or use documented project commands.
- Evals remain explicitly on demand. Controlled eval execution disables automatic instruction/skill discovery as documented by the harness; do not inject these project defaults into evaluation prompts or rewrite historical results.

## Discovery and same-name skills

Codex discovers repository skills under `.agents/skills/`. Claude Code discovers the six individual relative links under `.claude/skills/`, all pointing at the same canonical resources. There is one imported copy per skill, not two independently maintained copies. Both hosts normally load a skill body only when selected; ordinary discovery advertises metadata.

Existing global skills remain installed. Codex can show multiple skills with the same name rather than merging them. **Do not assume project discovery overrides the global copy.** Select/read the canonical project path in the table and report the path used. In Claude Code, use the project entry when it is available; when name resolution or managed configuration is unclear, read the same exact canonical file instead of claiming a different source was loaded. User/admin restrictions still apply.

New installations should be available on the next turn. If the host's current skill list does not refresh, start a new session in this checkout. The checked-in resources and routing instructions are active; this change does not claim a fresh paid agent session has demonstrated automatic selection. To verify without model calls:

```bash
node scripts/validate-native-skills.js
node --test scripts/validate-native-skills-test.js
```

The validator checks six fixed selections against the benchmark source pins, complete file hashes/executable bits, frontmatter names, source MIT notices, Claude links and the AGENTS/CLAUDE routing entrypoints. It is an offline integrity/configuration check, not an effectiveness eval or a live host-discovery proof. Linux/macOS CI runs it. Windows checkouts with symlink placeholders do not establish Claude discovery; use a symlink-capable checkout before native use. The validator deliberately rejects placeholder files rather than calling them working links.

## Updates and reuse

`.agents/native-skills.json` records source repository, exact commit, source path, copied root license and every installed resource hash/mode. Existing imported skill bytes remain upstream originals; `UPSTREAM-LICENSE.txt` is the separately added root notice. Follow each skill's local references as needed; do not execute bundled helpers simply because they are present.

To refresh a source, choose and review the revision deliberately, use the skill-installer helper with `--ref` and `--dest <checkout>/.agents/skills`, preserve the source notice and regenerate/review the ledger. The installer refuses to overwrite an existing skill: prepare an isolated replacement and compare before replacing the checked-in copy. Do not edit the ledger merely to hide drift. This ledger proves consistency with the reviewed installation, not remote source authenticity on every offline run.

To use the collection in another app, explicitly install the desired pinned sources project-locally there and adopt the routing contract under that app's rules. Merely enabling this repository's existing plugin does not install these `.agents/skills` resources. Reusable native plugin/catalog adaptation remains separate work under MOV-250.

Sources: [Codex skill discovery](https://learn.chatgpt.com/docs/build-skills), [Claude Code skill discovery](https://code.claude.com/docs/en/skills), [qualitative selection and source links](../tasks/swift-starting-set.md), [on-demand eval runbook](../evals/swift-benchmarks/on-demand.md).
