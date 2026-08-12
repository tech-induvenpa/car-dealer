-- CreateEnum
CREATE TYPE "Brand" AS ENUM ('TOYOTA', 'KIA', 'CHANGAN');

-- CreateEnum
CREATE TYPE "VehicleCategory" AS ENUM ('SUV', 'SEDAN', 'PICKUP', 'HATCHBACK', 'COMPACTO');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('GASOLINA', 'DIESEL', 'HIBRIDO', 'ELECTRICO');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('MANUAL', 'AUTOMATICA', 'CVT', 'DCT');

-- CreateEnum
CREATE TYPE "DriveType" AS ENUM ('FWD_4X2', 'AWD_4X4');

-- CreateEnum
CREATE TYPE "FuelEconomyUnit" AS ENUM ('KM_POR_GAL', 'L_POR_100KM');

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" SERIAL NOT NULL,
    "brand" "Brand" NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "priceIncludes" TEXT,
    "mainImageUrl" TEXT NOT NULL,
    "category" "VehicleCategory" NOT NULL,
    "displacementCc" INTEGER,
    "cylinders" INTEGER,
    "horsepowerHp" INTEGER,
    "torqueNm" INTEGER,
    "fuelType" "FuelType" NOT NULL,
    "transmissionType" "TransmissionType" NOT NULL,
    "transmissionSpeeds" INTEGER,
    "driveType" "DriveType" NOT NULL,
    "lengthMm" INTEGER,
    "widthMm" INTEGER,
    "heightMm" INTEGER,
    "wheelbaseMm" INTEGER,
    "trunkCapacityL" INTEGER,
    "weightKg" INTEGER,
    "passengerCapacity" INTEGER,
    "fuelEconomyValue" DECIMAL(5,2),
    "fuelEconomyUnit" "FuelEconomyUnit",
    "fuelEconomyNormalizedKmPerL" DECIMAL(5,2),
    "tankCapacityL" INTEGER,
    "airbagsCount" INTEGER,
    "hasAbs" BOOLEAN NOT NULL DEFAULT false,
    "hasStabilityControl" BOOLEAN NOT NULL DEFAULT false,
    "hasRearCamera" BOOLEAN NOT NULL DEFAULT false,
    "seatType" TEXT,
    "hasBluetooth" BOOLEAN NOT NULL DEFAULT false,
    "hasCarPlay" BOOLEAN NOT NULL DEFAULT false,
    "warrantyYears" INTEGER,
    "warrantyKm" INTEGER,
    "highlights" TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);
