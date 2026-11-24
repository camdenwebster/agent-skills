import Testing
import InventoryImport

private struct Catalog: CatalogResolving {
    func resolve(_ request: CatalogRequest) async throws -> CatalogMatch {
        CatalogMatch(sku: request.sku, title: "Desk")
    }
}
private actor Store: InventoryStoring {
    func commit(batchID: String, items: [ImportedItem]) async throws {}
}
@Test func smokeImportsOneRow() async throws {
    let importer = InventoryImporter(catalog: Catalog(), store: Store())
    let report = try await importer.run(ImportBatch(id: "smoke", rows: [
        ImportRow(sourceID: "r1", sku: "desk", quantity: 1, locationID: "office")
    ])) { _ in }
    #expect(report.items.map(\.title) == ["Desk"])
}
