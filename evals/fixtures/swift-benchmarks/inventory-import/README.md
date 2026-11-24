# Inventory import regression task

Add deterministic async Swift Testing regressions for the public API in `Sources/InventoryImport`. Product code is correct. Read all source files before authoring tests. Add exactly `Tests/InventoryImportTests/GeneratedRegressionTests.swift`; put all your test doubles/helpers there. Also add `RESULT.md` with actual commands, outcomes and limitations. Each added file must be UTF-8 and at most 64 KiB. All supplied files (including Package.swift, wrapper and smoke test) are frozen. Do not stage or commit, change configuration, add dependencies, or edit other files.

Run `sh swift-benchmarks/inventory-import/run-tests.sh` from the workspace root (or `sh run-tests.sh` from this directory). Budget: 15 minutes, at most three native test invocations. Use the installed toolchain, Swift 6 language mode and toolchain-provided Testing. No external packages. Tests must be hermetic public API tests: no process execution, network, filesystem/environment inspection, runtime manipulation or discovery changes. Do not use sleeps, polling/yield loops, randomness, global state or global serialization as synchronization.

Use plain `import InventoryImport` and exercise only its public API. Do not use `@testable` imports or private/internal access, conditional compilation (`#if` or other compilation directives), skipped/disabled tests, enabled/disabled traits, conditional test discovery, or known-issue annotations (`withKnownIssue`/`knownIssue`). Keep test code hermetic: no host process, network, filesystem, environment or unsafe/runtime manipulation APIs. The host uses a conservative lexical audit, not a Swift parser; comments and strings may also trigger flags. Such flags mean unqualified evidence and are not proof of malicious intent.

## Public behavior

`InventoryImporter(catalog:store:)` is Sendable and reusable across concurrent runs. `run(_:onEvent:)` takes an `ImportBatch(id:rows:)`. Rows have sourceID, sku, quantity and locationID. Duplicate SKUs are valid; source IDs must be unique within each batch. Catalog requests include batchID + sourceIndex + sourceID + sku, allowing deterministic control independent of task arrival order even for invalid duplicate source IDs. A catalog match supplies the canonical title; the input SKU is retained. Imported items retain every input field plus batch ID and canonical title.

Resolution runs concurrently. Returned report items and the single successful commit are in input order, regardless of catalog completion order. Validation occurs after resolution and before persistence, so invalid input may perform catalog reads and emit resolved events. Issues appear in input order; within a row: duplicateSourceID, quantityOutOfRange (outside 1...999), emptyTitle (exactly empty). Only subsequent occurrences of a duplicate sourceID receive that issue. Validation throws `ImportError.invalidRows` with all issues. Store atomicity is the conformer's contract; test stores can observe commit attempts and maintain a seeded snapshot.

Events are complete Equatable values:

- started(batchID,total) once before lookups.
- resolved(batchID,sourceID,sourceIndex,completedCount,total,item) once per result observed by the parent, in observed completion order; input index is zero based and completion counts are 1...N.
- committed(batchID,items) once after successful commit, with input-ordered items equal to the report.

Callbacks within a run are awaited serially and cannot overlap. Independent runs keep their own counters, buffers and callback sinks. Empty input emits started(total:0), returns an empty report, and performs no catalog call, commit or committed event.

Validation/dependency failure or cancellation prevents commit and committed events; already emitted events remain visible. A failing store naturally records one commit attempt. Dependency errors preserve their identity. Cancellation is checked at entry, around catalog awaits and before commit; structured children are canceled and joined. Cancellation while lookups are suspended must reach each lookup's cancellation handler. A canceled lookup may require explicit test release before returning: release every owned gate and join every task before asserting cancellation flags. Cancellation after a store transaction starts cannot roll it back; do not test an impossible cancel-versus-commit race.

## Required regression scenarios

1. Three rows including duplicate SKU with different source IDs, quantities and locations. Independently gate requests and release input positions 2,0,1, acknowledging each resolved callback before releasing the next. Assert every event field/count, input-ordered report and identical single commit/committed payload.
2. A late invalid row: exact ordered validation issues, unchanged seeded snapshot, zero commit attempts and no committed event.
3. Cancel while at least two lookups are known suspended. Release gates, join the run, then inspect synchronous cancellation-handler flags for all suspended lookups. Assert CancellationError and no persistence/completion. Do not wait indefinitely for a cancellation flag that a regression may omit.
4. One controlled resolver failure: preserve the sentinel error and prevent persistence/completion. Multiple simultaneous errors have no promised observation order.
5. Overlap two runs on one importer, deliberately interleave gated results, and verify separate sinks/counts/identities/reports and commit contents per batch without assuming cross-batch commit order.

Use explicit registration and event acknowledgements rather than scheduler timing. Test helpers are your choice; no particular helper architecture, test names or function count is required. Do not weaken smoke coverage, skip/disable tests, or report XCTest's zero-test summary as Swift Testing success. Record the native completion and any verification limits in RESULT.md.
