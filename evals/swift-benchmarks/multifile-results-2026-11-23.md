# Multi-file Swift Testing baseline — 2026-11-23

The new case distinguishes LLM grading from native test strength. One no-skill Codex baseline received **5/5** from the LLM grader and passed the correct implementation, but detected only **three of four** injected defects with completed assertions. Its event-identity mutation run timed out and is **incomplete**, so the submission is **not functionally qualified**. No candidate skills or repetitions were run in this batch; there is no skill ranking.

## Frozen challenge and provenance

[Case 401](multifile-testing-v1.json) uses the [inventory-import package](../fixtures/swift-benchmarks/inventory-import/README.md): multiple product files, injected async dependencies, ordered results, atomic validation, cancellation, event payloads and overlapping runs. The executor may add only public API regression tests and a result report. The [design](multifile-testing-design-v1.md) describes bounded artifact capture, frozen replay and limitations. Earlier cases, candidate revisions and grades remain unchanged.

The Architect and implementation Coders did not inspect candidate content. The coordinator had prior candidate context. This is author separation, not a fully blind held-out or model-training blindness claim. The mutation data and canonical tests were frozen outside the executor fixture before this baseline.

- Campaign: `evals/results/swift-benchmarks/2026-11-24T03-25-54-009Z-H3e3D3`, slot `0001` (UTC Nov 24; local Central Nov 23).
- Requested executor: Codex `gpt-5.6-sol`; CLI `0.145.0`; one executor and one grader invocation. Resolved model identity was absent, so evidence remains exploratory and `comparable=false`. The request is not proof of backend identity.
- Base commit: `db2272b26fb7923944e5d2047a3758e2cb8dab63`; reviewed uncommitted harness/fixture inputs were frozen by the campaign.
- Frozen harness SHA-256: `fe608d2b4264db9384e7afda07c42f31fbeb26cc7e4db18a07e38dfb0b0432a6`.
- Generated test SHA-256: `10b033ee32b936bbd137815b0b2afa9fbcc10d05e2a555bef5474731ef52e473`.
- Submission capture was complete, with no supplied-file changes, staging, commits or unexpected added files. Both required artifacts were retained. Raw model output and grades remain unchanged in the local campaign, which is ignored by Git.

## Native results

The executor used two of its three permitted native verification invocations. The final correct implementation completed **seven tests: six generated regressions and one supplied smoke test**. The host then replayed the exact retained artifact using the campaign's frozen checker and inputs, separate from LLM grading.

| Implementation | Completed evidence | Verdict |
|---|---|---|
| Correct | Seven tests pass | Passed |
| Persist before validation | Generated late-validation expectations fail | Assertion kill |
| Unstructured lookup | Generated cancellation expectations fail | Assertion kill |
| Corrupt progress identity | No completed test summary; terminated at the 120-second command limit | Incomplete, no kill credit |
| Return completion order | Generated ordering expectations fail | Assertion kill |

Functional report: `0001/functional-0c2f1a3f-c491-45b6-9f04-7b989279f785/functional-report.json` within the campaign. It records `correct_passed=true`, `killed=3`, `required_kills=4`, `qualified=false`; raw native/discovery logs sit beside it. A separate 360-second outer watchdog did not fire. Native replay cost no additional model calls.

The generated tests wait for a resolved event identified by its expected `sourceIndex` before releasing subsequent gates. The corrupt-identity implementation sends a different index; the wait never reaches the intended assertion and cannot release the remaining work. This demonstrates why deterministic happy-path coordination also needs bounded failure and cleanup behavior when the implementation is faulty. The retained tests were not repaired or regraded after seeing mutations.

## Harness qualification and limits

Before the live baseline, canonical reference tests passed the correct implementation and exposed all four compiling mutations through generated-test assertion failures. Deliberately weak tests passed the correct implementation and survived all four mutations (zero kills), so they did not qualify. The checker rejects zero/incomplete runs and does not count compilation errors, smoke-only failures or timeouts as kills. Fresh review checked both source and native evidence.

Repository Node verification passed **374 tests**, with zero failures, skips or cancellations. Suite validation, dry-run planning and whitespace checks passed. CI runs structural/stub coverage without model calls; native mutation qualification was performed locally and is separate evidence.

Local toolchain: Xcode 27.1, Apple Swift 6.4, macOS 27 host; the package declares macOS 15. The generated result report mentions `arm64e-macos14.0`, a Testing-library log target, which does not establish the host OS or package deployment target.

This is one bounded in-memory import task and one exploratory baseline. It does not establish production persistence correctness, broad Swift skill effectiveness or reproducibility across identified models. A suitable next experiment is a budgeted comparison of the three pinned testing candidates on this unchanged task, retaining both LLM and functional results. Do not count the incomplete baseline mutation as detected, and do not change this task or its mutations to favor a candidate.
