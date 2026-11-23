import Testing
@testable import TestingExtension

private func makeFormatter(title: String) async -> LabelFormatter {
    let lookup = LookupStub(title: title)
    return LabelFormatter { await lookup.lookup($0) }
}

@Test func independentFormattersKeepTheirInjectedValues() async {
    let first = await makeFormatter(title: "Desk")
    let second = await makeFormatter(title: "Lamp")
    #expect(await first.title(for: "item") == "Desk")
    #expect(await second.title(for: "item") == "Lamp")
}

@Test(arguments: ["Desk", "Lamp", "Chair"])
func formatsInjectedTitles(title: String) async {
    print("PARAMETER_TITLE:\(title)")
    let formatter = await makeFormatter(title: title)
    #expect(await formatter.title(for: "item") == title)
}

private actor LookupStub {
    private var title: String?
    init(title: String? = nil) { self.title = title }
    func configure(title: String) { self.title = title }
    func lookup(_ id: String) -> String? { title }
}
