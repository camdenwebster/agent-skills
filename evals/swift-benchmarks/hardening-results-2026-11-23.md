# Swift Testing hardening and smoke result — 2026-11-23

[MOV-277](https://linear.app/mothersound/issue/MOV-277/harden-swift-skill-eval-provenance-and-add-deeper-testing-cases) adds model-catalogue preflight, explicit exploratory Codex runs, stricter observed-identity extraction and a separate four-case testing extension. The original suite, candidate pins, fixtures and first-pilot grades remain unchanged.

## Verification

- Final full Node suite: 359 tests passed, zero failures/skips. Catalogue failure paths, lifecycle identity conflicts, exploratory metadata, runtime-profile validation and native-log completion rejection have regression coverage.
- A fresh reviewer confirmed the provenance conflict fix and found no remaining blockers in scope.
- Existing skill, version, reference, command, artifact and routing checks passed. Both suites validate.
- Native qualification used disposable fixture copies: confirmation defect failed, its canonical repair and clean control passed; the dependency defect failed in a filtered single-function probe, while its repair and clean control each passed two test functions with three parameter argument markers. Build caches were absent from the source fixture roots.

## Four-attempt live smoke

Case 201 of `swift-testing-extension-v1`, one repetition, Codex CLI 0.145.0, requested `gpt-5.6-sol`, `--exploratory`, runtime profile `swiftpm-isolated-v1`:

| Arm | Expectations passed | Critical failures |
| --- | --- | --- |
| baseline | 5/5 | 0 |
| avdlee-testing | 5/5 | 0 |
| hudson-testing-compat | 5/5 | 0 |
| axiom-testing | 5/5 | 0 |

Four executor attempts and four grader calls completed. Manual review of every saved diff and relevant command result confirmed the same scoped lifetime repair, unchanged product implementation and a real two-function Swift Testing pass through the supplied wrapper. No wrapper/setup failure was observed. The baseline also reproduced the intended pre-edit confirmation failure. AvdLee additionally repeated its test command twenty times within its single attempt; these are not independent benchmark repetitions.

The model catalogue probe ran before scheduling rows and retained sanitized advertised names, collection time and a raw-catalogue hash. It confirmed only that the requested model was CLI-listed. Resolved executor identity was still absent and grader identity unknown; the report correctly remains `comparable=false`. Neither the catalogue nor the exploratory flag is a substitute for observed identity.

All four arms passing shows no observed skill advantage on this task. This new case and its clearer verification contract are not a repeat of original case 4 and do not overturn the historical Hudson serialization failure. The other three extension cases were qualified natively but have not received model-backed comparisons in this smoke. No blind held-out result, overall winner, Claude comparison, native UI/device qualification or complete monetary bill is claimed.

## Evidence

- Local ignored campaign: `evals/results/swift-benchmarks/2026-11-23T22-51-42-755Z-nTrCfo/` (manifest, report, frozen inputs, per-attempt records/grades and captures).
- Harness SHA-256: `a68da1aea31b97748f08a8721222661eacd3758c833d94035a45ecc04cb7c34d`.
- Suite SHA-256: `39f54f49329776992cb64a11f91a9c8e19c6ec8cefa81b01bb1d7b2f37686c28`.
- Execution used Swift 6.4 / Xcode 27.1; see the manifest for exact toolchain/platform values.
- The source changes and this summary are versioned together; raw candidate-containing traces remain local.

Next evaluation scope: the two clean controls and the dependency-isolation repair, with per-case observations and no ranking inferred from matching requested model strings.
