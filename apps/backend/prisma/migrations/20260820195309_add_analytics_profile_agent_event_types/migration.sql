-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AnalyticsEventType" ADD VALUE 'NEED_CAPTURED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'MOTIVATION_CAPTURED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'OBJECTION_CAPTURED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'BUDGET_CAPTURED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'FUNNEL_STAGE_REACHED';
