# 🚌 Bus Tracking Platform - Backend

A complete backend system for a **Bus Tracking Platform** designed for **Kigali, Rwanda**. This system provides real-time bus tracking, route management, seat booking, and live ETA calculations with WebSocket support.

## 🏗 Architecture

- **Framework**: Node.js with Express
- **Database**: PostgreSQL with Sequelize ORM
- **Real-time**: Socket.IO for live updates
- **Authentication**: JWT-based auth system
- **API Style**: RESTful with real-time WebSocket integration

## 🌟 Features

- ✅ **JWT Authentication** - Secure user and driver authentication
- ✅ **Real-time Bus Tracking** - Live GPS location updates via Socket.IO
- ✅ **Route Management** - Complete CRUD for routes and bus stops
- ✅ **ETA Calculations** - Haversine formula with traffic factors
- ✅ **Seat Booking System** - Optional reservation system
- ✅ **Nearby Stops Search** - Geolocation-based stop discovery
- ✅ **GPS Simulator** - Testing tool for simulating bus movement
- ✅ **Comprehensive Logging** - Winston-based logging system
- ✅ **Error Handling** - Centralized error handling middleware
- ✅ **Data Seeding** - Sample data for Kigali routes and stops

## 📦 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                   # PostgreSQL connection
│   ├── models/                     # Sequelize models
│   │   ├── index.js               # Model relationships
│   │   ├── User.js                # User authentication model
│   │   ├── Driver.js              # Driver profile model
│   │   ├── Route.js               # Bus route model
│   │   ├── Stop.js                # Bus stop model
│   │   ├── Bus.js                 # Active bus model
│   │   ├── LocationUpdate.js      # GPS tracking data
│   │   └── Booking.js             # Seat reservation model
│   ├── controllers/               # Business logic
│   │   ├── authController.js      # Authentication endpoints
│   │   ├── routeController.js     # Route and stop management
│   │   ├── busController.js       # Bus tracking and location
│   │   └── bookingController.js   # Booking system
│   ├── routes/                    # Express routes
│   │   ├── auth.js               # Authentication routes
│   │   ├── routes.js             # Route management routes
│   │   ├── stops.js              # Stop-specific routes
│   │   ├── buses.js              # Bus tracking routes
│   │   └── bookings.js           # Booking routes
│   ├── middleware/               # Custom middleware
│   │   ├── auth.js              # JWT authentication
│   │   └── errorHandler.js      # Error handling
│   ├── services/                # Business services
│   │   └── socketService.js     # Socket.IO management
│   ├── utils/                   # Utility functions
│   │   ├── logger.js           # Winston logger
│   │   ├── etaCalculator.js    # ETA and distance calculations
│   │   └── seedData.js         # Database seeding
│   ├── server.js               # Express server setup
│   └── app.js                  # Application entry point
├── gps-simulator.js            # GPS simulation script
├── .env.example               # Environment variables template
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### 1. Installation

```bash
cd backend
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your database credentials
```

Required environment variables:
```bash
PORT=3000
DATABASE_URL=postgres://username:password@localhost:5432/bus_tracking
JWT_SECRET=your_super_secret_jwt_key_here
CORS_ORIGIN=http://localhost:3001
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb bus_tracking

# Run database migrations and seed data
npm run seed
```

### 4. Start the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

### 5. Test GPS Simulation

```bash
# In a separate terminal, start the GPS simulator
npm run simulator
```

The server will be running at `http://localhost:3000`

## 📡 API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication

All API requests requiring authentication should include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### 🔐 Authentication Endpoints

#### Register User/Driver
```http
POST /auth/signup
Content-Type: application/json

{
  "name": "John Uwimana",
  "email": "john@example.com",
  "password": "password123",
  "role": "user",
  "phone": "+250788123456",
  "license_number": "LIC001RW",      // Required for drivers
  "vehicle_plate": "RAD 123 A",     // Required for drivers
  "vehicle_model": "Toyota Hiace",   // Optional for drivers
  "vehicle_capacity": 30             // Optional for drivers
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /auth/profile
Authorization: Bearer <token>
```

### 🗺 Route Management

#### Get All Routes
```http
GET /routes?page=1&limit=20&search=nyabugogo
```

#### Get Route Details
```http
GET /routes/:id
```

#### Get Route Stops
```http
GET /routes/:id/stops
```

#### Get Route Statistics
```http
GET /routes/:id/stats
```

### 🚏 Stop Management

#### Find Nearby Stops
```http
GET /stops/nearby?lat=-1.9441&lng=30.0729&radius=1000
```

#### Search Stops
```http
GET /stops/search?q=kigali&route_id=1
```

#### Get Stop Details
```http
GET /stops/:id
```

### 🚌 Bus Tracking

#### Get Active Buses
```http
GET /buses/active?route_id=1&limit=50
```

#### Get Bus Details
```http
GET /buses/:id
```

#### Get Bus Location History
```http
GET /buses/:id/history?hours=24&limit=100
```

#### Update Driver Location (Drivers only)
```http
POST /buses/drivers/:id/location
Authorization: Bearer <driver_token>
Content-Type: application/json

{
  "lat": -1.9441,
  "lng": 30.0729,
  "speed_kmh": 25.5,
  "heading": 180,
  "accuracy": 5.2
}
```

#### Find Nearby Buses
```http
GET /buses/nearby?lat=-1.9441&lng=30.0729&radius=5000
```

#### Get Bus Route Progress
```http
GET /buses/:id/progress
```

### 🎫 Booking System

