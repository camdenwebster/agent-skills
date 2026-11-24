import SwiftUI

struct SaveAction: View {
    let save: () -> Void
    var body: some View {
        Button("Save item", systemImage: "checkmark", action: save)
            .buttonStyle(.borderedProminent)
    }
}
