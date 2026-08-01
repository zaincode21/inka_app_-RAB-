-- Default milk selling price and sale destination defaults.
ALTER TABLE "Farm" ADD COLUMN IF NOT EXISTS "milkPricePerLiter" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Farm" ADD COLUMN IF NOT EXISTS "defaultMilkBuyer" TEXT;
ALTER TABLE "Farm" ADD COLUMN IF NOT EXISTS "defaultMilkDestination" TEXT;
