// swift-tools-version: 6.0
import PackageDescription
let package = Package(
    name: "InventoryImport", platforms: [.macOS(.v15)],
    products: [.library(name: "InventoryImport", targets: ["InventoryImport"])],
    targets: [.target(name: "InventoryImport"), .testTarget(name: "InventoryImportTests", dependencies: ["InventoryImport"])],
    swiftLanguageModes: [.v6]
)
