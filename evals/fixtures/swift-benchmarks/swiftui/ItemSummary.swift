import SwiftUI

struct ItemSummary: View {
    let title: String
    let locationName: String
    var body: some View {
        VStack(alignment: .leading) {
            Text(title).font(.headline)
            Text(locationName).font(.body).foregroundStyle(.secondary)
        }
    }
}
