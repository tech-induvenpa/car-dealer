-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('VEHICLE_VIEWED', 'VEHICLE_ADDED_TO_COMPARISON', 'COMPARISON_PERFORMED', 'QUIZ_COMPLETED', 'LEAD_SUBMITTED');

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" SERIAL NOT NULL,
    "type" "AnalyticsEventType" NOT NULL,
    "sessionId" TEXT,
    "vehicleId" INTEGER,
    "vehicleIds" INTEGER[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);
