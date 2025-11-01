// prisma/seed.ts

import { PrismaClient, BusDirection, BusStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// --- SAMPLE DATA (Consolidated from seedData.ts) ---

const sampleUsers = [
  { name: 'System Admin', email: 'admin@buslink.com', password: 'Password123!', role: 'admin', phone: '+250788000000' },
  { name: 'John Uwimana', email: 'john.uwimana@example.com', password: 'Password123!', role: 'passenger', phone: '+250788123456' },
  { name: 'Marie Mukamana', email: 'marie.mukamana@example.com', password: 'Password123!', role: 'passenger', phone: '+250788234567' },
  { name: 'David Nkurunziza', email: 'david.driver@example.com', password: 'Password123!', role: 'driver', phone: '+250788345678', license: 'LIC001RW', plate: 'RAD 123 A', model: 'Toyota Hiace', capacity: 30 },
  { name: 'Grace Uwizeyimana', email: 'grace.driver@example.com', password: 'Password123!', role: 'driver', phone: '+250788456789', license: 'LIC002RW', plate: 'RAD 124 B', model: 'Mercedes Sprinter', capacity: 25 },
  { name: 'Patrick Hakizimana', email: 'patrick.driver@example.com', password: 'Password123!', role: 'driver', phone: '+250788567890', license: 'LIC003RW', plate: 'RAD 125 C', model: 'Nissan Civilian', capacity: 35 }
]

const sampleRoutes = [
  { id: 1, name: 'Nyabugogo - City Center', description: 'Main route to City Center', color: '#FF5722', distanceKm: 8.5, estimatedDurationMinutes: 25, fareAmount: 500 },
  { id: 2, name: 'Remera - Kimironko', description: 'Route connecting Remera to Kimironko', color: '#2196F3', distanceKm: 4.2, estimatedDurationMinutes: 15, fareAmount: 300 },
  { id: 3, name: 'Kicukiro - Nyarugunga', description: 'South Kigali route', color: '#4CAF50', distanceKm: 6.8, estimatedDurationMinutes: 20, fareAmount: 400 },
  { id: 4, name: 'Gasabo - Kinyinya', description: 'Northern route', color: '#FF9800', distanceKm: 7.2, estimatedDurationMinutes: 22, fareAmount: 450 },
  { id: 5, name: 'Nyanza - Huye Express', description: 'Long distance route', color: '#9C27B0', distanceKm: 135.0, estimatedDurationMinutes: 180, fareAmount: 2500 }
]

const sampleStops = [
  { routeId: 1, name: 'Nyabugogo Terminal', latitude: -1.9659, longitude: 30.0588, stopOrder: 1 },
  { routeId: 1, name: 'Kimisagara', latitude: -1.9580, longitude: 30.0610, stopOrder: 2 },
  { routeId: 1, name: 'Nyamirambo', latitude: -1.9520, longitude: 30.0640, stopOrder: 3 },
  { routeId: 1, name: 'Kigali City Center', latitude: -1.9441, longitude: 30.0729, stopOrder: 4 },
  { routeId: 2, name: 'Remera', latitude: -1.9441, longitude: 30.0939, stopOrder: 1 },
  { routeId: 2, name: 'Kisimenti', latitude: -1.9380, longitude: 30.0970, stopOrder: 2 },
  { routeId: 2, name: 'Gishushu', latitude: -1.9320, longitude: 30.1010, stopOrder: 3 },
  { routeId: 2, name: 'Kimironko Market', latitude: -1.9280, longitude: 30.1050, stopOrder: 4 },
  { routeId: 3, name: 'Kicukiro Center', latitude: -1.9720, longitude: 30.0920, stopOrder: 1 },
  { routeId: 3, name: 'Gatenga', latitude: -1.9780, longitude: 30.0980, stopOrder: 2 },
  { routeId: 3, name: 'Nyarugunga', latitude: -1.9900, longitude: 30.1100, stopOrder: 3 },
  { routeId: 4, name: 'Gasabo', latitude: -1.9200, longitude: 30.0800, stopOrder: 1 },
  { routeId: 4, name: 'Jabana', latitude: -1.9150, longitude: 30.0850, stopOrder: 2 },
  { routeId: 4, name: 'Kinyinya', latitude: -1.9050, longitude: 30.0950, stopOrder: 3 },
  { routeId: 5, name: 'Nyanza Terminal', latitude: -2.3500, longitude: 29.9000, stopOrder: 1 },
  { routeId: 5, name: 'Huye (Butare)', latitude: -2.5950, longitude: 29.7390, stopOrder: 2 }
]


async function main() {
  console.log('🚀 Starting database seeding...')

  // 1. Clean up existing data
  console.log('🧹 Cleaning existing data...')
  await prisma.locationUpdate.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.bus.deleteMany()
  await prisma.driver.deleteMany()
  await prisma.stop.deleteMany()
  await prisma.route.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Database cleaned!')

  // 2. Create Users
  console.log('👥 Creating users...')
  const userCreationPromises = sampleUsers.map(async (userData) => {
    const hashedPassword = await bcrypt.hash(userData.password, 12)
    return prisma.user.create({
      data: {
        name: userData.name, email: userData.email, password: hashedPassword,
        role: userData.role as any, phone: userData.phone,
        isEmailVerified: true, isActive: true,
      },
    })
  })
  const createdUsers = await Promise.all(userCreationPromises)
  console.log(`✅ Created ${createdUsers.length} users.`)

  // 3. Create Routes
  console.log('🛣️  Creating routes...')
  for (const routeData of sampleRoutes) {
    await prisma.route.create({
      data: {
        name: routeData.name, description: routeData.description, color: routeData.color,
        distanceKm: routeData.distanceKm, estimatedDurationMinutes: routeData.estimatedDurationMinutes,
        fareAmount: routeData.fareAmount,
        stops: {
          create: sampleStops
            .filter(stop => stop.routeId === routeData.id)
            .map(({ routeId, ...stop }) => stop), // Exclude routeId from stop data
        },
      },
    })
  }
  console.log(`✅ Created ${sampleRoutes.length} routes and their stops.`)

  // --- 4. Create Drivers & Buses in a loop ---
  console.log('🚗🚌 Creating drivers and buses...')
  const driverUsers = createdUsers.filter(u => u.role === 'driver')
  const driverSampleData = sampleUsers.filter(u => u.role === 'driver')

  // FIX: Fetch routes again, but this time INCLUDE the stops we just created
  const routesWithStops = await prisma.route.findMany({
    include: {
      stops: { orderBy: { stopOrder: 'asc' } },
    },
  })

  for (let i = 0; i < driverUsers.length; i++) {
    const user = driverUsers[i]
    const sampleData = driverSampleData[i]
    const route = routesWithStops[i % routesWithStops.length] // Assign routes cyclically

    // Create the driver profile
    const driver = await prisma.driver.create({
      data: {
        userId: user.id,
        name: user.name,
        phone: user.phone!,
        licenseNumber: sampleData.license ?? '',
        status: 'active',
        rating: 4.5,
        isVerified: true,
      },
    })

    // Create the bus and link it to the driver and route
    const initialStop = route.stops[0]
    const nextStop = route.stops[1] || initialStop // Handle routes with only one stop

    await prisma.bus.create({
      data: {
        busNumber: `RB${String(i + 1).padStart(3, '0')}`,
        vehiclePlate: sampleData.plate ?? '',
        vehicleModel: sampleData.model ?? '',
        capacity: sampleData.capacity ?? 0,
        routeId: route.id,
        driverId: driver.id,
        status: i % 2 === 0 ? 'moving' : 'idle' as BusStatus,
        direction: 'forward' as BusDirection,
        lastLocationLat: initialStop.latitude,
        lastLocationLng: initialStop.longitude,
        currentStopId: initialStop.id,
        nextStopId: nextStop.id,
      },
    })
  }
  console.log(`✅ Created ${driverUsers.length} drivers and their assigned buses.`)

  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ An error occurred while seeding the database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('👋 Database connection closed.')
  })