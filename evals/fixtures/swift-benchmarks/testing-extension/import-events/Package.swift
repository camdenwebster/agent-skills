// swift-tools-version: 6.0
import PackageDescription
let package = Package(name: "TestingExtension", products: [.library(name: "TestingExtension", targets: ["TestingExtension"])], targets: [.target(name: "TestingExtension"), .testTarget(name: "TestingExtensionTests", dependencies: ["TestingExtension"])])
