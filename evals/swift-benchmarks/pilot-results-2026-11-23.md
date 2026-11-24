# First live Swift Testing pilot

Eight Codex executor attempts and eight grader calls completed on 2026-11-23: one repetition of original cases 3 and 4 for baseline and three pinned testing skills. These are exploratory observations, not a qualified effectiveness ranking.

| Arm | Async repair | Serialization review | Critical failures |
| --- | --- | --- | --- |
| Baseline | 5/5 | 3/5 | 0 |
| AvdLee testing | 5/5 | 3/5 | 0 |
| Hudson testing compatibility pin | 5/5 | 2/5 | 1 |
| Axiom testing | 5/5 | 3/5 | 0 |

All four repair traces contain the scoped `async throws` test edit and three passing Swift Testing tests; product code remained unchanged. Test execution required writable cache paths and disabling SwiftPM's nested sandbox inside the outer Codex workspace sandbox. The XCTest zero-test preamble was separate from the three executed Swift Testing tests.

All four review attempts left tracked source unchanged and wrote their assessment. Baseline, AvdLee and Axiom correctly rejected the central claim but omitted the individual nonparameterized-test distinction and authoritative documentation or explicit source-verification limits.

The Hudson snapshot at `3d434c7d81f35e5726d4363fc30260735d541c2f` accepted the incorrect claim that suite-level serialization does not cover ordinary tests. Its trace read the skill reference containing that same guidance. [Apple's documentation](https://developer.apple.com/documentation/testing/parallelization.md) states that suite application serializes contained test functions and subsuites. This finding concerns the tested historical revision, not every release or skill by its author. Do not adopt that snapshot unchanged.

The human review examined all eight final captures and relevant execution evidence against the grades; no grade was changed. Serialization was deliberately a known source-conflict probe, not an unseen general-quality test. No tested skill showed an advantage over baseline on the simple repair case.

## Provenance and limitations

- Repository revision: `85ab2853c52ad31c2ac791331fc9594ebc9da26c`; original suite, fixtures and pins are recorded in each campaign manifest.
- Requested model: `gpt-5.6-sol`, listed by the installed CLI's `model/list`. Codex CLI 0.145.0, Swift 6.4, Xcode 27.1, arm64 macOS.
- Resolved executor identity was absent; grader identity was unknown. Both reports correctly retained `comparable=false`. Requested model and catalogue availability are not resolved identity.
- An initial four-attempt `gpt-6.2-sol` batch was rejected before evaluation. Those attempts are incomplete/unscored and excluded from the table.
- Scores count rubric expectations, not independent samples. One repetition and two cases do not support a general skill ranking. Grading used the same requested model as execution and is not an independent functional oracle.
- Usage telemetry is executor-only; complete monetary cost is unknown. No Claude comparison, simulator/device evaluation, paid skill installation or full campaign ran.

Raw traces, frozen inputs, manifests, workspace captures and the full human review remain in ignored local artifacts:

- `evals/results/swift-benchmarks/2026-11-23T22-23-53-190Z-zW4Dwa/` — async repair.
- `evals/results/swift-benchmarks/2026-11-23T22-30-21-095Z-vKQelm/` — serialization review and `pilot-review.md`.
- `evals/results/swift-benchmarks/2026-11-23T22-22-51-204Z-WJoNV0/` — rejected-model diagnostics.

Durable tracker checkpoint: [MOV-276](https://linear.app/mothersound/issue/MOV-276/create-a-controlled-swift-skill-comparison-benchmark-pilot). Follow-up hardening and additional testing cases: [MOV-277](https://linear.app/mothersound/issue/MOV-277/harden-swift-skill-eval-provenance-and-add-deeper-testing-cases). The original records and grades remain unchanged.
