// scripts/gps-simulator.ts

import { PrismaClient, Bus, Route, Stop, BusDirection } from '@prisma/client' // <-- Import BusDirection
import { io as SocketIOClient } from 'socket.io-client'
import logger from '../src/utils/logger.js'

const prisma = new PrismaClient()

// Define a type for our simulated bus object
type SimulatedBus = Bus & {
  route: Route & { stops: Stop[] }
  currentStopIndex: number
  targetStopIndex: number
  // FIX: Use the Prisma enum for direction. No longer a type conflict.
  direction: BusDirection 
  stopUntil?: Date
}

class GpsSimulator {
  private serverUrl = `http://localhost:${process.env.PORT || 3000}`
  private socket = SocketIOClient(this.serverUrl)
  private buses: SimulatedBus[] = [] // This will no longer be 'never[]'
  private simulationInterval = 3000 // 3 seconds

  public async start() {
    logger.info('🚌 Starting GPS Simulator...')
    await this.initializeBuses()
    this.connectToServer()

    setInterval(() => this.updateBuses(), this.simulationInterval)

    logger.info(`✅ GPS Simulator started with ${this.buses.length} buses.`)
    logger.info(`📡 Update interval: ${this.simulationInterval}ms`)
  }

  private connectToServer() {
    this.socket.on('connect', () => logger.info('✅ Connected to BusLink server via WebSocket.'))
    this.socket.on('disconnect', () => logger.warn('🔌 Disconnected from BusLink server.'))
    this.socket.on('connect_error', (err) => logger.error(`Connection Error: ${err.message}`))
  }

  private async initializeBuses() {
    logger.info('Fetching bus and route data from database...')
    const dbBuses = await prisma.bus.findMany({
      where: { isTracked: true },
      include: {
        route: {
          include: {
            stops: { orderBy: { stopOrder: 'asc' } },
          },
        },
      },
    })

    if (dbBuses.length === 0) {
      logger.error('❌ No buses found in the database to simulate. Please seed the database first.')
      process.exit(1)
    }

    this.buses = dbBuses.map((bus) => ({
      ...bus,
      currentStopIndex: 0,
      targetStopIndex: 1,
      // FIX: direction is already part of the `bus` object from Prisma, so we don't need to add it here.
      // It defaults to 'forward' as per the schema.
    }))

    logger.info(`Initialized ${this.buses.length} buses for simulation.`)
  }

  private updateBuses() {
    if (!this.socket.connected) return
    this.buses.forEach((bus) => this.moveBus(bus))
  }

  private moveBus(bus: SimulatedBus) {
    const now = new Date()
    // FIX: Correctly checks the property on the 'bus' object.
    if (bus.stopUntil && now < bus.stopUntil) {
      return
    }

    const { route, currentStopIndex } = bus
    
    // FIX: Logic now based on the string value of bus.direction
    const directionIncrement = bus.direction === 'forward' ? 1 : -1
    bus.targetStopIndex = currentStopIndex + directionIncrement

    const targetStop = route.stops[bus.targetStopIndex]

    if (!targetStop) {
      // Reached end of route, turn around
      bus.direction = bus.direction === 'forward' ? 'backward' : 'forward'
      bus.targetStopIndex = bus.currentStopIndex + (bus.direction === 'forward' ? 1 : -1)
      const newTargetStop = route.stops[bus.targetStopIndex]
      if (!newTargetStop) return 
    }
    
    // Simulate movement
    const lastLat = bus.lastLocationLat ?? route.stops[currentStopIndex].latitude
    const lastLng = bus.lastLocationLng ?? route.stops[currentStopIndex].longitude

    const latDiff = route.stops[bus.targetStopIndex].latitude - lastLat
    const lngDiff = route.stops[bus.targetStopIndex].longitude - lastLng
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff)
    
    const speedKmh = 40
    const speedFactor = (speedKmh / 3600) * (this.simulationInterval / 1000) / 111.32

    if (distance < speedFactor) {
      // Arrived at target stop
      bus.lastLocationLat = route.stops[bus.targetStopIndex].latitude
      bus.lastLocationLng = route.stops[bus.targetStopIndex].longitude
      bus.currentStopIndex = bus.targetStopIndex
      bus.stopUntil = new Date(Date.now() + Math.random() * 20000) // Wait 0-20 seconds
    } else {
      // Move towards target
      const moveRatio = speedFactor / distance
      bus.lastLocationLat = lastLat + latDiff * moveRatio
      bus.lastLocationLng = lastLng + lngDiff * moveRatio
    }

    // Emit update
    const locationUpdate = {
      busId: bus.id,
      routeId: bus.routeId,
      latitude: bus.lastLocationLat,
      longitude: bus.lastLocationLng,
      speedKmh,
      timestamp: new Date().toISOString(),
    }
    
    this.socket.emit('updateLocation', locationUpdate)
    logger.info(`📍 Emitting location for Bus #${bus.busNumber}: ${locationUpdate.latitude.toFixed(4)}, ${locationUpdate.longitude.toFixed(4)}`)
  }
}

const simulator = new GpsSimulator()
simulator.start()