// prisma/seed.ts

import { PrismaClient, BusDirection, BusStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// --- SAMPLE DATA ---

const sampleUsers = [
  { name: 'System Admin', email: 'admin@buslink.com', password: 'Password123!', role: 'admin', phone: '+250788000000' },
  { name: 'John Uwimana', email: 'john.uwimana@example.com', password: 'Password123!', role: 'passenger', phone: '+250788123456' },
  { name: 'Marie Mukamana', email: 'marie.mukamana@example.com', password: 'Password123!', role: 'passenger', phone: '+250788234567' },
  { name: 'David Nkurunziza', email: 'david.driver@example.com', password: 'Password123!', role: 'driver', phone: '+250788345678', license: 'LIC001RW' },
  { name: 'Grace Uwizeyimana', email: 'grace.driver@example.com', password: 'Password123!', role: 'driver', phone: '+250788456789', license: 'LIC002RW' },
];

const sampleRoutes = [
  { id: 1, name: 'Nyabugogo - City Center', fareAmount: 500, distanceKm: 6.2, estimatedDurationMinutes: 18 },
  { id: 2, name: 'Remera - Kimironko', fareAmount: 300, distanceKm: 4.5, estimatedDurationMinutes: 12 },
];

const sampleStops = [
  { routeId: 1, name: 'Nyabugogo Terminal', latitude: -1.9659, longitude: 30.0588, stopOrder: 1 },
  { routeId: 1, name: 'Kimisagara', latitude: -1.9580, longitude: 30.0610, stopOrder: 2 },
  { routeId: 1, name: 'Kigali City Center', latitude: -1.9441, longitude: 30.0729, stopOrder: 3 },
  { routeId: 2, name: 'Remera', latitude: -1.9441, longitude: 30.0939, stopOrder: 1 },
  { routeId: 2, name: 'Kimironko Market', latitude: -1.9280, longitude: 30.1050, stopOrder: 2 },
];

const sampleBuses = [
  { busNumber: 'RB001', vehiclePlate: 'RAD 123 A', model: 'Toyota Hiace', capacity: 30 },
  { busNumber: 'RB002', vehiclePlate: 'RAD 124 B', model: 'Mercedes Sprinter', capacity: 25 },
];


async function main() {
  console.log('🚀 Starting database seeding...');

  // 1. Clean up existing data in the correct order
  console.log('🧹 Cleaning database...');
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.locationUpdate.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.stop.deleteMany();
  await prisma.route.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Database cleaned!');

  // 2. Create Users and Notifications
  console.log('👥 Creating users and notifications...');
  const createdUsers = [];
  for (const userData of sampleUsers) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const user = await prisma.user.create({
      data: {
        name: userData.name, email: userData.email, password: hashedPassword,
        role: userData.role as any, phone: userData.phone, isEmailVerified: true, isActive: true,
        notifications: {
          create: { message: 'Welcome to BusLink! We are happy to have you.' },
        },
      },
    });
    createdUsers.push(user);
  }
  console.log(`✅ Created ${createdUsers.length} users and their welcome notifications.`);

  // 3. Create Routes with nested Stops
  console.log('🛣️ Creating routes and stops...');
  const routeMap = new Map();
  for (const routeData of sampleRoutes) {
    const route = await prisma.route.create({
      data: {
        name: routeData.name,
        fareAmount: routeData.fareAmount,
        distanceKm: routeData.distanceKm ?? undefined,
        estimatedDurationMinutes: routeData.estimatedDurationMinutes ?? undefined,
        stops: {
          create: sampleStops.filter(s => s.routeId === routeData.id).map(({ routeId, ...stop }) => stop),
        },
      },
    });
    routeMap.set(route.id, route);
  }
  console.log(`✅ Created ${sampleRoutes.length} routes and their stops.`);
  
  const routesWithStops = await prisma.route.findMany({ include: { stops: { orderBy: { stopOrder: 'asc' } } } });

  // 4. Create Drivers, Buses, and Trips
  console.log('🚗🚌 Creating drivers, buses, and trips...');
  const driverUsers = createdUsers.filter(u => u.role === 'driver');
  const createdDrivers = [];
  const createdBuses = [];

  for (let i = 0; i < driverUsers.length; i++) {
    const user = driverUsers[i];
    const driverData = sampleUsers.find(su => su.email === user.email)!;
    const busData = sampleBuses[i];
    const route = routesWithStops[i % routesWithStops.length];

    const driver = await prisma.driver.create({
      data: { userId: user.id, name: user.name, phone: user.phone!, licenseNumber: driverData.license! },
    });
    createdDrivers.push(driver);

    const bus = await prisma.bus.create({
      data: {
        busNumber: busData.busNumber, vehiclePlate: busData.vehiclePlate,
        vehicleModel: busData.model, capacity: busData.capacity,
        routeId: route.id, driverId: driver.id, status: 'idle' as BusStatus,
        direction: 'forward' as BusDirection,
      },
    });
    createdBuses.push(bus);

    // Create a completed trip for this driver
    await prisma.trip.create({
      data: {
        driverId: driver.id, routeId: route.id, busId: bus.id,
        status: 'completed', distanceKm: Number(route.distanceKm) || 8.5, durationMins: Number(route.estimatedDurationMinutes) || 25,
        endedAt: new Date(),
      },
    });
  }
  console.log(`✅ Created ${createdDrivers.length} drivers, buses, and sample trips.`);

  // 5. Create Bookings and Payments
  console.log('🎟️ Creating bookings and payments...');
  const passengerUser = createdUsers.find(u => u.role === 'passenger')!;
  const busForBooking = createdBuses[0];
  const routeForBooking = routesWithStops.find(r => r.id === busForBooking.routeId)!;

      const booking = await prisma.booking.create({
    data: {
      userId: passengerUser.id,
      busId: busForBooking.id,
      routeId: busForBooking.routeId,
      fromStopId: routeForBooking.stops[0].id,
      toStopId: routeForBooking.stops[2].id,
      seatCount: 2,
      	  totalFare: Number(routeMap.get(busForBooking.routeId)?.fareAmount ?? 500) * 2,
      travelDate: new Date(),
      bookingReference: `BKL${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`,
      status: 'completed',
      paymentStatus: 'paid',
    },
  });

  // Create a payment for the booking
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amount: booking.totalFare,
      method: 'CASH',
      status: 'paid',
    },
  });

  // Create a pending booking
      await prisma.booking.create({
    data: {
      userId: passengerUser.id,
      busId: busForBooking.id,
      routeId: busForBooking.routeId,
      fromStopId: routeForBooking.stops[0].id,
      toStopId: routeForBooking.stops[1].id,
      seatCount: 1,
          totalFare: Number(routeMap.get(busForBooking.routeId)?.fareAmount ?? 500),
      travelDate: new Date(),
      bookingReference: `BKL${(Date.now() + 1).toString(36).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`,
      status: 'pending',
      paymentStatus: 'pending',
    },
  });
  console.log('✅ Created sample bookings and payments.');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ An error occurred while seeding the database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('👋 Database connection closed.');
  });