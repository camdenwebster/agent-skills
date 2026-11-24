-- New named migration: Add notes to inventoryItems
ALTER TABLE "inventoryItems"
ADD COLUMN "notes" TEXT NOT NULL ON CONFLICT REPLACE DEFAULT '';
