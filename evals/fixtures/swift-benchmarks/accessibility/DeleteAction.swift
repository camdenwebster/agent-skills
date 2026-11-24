import SwiftUI

struct DeleteAction: View {
    let removeItem: () -> Void
    var body: some View {
        Image(systemName: "trash")
            .foregroundStyle(.red)
            .onTapGesture { removeItem() }
    }
}
