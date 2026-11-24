/// An ordered, caller-identified import. Repeated SKUs are allowed.
public struct ImportBatch: Sendable, Equatable {
    public let id: String
    public let rows: [ImportRow]
    public init(id: String, rows: [ImportRow]) { self.id = id; self.rows = rows }
}

public struct ImportRow: Sendable, Equatable {
    public let sourceID: String
    public let sku: String
    public let quantity: Int
    public let locationID: String
    public init(sourceID: String, sku: String, quantity: Int, locationID: String) {
        self.sourceID = sourceID; self.sku = sku
        self.quantity = quantity; self.locationID = locationID
    }
}

/// Request identity is independent of SKU and of scheduler arrival order.
public struct CatalogRequest: Sendable, Equatable, Hashable {
    public let sourceIndex: Int
    public let batchID: String
    public let sourceID: String
    public let sku: String
    public init(batchID: String, sourceIndex: Int, sourceID: String, sku: String) {
        self.sourceIndex = sourceIndex
        self.batchID = batchID; self.sourceID = sourceID; self.sku = sku
    }
}

public struct CatalogMatch: Sendable, Equatable {
    public let sku: String
    public let title: String
    public init(sku: String, title: String) { self.sku = sku; self.title = title }
}

public struct ImportedItem: Sendable, Equatable {
    public let batchID: String
    public let sourceID: String
    public let sku: String
    public let title: String
    public let quantity: Int
    public let locationID: String
    public init(batchID: String, sourceID: String, sku: String, title: String, quantity: Int, locationID: String) {
        self.batchID = batchID; self.sourceID = sourceID; self.sku = sku
        self.title = title; self.quantity = quantity; self.locationID = locationID
    }
}

public struct ImportReport: Sendable, Equatable {
    public let batchID: String
    public let items: [ImportedItem]
    public init(batchID: String, items: [ImportedItem]) { self.batchID = batchID; self.items = items }
}

public enum ValidationReason: Sendable, Equatable {
    case duplicateSourceID
    case quantityOutOfRange
    case emptyTitle
}

public struct ValidationIssue: Sendable, Equatable {
    public let sourceID: String
    public let sourceIndex: Int
    public let reason: ValidationReason
    public init(sourceID: String, sourceIndex: Int, reason: ValidationReason) {
        self.sourceID = sourceID; self.sourceIndex = sourceIndex; self.reason = reason
    }
}

public enum ImportError: Error, Sendable, Equatable {
    case invalidRows([ValidationIssue])
}

public enum ImportEvent: Sendable, Equatable {
    case started(batchID: String, total: Int)
    case resolved(batchID: String, sourceID: String, sourceIndex: Int, completedCount: Int, total: Int, item: ImportedItem)
    case committed(batchID: String, items: [ImportedItem])
}
