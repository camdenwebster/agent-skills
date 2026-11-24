import Foundation

struct InventoryEntry: Sendable { let title: String }

struct InventoryLookup: Sendable {
    let load: @Sendable () async throws -> [InventoryEntry]

    func titles() async throws -> [String] {
        do {
            let entries = try await load()
            return entries.map(\.title)
        } catch {
            return []
        }
    }
}
