import Testing
@testable import InventoryValidation

@Suite(.serialized)
struct ImportFlowTests {
    @Test func acceptsLabel() async throws {
        let label = try await ImportValidator().validate("Desk")
        #expect(label == "Desk")
    }

    @Test func rejectsBlankLabel() async {
        await #expect(throws: ImportError.emptyLabel) {
            try await ImportValidator().validate("   ")
        }
    }
}
