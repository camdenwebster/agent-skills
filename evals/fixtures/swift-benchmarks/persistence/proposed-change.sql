-- The author proposes editing a shipped migration to rename the field:
ALTER TABLE "inventoryItems" RENAME COLUMN "title" TO "displayTitle";
CREATE UNIQUE INDEX "inventoryItems_displayTitle_unique" ON "inventoryItems" ("displayTitle");
-- Down:
ALTER TABLE "inventoryItems" RENAME COLUMN "displayTitle" TO "title";
