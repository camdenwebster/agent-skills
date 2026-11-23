// swift-tools-version: 6.0
import PackageDescription
let package = Package(name: "InventoryConcurrency", products: [.library(name: "InventoryConcurrency", targets: ["InventoryConcurrency"])], targets: [.target(name: "InventoryConcurrency", path: ".", exclude: ["PROJECT.md", "Package.swift"], sources: ["Lookup.swift", "IsolatedCounter.swift"])])
