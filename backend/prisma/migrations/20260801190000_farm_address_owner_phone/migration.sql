-- Farm address and owner contact for registration / create-farm flow.
ALTER TABLE "Farm" ADD COLUMN IF NOT EXISTS "ownerPhone" TEXT;
ALTER TABLE "Farm" ADD COLUMN IF NOT EXISTS "district" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Farm" ADD COLUMN IF NOT EXISTS "sector" TEXT NOT NULL DEFAULT '';
