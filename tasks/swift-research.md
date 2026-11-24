# Swift grounding research

Researched 2026-11-23. Three subagents examined expert packs, Apple/Xcode, and mobile design/paid tooling. Parent additionally inspected Axiom's source and public Point-Free materials. This is source research, not a comparative runtime benchmark. No skills were installed, no app was built, and no product was purchased or trial activated.

## Recommended source roles

| Source | Role in our plan | Adoption boundary |
|---|---|---|
| Apple bundled Xcode skills and documentation | First-party SwiftUI dataflow/identity, availability, native system contracts, evaluated security settings and localization | Discover locally and record Xcode build; use export/import where appropriate. No MIT redistribution grant established by inspection. |
| Paul Hudson's SwiftUI, concurrency and testing skills | Focused anti-patterns and Swift-specific review examples | Curate individual rules; reconcile with Apple and compile/test supported examples. |
| Antoine van der Lee's SwiftUI, concurrency and testing skills | Project discovery and deeper focused references | Curate instead of loading overlapping packs into every task; keep architecture preferences contextual. |
| Axiom | Native diagnostics, async testing, profiling decision trees and build/test evidence | MIT; adapt selected procedures and preserve notice. Do not import the entire orchestration system or automatic cleanup behavior. |
| Emil Kowalski | Interaction/motion review and additional Swift counterexamples | MIT; translate design intent, not web/Expo implementation or taste-based absolutes. |
| Nil Coalescing SwiftFairy | Optional local specialist code reviewer via MCP | Paid tool; no redistribution grant found. Evaluate separately if requested; never required for open-source CI. |
| Point-Free Way | Optional consuming-project library expertise | Paid/internal-use skills; exclude private skill text from this public pack and its evaluation corpus. Public library docs remain independent sources. |

## Apple: actual bundled skills, not only community mirrors

Read-only inspection found selected Xcode 27.1 (27A9275) at /Applications/Xcode-27.1.0.app. The installed xcrun agent skills command supports export; help lists --output-dir and --replace-existing. No export was performed.

The IDEIntelligenceChat.framework resource directory includes SwiftUI specialist, SwiftUI OS-27 changes, App Intents specialist/OS-27 changes, resizability, document-app, security-settings and C bounds-safety templates and supporting references. SwiftUI topics worth structuring around: dataflow/invalidation, narrow inputs, view identity, environment and localization. Treat SDK-new APIs as a separate versioned path. String Catalog translation/coordinator skills are under IDE­XCStringsSupport.framework; this exposed a localization gap in the initial plan. The inventory was not an exhaustive export count.

Separate AdditionalDocumentation files cover framework updates; they are not all discoverable skills. Xcode MCP tools are another layer and require capability/permission discovery. Apple-template tool restrictions can assume an Xcode-scoped environment and should not become universal rules in a portable pack.

