import Testing
@testable import TestingExtension

@Test func emitsImportedLabelsWithinLifetime() async {
    let gate = StartGate()
    var work: Task<Void, Never>?
    await confirmation(expectedCount: 2) { emitted in
        work = Task {
            await gate.wait()
            await EventImporter().importLabels(["Desk", "Lamp"]) { _ in emitted() }
        }
    }
    await gate.open()
    await work?.value
}

@Test func emptyImportEmitsNoLabels() async {
    await confirmation(expectedCount: 0) { emitted in
        await EventImporter().importLabels([]) { _ in emitted() }
    }
}

private actor StartGate {
    private var opened = false
    private var waiters: [CheckedContinuation<Void, Never>] = []
    func wait() async {
        if opened { return }
        await withCheckedContinuation { waiters.append($0) }
    }
    func open() {
        opened = true
        let pending = waiters
        waiters.removeAll()
        for continuation in pending { continuation.resume() }
    }
}
