-- Soft archive: keep rows for audit while hiding from default lists.
ALTER TABLE "Cattle" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedByUserId" TEXT;

ALTER TABLE "HealthEvent" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedByUserId" TEXT;

ALTER TABLE "MilkRecord" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedByUserId" TEXT;

ALTER TABLE "Transaction" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedByUserId" TEXT;

CREATE INDEX "Cattle_deletedAt_idx" ON "Cattle"("deletedAt");
CREATE INDEX "HealthEvent_deletedAt_idx" ON "HealthEvent"("deletedAt");
CREATE INDEX "MilkRecord_deletedAt_idx" ON "MilkRecord"("deletedAt");
CREATE INDEX "Transaction_deletedAt_idx" ON "Transaction"("deletedAt");

ALTER TABLE "Cattle" ADD CONSTRAINT "Cattle_deletedByUserId_fkey" FOREIGN KEY ("deletedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HealthEvent" ADD CONSTRAINT "HealthEvent_deletedByUserId_fkey" FOREIGN KEY ("deletedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MilkRecord" ADD CONSTRAINT "MilkRecord_deletedByUserId_fkey" FOREIGN KEY ("deletedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_deletedByUserId_fkey" FOREIGN KEY ("deletedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
