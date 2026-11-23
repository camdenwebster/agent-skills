# Plan: Native iOS and Swift support for agent-skills

Status: Plan and recommended scope decisions accepted by the user on 2026-11-23. Source research and tracking setup are complete. Native skill adaptation remains planned; the separate early benchmark pilot is implemented under MOV-276.
Repository: camdenwebster/agent-skills (local checkout: ~/dev/agent-skills)
Source baseline: 8c99fa36d90068c82d547f7c12a9d67a3e95f4ee
Task source: Linear Mothersound / MovingBox team, epic MOV-250 (https://linear.app/mothersound/issue/MOV-250/adapt-agent-skills-fork-for-native-ios-and-swift-development). Local task IDs map to Linear child issues; Linear owns task status and dependencies.

## Outcome

An agent receiving an iOS/Swift task selects native implementation, verification, accessibility, performance and delivery procedures, while existing web workflows continue to work. The procedures distinguish source review, compilation, executed tests, simulator validation, physical-device evidence and distribution. Unsupported or unperformed checks are reported explicitly.

## Accepted decisions

1. Preserve web support and published skill identifiers; introduce native paths. Confirmed by the user on 2026-11-23.
2. Keep three levels separate: universal workflow, platform-specific procedure, consuming-project policy. MovingBox's CloudKit schema restrictions, test plans, simulator preference and Mock-AI arguments are project policy, not defaults for all Swift apps.
3. Extend existing skills with concise platform selection and references loaded on demand. Introduce a native runtime-testing skill only if fork-local overlap and workflow review confirms a distinct gap. Leave the explicitly browser-scoped skill and /webperf intact; route native requests separately.
4. Discover actual project/tool capabilities. Record Xcode/compiler, Swift language/concurrency settings, SDK/deployment target, project/workspace/package, scheme, test plans, runtime/destination, launch arguments and artifact paths. Do not hard-code a simulator or infer availability from current documentation alone.
5. Make structured concurrency part of native correctness: isolation, Sendable boundaries, task ownership, cancellation, error propagation and test isolation. Do not impose an application architecture or perform a MovingBox refactor.
6. Keep Node-based repository tooling. A JavaScript validator can validate Swift-targeted procedures. Do not introduce a runtime plugin framework or machine-readable platform configuration until a concrete consumer requires it.
7. Preserve whole-repo shared references. Any newly advertised per-skill install must carry all required native resources or clearly retain the existing documented limitation; do not add silently broken sibling dependencies.

## Scope and exclusions

Scope: skills, references, relevant personas and command wrappers, native fixtures/evaluations, documentation and maintainer checks.
Excluded: modifying MovingBox, deploying or releasing an app, installing these skills globally, opening upstream pull requests, replacing all examples, converting maintainer tools to Swift, prescribing mutation tooling without evidence, or building a nightly exploration system.

## Milestones and dependency order

M0: source grounding completed (00), then compatibility and fixture feasibility (01).
M1: native task proven end to end (02 -> 03 -> 04 -> 05); independent guard hardening (06 -> 07).
M2: native UI quality (08, 08b, 09, 10); delivery/data compatibility (11, 12); supporting guidance (13, 14, 15).
M3: host integration, installation and complete evaluation (16 -> 17 -> 18).

Each task has at most three acceptance criteria in todo.md and a focused file scope. Implement tasks in small reviewable changes. If a slice exceeds five files, split its core, reference/fixture and host-propagation changes before implementation. Changes to the same router, shared checklist or eval runner are sequential. Independent content slices can proceed in parallel once M1 establishes the procedure contract.

## Milestone gates

- M0: additive native support and stable published names are accepted. Complete source research, reconcile conflicting guidance, and check the inherited catalog, fork issues and rejection ledger before creating skills or commands; no upstream-contribution approval is needed.
- M1: one isolated Swift package and one tiny iOS app fixture demonstrate tool discovery, fail-first test, fix, real nonzero execution, preserved result artifacts and honest unavailable-tool reporting. Explicit negative controls fail. Existing web routing remains green. Review this evidence before broad edits.
- M2: native UI, data and release cases choose the correct platform path. MovingBox rules are demonstrated only through a project-policy fixture. Manual accessibility and representative device performance remain distinct from simulator/automated evidence.
- M3: deterministic checks pass, scoped behavioral evaluations pass, command bodies are reviewed across hosts, and installation resources resolve. No shipping claim follows from a plan or simulator build.

## Source-grounded refinements

- Use AvdLee's settings intake/testing procedures, Apple's versioned SwiftUI guidance, Hudson's scoped review checks, Devesa's accessibility intake and trace-driven performance procedures from AvdLee/Ricouard/Axiom. Pin individual source rules and retain notices where adaptation is permitted.
- Reconcile conflicting rules against Apple documentation and executable fixtures before adoption. Add serialized-suite, confirmation lifetime, explicit cancellation readiness and unavailable-API cases.
- Add native motion review and a focused String Catalog/localization slice. Keep project architecture preferences and newest-SDK rules contextual.
- Apple bundled skills remain versioned first-party references/export candidates; no MIT republication permission was established. Private paid skills are excluded from the public pack/eval corpus.
- SwiftFairy is an optional deferred reviewer trial, not required verification or CI. Research found no independent comparative effectiveness benchmark; task 18 must establish our actual outcomes.

## Validation strategy

Baseline already run on the source commit: validate-skills, validate-commands, validate-reference-links all pass; routing evals report 164 checks passed, 107/107 positive prompts rank first. These are structural/routing evidence only, not native behavioral proof.

Required deterministic commands after applicable implementation slices:

```bash
node scripts/validate-skills.js
node scripts/validate-reference-links.js
node scripts/validate-commands.js
node scripts/validate-artifact-paths.js
node scripts/validate-versions.js
node scripts/run-evals.js --min-rank1 95
node --test scripts/floor-guard-reference-test.js scripts/quality-gate-test.js
bash hooks/session-start-test.sh
```

Run modified validator tests and existing CI checks appropriate to each change. Command parity checks compare presence/descriptions, not equivalent native behavior in wrapper bodies; review and evaluate those bodies separately.

Native validation has two levels: Linux-safe routing/report/guard fixtures using realistic native artifacts; macOS execution of actual Swift and iOS fixtures. The former never substitutes for the latter. Record exact toolchain, destination and executed test counts. Preserve xcodebuild status through formatting pipes. No tests, missing destination, unsupported capability, malformed/incomplete artifacts and permission denial cannot count as passes. Keep fixtures disposable and independent of personal device/app data.

Behavioral evaluation uses the existing runner and scoped cases, with evidence stored for comparison. Record actual agent/tool versions and repeated results before changing routing broadly. Existing web cases remain. Model-backed evals incur usage and are not run as part of writing this plan.

## Risks and mitigations

- Routing overlap: test Swift/iOS positives and adjacent web/server negatives; do not rename published skills casually.
- Excess prompt size: short branch selection, references on demand, no duplicated native checklist in every skill.
- False confidence: test deliberate bad states and clean controls; distinguish automated, manual and physical-device evidence.
- Regex guard limitations: declare supported forms; add real Git-diff fixtures and avoid claiming semantic completeness.
- Platform/version drift: discover installed tools and availability; record versions with artifacts; keep commands capability-based.
- Destructive persistence advice: consuming-project policy overrides generic expand/contract; prove historical upgrade compatibility.
- Wrapper/reference drift: update all host representations and test bodies, not just command names.
- App release expectations: distinguish containment, new distribution and installed adoption; source rollback is not installed binary rollback.

## Research and remaining implementation checks

- Scope confirmed: retain web support with native paths and work only in the personal fork https://github.com/camdenwebster/agent-skills. The original https://github.com/addyosmani/agent-skills is retained as upstream for inbound synchronization only. No upstream contributions or pull requests are planned.
- See [swift-research.md](swift-research.md) for source roles, provenance, limitations and concrete changes to this plan.
- Existing runner's macOS/Xcode capability and native fixture staging support must be verified during task 01; extend only where required.

The plan is approved; tracking and fork setup are complete, and implementation has not started. No current MovingBox issue or workflow pointer is repurposed.

## Fork maintenance policy

- User decision on 2026-11-23: all custom work lives in camdenwebster/agent-skills; no contribution upstream is planned.
- Local checkout: ~/dev/agent-skills. origin points to the personal fork; upstream points to addyosmani/agent-skills. Git push and gh default to the personal fork.
- Sync is inbound and deliberate: fetch upstream, review changes, merge upstream/main into the fork on a maintenance branch, resolve conflicts, run the fork validation suite, then deliver only to origin. Avoid resetting fork history or using an overwrite sync that discards native changes.
- Preserve inherited skill identifiers where practical and maintain native regression fixtures to detect upstream drift. Upstream contributor-specific PR/preflight rules do not apply to this fork-only delivery policy.

## Linear issue index

| Plan task | Linear issue | Delivery | Blocked by |
|---|---|---|---|
| 01 | [MOV-251](https://linear.app/mothersound/issue/MOV-251/agent-skills-01-confirm-platform-contract-and-fixture-feasibility) | Confirm platform contract and fixture feasibility | None; research complete |
| 02 | [MOV-252](https://linear.app/mothersound/issue/MOV-252/agent-skills-02-swift-package-test-first-procedure) | Swift package test-first procedure | MOV-251 |
| 03 | [MOV-253](https://linear.app/mothersound/issue/MOV-253/agent-skills-03-native-runtime-workflow-and-ios-fixture-contract) | Native runtime workflow and iOS fixture contract | MOV-252 |
| 04 | [MOV-254](https://linear.app/mothersound/issue/MOV-254/agent-skills-04-execute-the-native-app-fixture-with-meaningful-ui) | Execute the native app fixture with meaningful UI assertions | MOV-253 |
| 05 | [MOV-255](https://linear.app/mothersound/issue/MOV-255/agent-skills-05-route-native-tasks-to-the-proven-workflow) | Route native tasks to the proven workflow | MOV-254 |
| 06 | [MOV-256](https://linear.app/mothersound/issue/MOV-256/agent-skills-06-recognize-swift-test-and-assertion-weakening) | Recognize Swift test and assertion weakening | MOV-251 |
| 07 | [MOV-257](https://linear.app/mothersound/issue/MOV-257/agent-skills-07-native-configuration-constraints-and-runtime-budgets) | Native configuration constraints and runtime budgets | MOV-252, MOV-256 |
| 08 | [MOV-258](https://linear.app/mothersound/issue/MOV-258/agent-skills-08-swiftui-implementation-and-refactoring-correctness) | SwiftUI implementation and refactoring correctness | MOV-255 |
| 08b | [MOV-259](https://linear.app/mothersound/issue/MOV-259/agent-skills-08b-native-localization-and-string-catalog-workflow) | Native localization and String Catalog workflow | MOV-255, MOV-258 |
| 09 | [MOV-260](https://linear.app/mothersound/issue/MOV-260/agent-skills-09-native-accessibility-audit) | Native accessibility audit | MOV-254, MOV-258 |
| 10 | [MOV-261](https://linear.app/mothersound/issue/MOV-261/agent-skills-10-native-performance-measurements) | Native performance measurements | MOV-254 |
| 11 | [MOV-262](https://linear.app/mothersound/issue/MOV-262/agent-skills-11-native-release-containment-and-ci-guidance) | Native release containment and CI guidance | MOV-254, MOV-257 |
| 12 | [MOV-263](https://linear.app/mothersound/issue/MOV-263/agent-skills-12-persistence-compatibility-and-consuming-project-policy) | Persistence compatibility and consuming-project policy | MOV-262 |
| 13 | [MOV-264](https://linear.app/mothersound/issue/MOV-264/agent-skills-13-native-security-and-dependencies) | Native security and dependencies | MOV-251 |
| 14 | [MOV-265](https://linear.app/mothersound/issue/MOV-265/agent-skills-14-native-observability) | Native observability | MOV-261, MOV-264 |
| 15a | [MOV-266](https://linear.app/mothersound/issue/MOV-266/agent-skills-15a-swift-api-contracts-and-source-authority) | Swift API contracts and source authority | MOV-252 |
| 15b | [MOV-267](https://linear.app/mothersound/issue/MOV-267/agent-skills-15b-native-context-and-specification-templates) | Native context and specification templates | MOV-255, MOV-266 |
| 15c | [MOV-268](https://linear.app/mothersound/issue/MOV-268/agent-skills-15c-native-documentation-review-and-planning-examples) | Native documentation, review and planning examples | MOV-266, MOV-267 |
| 16a | [MOV-269](https://linear.app/mothersound/issue/MOV-269/agent-skills-16a-synchronize-constraints-command-behavior) | Synchronize constraints command behavior | MOV-257 |
| 16b | [MOV-270](https://linear.app/mothersound/issue/MOV-270/agent-skills-16b-synchronize-accessibility-command-behavior) | Synchronize accessibility command behavior | MOV-260 |
| 16c | [MOV-271](https://linear.app/mothersound/issue/MOV-271/agent-skills-16c-integrate-native-runtime-and-performance-entry-points) | Integrate native runtime and performance entry points | MOV-255, MOV-261 |
| 16d | [MOV-272](https://linear.app/mothersound/issue/MOV-272/agent-skills-16d-synchronize-shipping-command-behavior) | Synchronize shipping command behavior | MOV-262, MOV-263 |
| 17a | [MOV-273](https://linear.app/mothersound/issue/MOV-273/agent-skills-17a-shared-checklist-consistency) | Shared checklist consistency | MOV-258, MOV-259, MOV-260, MOV-261, MOV-262, MOV-263, MOV-264, MOV-265, MOV-266, MOV-267, MOV-268 |
| 17b | [MOV-274](https://linear.app/mothersound/issue/MOV-274/agent-skills-17b-catalog-adoption-and-resource-packaging) | Catalog, adoption and resource packaging | MOV-269, MOV-270, MOV-271, MOV-272, MOV-273 |
| 18 | [MOV-275](https://linear.app/mothersound/issue/MOV-275/agent-skills-18-end-to-end-evaluation-and-handoff) | End-to-end evaluation and handoff | MOV-251, MOV-252, MOV-253, MOV-254, MOV-255, MOV-256, MOV-257, MOV-258, MOV-259, MOV-260, MOV-261, MOV-262, MOV-263, MOV-264, MOV-265, MOV-266, MOV-267, MOV-268, MOV-269, MOV-270, MOV-271, MOV-272, MOV-273, MOV-274 |

## Early skill-selection benchmark pilot

MOV-276 adds an independently authored comparison suite before the final integration evaluation in MOV-275. It compares explicit individual skill guidance with a baseline on matched tasks, not automatic routing or whole skill ecosystems. See ../evals/swift-benchmarks/README.md for cases, pins, provenance checks, repeated-run procedure and interpretation. Source review, Swift package validation and a model-backed effectiveness campaign remain separate evidence levels. No actual candidate winner is established by harness tests or dry-run validation.
