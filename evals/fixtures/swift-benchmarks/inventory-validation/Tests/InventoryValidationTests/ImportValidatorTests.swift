import Testing
@testable import InventoryValidation

@Test func trimsImportedLabel() {
    Task {
        let label = try await ImportValidator().validate("  Lamp  ")
        #expect(label == "Lamp")
    }
}
