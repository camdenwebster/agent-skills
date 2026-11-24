import Testing
@testable import TestingExtension

@Test func emitsImportedLabelsWithinLifetime() async {
    await confirmation(expectedCount: 2) { emitted in
        await EventImporter().importLabels(["Desk", "Lamp"]) { _ in emitted() }
    }
}

@Test func emptyImportEmitsNoLabels() async {
    await confirmation(expectedCount: 0) { emitted in
        await EventImporter().importLabels([]) { _ in emitted() }
    }
}
