# Swift skill comparison pilot

Current policy: comparisons are **on demand**. Use the [qualitative starting set](../../tasks/swift-starting-set.md) for initial adoption and the [short runbook](on-demand.md) when a concrete question warrants an eval. Case 401 adds [multi-file testing with native mutation replay](multifile-testing-design-v1.md); see its [baseline findings](multifile-results-2026-11-23.md).

These independently authored cases help select Swift guidance for our native adaptation work. They reuse the existing behavioral evaluation runner and its recorded execution/LLM grading, but compare different **instructed skill contents on the same tasks**. They do not measure automatic skill discovery, entire ecosystems, or real-device usability.

The pilot contains 16 cases across eight domains. Each domain has a defect/pressure case and a clean or bounded-evidence control. Controls are not identified as such in executor prompts. An instruction to fix a concrete defect is separate from a request to assess a proposal. Grader expectations are not appended to executor prompts.

| IDs | Domain | What matters for our projects |
|---|---|---|
| 1–2 | Concurrency | Cancellation propagation, owned tasks, actor isolation, no unsafe escapes or needless MainActor conversion |
| 3–4 | Swift Testing | Awaited assertions, real execution counts, suite serialization scope and no timing-based substitutes |
| 5–6 | SwiftUI | Stable row identity, value-input views, scoped fixes and respect for existing architecture |
| 7–8 | Accessibility | Native control semantics, useful labels, assistive input and honest manual-audit limits |
| 9–10 | Persistence | Additive shipped synced migrations, compatible defaults and project policy over generic rollback recipes |
| 11–12 | Evidence | Zero-test/incomplete rejection, conditional simulator support, hypothetical versus captured evidence |
| 13–14 | Performance | Matched experiments, source suspicion versus trace proof, no invented speedup |
| 15–16 | Architecture | Deep capability boundaries, explicit dependencies, Sendable values and independent behavior invariants |

The SwiftUI/accessibility sources are review fixtures with no app target. Evidence/performance numbers are explicitly synthetic, not measurements. The concurrency package builds; the inventory-validation package has a deliberately unowned-task test to repair and a valid serialized suite to review. A successful baseline test run does not establish that the deliberately defective test is trustworthy.

## Candidate policy

`suite.json` records 19 individual skills at exact Git commits, with MIT declaration, resource path and topic scope. Each of the eight areas has exactly three eligible candidates; some skills cover multiple areas. See the [three-per-area shortlist](shortlist.md) for the selection, source links and labeled language-agnostic controls/specialists. A candidate is evaluated only on its declared domains; baseline runs on selected cases. Scores across different coverage cannot be compared as overall quality.

Candidates are read from explicit local, clean Git checkouts. The runner checks the exact commit, a matching GitHub remote, tracked resource bytes and a tracked MIT license. It rejects symlink resources and unsafe paths. It copies the selected skill plus repository-root references; arbitrary sibling-skill dependencies, plugins and multi-skill orchestration are **not supported**. Audit such dependencies before interpreting a candidate's outcome. No skill is downloaded, installed or updated automatically.

Apple-bundled skills, Point-Free subscription skill text and SwiftFairy knowledge are not included. The pilot does not establish permission to redistribute or evaluate proprietary material. Existing public API documentation can be used as authoritative grounding. Copying a paid CLI's open-source license does not license its separate content.

## Validate and dry-run — no model calls

From the repository root:

```bash
node scripts/run-swift-benchmarks.js --validate
node --test scripts/run-swift-benchmarks-test.js scripts/run-evals-test.js
node scripts/run-swift-benchmarks.js --model EXACT_MODEL_ID --case 4 --runs 1 --dry-run
```

`EXACT_MODEL_ID` is a placeholder: choose an explicit supported model version for an actual experiment. Avoid moving aliases; actual executor-model identification is recorded when emitted. A schema validation or dry-run is not an effectiveness score. Dry-run checks the requested matrix/resources and writes no result files.

To prepare one public candidate in a disposable location (not install it):

```bash
git clone https://github.com/AvdLee/Swift-Testing-Agent-Skill.git /tmp/avdlee-testing-benchmark
git -C /tmp/avdlee-testing-benchmark checkout --detach 798e9b1a2bcac164d4f0c781908199e754f0bab6
node scripts/run-swift-benchmarks.js \
  --candidate avdlee-testing \
  --source avdlee-testing=/tmp/avdlee-testing-benchmark \
  --model EXACT_MODEL_ID --case 4 --runs 3 --dry-run
```

Omitting `--candidate` selects baseline only. Selecting candidates automatically includes baseline. Repeat `--candidate` and `--source` for multiple candidates. `--all` requires a source checkout for every declared candidate. Start narrowly: a three-repeat, one-case, one-candidate comparison schedules six executor runs and up to six grader runs. Inspect the dry-run matrix before starting a larger campaign.

## Select Claude Code or Codex

Claude Code remains the default. Pass `--engine codex` to use Codex for both execution and grading; it does not require Claude Code for that campaign:

```bash
node scripts/run-swift-benchmarks.js --engine codex \
  --model EXACT_CODEX_MODEL_ID --case 4 --runs 1 --dry-run
```

The general behavioral runner also accepts `--engine claude|codex`. Each campaign records its selected engine; runtime cohorts must remain separate. A comparison between Claude and Codex changes the runtime/model as well as the skill context, so it is not a controlled skill-only comparison. Run each engine's baseline and candidate on the same tasks within that engine.

Codex uses noninteractive JSON event output and preserves that native trace. Its grader requests schema-constrained final JSON. Automation uses ephemeral sessions, explicit sandbox policy and configuration overrides to suppress automatic user instructions/skills, hooks, plugins, memory and apps where supported. Authentication is reused through the CLI without copying credentials or changing the user's home/configuration. These settings do not override administrator-managed policy or establish equivalence to Claude's tools. Codex may not report a resolved model identity; that remains unknown rather than being inferred from the requested model.

