# Swift evals on demand

Status: dormant tooling, not an active campaign. The starting skill decision is [qualitative](../../tasks/swift-starting-set.md). No model calls are scheduled automatically. See [the complete runner guide](README.md) for resource policy, provenance, runtime profiles and interpretation.

## Choose the smallest useful task

| Need | Suite and case |
|---|---|
| Concurrency, SwiftUI, accessibility, persistence, evidence, performance or architecture review | `suite.json`, choose the relevant problem/control pair from README |
| Async confirmation or injected-dependency test repairs | `testing-extension.json`, cases 201/203 |
| Source-preserving reviews of those testing cases | `testing-review-controls-v2.json`, cases 302/304; do not pool with original 202/204 |
| Multi-file test authoring with independent native strength checks | `multifile-testing-v1.json`, case 401; [contract/design](multifile-testing-design-v1.md) |

## Prepare, inspect, then explicitly run

From the repo root, choose one engine, an exact supported model ID, a case and a fixed candidate revision. Both Claude Code and Codex are supported; neither is needed merely to validate the suite. Replace the uppercase placeholders below. Do not interpret dry-run success as model availability or native execution.

```bash
node scripts/run-swift-benchmarks.js --suite evals/swift-benchmarks/multifile-testing-v1.json --validate

# Optional candidate preparation, not skill installation:
git clone https://github.com/AvdLee/Swift-Testing-Agent-Skill.git /tmp/avdlee-testing-benchmark
git -C /tmp/avdlee-testing-benchmark checkout --detach 798e9b1a2bcac164d4f0c781908199e754f0bab6

node scripts/run-swift-benchmarks.js \
  --suite evals/swift-benchmarks/multifile-testing-v1.json \
  --engine codex --model EXACT_SUPPORTED_MODEL_ID --exploratory \
  --candidate avdlee-testing --source avdlee-testing=/tmp/avdlee-testing-benchmark \
  --case 401 --runs 1 --dry-run
```

Inspect the matrix before proceeding: this example schedules baseline plus one candidate, one repetition each: **two executor attempts and up to two grader calls**. Omit candidate/source for baseline only. Use a different disposable checkout path if the example path exists; do not overwrite existing work. Source resources must be clean, at the exact pin, licensed and accepted by the runner's path/symlink policy.

Only after choosing the call budget, remove `--dry-run` to invoke models and incur usage. To use Claude Code, change `--engine codex` to `--engine claude`, select its supported explicit model, and omit `--exploratory`. CLI capability preflight must pass. Keep engines separate. Codex live runs require `--exploratory`; absent resolved model identity remains unknown/non-comparable. Never infer backend identity from the request.

## Inspect the output and check native strength

The runner prints a unique campaign path under ignored `evals/results/swift-benchmarks/`. Read its manifest, report and each slot's records/grades, stdout/stderr, workspace evidence and RESULT artifact. Confirm completion, actual edits and real test counts; preserve unsupported/incomplete status. An LLM grade is separate from native proof.

For case 401, review generated tests for permitted public API use and safe/hermetic behavior **before executing retained code**. On a matching native Swift toolchain, replay each selected slot with its frozen checker:

```bash
node /ABSOLUTE/CAMPAIGN/inputs/scripts/check-inventory-import.js \
  --campaign /ABSOLUTE/CAMPAIGN --slot 0001
```

Substitute the real absolute campaign path and repeat for the baseline/candidate slots being compared. Read each new `functional-UUID/functional-report.json` and its discovery/native logs. Correct code must complete and pass; all four mutations must produce generated-test assertion kills for qualification. Timeout, compile failure, missing/zero completion and smoke-only failure do not count. Unqualified replay returns nonzero; inspect the report rather than treating that exit as a harness defect. Each native command has a 120-second limit. Use an isolated worker and ownership-scoped process cleanup; the source audit is not a security sandbox.

For other suites there is no equivalent automatic per-submission mutation oracle: audit the task-specific compiler/test evidence manually. Optional fixture-author qualification commands (not needed for ordinary repeated use) are documented in the full guide and case-401 design. Do not build directly in checked-in fixture roots; disposable workspaces avoid cache pollution of frozen inputs.

## Decide and retain

Compare matching tasks within one engine/model/toolchain cohort. Inspect critical failures, clean-control false positives and incomplete coverage before pass counts. One run is exploratory, not a reliable ranking. Keep original raw grades, hashes, resource revisions and functional reports. Changing a prompt, fixture or rubric creates a new version; never repair an evaluated submission after seeing mutations and report it as the original result.

Record a concise decision and limitations in a versioned Markdown report. Raw campaigns remain local and Git-ignored; archive the whole campaign separately if durable replay is required. Neither a dry-run nor a published summary guarantees the raw files remain available later. The existing results are linked from README and the case-401 design.
