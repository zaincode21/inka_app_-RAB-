-- Link reproductive cycle events (Breeding → Pregnant → Abort/Birth).
ALTER TABLE "HealthEvent" ADD COLUMN IF NOT EXISTS "sourceEventId" TEXT;

CREATE INDEX IF NOT EXISTS "HealthEvent_sourceEventId_idx" ON "HealthEvent"("sourceEventId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'HealthEvent_sourceEventId_fkey'
  ) THEN
    ALTER TABLE "HealthEvent"
      ADD CONSTRAINT "HealthEvent_sourceEventId_fkey"
      FOREIGN KEY ("sourceEventId") REFERENCES "HealthEvent"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
