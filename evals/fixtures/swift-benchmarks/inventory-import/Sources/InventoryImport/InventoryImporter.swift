public struct InventoryImporter: Sendable {
    private let catalog: any CatalogResolving
    private let store: any InventoryStoring

    public init(catalog: any CatalogResolving, store: any InventoryStoring) {
        self.catalog = catalog; self.store = store
    }

    public func run(
        _ batch: ImportBatch,
        onEvent: @Sendable (ImportEvent) async -> Void
    ) async throws -> ImportReport {
        try Task.checkCancellation()
        await onEvent(.started(batchID: batch.id, total: batch.rows.count))
        guard !batch.rows.isEmpty else { return ImportReport(batchID: batch.id, items: []) }

        let items = try await withThrowingTaskGroup(of: (Int, ImportedItem).self) { group in
            for (index, row) in batch.rows.enumerated() {
                group.addTask {
                    try Task.checkCancellation()
                    let request = CatalogRequest(batchID: batch.id, sourceIndex: index, sourceID: row.sourceID, sku: row.sku)
                    let match = try await catalog.resolve(request)
                    try Task.checkCancellation()
                    return (index, ImportedItem(
                        batchID: batch.id, sourceID: row.sourceID, sku: row.sku,
                        title: match.title, quantity: row.quantity, locationID: row.locationID
                    ))
                }
            }
            var slots = [ImportedItem?](repeating: nil, count: batch.rows.count)
            var completedCount = 0
            for try await (index, item) in group {
                slots[index] = item
                completedCount += 1
                await onEvent(.resolved(
                    batchID: batch.id, sourceID: batch.rows[index].sourceID,
                    sourceIndex: index, completedCount: completedCount,
                    total: batch.rows.count, item: item
                ))
            }
            return slots.map { $0! }
        }
        try Task.checkCancellation()
        let issues = validationIssues(items)
        guard issues.isEmpty else { throw ImportError.invalidRows(issues) }
        try Task.checkCancellation()
        try await store.commit(batchID: batch.id, items: items)
        await onEvent(.committed(batchID: batch.id, items: items))
        return ImportReport(batchID: batch.id, items: items)
    }

    private func validationIssues(_ items: [ImportedItem]) -> [ValidationIssue] {
        var seen: Set<String> = []
        var issues: [ValidationIssue] = []
        for (index, item) in items.enumerated() {
            // Within each input row, issue order is duplicate ID, quantity, title.
            if !seen.insert(item.sourceID).inserted {
                issues.append(ValidationIssue(sourceID: item.sourceID, sourceIndex: index, reason: .duplicateSourceID))
            }
            if !(1...999).contains(item.quantity) {
                issues.append(ValidationIssue(sourceID: item.sourceID, sourceIndex: index, reason: .quantityOutOfRange))
            }
            if item.title.isEmpty {
                issues.append(ValidationIssue(sourceID: item.sourceID, sourceIndex: index, reason: .emptyTitle))
            }
        }
        return issues
    }
}
