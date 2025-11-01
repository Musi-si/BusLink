// scripts/reset-db.ts

import { PrismaClient } from '@prisma/client'
import logger from '../src/utils/logger.js'

const prisma = new PrismaClient()

async function main() {
  logger.info('🗑️  Starting database reset...')

  // The order is important due to foreign key constraints
  await prisma.locationUpdate.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.bus.deleteMany()
  await prisma.driver.deleteMany()
  await prisma.stop.deleteMany()
  await prisma.route.deleteMany()
  await prisma.user.deleteMany()

  logger.info('✅ Database has been completely reset.')
}

main()
  .catch((e) => {
    logger.error('❌ An error occurred during database reset:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })