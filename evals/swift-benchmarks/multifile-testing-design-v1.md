# Multi-file Swift Testing evaluation, v1

Case 401 adds one inventory-import Swift 6 package with a correct product implementation. Executors write public API regression tests across concurrent resolution, ordered persistence, validation failure, cancellation, callback payloads and overlapping runs. See the frozen [public task contract](../fixtures/swift-benchmarks/inventory-import/README.md). Existing suites, candidate pins, fixtures and recorded grades are unchanged; the three testing candidate records are copied from `testing-extension.json` without updating their revisions.

The Architect and implementation Coders did not inspect candidate content when designing or implementing this fixture. The coordinating agent has prior candidate context. This is author independence from candidate content, not model-training blindness or a held-out-blind evaluation claim.

Both `Tests/InventoryImportTests/GeneratedRegressionTests.swift` and fixture `RESULT.md` must be added; no other added files are permitted. Each added file must be UTF-8 and at most 64 KiB. Supplied files are immutable; staging and commits are forbidden. The executor has at most three native verification commands, a 15-minute task budget matching the runner's existing executor timeout. The comparison process retains its existing larger timeout to accommodate grading. No simulator, external package, network or paid model call is needed for fixture qualification or CI.

The opt-in `inventory-import-tests-v1` artifact profile adds a bounded host-collected submission manifest to `workspace_evidence.inventory_import_submission` before recording and grading. Generic workspace capture remains present and unchanged. Suite and behavioral-record validation reject unsupported profiles and invalid profile/fixture combinations. Legacy tasks never load the profile collector.

The host checker reconstructs only the exact complete permitted test artifact against frozen inputs. It rejects supplied-file changes, staging/commits, unexpected paths and incomplete evidence. Native replay first requires a completed passing correct implementation, then checks the same generated tests against independently qualified product mutations. Canonical qualification tests and mutation data stay outside the executor fixture. Assertion kills, surviving mutations, compile errors, timeouts and invalid evidence are distinct results; smoke tests or LLM grades cannot substitute for generated-test mutation detection.

Validate without model calls:

```sh
node scripts/run-swift-benchmarks.js --suite evals/swift-benchmarks/multifile-testing-v1.json --validate
node --test scripts/run-evals-test.js scripts/run-swift-benchmarks-test.js
```

Tests use plain `import InventoryImport` and public APIs only. `@testable`, private/internal access, conditional compilation/directives, skipped/disabled tests, enabled/disabled traits, conditional discovery and known-issue annotations are prohibited. The checker uses a conservative lexical audit rather than a Swift parser: comments and strings can trigger flags. Flagged artifacts provide unqualified evidence; findings are not proof of malicious intent.

Native author qualification and campaign checking are explicit host operations, separate from the comparison runner's LLM grades:

```sh
node scripts/check-inventory-import.js --qualify /absolute/path/to/qualification-output
node /absolute/path/to/CAMPAIGN/inputs/scripts/check-inventory-import.js --campaign /absolute/path/to/CAMPAIGN --slot 0001
```

Use the frozen campaign checker. A live checker is accepted only when its bytes and executable mode, and those of its submission helper, match the frozen campaign versions; otherwise checking rejects the invocation. The native toolchain must match `manifest.versions.swift`. Each check writes distinct functional evidence without overwriting raw LLM grades.

Start with this one case and inspect its behavior before adding variants. It establishes evidence for a bounded in-memory import pipeline, not general production concurrency or persistence correctness.
