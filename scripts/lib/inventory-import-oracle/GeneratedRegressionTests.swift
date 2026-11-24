import Testing
import Synchronization
import InventoryImport

private final class CancellationFlags: Sendable {
    private let flags = Mutex<Set<CatalogRequest>>([])
    func mark(_ request: CatalogRequest) { flags.withLock { _ = $0.insert(request) } }
    func snapshot() -> Set<CatalogRequest> { flags.withLock { $0 } }
}
private actor Gate: CatalogResolving {
    nonisolated let cancellations = CancellationFlags()
    private var pending: [CatalogRequest: CheckedContinuation<CatalogMatch, Never>] = [:]
    private var registered: Set<CatalogRequest> = []
    private var observers: [(Int, CheckedContinuation<Void, Never>)] = []
    func resolve(_ request: CatalogRequest) async throws -> CatalogMatch {
        await withTaskCancellationHandler {
            await withCheckedContinuation { continuation in
                pending[request] = continuation
                registered.insert(request)
                let ready = observers.filter { registered.count >= $0.0 }
                observers.removeAll { registered.count >= $0.0 }
                for (_, observer) in ready { observer.resume() }
            }
        } onCancel: { cancellations.mark(request) }
    }
    func waitForRequests(_ count: Int) async {
        if registered.count >= count { return }
        await withCheckedContinuation { observers.append((count, $0)) }
    }
    func release(_ request: CatalogRequest, title: String = "Canonical") {
        pending.removeValue(forKey: request)?.resume(returning: CatalogMatch(sku: request.sku, title: title))
    }
    func releaseAll() {
        for (request, continuation) in pending {
            continuation.resume(returning: CatalogMatch(sku: request.sku, title: "Canonical"))
        }
        pending.removeAll()
    }
}
private actor EventSink {
    private var events: [ImportEvent] = []
    private var observers: [(String, CheckedContinuation<Void, Never>)] = []
    func receive(_ event: ImportEvent) {
        events.append(event)
        if case let .resolved(_, _, _, _, _, item) = event {
            let ready = observers.filter { $0.0 == item.sourceID }
            observers.removeAll { $0.0 == item.sourceID }
            for (_, observer) in ready { observer.resume() }
        }
    }
    func waitForItem(_ sourceID: String) async {
        if events.contains(where: { if case let .resolved(_, _, _, _, _, item) = $0 { return item.sourceID == sourceID }; return false }) { return }
        await withCheckedContinuation { observers.append((sourceID, $0)) }
    }
    func snapshot() -> [ImportEvent] { events }
}
private actor MemoryStore: InventoryStoring {
    struct Attempt: Equatable, Sendable { let batchID: String; let items: [ImportedItem] }
    private var attempts: [Attempt] = []
    private var contents: [String: [ImportedItem]] = ["seed": []]
    func commit(batchID: String, items: [ImportedItem]) async throws {
        attempts.append(Attempt(batchID: batchID, items: items)); contents[batchID] = items
    }
    func snapshot() -> [String: [ImportedItem]] { contents }
    func history() -> [Attempt] { attempts }
}
private func row(_ id: String, _ quantity: Int = 1) -> ImportRow {
    ImportRow(sourceID: id, sku: "same-sku", quantity: quantity, locationID: "location-\(id)")
}
private func request(_ batch: String, _ id: String) -> CatalogRequest {
    CatalogRequest(batchID: batch, sourceIndex: ["a", "b", "c"].firstIndex(of: id)!, sourceID: id, sku: "same-sku")
}
private func item(_ batch: String, _ row: ImportRow, title: String = "Canonical") -> ImportedItem {
    ImportedItem(batchID: batch, sourceID: row.sourceID, sku: row.sku, title: title, quantity: row.quantity, locationID: row.locationID)
}
private func outcome(_ importer: InventoryImporter, _ batch: ImportBatch, _ sink: EventSink) async -> Result<ImportReport, any Error> {
    do { return .success(try await importer.run(batch) { await sink.receive($0) }) }
    catch { return .failure(error) }
}

