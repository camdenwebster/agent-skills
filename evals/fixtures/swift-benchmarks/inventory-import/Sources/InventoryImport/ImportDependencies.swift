public protocol CatalogResolving: Sendable {
    func resolve(_ request: CatalogRequest) async throws -> CatalogMatch
}

/// A conformer must atomically persist the complete items array, or throw.
/// The importer cannot roll back an external transaction once commit begins.
public protocol InventoryStoring: Sendable {
    func commit(batchID: String, items: [ImportedItem]) async throws
}
