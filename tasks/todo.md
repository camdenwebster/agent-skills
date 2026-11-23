# Native iOS/Swift task index

Authoritative task status, acceptance criteria, verification and blocking links are in [Linear MOV-250](https://linear.app/mothersound/issue/MOV-250/adapt-agent-skills-fork-for-native-ios-and-swift-development). This file is an index, not a second status checklist. All 25 required implementation tasks were filed as Todo on 2026-11-23.

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

Research task 00 completed before filing; see swift-research.md. Optional SwiftFairy experiment OPT-01 remains deferred and requires a separate request. It is not a required child or blocker.

Work the unblocked frontier, starting with MOV-251. Preserve M1/M2/M3 evidence review gates in plan.md. All custom work stays in camdenwebster/agent-skills; upstream supplies inbound updates only.

Additional early selection work: [MOV-276 — controlled Swift comparison pilot](https://linear.app/mothersound/issue/MOV-276/create-a-controlled-swift-skill-comparison-benchmark-pilot). This supplements the original plan and is independent of MOV-275's final integration gate.