@Test func orderedPayloadsRetainDuplicateSKUIdentity() async {
    let gate = Gate(), store = MemoryStore(), sink = EventSink()
    let rows = [row("a", 3), row("b", 5), row("c", 7)]
    let importer = InventoryImporter(catalog: gate, store: store)
    let work = Task { await outcome(importer, ImportBatch(id: "batch", rows: rows), sink) }
    await gate.waitForRequests(3)
    for index in [2, 0, 1] {
        await gate.release(request("batch", rows[index].sourceID))
        await sink.waitForItem(rows[index].sourceID)
    }
    let result = await work.value
    let expected = rows.map { item("batch", $0) }
    if case let .success(report) = result { #expect(report == ImportReport(batchID: "batch", items: expected)) }
    else { Issue.record("Expected successful import") }
    let events = await sink.snapshot()
    let expectedEvents: [ImportEvent] = [.started(batchID: "batch", total: 3)] + [2, 0, 1].enumerated().map { count, index in
        .resolved(batchID: "batch", sourceID: rows[index].sourceID, sourceIndex: index, completedCount: count + 1, total: 3, item: expected[index])
    } + [.committed(batchID: "batch", items: expected)]
    #expect(events == expectedEvents)
    #expect(await store.history() == [.init(batchID: "batch", items: expected)])
}

private struct ImmediateCatalog: CatalogResolving {
    func resolve(_ request: CatalogRequest) async throws -> CatalogMatch { CatalogMatch(sku: request.sku, title: request.sourceID == "bad" ? "" : "Canonical") }
}
@Test func lateValidationPreservesSnapshot() async {
    let store = MemoryStore(), sink = EventSink()
    let before = await store.snapshot()
    let result = await outcome(InventoryImporter(catalog: ImmediateCatalog(), store: store), ImportBatch(id: "invalid", rows: [row("ok"), row("bad", 0)]), sink)
    if case let .failure(error) = result {
        #expect(error as? ImportError == .invalidRows([
            ValidationIssue(sourceID: "bad", sourceIndex: 1, reason: .quantityOutOfRange),
            ValidationIssue(sourceID: "bad", sourceIndex: 1, reason: .emptyTitle)
        ]))
    } else { Issue.record("Expected validation error") }
    #expect(await store.snapshot() == before)
    #expect(await store.history().isEmpty)
    #expect(await sink.snapshot().count == 3)
}

@Test func cancellationReachesSuspendedDependencies() async {
    let gate = Gate(), store = MemoryStore(), sink = EventSink()
    let before = await store.snapshot()
    let importer = InventoryImporter(catalog: gate, store: store)
    let work = Task { await outcome(importer, ImportBatch(id: "cancel", rows: [row("a"), row("b")]), sink) }
    await gate.waitForRequests(2)
    work.cancel()
    // Always release and join before checking flags. A detached-ownership regression must fail, not hang.
    await gate.releaseAll()
    let result = await work.value
    if case let .failure(error) = result { #expect(error is CancellationError) }
    else { Issue.record("Expected cancellation") }
    #expect(gate.cancellations.snapshot() == Set([request("cancel", "a"), request("cancel", "b")]))
    #expect(await store.history().isEmpty)
    #expect(await store.snapshot() == before)
    #expect(await sink.snapshot() == [.started(batchID: "cancel", total: 2)])
}

private enum Sentinel: Error { case unavailable }
private struct FailingCatalog: CatalogResolving {
    func resolve(_ request: CatalogRequest) async throws -> CatalogMatch { throw Sentinel.unavailable }
}
@Test func dependencyErrorRetainsIdentity() async {
    let store = MemoryStore(), sink = EventSink()
    let before = await store.snapshot()
    let result = await outcome(InventoryImporter(catalog: FailingCatalog(), store: store), ImportBatch(id: "error", rows: [row("a")]), sink)
    if case let .failure(error) = result { #expect(error as? Sentinel == .unavailable) }
    else { Issue.record("Expected sentinel error") }
    #expect(await store.history().isEmpty)
    #expect(await store.snapshot() == before)
    #expect(await sink.snapshot() == [.started(batchID: "error", total: 1)])
}

@Test func overlappingRunsOwnTheirEventsAndBuffers() async {
    let gate = Gate(), store = MemoryStore(), left = EventSink(), right = EventSink()
    let importer = InventoryImporter(catalog: gate, store: store)
    let rows = [row("a", 2), row("b", 4)]
    let first = Task { await outcome(importer, ImportBatch(id: "left", rows: rows), left) }
    let second = Task { await outcome(importer, ImportBatch(id: "right", rows: rows), right) }
    await gate.waitForRequests(4)
    for (batch, source, sink) in [("right", "b", right), ("left", "a", left), ("right", "a", right), ("left", "b", left)] {
        await gate.release(request(batch, source)); await sink.waitForItem(source)
    }
    let results = [await first.value, await second.value]
    for (offset, batch) in ["left", "right"].enumerated() {
        let expected = rows.map { item(batch, $0) }
        if case let .success(report) = results[offset] { #expect(report == ImportReport(batchID: batch, items: expected)) }
        else { Issue.record("Expected overlapping success") }
        let sink = offset == 0 ? left : right
        let order = offset == 0 ? [0, 1] : [1, 0]
        let events: [ImportEvent] = [.started(batchID: batch, total: 2)] + order.enumerated().map { count, index in
            .resolved(batchID: batch, sourceID: rows[index].sourceID, sourceIndex: index, completedCount: count + 1, total: 2, item: expected[index])
        } + [.committed(batchID: batch, items: expected)]
        #expect(await sink.snapshot() == events)
        #expect(await store.snapshot()[batch] == expected)
    }
    #expect(await store.history().count == 2)
}
