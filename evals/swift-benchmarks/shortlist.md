# Three candidates per benchmark area

Selected 2026-11-23 for the first controlled comparison. These are candidates, not rankings or adoption decisions. The suite now declares exactly three eligible skills per domain: 19 distinct skills across eight areas, because some are deliberately reused in multiple areas. All selected snapshots are MIT-licensed; proprietary/Apple-bundled skill text remains outside the corpus.

| Area | Candidate 1 | Candidate 2 | Candidate 3 |
|---|---|---|---|
| Concurrency | [AvdLee — Swift Concurrency](https://github.com/AvdLee/Swift-Concurrency-Agent-Skill/blob/3b1580d8398e0b5408b3bf0bada0e941a1cfc642/skills/swift-concurrency/SKILL.md) | [Hudson — Concurrency Pro (compatibility snapshot)](https://github.com/twostraws/Swift-Concurrency-Agent-Skill/blob/e710f8d577ccbff1ac047aac1594a5683000cb0b/swift-concurrency-pro/SKILL.md) | [Emil — Write Swift](https://github.com/emilkowalski/skills/blob/64eb3deb9a5fbfa041faf783e0bc3fd635872e9c/skills/write-swift/SKILL.md) |
| Testing | [AvdLee — Swift Testing](https://github.com/AvdLee/Swift-Testing-Agent-Skill/blob/798e9b1a2bcac164d4f0c781908199e754f0bab6/swift-testing-expert/SKILL.md) | [Hudson — Testing Pro (compatibility snapshot)](https://github.com/twostraws/Swift-Testing-Agent-Skill/blob/3d434c7d81f35e5726d4363fc30260735d541c2f/swift-testing-pro/SKILL.md) | [Axiom — Testing](https://github.com/CharlesWiltgen/Axiom/blob/ffafd3b3e0dbaaa60b753ca4a835ae6603b873e1/axiom-codex/skills/axiom-testing/SKILL.md) |
| SwiftUI | [Hudson — SwiftUI Pro](https://github.com/twostraws/SwiftUI-Agent-Skill/blob/f2920b63995263f57b3e198674e89a602efba6d2/swiftui-pro/SKILL.md) | [AvdLee — SwiftUI Expert](https://github.com/AvdLee/SwiftUI-Agent-Skill/blob/62bd760f005093d1e2e4de5db156e456a5f96400/skills/swiftui-expert-skill/SKILL.md) | [Ricouard — View Refactor](https://github.com/Dimillian/Skills/blob/05ba982bfeb0d77d3c97d4542b0ee15034d05f84/swiftui-view-refactor/SKILL.md) |
| Accessibility | [Devesa — iOS Accessibility](https://github.com/dadederk/iOS-Accessibility-Agent-Skill/blob/dcc3a36ce1d0099341d545c1af4eb5a8c989bf66/ios-accessibility/SKILL.md) | [Hudson — SwiftUI Pro](https://github.com/twostraws/SwiftUI-Agent-Skill/blob/f2920b63995263f57b3e198674e89a602efba6d2/swiftui-pro/SKILL.md) | [AvdLee — SwiftUI Expert](https://github.com/AvdLee/SwiftUI-Agent-Skill/blob/62bd760f005093d1e2e4de5db156e456a5f96400/skills/swiftui-expert-skill/SKILL.md) |
| Persistence | [Axiom — Data](https://github.com/CharlesWiltgen/Axiom/blob/ffafd3b3e0dbaaa60b753ca4a835ae6603b873e1/axiom-codex/skills/axiom-data/SKILL.md) | [Axiom — Database Schema Audit](https://github.com/CharlesWiltgen/Axiom/blob/ffafd3b3e0dbaaa60b753ca4a835ae6603b873e1/axiom-codex/skills/axiom-audit-database-schema/SKILL.md) | [Catalog — Migrations (general control)](https://github.com/addyosmani/agent-skills/blob/8c99fa36d90068c82d547f7c12a9d67a3e95f4ee/skills/deprecation-and-migration/SKILL.md) |
| Evidence | [Axiom — Run Tests (evidence-review scope)](https://github.com/CharlesWiltgen/Axiom/blob/ffafd3b3e0dbaaa60b753ca4a835ae6603b873e1/axiom-codex/skills/axiom-run-tests/SKILL.md) | [Catalog — Code Review (general control)](https://github.com/addyosmani/agent-skills/blob/8c99fa36d90068c82d547f7c12a9d67a3e95f4ee/skills/code-review-and-quality/SKILL.md) | [Catalog — TDD (general control)](https://github.com/addyosmani/agent-skills/blob/8c99fa36d90068c82d547f7c12a9d67a3e95f4ee/skills/test-driven-development/SKILL.md) |
| Performance | [Ricouard — Performance Audit](https://github.com/Dimillian/Skills/blob/05ba982bfeb0d77d3c97d4542b0ee15034d05f84/swiftui-performance-audit/SKILL.md) | [AvdLee — SwiftUI Expert](https://github.com/AvdLee/SwiftUI-Agent-Skill/blob/62bd760f005093d1e2e4de5db156e456a5f96400/skills/swiftui-expert-skill/SKILL.md) | [Hudson — SwiftUI Pro](https://github.com/twostraws/SwiftUI-Agent-Skill/blob/f2920b63995263f57b3e198674e89a602efba6d2/swiftui-pro/SKILL.md) |
| Architecture | [Matt Pocock — Codebase Design (language agnostic)](https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/codebase-design/SKILL.md) | [Axiom — SwiftUI Architecture Audit](https://github.com/CharlesWiltgen/Axiom/blob/ffafd3b3e0dbaaa60b753ca4a835ae6603b873e1/axiom-codex/skills/axiom-audit-swiftui-architecture/SKILL.md) | [Catalog — Code Review (general control)](https://github.com/addyosmani/agent-skills/blob/8c99fa36d90068c82d547f7c12a9d67a3e95f4ee/skills/code-review-and-quality/SKILL.md) |

## Why these groups

- Concurrency compares a settings/isolation-oriented procedure, a focused dangerous-pattern reviewer and a broader Swift-language guide.
- Testing compares three native testing procedures on async lifetime and serialization without conflating UI automation with Swift Testing.
- SwiftUI contrasts broad modern-API/state review with a more opinionated refactoring skill. Project architecture remains authoritative.
- Accessibility compares a dedicated assistive-technology specialist against two general SwiftUI reviewers, including clean controls that should not be rewritten.
- Persistence has native SQLiteData/CloudKit coverage and a schema audit, plus a general migration control. The test is whether each respects the consuming project's stricter sync policy; generic migration habits are not automatically correct.
- Evidence includes a native test-evidence procedure and two general verification controls. The latter are not claimed to be native result-bundle specialists.
- Performance compares a dedicated performance audit against broad SwiftUI review guidance. The current cases measure evidence discipline and experiment design, not actual device profiling ability.
- Architecture compares a language-agnostic deep-module specialist, a native SwiftUI separation/testability audit and general code review. Neither SwiftUI audit nor TypeScript examples dictate our app's package map.

## Source and resource compatibility

The earlier Hudson concurrency pin and the newest Testing packaging contain nested reference symlinks rejected by the pilot's resource policy. The selected pre-marketplace snapshots retain their local references without those symlinks. They are **historical compatibility snapshots**, not claims to test the latest release. Do not loosen path protections or silently omit adapter subdirectories to make newer layouts appear supported. A future source-materialization adapter can be evaluated separately.

Axiom topic bundles carry local references useful for these cases, but optional sibling auditors and repository-level helpers are not staged. Axiom Run Tests is selected for the current read-only evidence review: its preferred external axbuild helper is not bundled here, and this is not a qualification of the complete native execution toolchain. Axiom Data/Schema Audit may still suggest rebuild/drop patterns in other situations; the synced-schema policy cases must catch inappropriate advice.

Matt Pocock's selected skill includes its local deepening and alternative-design references. Its language-agnostic architectural guidance is applicable, but optional subagent workflows are not required by our design-review fixtures. Advice to replace shallow tests must not become automatic deletion of existing tests.

All candidates have exact commit, path, license and topic scope in suite.json. Prepared-source checks verify the Git pin, matching remote, clean tracked resource bytes, license notice, no symlinks, fixture paths and dry-run matrix. Passing this staging check establishes resource compatibility only, not skill effectiveness.

## Evaluation procedure

Keep the existing no-skill baseline in each engine. Start with one domain's problem/control pair and all three candidates, then repeat under a fixed requested model and runtime. Keep Claude and Codex campaigns separate. Read critical failures and clean-control false positives before comparing pass counts; unknown resolved model identity or incomplete attempts prevent strong comparative inference.

The full default matrix is 16 cases × (baseline + 3 candidates) × 3 repetitions = 192 executor attempts, each with a possible grader call. Use dry-run and a small case selection first. No model-backed comparison was run to create this shortlist.

## Pinned source index

| Candidate ID | Revision | Resource directory |
|---|---|---|
| `hudson-swiftui` | [`f2920b639952`](https://github.com/twostraws/SwiftUI-Agent-Skill/tree/f2920b63995263f57b3e198674e89a602efba6d2) | `swiftui-pro` |
| `avdlee-concurrency` | [`3b1580d8398e`](https://github.com/AvdLee/Swift-Concurrency-Agent-Skill/tree/3b1580d8398e0b5408b3bf0bada0e941a1cfc642) | `skills/swift-concurrency` |
| `avdlee-testing` | [`798e9b1a2bca`](https://github.com/AvdLee/Swift-Testing-Agent-Skill/tree/798e9b1a2bcac164d4f0c781908199e754f0bab6) | `swift-testing-expert` |
| `avdlee-swiftui` | [`62bd760f0050`](https://github.com/AvdLee/SwiftUI-Agent-Skill/tree/62bd760f005093d1e2e4de5db156e456a5f96400) | `skills/swiftui-expert-skill` |
| `ricouard-performance` | [`05ba982bfeb0`](https://github.com/Dimillian/Skills/tree/05ba982bfeb0d77d3c97d4542b0ee15034d05f84) | `swiftui-performance-audit` |
| `ricouard-refactor` | [`05ba982bfeb0`](https://github.com/Dimillian/Skills/tree/05ba982bfeb0d77d3c97d4542b0ee15034d05f84) | `swiftui-view-refactor` |
| `devesa-accessibility` | [`dcc3a36ce1d0`](https://github.com/dadederk/iOS-Accessibility-Agent-Skill/tree/dcc3a36ce1d0099341d545c1af4eb5a8c989bf66) | `ios-accessibility` |
| `emil-swift` | [`64eb3deb9a5f`](https://github.com/emilkowalski/skills/tree/64eb3deb9a5fbfa041faf783e0bc3fd635872e9c) | `skills/write-swift` |
| `catalog-review` | [`8c99fa36d900`](https://github.com/addyosmani/agent-skills/tree/8c99fa36d90068c82d547f7c12a9d67a3e95f4ee) | `skills/code-review-and-quality` |
| `catalog-migrations` | [`8c99fa36d900`](https://github.com/addyosmani/agent-skills/tree/8c99fa36d90068c82d547f7c12a9d67a3e95f4ee) | `skills/deprecation-and-migration` |
| `hudson-concurrency-compat` | [`e710f8d577cc`](https://github.com/twostraws/Swift-Concurrency-Agent-Skill/tree/e710f8d577ccbff1ac047aac1594a5683000cb0b) | `swift-concurrency-pro` |
| `hudson-testing-compat` | [`3d434c7d81f3`](https://github.com/twostraws/Swift-Testing-Agent-Skill/tree/3d434c7d81f35e5726d4363fc30260735d541c2f) | `swift-testing-pro` |
| `axiom-testing` | [`ffafd3b3e0db`](https://github.com/CharlesWiltgen/Axiom/tree/ffafd3b3e0dbaaa60b753ca4a835ae6603b873e1) | `axiom-codex/skills/axiom-testing` |
| `axiom-data` | [`ffafd3b3e0db`](https://github.com/CharlesWiltgen/Axiom/tree/ffafd3b3e0dbaaa60b753ca4a835ae6603b873e1) | `axiom-codex/skills/axiom-data` |
| `axiom-schema-audit` | [`ffafd3b3e0db`](https://github.com/CharlesWiltgen/Axiom/tree/ffafd3b3e0dbaaa60b753ca4a835ae6603b873e1) | `axiom-codex/skills/axiom-audit-database-schema` |
| `axiom-run-tests` | [`ffafd3b3e0db`](https://github.com/CharlesWiltgen/Axiom/tree/ffafd3b3e0dbaaa60b753ca4a835ae6603b873e1) | `axiom-codex/skills/axiom-run-tests` |
| `axiom-architecture-audit` | [`ffafd3b3e0db`](https://github.com/CharlesWiltgen/Axiom/tree/ffafd3b3e0dbaaa60b753ca4a835ae6603b873e1) | `axiom-codex/skills/axiom-audit-swiftui-architecture` |
| `catalog-tdd` | [`8c99fa36d900`](https://github.com/addyosmani/agent-skills/tree/8c99fa36d90068c82d547f7c12a9d67a3e95f4ee) | `skills/test-driven-development` |
| `matt-codebase-design` | [`abeeaf95660b`](https://github.com/mattpocock/skills/tree/abeeaf95660ba9e8b7c753eb38f441ca707a8823) | `skills/engineering/codebase-design` |
