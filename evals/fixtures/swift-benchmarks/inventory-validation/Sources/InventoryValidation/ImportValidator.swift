import Foundation
public enum ImportError: Error, Equatable { case emptyLabel }
public struct ImportValidator: Sendable {
    public init() {}
    public func validate(_ label: String) async throws -> String {
        let clean = label.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !clean.isEmpty else { throw ImportError.emptyLabel }
        return clean
    }
}
