import SwiftUI

struct InventoryRowData: Identifiable {
    let id: UUID
    var title: String
}

struct EditableInventoryRow: View {
    let item: InventoryRowData
    @State private var expanded = false
    var body: some View {
        DisclosureGroup(isExpanded: $expanded) {
            Text(item.id.uuidString)
        } label: {
            Text(item.title)
        }
    }
}

struct InventoryList: View {
    var items: [InventoryRowData]
    var body: some View {
        List {
            ForEach(items.indices, id: \.self) { index in
                EditableInventoryRow(item: items[index])
            }
        }
    }
}