Sources: [Apple agent customization](https://developer.apple.com/documentation/xcode/extending-and-customizing-agents), [WWDC26 SwiftUI skill export discussion](https://developer.apple.com/videos/play/wwdc2026/269/?time=1588), [external-agent Xcode access](https://developer.apple.com/documentation/xcode/giving-external-agents-access-to-xcode). The inspected resources had no standalone permissive license; official export support does not establish permission to republish them under MIT. Community exports must not be presented as an Apple-maintained open-source release.

## Axiom: operational procedures and evidence handling

Inspected checkout: CharlesWiltgen/Axiom at ffafd3b3e0dbaaa60b753ca4a835ae6603b873e1. MIT license verified. The native testing guidance distinguishes Swift Testing logic tests from XCTest UI/performance uses, explains confirmation scope and parallel shared-state hazards. Profiling selects tools by symptom, then measures a reproducible flow. These are useful procedure shapes for tasks 02–04 and 10.

Its axbuild tool separates child command status from artifact collection completeness, retains full logs, handles ambiguous counts conservatively and supplies native fixtures. Inspect this existing approach before inventing a wrapper. Toolchain coverage is explicit and limited; we did not run its suite or prove compatibility with our selected Xcode.

Its quality page describes pressure testing, but the stated headline and enumerated validation coverage differ. Treat these as maintainer-reported evidence, not a universal comparative effectiveness result. Some debugging guidance uses unsupported prevalence claims and cleanup-first assumptions. Our procedures must preserve current evidence and inspect scope before cleaning caches, erasing simulators or terminating processes.

Sources: [repository](https://github.com/CharlesWiltgen/Axiom), [license](https://github.com/CharlesWiltgen/Axiom/blob/ffafd3b3e0dbaaa60b753ca4a835ae6603b873e1/LICENSE), [async testing](https://github.com/CharlesWiltgen/Axiom/blob/ffafd3b3e0dbaaa60b753ca4a835ae6603b873e1/axiom-codex/skills/axiom-testing/skills/testing-async.md), [axbuild](https://github.com/CharlesWiltgen/Axiom/blob/ffafd3b3e0dbaaa60b753ca4a835ae6603b873e1/tools/axbuild/README.md), [reported quality process](https://github.com/CharlesWiltgen/Axiom/blob/ffafd3b3e0dbaaa60b753ca4a835ae6603b873e1/docs/start/quality.md).

## Concrete source conflict: test serialization

Hudson's inspected concurrency testing reference says a serialized suite affects only parameterized tests. Apple's current documentation says the suite runs contained test functions and subsuites serially, including ordinary tests. The nonparameterized individual-test case is different: applying the trait there has no effect. Do not propagate the suite claim. Add an executable suite-level example and distinct negative controls; do not infer test order guarantees beyond the documented scope.

Sources: [Hudson reference](https://raw.githubusercontent.com/twostraws/Swift-Concurrency-Agent-Skill/main/swift-concurrency-pro/references/testing.md), [Apple parallelization documentation](https://developer.apple.com/documentation/testing/parallelization.md). Source checked 2026-11-23; repository content may change. Other examples involving scheduling/yield and callback completion also require deterministic readiness rather than sleep-based confidence.

## Emil: mixed web, React Native and native Swift

Inspected revision: 64eb3deb9a5fbfa041faf783e0bc3fd635872e9c. The reviewer observed 58,978 GitHub stars and a November 15 last-push date on November 23; adoption/activity are not effectiveness measurements. MIT license, 20 skill entries; no eval/test directory was found in the inspected tree.

animate-expo is specifically Reanimated/Gesture Handler/Expo; apple-design deliberately translates Apple talks into web implementation; write-swift is a native Swift skill. The transferable motion checklist is purpose, system defaults, continuity, interruption/reversal, velocity handoff, reduced motion, haptics and representative hardware verification. Keep Expo worklets, JS-thread recipes and CSS/Pointer Events implementation separate. Exact timing/spring values, frequency-based animation bans and no-hover statements are contextual design judgments. iPad pointer/keyboard support prevents a blanket touch-only policy. Swift concurrency recommendations must follow discovered settings, not automatically enable new defaults.

Sources: [pack](https://github.com/emilkowalski/skills), [animate-expo](https://github.com/emilkowalski/skills/blob/64eb3deb9a5fbfa041faf783e0bc3fd635872e9c/skills/animate-expo/SKILL.md), [apple-design](https://github.com/emilkowalski/skills/blob/64eb3deb9a5fbfa041faf783e0bc3fd635872e9c/skills/apple-design/SKILL.md), [write-swift](https://github.com/emilkowalski/skills/blob/64eb3deb9a5fbfa041faf783e0bc3fd635872e9c/skills/write-swift/SKILL.md).

## SwiftFairy: optional tool experiment

The Nil Coalescing product is SwiftFairy, a macOS app that exposes local review to agents through MCP. Public documentation describes knowledge Scrolls for SwiftUI behavior, layout/resizability, Charts and modern Swift, with cross-file review. The reported 350+ issue patterns and token savings are vendor claims, not results measured here. A license to use the product is not permission to vendor its knowledge into this repository.

Public prices checked 2026-11-23: Proper SwiftUI lifetime $140 during the 30% sale (regular $200); Modern Swift lifetime $70 (regular $100). Fixed-term and subscription options also exist; purchase page offers a one-day trial per Scroll. Pricing and availability can change. No purchase is needed for the initial native milestone.

If requested later, test it on independently authored faulty and clean code: state ownership, stable identity, view invalidation, layout, actor isolation and availability. Compare actionable correct findings, false positives, applied-fix compilation, effort and measured usage against our existing review procedure. Keep paid output outside redistributable skill/eval text unless permitted. Public examples may identify test categories; they are not a benchmark corpus to copy wholesale.

Sources: [product](https://tools.nilcoalescing.com/swiftfairy/), [usage/MCP](https://tools.nilcoalescing.com/swiftfairy/how-to-use/), [pricing](https://tools.nilcoalescing.com/swiftfairy/purchase/), [public SwiftUI examples](https://tools.nilcoalescing.com/swiftfairy/proper-swiftui/).

## Point-Free: useful project integration, separate distribution boundary

Public materials describe a subscription skill collection tightly aligned with Point-Free libraries and controlled dependencies/testability. The CLI is MIT; the separately installed skill documents have different terms. The locally inspected skill license restricts redistribution and AI evaluation/training use; private skill content was not used as our design/evaluation corpus. Keep these skills optional and external for licensed project use. For open implementation references, use the libraries' independently licensed public documentation/source.

Sources: [public product](https://www.pointfree.co/the-way), [public CLI](https://github.com/pointfreeco/pfw). This recommendation does not require buying or updating anything.

## Changes to the approved plan

1. Add source/provenance and conflict reconciliation before native implementation. For every adopted rule record URL, revision/Xcode build, supported API/toolchain scope, license/notice and its independent fixture.
2. Ground SwiftUI guidance in Apple dataflow/identity/environment categories; use Hudson/van der Lee as complementary review sources, not concurrent competing routers.
3. Add test cases for serialized-suite scope, callback confirmation lifetime, cancellation with explicit readiness, unavailable APIs and false-green async assertions.
4. Inspect Axiom's native evidence format before adding infrastructure; require owned-process recovery and never copy global cleanup commands as routine verification.
5. Add motion/interaction review to task 08 and String Catalog/localization as a focused slice. Keep newest-SDK advice separated from universal rules.
6. Keep SwiftFairy as a deferred optional trial after milestone M1, not a dependency. No comparative result is claimed before the controlled trial.

## Effectiveness validation to run during implementation

Use small, independently authored faulty and clean fixtures. Hold task, model, toolchain, repository state and budgets constant; compare the existing workflow with the selected native guidance. Record actual compiler/test/UI evidence, unnecessary edits, false positives and repeated outcomes. Stars, author reputation, content volume and self-reported validation do not replace this comparison. Do not include private paid skill text in evaluation input. Initial conditions: suite serialization, escaping async work/confirmation, actor isolation/cancellation, SwiftUI identity/state, adaptive layout/localization and native artifact completeness.

## Expert-pack comparison and pinned source ledger

The reviewer inspected actual skills/references, not only catalog descriptions. The repositories below report MIT licensing; retain the applicable notice with any substantive adapted material. Pins identify the reviewed snapshot, not a promise of ongoing correctness.

| Repository | Reviewed revision | Selected contribution and caveat |
|---|---|---|
| [Hudson SwiftUI](https://github.com/twostraws/SwiftUI-Agent-Skill) | f2920b63995263f57b3e198674e89a602efba6d2 | Broad scoped review with topic references loaded as needed; discover current project targets rather than copying hard-coded baselines. |
| [Hudson concurrency](https://github.com/twostraws/Swift-Concurrency-Agent-Skill) | bee3f69ba17142da148d3c5406f148ed62592b69 | Reentrancy, ownership/cancellation and continuation review; reconcile the suite-serialization defect noted above. |
| [AvdLee concurrency](https://github.com/AvdLee/Swift-Concurrency-Agent-Skill) | 3b1580d8398e0b5408b3bf0bada0e941a1cfc642 | Primary procedural intake: settings, exact diagnostic/symbol, isolation boundary, smallest safe change and invariants for unsafe escapes. |
| [AvdLee testing](https://github.com/AvdLee/Swift-Testing-Agent-Skill) | 798e9b1a2bcac164d4f0c781908199e754f0bab6 | Framework boundaries, dependency isolation, parameterization and incremental migration; retain our actual-execution evidence gates. |
| [AvdLee SwiftUI](https://github.com/AvdLee/SwiftUI-Agent-Skill) | 62bd760f005093d1e2e4de5db156e456a5f96400 | State/invalidation without mandatory application architecture; trace helpers and Python helper tests. Helper tests do not prove general agent effectiveness. |
| [AvdLee build optimization](https://github.com/AvdLee/Xcode-Build-Optimization-Agent-Skill) | 6bd7b596cd688b1127ded00e812b1b6937ec35d6 | Distinguish clean/cached/zero-change/edit builds; same destination/warmups, repeated runs and medians/spread with raw artifacts. Each standalone skill carries resources; don't import the orchestrator automatically. |
| [Ricouard skills](https://github.com/Dimillian/Skills) | 05ba982bfeb0d77d3c97d4542b0ee15034d05f84 | Trace-backed performance and repeat captures; MV-over-MVVM and style preferences yield to project architecture. |
| [Devesa accessibility](https://github.com/dadederk/iOS-Accessibility-Agent-Skill) | dcc3a36ce1d0099341d545c1af4eb5a8c989bf66 | Intake includes UI framework/target/design system/localization; covers native assistive technologies and shared controls. Checklists do not establish runtime/manual verification. |

Snapshot popularity observed by the reviewer: Hudson SwiftUI about 6.6k stars, AvdLee SwiftUI about 3.9k, Ricouard about 4.0k. These rounded live observations are selection signals, not install counts or quality scores. No comparable independently controlled end-to-end effectiveness benchmark was located in the inspected core packs.

Plan mapping: AvdLee intake/testing -> 01/02/06/07/15a; Apple plus Hudson -> 08/15b; AvdLee/Ricouard/Axiom profiling -> 10/14; Devesa -> 09/16b; build benchmark/resource contracts -> 11/17b; controlled comparisons -> 18.
