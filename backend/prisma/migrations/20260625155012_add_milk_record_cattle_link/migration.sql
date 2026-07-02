-- AlterTable
ALTER TABLE "MilkRecord" ADD COLUMN     "cattleId" TEXT;

-- CreateIndex
CREATE INDEX "MilkRecord_cattleId_idx" ON "MilkRecord"("cattleId");

-- AddForeignKey
ALTER TABLE "MilkRecord" ADD CONSTRAINT "MilkRecord_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
