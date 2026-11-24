// swift-tools-version: 6.0
import PackageDescription
let package = Package(name: "InventoryValidation", products: [.library(name: "InventoryValidation", targets: ["InventoryValidation"])], targets: [.target(name: "InventoryValidation"), .testTarget(name: "InventoryValidationTests", dependencies: ["InventoryValidation"])])
