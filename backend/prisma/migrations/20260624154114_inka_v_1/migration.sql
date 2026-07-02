-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'MANAGER', 'VETERINARIAN', 'WORKER');

-- CreateEnum
CREATE TYPE "AnimalSex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "CattleStage" AS ENUM ('CALF', 'HEIFER', 'COW', 'BULL', 'STEER');

-- CreateEnum
CREATE TYPE "CattleStatus" AS ENUM ('ACTIVE', 'SOLD', 'CULLED', 'DEAD', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ReproductiveStatus" AS ENUM ('OPEN', 'BRED', 'PREGNANT', 'DRY', 'LACTATING', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "EventScope" AS ENUM ('INDIVIDUAL', 'MASS');

-- CreateEnum
CREATE TYPE "TransactionKind" AS ENUM ('INCOME', 'EXPENSE');

-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "weightUnit" TEXT NOT NULL DEFAULT 'kg',
    "milkUnit" TEXT NOT NULL DEFAULT 'L',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "farmId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cattle" (
    "id" TEXT NOT NULL,
    "farmId" TEXT,
    "tagNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "officialId" TEXT,
    "rfid" TEXT,
    "breed" TEXT NOT NULL,
    "sex" "AnimalSex" NOT NULL,
    "stage" "CattleStage" NOT NULL,
    "status" "CattleStatus" NOT NULL DEFAULT 'ACTIVE',
    "groupName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "entryDate" TIMESTAMP(3),
    "weightKg" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "bodyConditionScore" DECIMAL(3,1) NOT NULL DEFAULT 0,
    "colorMarkings" TEXT,
    "source" TEXT,
    "sourceDetail" TEXT,
    "purchasePrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paddock" TEXT,
    "lactationNumber" INTEGER NOT NULL DEFAULT 0,
    "parity" INTEGER NOT NULL DEFAULT 0,
    "reproductiveStatus" "ReproductiveStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "motherTag" TEXT,
    "fatherTag" TEXT,
    "notes" TEXT,
    "photoUri" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cattle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthEvent" (
    "id" TEXT NOT NULL,
    "farmId" TEXT,
    "cattleId" TEXT,
    "scope" "EventScope" NOT NULL,
    "groupName" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "eventType" TEXT NOT NULL,
    "symptoms" TEXT,
    "diagnosis" TEXT,
    "medicine" TEXT,
    "dosage" TEXT,
    "route" TEXT,
    "frequency" TEXT,
    "withdrawalDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "batchNumber" TEXT,
    "technician" TEXT,
    "vetName" TEXT,
    "vetContact" TEXT,
    "followUpDate" TIMESTAMP(3),
    "weightKg" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "semenUsed" TEXT,
    "bullResponsible" TEXT,
    "returnHeatDate" TIMESTAMP(3),
    "breedingDate" TIMESTAMP(3),
    "expectedDeliveryDate" TIMESTAMP(3),
    "calfTag" TEXT,
    "calfGender" "AnimalSex",
    "notes" TEXT,
    "photoUri" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilkRecord" (
    "id" TEXT NOT NULL,
    "farmId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "milkType" TEXT NOT NULL,
    "amTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "noonTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pmTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalProduced" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalUsed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "rejectedMilk" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "destination" TEXT,
    "buyer" TEXT,
    "pricePerLiter" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fatPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "proteinPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "somaticCellCount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MilkRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "farmId" TEXT,
    "cattleId" TEXT,
    "milkRecordId" TEXT,
    "healthEventId" TEXT,
    "kind" "TransactionKind" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "quantity" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paymentMethod" TEXT,
    "buyerVendor" TEXT,
    "receiptNumber" TEXT,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "farmId" TEXT,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "label" TEXT,
    "cattleId" TEXT,
    "milkRecordId" TEXT,
    "healthEventId" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cattle_tagNumber_key" ON "Cattle"("tagNumber");

-- CreateIndex
CREATE INDEX "Cattle_farmId_idx" ON "Cattle"("farmId");

-- CreateIndex
CREATE INDEX "Cattle_tagNumber_idx" ON "Cattle"("tagNumber");

-- CreateIndex
CREATE INDEX "Cattle_stage_status_idx" ON "Cattle"("stage", "status");

-- CreateIndex
CREATE INDEX "HealthEvent_farmId_idx" ON "HealthEvent"("farmId");

-- CreateIndex
CREATE INDEX "HealthEvent_cattleId_idx" ON "HealthEvent"("cattleId");

-- CreateIndex
CREATE INDEX "HealthEvent_eventDate_idx" ON "HealthEvent"("eventDate");

-- CreateIndex
CREATE INDEX "HealthEvent_eventType_idx" ON "HealthEvent"("eventType");

-- CreateIndex
CREATE INDEX "MilkRecord_farmId_idx" ON "MilkRecord"("farmId");

-- CreateIndex
CREATE INDEX "MilkRecord_date_idx" ON "MilkRecord"("date");

-- CreateIndex
CREATE INDEX "Transaction_farmId_idx" ON "Transaction"("farmId");

-- CreateIndex
CREATE INDEX "Transaction_kind_date_idx" ON "Transaction"("kind", "date");

-- CreateIndex
CREATE INDEX "Transaction_category_idx" ON "Transaction"("category");

-- CreateIndex
CREATE INDEX "Category_kind_idx" ON "Category"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "Category_farmId_kind_name_key" ON "Category"("farmId", "kind", "name");

-- CreateIndex
CREATE INDEX "Attachment_ownerType_idx" ON "Attachment"("ownerType");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cattle" ADD CONSTRAINT "Cattle_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthEvent" ADD CONSTRAINT "HealthEvent_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthEvent" ADD CONSTRAINT "HealthEvent_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilkRecord" ADD CONSTRAINT "MilkRecord_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_milkRecordId_fkey" FOREIGN KEY ("milkRecordId") REFERENCES "MilkRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_healthEventId_fkey" FOREIGN KEY ("healthEventId") REFERENCES "HealthEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_milkRecordId_fkey" FOREIGN KEY ("milkRecordId") REFERENCES "MilkRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_healthEventId_fkey" FOREIGN KEY ("healthEventId") REFERENCES "HealthEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
