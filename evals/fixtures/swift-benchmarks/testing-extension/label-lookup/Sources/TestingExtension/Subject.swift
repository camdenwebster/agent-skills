public struct LabelFormatter: Sendable {
    private let lookup: @Sendable (String) async -> String?
    public init(lookup: @escaping @Sendable (String) async -> String?) {
        self.lookup = lookup
    }
    public func title(for id: String) async -> String {
        await lookup(id) ?? "Unknown"
    }
}
