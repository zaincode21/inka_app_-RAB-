-- Remap UserRole to Super Admin / Farm Owner / Farm Manager (keep Vet/Worker for later).
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'FARM_OWNER', 'FARM_MANAGER', 'VETERINARIAN', 'WORKER');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "UserRole_new"
  USING (
    CASE "role"::text
      WHEN 'OWNER' THEN 'FARM_OWNER'::"UserRole_new"
      WHEN 'MANAGER' THEN 'FARM_MANAGER'::"UserRole_new"
      WHEN 'VETERINARIAN' THEN 'VETERINARIAN'::"UserRole_new"
      WHEN 'WORKER' THEN 'WORKER'::"UserRole_new"
      ELSE 'FARM_OWNER'::"UserRole_new"
    END
  );

DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'FARM_OWNER'::"UserRole";

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
