-- System configuration: days after breeding until estimated return heat.
ALTER TABLE "Farm" ADD COLUMN IF NOT EXISTS "returnHeatDays" INTEGER NOT NULL DEFAULT 21;
