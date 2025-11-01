/*
  Warnings:

  - You are about to drop the column `route_id` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `vehicle_capacity` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `vehicle_model` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `vehicle_plate` on the `drivers` table. All the data in the column will be lost.
  - The `status` column on the `drivers` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[license_number]` on the table `drivers` will be added. If there are existing duplicate values, this will fail.
  - Made the column `phone` on table `drivers` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('active', 'inactive', 'on_break', 'off_duty');

-- CreateEnum
CREATE TYPE "BusStatus" AS ENUM ('idle', 'moving', 'arrived', 'offline', 'maintenance');

-- CreateEnum
CREATE TYPE "BusDirection" AS ENUM ('forward', 'backward');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "LocationSource" AS ENUM ('gps', 'manual', 'simulator');

-- DropForeignKey
ALTER TABLE "drivers" DROP CONSTRAINT "drivers_route_id_fkey";

-- AlterTable
ALTER TABLE "drivers" DROP COLUMN "route_id",
DROP COLUMN "vehicle_capacity",
DROP COLUMN "vehicle_model",
DROP COLUMN "vehicle_plate",
ALTER COLUMN "phone" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "DriverStatus" NOT NULL DEFAULT 'off_duty';

-- AlterTable
ALTER TABLE "routes" ADD COLUMN     "description" TEXT,
ADD COLUMN     "distance_km" DECIMAL(65,30),
ADD COLUMN     "estimated_duration_minutes" INTEGER,
ADD COLUMN     "fare_amount" DECIMAL(65,30),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "polyline" TEXT,
ALTER COLUMN "color" SET DEFAULT '#007bff';

-- CreateTable
CREATE TABLE "stops" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "stop_order" INTEGER NOT NULL,
    "zone" TEXT,
    "amenities" JSONB DEFAULT '[]',
    "is_major" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "route_id" INTEGER NOT NULL,

    CONSTRAINT "stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buses" (
    "id" SERIAL NOT NULL,
    "bus_number" TEXT NOT NULL,
    "vehicle_plate" TEXT NOT NULL,
    "vehicle_model" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "current_occupancy" INTEGER NOT NULL DEFAULT 0,
    "status" "BusStatus" NOT NULL DEFAULT 'idle',
    "direction" "BusDirection" NOT NULL DEFAULT 'forward',
    "is_tracked" BOOLEAN NOT NULL DEFAULT true,
    "last_location_lat" DOUBLE PRECISION,
    "last_location_lng" DOUBLE PRECISION,
    "last_speed_kmh" DECIMAL(65,30),
    "last_update" TIMESTAMP(3),
    "route_id" INTEGER NOT NULL,
    "driver_id" INTEGER,
    "current_stop_id" INTEGER,
    "next_stop_id" INTEGER,

    CONSTRAINT "buses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_updates" (
    "id" SERIAL NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "speed_kmh" DECIMAL(65,30),
    "heading" DECIMAL(65,30),
    "altitude" DECIMAL(65,30),
    "accuracy" DECIMAL(65,30),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "LocationSource" NOT NULL DEFAULT 'gps',
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "bus_id" INTEGER NOT NULL,

    CONSTRAINT "location_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "seat_count" INTEGER NOT NULL DEFAULT 1,
    "total_fare" DECIMAL(65,30) NOT NULL,
    "booking_reference" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "payment_method" TEXT,
    "booking_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "travel_date" TIMESTAMP(3) NOT NULL,
    "passenger_name" TEXT,
    "passenger_phone" TEXT,
    "special_requests" TEXT,
    "notes" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "user_id" INTEGER NOT NULL,
    "bus_id" INTEGER NOT NULL,
    "route_id" INTEGER NOT NULL,
    "from_stop_id" INTEGER NOT NULL,
    "to_stop_id" INTEGER NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stops_latitude_longitude_idx" ON "stops"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "stops_route_id_stop_order_key" ON "stops"("route_id", "stop_order");

-- CreateIndex
CREATE UNIQUE INDEX "buses_bus_number_key" ON "buses"("bus_number");

-- CreateIndex
CREATE UNIQUE INDEX "buses_vehicle_plate_key" ON "buses"("vehicle_plate");

-- CreateIndex
CREATE UNIQUE INDEX "buses_driver_id_key" ON "buses"("driver_id");

-- CreateIndex
CREATE INDEX "location_updates_bus_id_timestamp_idx" ON "location_updates"("bus_id", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_reference_key" ON "bookings"("booking_reference");

-- CreateIndex
CREATE INDEX "bookings_travel_date_idx" ON "bookings"("travel_date");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_license_number_key" ON "drivers"("license_number");

-- AddForeignKey
ALTER TABLE "stops" ADD CONSTRAINT "stops_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buses" ADD CONSTRAINT "buses_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buses" ADD CONSTRAINT "buses_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buses" ADD CONSTRAINT "buses_current_stop_id_fkey" FOREIGN KEY ("current_stop_id") REFERENCES "stops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buses" ADD CONSTRAINT "buses_next_stop_id_fkey" FOREIGN KEY ("next_stop_id") REFERENCES "stops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_updates" ADD CONSTRAINT "location_updates_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_from_stop_id_fkey" FOREIGN KEY ("from_stop_id") REFERENCES "stops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_to_stop_id_fkey" FOREIGN KEY ("to_stop_id") REFERENCES "stops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