See [official noninteractive Codex documentation](https://developers.openai.com/codex/noninteractive) and the [configuration reference](https://developers.openai.com/codex/config-reference). CLI capabilities are checked before live execution; unsupported flags/configuration must not produce a fabricated successful benchmark.

## Testing extension and isolated SwiftPM profile

See the [hardening validation and first extension smoke](hardening-results-2026-11-23.md) for actual execution evidence and remaining limits.

The first real eight-attempt pilot is recorded in [pilot results](pilot-results-2026-11-23.md). A separate [testing extension](testing-extension.json) adds cases 201–204 for confirmation lifetime and injected-dependency isolation, with defect and valid-source controls. These cases were independently authored **after** reviewing the candidate sources and first results; they are new evaluation cases, not blind held-out evidence. The original suite, fixtures and historical results remain unchanged.

Select the extension explicitly:

```bash
node scripts/run-swift-benchmarks.js --suite evals/swift-benchmarks/testing-extension.json --validate
node scripts/run-swift-benchmarks.js --suite evals/swift-benchmarks/testing-extension.json \
  --engine codex --model EXACT_CODEX_MODEL_ID --exploratory --case 201 --runs 1 --dry-run
```

Add the same `--candidate` / `--source` pairs described above to compare candidates. Removing `--dry-run` invokes models. One selected case with baseline plus three candidates and one repetition schedules four executor attempts and up to four graders; the extension's full default three-repeat matrix schedules 48 executor attempts. No larger matrix is implicitly authorized by an example.

The extension declares `runtime_profile: swiftpm-isolated-v1` at suite and case level. Validation rejects unknown or mismatched profile names, and the manifest/record retain the selection. Choosing this suite opts into its checked-in `./run-tests.sh` commands: module caches, SwiftPM cache and build output live below each disposable fixture's `.build/eval-runtime`. The wrappers disable only SwiftPM's nested subprocess sandbox, which cannot run inside this host's outer agent sandbox; Codex still uses `workspace-write`. They do not change HOME/global configuration or install dependencies. The identical wrapper bytes are hash-bound and supplied to every arm. This profile is not injected into unrelated generic/Claude evals. Avoid building checked-in fixture roots: ignored `.build` files would still enter the runner's input snapshot.

Author grounding follows [Apple confirmation semantics](https://developer.apple.com/documentation/testing/confirmation(_:expectedcount:isolation:sourcelocation:_:)-5mqz2) and [parameterized testing](https://developer.apple.com/documentation/testing/parameterizedtesting); no candidate reference text is copied into these fixtures.

Author-side native qualification uses disposable copies:

```bash
node scripts/validate-swift-testing-extension.js
```

This runs the confirmation defect/control, dependency defect/control and canonical repairs with Swift. The confirmation defect fails with a closed actor gate, without sleeps or scheduling assumptions. The dependency negative probe filters `independentFormattersKeepTheirInjectedValues` so parallel parameterized cases cannot accidentally reset the shared stub and hide its failure. Canonical repair and valid controls run their full suites. Completion counts and parameter markers are checked separately: two test functions can include three argument invocations. This qualifies the fixture and canonical repair, not an arbitrary agent-generated repair; the live grader still requires manual evidence review. CI runs only stub/unit coverage and suite validation, requiring neither Swift nor paid model calls.

## Clarified review controls (MOV-278)

See the [calibration and comparison report](calibration-results-2026-11-23.md) for the preserved raw grades, audit qualifications and completed comparison observations.

Baseline calibration exposed ambiguous review/edit scope in case 202 and an actor-versus-ownership reporting obligation not explicit in case 204. Their raw grades and original suite are preserved. Use [review-controls v2](testing-review-controls-v2.json), cases 302/304, for new comparisons of these review tasks. The versioned prompts explicitly require source preservation, distinguish optional payload coverage from the requested count/lifetime contract, request actor/ownership analysis where scored, and bound successful native verification to one command invocation. These are changed tasks authored after inspecting calibration outputs and candidate sources, not blind held-out cases. Do not pool their scores with cases 202/204.

The new suite reuses unchanged Swift fixtures, candidate pins and runtime profile; no runner or native fixture modification is involved. Select it with `--suite evals/swift-benchmarks/testing-review-controls-v2.json`. The dependency repair remains case 203 in `testing-extension.json`.

## Codex availability and model provenance

Live Codex comparisons now require `--exploratory`, acknowledging that `codex exec --json` may omit resolved model identity. The flag records campaign purpose and **never changes** strict comparability. Unknown identities remain null/non-comparable; historical records and grades are not rewritten.

Before creating results or launching any matrix rows, the wrapper runs a bounded `codex debug models` catalogue probe (20 seconds, 8 MiB output cap). An invalid catalogue or a requested model absent from its visible entries stops the campaign without switching models. Older CLIs without that diagnostic must be upgraded or used separately; the runner does not silently fall back. Dry-runs and validation do not probe the catalogue or make model calls.

The manifest retains sanitized advertised model names, the raw catalogue's hash and collection time, plus the source command. The catalogue may be cached/stale; collection time is **not** a provider freshness attestation, a guarantee of account permission, or a resolved-model observation. Model information in tool output, assistant prose or item metadata is never accepted as executor identity. Only recognized native lifecycle envelopes may supply identity; conflicting emitted lifecycle identities remain unknown. Requested and observed values stay separate, and no skill ranking is justified solely by matching request strings.

## Run a model-backed comparison

Remove `--dry-run` from the inspected command; live Codex commands must also include `--exploratory`. This invokes the selected installed CLI (`claude` by default, or `codex`) and incurs usage. Within a campaign both executor and grader use the same explicit model request and consistent engine-specific tool/sandbox settings and timeouts. Actual resolved grader model is unavailable and remains unknown; do not treat the requested ID as proof of resolved identity.

For Claude, both processes use `--safe-mode`; live execution refuses a CLI that does not advertise it. Codex uses the engine-specific isolation settings described above. The shared `safe_mode` recording field represents the requested engine isolation policy, not a claim that Codex has a Claude-style flag. The selected candidate is supplied as explicit content with readable reference resources. Safe mode is **not a sandbox**: administrator policy, host tool availability and shell access can remain. Use trusted candidate snapshots and disposable fixtures on an appropriate worker. Do not use this as an adversarial skill-safety test.

Candidate order rotates across repetitions to reduce always-first bias. This is not full randomization or a statistical significance guarantee. Three runs are a smoke comparison; expand/repeat and examine paired case outcomes before making a consequential choice. Keep model, toolchain, workload, network access, resource policy and runtime settings fixed. Native CI/tool availability differences require separate cohorts, not merged scores.

## Output and interpretation

Each campaign creates a unique directory beneath ignored `evals/results/swift-benchmarks/`. It retains a manifest, report, per-attempt outcome/stdout/stderr and the original harness records/grades or failure diagnostics. Hashes bind the suite, harness scripts, fixtures and supplied candidate resources. A live campaign freezes those verified inputs once under its inputs directory before execution, and later rows use only that snapshot. Candidate license notices accompany staged resources. Native fixture workspaces are disposable. Both engines also retain bounded host-collected final evidence: a diff against the original fixture baseline and supported RESULT/untracked text, separate from the native event stream. Limits, omitted files and capture errors remain explicit. This makes post-edit contents available even when an engine event only names changed paths; it is not a full retained working-tree checkout.

Read the report by engine, candidate, domain and observed executor-model cohort:

- `planned`, `completed` and `incomplete` expose coverage and execution validity.
- `passed`/`failed` count fully satisfied versus failed rubrics among scored attempts.
- `critical_failure_runs` flags candidate attempts that violated designated correctness or evidence criteria.
- Incomplete execution or invalid grading stays **unscored**, not a zero-quality answer or a passing omission.
- Observed executor usage/cost is recorded when available. It is not a complete campaign bill: grader costs, retries and provider accounting may differ.

Per-case comparability flags reject inference across mixed/unknown resolved models, incomplete attempts or unmatched cohorts. Known moving model aliases are rejected, but a request string alone cannot establish fixed resolved identity. There is no global weighted score or automatic winner. Compare the same domain/case/model repetitions, read failed expectations and check critical failures first. For clean controls, unnecessary rewrites/invented defects are failures. Prefer the smallest set of complementary skills that improves our outcomes over baseline while preserving project policy. Content volume, GitHub stars and confident prose earn no points.

The grader is an LLM examining execution traces. Actual file reads and task-specific RESULT artifacts are required; modification cases need real edits, and available native tests must actually execute. This helps reject narration-only success but is **not an independent functional oracle**. Inspect compiler/test evidence, manually confirm a sample of judgments and use preserved recordings to regrade without regenerating when appropriate. Historical regrades must preserve grader isolation and use the recorded engine and saved workspace evidence. They are historical regrades, not new execution results; a Codex record cannot silently enter the default Claude replay path. Known incorrect implementations should fail; unknown/incomplete evidence must remain explicit.

For native testing, parse all framework output: SwiftPM can print an XCTest zero-test section before a Swift Testing section with real tests. Neither a single log match nor process exit zero establishes trustworthy execution.

## Ground truth and future expansion

Ground rules in the pinned project requirements and official APIs. The suite-level serialization distinction follows [Apple's documentation](https://developer.apple.com/documentation/testing/parallelization.md). Use independently authored fixtures, and preserve license notices with any later adapted source material.

Next useful expansions are deterministic functional oracles, native UI/device fixtures, trace-backed performance captures, localization, App Intents, source-authority checks and held-out case variants. Keep those separate from the current source-review and Swift package evidence. Update candidate revisions deliberately and keep old result manifests; changing suite/fixture hashes creates a new benchmark version.

## Validation completed while creating this pilot

The concurrency library compiled and inventory-validation executed three Swift Testing tests on the installed Swift 6.4 toolchain. Its expected unowned-task warning remains part of the repair fixture. A pinned AvdLee testing source passed provenance checks in a two-repeat dry-run with alternating baseline/candidate order. Automated runner tests use a stub CLI and do not measure any real skill's effectiveness. No paid comparison, simulator audit or winner selection was performed.

Shortlist staging validation: all 19 pinned candidates passed prepared-source provenance/resource checks in a complete Codex-engine dry-run of the 192-row default matrix. This establishes staging compatibility, not execution quality or model availability; no model calls were made.
