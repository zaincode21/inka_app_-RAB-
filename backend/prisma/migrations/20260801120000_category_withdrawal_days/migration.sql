-- Default milk withdrawal days for medicine/vaccine categories.
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "defaultWithdrawalDays" DECIMAL(6,2) NOT NULL DEFAULT 0;
