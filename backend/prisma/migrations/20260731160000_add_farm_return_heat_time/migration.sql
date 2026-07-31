-- Time of day for estimated return heat / follow-up (HH:mm, 24h).
ALTER TABLE "Farm" ADD COLUMN IF NOT EXISTS "returnHeatTime" TEXT NOT NULL DEFAULT '08:00';