#### Create Booking
```http
POST /bookings
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "bus_id": 1,
  "route_id": 1,
  "from_stop_id": 1,
  "to_stop_id": 5,
  "seat_count": 2,
  "travel_date": "2024-01-15",
  "travel_time": "08:30:00",
  "passenger_name": "John Uwimana",
  "passenger_phone": "+250788123456",
  "special_requests": "Window seat preferred"
}
```

#### Get User Bookings
```http
GET /bookings/user/my?status=confirmed&page=1&limit=20
Authorization: Bearer <user_token>
```

#### Get Booking Details
```http
GET /bookings/:id
Authorization: Bearer <token>
```

#### Update Booking Status (Drivers/Admin)
```http
PUT /bookings/:id/status
Authorization: Bearer <driver_or_admin_token>
Content-Type: application/json

{
  "status": "confirmed",
  "notes": "Passenger confirmed"
}
```

#### Cancel Booking
```http
PUT /bookings/:id/cancel
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "reason": "Change of plans"
}
```

## 📡 WebSocket Events

Connect to Socket.IO at `http://localhost:3000`

### Client Events (Emit)

#### Subscribe to Stop Updates
```javascript
socket.emit('subscribe_stop', { stopId: 1 });
```

#### Subscribe to Route Updates
```javascript
socket.emit('subscribe_route', { routeId: 1 });
```

#### Subscribe to Bus Updates
```javascript
socket.emit('subscribe_bus', { busId: 1 });
```

### Server Events (Listen)

#### Bus Location Update
```javascript
socket.on('bus_update', (data) => {
  console.log('Bus update:', data);
  // {
  //   type: 'bus_update',
  //   data: {
  //     busId: 1,
  //     routeId: 1,
  //     location: { lat: -1.9441, lng: 30.0729 },
  //     speed_kmh: 25.5,
  //     heading: 180,
  //     timestamp: '2024-01-15T08:30:00Z',
  //     eta_to_stops: [...]
  //   }
  // }
});
```

#### ETA Update for Stop
```javascript
socket.on('eta_update', (data) => {
  console.log('ETA update:', data);
  // {
  //   type: 'eta_update',
  //   data: {
  //     stopId: 1,
  //     stopName: 'Kigali City Center',
  //     busId: 1,
  //     routeId: 1,
  //     distance_meters: 1250,
  //     eta_seconds: 180,
  //     eta_minutes: 3
  //   }
  // }
});
```

## 🧪 Testing & Development

### Sample Login Credentials

The seed data creates these test accounts:

**Regular Users:**
- Email: `john.uwimana@example.com` | Password: `password123`
- Email: `marie.mukamana@example.com` | Password: `password123`

**Drivers:**
- Email: `david.driver@example.com` | Password: `driver123`
- Email: `grace.driver@example.com` | Password: `driver123`

### GPS Simulator

The GPS simulator creates realistic bus movement for testing:

```bash
# Start the simulator (in separate terminal)
npm run simulator

# Customize simulation
BUSES_COUNT=5 SIMULATION_INTERVAL=2000 npm run simulator
```

### Health Check

```http
GET /health
```

Returns server status and basic info.

### API Information

```http
GET /api/info
```

Returns API documentation and available endpoints.

## 🗄 Database Schema

### Key Tables

- **users** - Authentication and user profiles
- **drivers** - Driver-specific information and vehicle details
- **routes** - Bus routes with colors and descriptions
- **stops** - Bus stops with GPS coordinates and amenities
- **buses** - Active buses with real-time location data
- **location_updates** - Historical GPS tracking data
- **bookings** - Seat reservations and booking management

### Sample Routes (Kigali)

1. **Nyabugogo - City Center** - Main terminal route
2. **Remera - Kimironko** - Market connection route  
3. **Kicukiro - Nyarugunga** - South Kigali route
4. **Gasabo - Kinyinya** - Northern district route
5. **Nyanza - Huye Express** - Long distance route

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret for JWT tokens | Required |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3001` |
| `SIMULATION_INTERVAL` | GPS update interval (ms) | `3000` |
| `BUSES_COUNT` | Number of simulated buses | `5` |
| `LOG_LEVEL` | Logging level | `info` |

### Database Configuration

The system uses PostgreSQL with the following optimizations:
- Indexed location columns for fast proximity queries
- Foreign key constraints for data integrity
- Automatic timestamp management
- JSON fields for flexible data storage (amenities, polylines)

## 🚀 Production Deployment

### Prerequisites
- PostgreSQL database
- Node.js 18+ runtime
- Process manager (PM2 recommended)
- Reverse proxy (Nginx recommended)

### Steps

1. **Install dependencies**
   ```bash
   npm ci --production
   ```

2. **Set environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

3. **Run database migrations**
   ```bash
   npm run seed
   ```

4. **Start with PM2**
   ```bash
   pm2 start src/app.js --name bus-tracking-api
   pm2 startup
   pm2 save
   ```

### Security Considerations

- Use strong JWT secrets in production
- Enable HTTPS/SSL
- Configure rate limiting appropriately
- Set up database connection pooling
- Enable CORS only for trusted origins
- Use environment-specific logging levels

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/api/info`
- Review the health check endpoint at `/health`

## 🔄 Version History

- **v1.0.0** - Initial release with complete bus tracking system
  - JWT authentication
  - Real-time tracking with Socket.IO  
  - Route and stop management
  - Booking system
  - GPS simulation
  - Comprehensive API documentation

---

Made with ❤️ for **Kigali, Rwanda** 🇷🇼