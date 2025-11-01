# Driver Dashboard API Endpoints

## Overview
This document outlines the required REST API endpoints to support the driver dashboard functionality in the BusLink application.

## Authentication
All endpoints require authentication and the user must have the 'driver' role.

## Endpoints

### 1. Driver Trips
```http
GET /api/driver/trips/:driverId
```

**Purpose**: Retrieve all trips made by a specific driver

**Parameters**:
- `driverId` (URL parameter) - The ID of the driver

**Response**:
```typescript
{
  trips: Array<{
    id: string;
    created_at: string; // ISO date
    route: {
      route_name: string;
      start_location: string;
      end_location: string;
    };
    distance_km: number;
    duration_mins: number;
    status: 'completed' | 'in-progress' | 'cancelled';
  }>
}
```

### 2. Bus Bookings
```http
GET /api/bookings/bus/:busNumber
```

**Purpose**: Get all bookings for a specific bus

**Parameters**:
- `busNumber` (URL parameter) - The bus number to fetch bookings for

**Response**:
```typescript
{
  bookings: Array<{
    id: string;
    created_at: string; // ISO date
    user: {
      name: string;
      email: string;
      phone: string;
    };
    seats: number;
    status: 'confirmed' | 'pending' | 'cancelled';
  }>
}
```

### 3. Active Buses
```http
GET /api/buses/active
```

**Purpose**: Get all active buses or a specific bus by driver

**Query Parameters**:
- `driverId` (optional) - Filter buses by driver ID

**Response**:
```typescript
Array<{
  id: string;
  bus_number: string;
  capacity: number;
  current_state: 'moving' | 'idle' | 'maintenance' | 'offline';
  speed_kmh: number;
  current_lat: number;
  current_lng: number;
  route?: {
    route_name: string;
    route_number: string;
    start_location: string;
    end_location: string;
  };
}>
```

### 4. Update Bus Location
```http
PATCH /api/driver/update-location
```

**Purpose**: Update a bus's current location and speed

**Request Body**:
```typescript
{
  bus_number: string;
  current_lat: number;
  current_lng: number;
  speed_kmh: number;
}
```

**Response**: Updated bus object

## Database Schema

### Trip Model
```typescript
{
  id: string;
  driver_id: string;
  route_id: string;
  created_at: Date;
  distance_km: number;
  duration_mins: number;
  status: string;
}
```

### Booking Model
```typescript
{
  id: string;
  user_id: string;
  bus_number: string;
  created_at: Date;
  seats: number;
  status: string;
}
```

### Bus Model
```typescript
{
  id: string;
  bus_number: string;
  driver_id: string;
  capacity: number;
  current_state: string;
  speed_kmh: number;
  current_lat: number;
  current_lng: number;
  route_id: string;
}
```

### Route Model
```typescript
{
  id: string;
  route_number: string;
  route_name: string;
  start_location: string;
  end_location: string;
}
```

## Implementation Requirements

### Security
- Implement authentication middleware for all endpoints
- Verify driver role and permissions
- Add rate limiting for location updates (max 1 update per 5 seconds)

### Validation
- Validate numeric fields (latitude, longitude, speed, distance)
- Ensure required fields are present
- Validate status enum values

### Error Handling
- Return appropriate HTTP status codes
- Include descriptive error messages
- Handle not found resources gracefully

### Performance
- Add pagination for trips and bookings lists (default limit: 20)
- Index frequently queried fields
- Cache active bus statuses

## Testing Considerations
1. Test authentication and authorization
2. Validate input constraints
3. Test error scenarios
4. Check rate limiting
5. Verify real-time updates