actor IsolatedCounter {
    private var value = 0
    func increment() -> Int {
        value += 1
        return value
    }
    func current() -> Int { value }
}
