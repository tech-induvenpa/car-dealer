-- AlterEnum
ALTER TYPE "AnalyticsEventType" ADD VALUE 'VERDICT_DELIVERED';

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "contactFirstName" TEXT,
ADD COLUMN     "contactLastName" TEXT,
ADD COLUMN     "contactPhone" TEXT;
