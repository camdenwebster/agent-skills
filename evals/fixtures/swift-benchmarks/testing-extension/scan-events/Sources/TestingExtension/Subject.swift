public actor EventImporter {
    public init() {}
    public func importLabels(_ labels: [String], report: @Sendable (String) -> Void) async {
        for label in labels { report(label) }
    }
}
