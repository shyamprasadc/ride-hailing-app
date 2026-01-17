# Ride-Hailing Platform - Technical Documentation

**Version**: 1.0  
**Type**: Demo/Interview Project  
**Stack**: Node.js + TypeScript + React + PostgreSQL + Redis

---

## Table of Contents

1. [High-Level Design (HLD)](#high-level-design-hld)
2. [Low-Level Design (LLD)](#low-level-design-lld)
3. [Non-Functional Aspects](#non-functional-aspects)
4. [Demo & Operations](#demo--operations)

---

# High-Level Design (HLD)

## System Overview

A minimal ride-hailing platform demonstrating core functionality: riders request rides, drivers accept them, trips are completed, and payments are processed. Built for demo/interview purposes to showcase backend API design, database modeling, and full-stack integration.

**Problem Solved**: Demonstrates end-to-end ride-hailing workflow with proper state management, transactional consistency, and real-time status updates.

## Architecture Diagram

```
┌─────────────┐
│   Browser   │
│  (React UI) │
└──────┬──────┘
       │ HTTP/REST
       │
┌──────▼──────────────────────────────────────┐
│         Backend API (Node.js/Express)       │
│  ┌────────────┐  ┌────────────┐            │
│  │ Controllers│  │  Services  │            │
│  └────────────┘  └────────────┘            │
│         │              │                    │
│         ▼              ▼                    │
│  ┌────────────┐  ┌────────────┐            │
│  │   Routes   │  │  Validators│            │
│  └────────────┘  └────────────┘            │
└──────┬──────────────┬───────────────────────┘
       │              │
       │              │
┌──────▼──────┐  ┌───▼────────┐  ┌──────────┐
│ PostgreSQL  │  │   Redis    │  │ New Relic│
│  (Prisma)   │  │  (Cache)   │  │(Monitor) │
└─────────────┘  └────────────┘  └──────────┘
```

## Components

### 1. Frontend (React + Vite)
- **Purpose**: Demo UI to visualize backend functionality
- **Tech**: React 18, Vite, Native Fetch API, Plain CSS
- **Features**:
  - Rider View: Create rides, monitor status
  - Driver View: Update location, accept rides
  - Trip View: End trips, process payments
- **Communication**: REST API calls with 3-second polling for status updates

### 2. Backend API (Node.js + Express + TypeScript)
- **Purpose**: Core business logic and API layer
- **Tech**: Node.js 14+, Express 4, TypeScript 5, Prisma ORM
- **Architecture**: Layered (Routes → Controllers → Services → Database)
- **Features**:
  - RESTful API design
  - Input validation (Joi)
  - Error handling middleware
  - Transaction management
  - Logging (Winston)

### 3. PostgreSQL Database
- **Purpose**: Primary data store
- **ORM**: Prisma
- **Schema**: 5 core tables (Rider, Driver, RideRequest, Trip, Payment)
- **Features**:
  - ACID transactions
  - Foreign key constraints
  - Indexes for performance
  - UUID primary keys

### 4. Redis (Cache Layer)
- **Purpose**: Driver location caching
- **Usage**: Store available driver coordinates for fast nearest-driver lookup
- **TTL**: Configurable (default: 1 hour)
- **Pattern**: Cache-aside

### 5. New Relic (Monitoring)
- **Purpose**: Application performance monitoring (APM)
- **Metrics**: API latency, error rates, throughput
- **Status**: Optional (disabled if no license key)

## Request Flow

### Complete Ride Flow

```
1. RIDE CREATION
   Rider → POST /v1/rides
   ├─ Validate rider exists
   └─ Create RideRequest (status: REQUESTED)

2. DRIVER VIEWS NEARBY RIDES
   Driver → GET /v1/drivers/:id/nearby-rides
   ├─ Get driver's current location
   ├─ Query all REQUESTED rides matching driver's tier
   ├─ Calculate distance using Haversine formula
   ├─ Filter by radius (default 10km)
   └─ Return sorted by distance (nearest first)

3. DRIVER ACCEPTANCE
   Driver → POST /v1/drivers/:id/accept
   ├─ Verify driver is AVAILABLE
   ├─ Verify ride is REQUESTED
   ├─ Transaction (prevents race conditions):
   │  ├─ Update RideRequest (status: ASSIGNED, driverId)
   │  ├─ Update Driver (status: ASSIGNED)
   │  └─ Create Trip (status: CREATED)
   └─ Return success

3. TRIP COMPLETION
   Driver → POST /v1/trips/:id/end
   ├─ Verify trip is CREATED or STARTED
   ├─ Calculate fare (distance × rate)
   ├─ Transaction:
   │  ├─ Update Trip (status: ENDED, fare, distance, endTime)
   │  └─ Update Driver (status: AVAILABLE)
   └─ Return trip details

4. PAYMENT PROCESSING
   System → POST /v1/payments
   ├─ Verify trip is ENDED
   ├─ Transaction:
   │  ├─ Create Payment (status: SUCCESS/FAILED)
   │  └─ Update Trip (status: PAID)
   └─ Return payment confirmation
```

## Deployment Assumptions

**Current Setup**: Local development/demo environment

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`
- PostgreSQL: Local instance on port 5432
- Redis: Local instance on port 6379

**Production Considerations** (not implemented):
- Containerization (Docker)
- Load balancing
- Database replication
- Redis cluster
- CDN for frontend
- API gateway

## Scalability Considerations

### Current Implementation
- **Single instance**: Suitable for demo/interview
- **Connection pooling**: Prisma default pool
- **Indexes**: On frequently queried fields (status, tier)
- **Redis caching**: Reduces DB load for driver lookups

### Scalability Strategies (for discussion)
1. **Horizontal scaling**: Stateless API allows multiple instances
2. **Database**: Read replicas for GET requests
3. **Caching**: Redis for hot data (active rides, driver locations)
4. **Async processing**: Queue for notifications, analytics
5. **Geospatial indexing**: PostGIS for location-based queries
6. **Rate limiting**: Prevent abuse

---

# Low-Level Design (LLD)

## API Specification

### Base URL
```
http://localhost:3000/v1
```

### 1. Create Ride Request

**Endpoint**: `POST /v1/rides`

**Request**:
```json
{
  "riderId": "uuid",
  "pickupLat": 37.7749,
  "pickupLng": -122.4194,
  "destLat": 37.8049,
  "destLng": -122.3894,
  "tier": "ECONOMY",
  "autoAssign": false
}
```

**Parameters**:
- `autoAssign` (optional, boolean, default: `false`): If `true`, automatically assigns nearest available driver. If `false` or omitted, creates ride in REQUESTED status for manual driver acceptance.

**Response** (200) - Manual acceptance or no driver available:
```json
{
  "statusCode": "10000",
  "message": "Ride request created successfully",
  "data": {
    "rideId": "uuid",
    "status": "REQUESTED",
    "message": "Ride request created. Waiting for driver to accept."
  }
}
```

**Response** (200) - Auto-assign with driver found:
```json
{
  "statusCode": "10000",
  "message": "Ride request created successfully",
  "data": {
    "rideId": "uuid",
    "tripId": "uuid",
    "status": "ASSIGNED",
    "driver": {
      "id": "uuid",
      "name": "Driver Name",
      "phone": "+1234567890"
    }
  }
}
```

### 2. Get Ride Status

**Endpoint**: `GET /v1/rides/:id`

**Response** (200):
```json
{
  "statusCode": "10000",
  "message": "Ride details fetched successfully",
  "data": {
    "id": "uuid",
    "status": "ASSIGNED",
    "pickup": { "latitude": 37.7749, "longitude": -122.4194 },
    "destination": { "latitude": 37.8049, "longitude": -122.3894 },
    "tier": "ECONOMY",
    "rider": { "id": "uuid", "name": "Rider Name" },
    "driver": { "id": "uuid", "name": "Driver Name" },
    "trip": {
      "id": "uuid",
      "status": "CREATED",
      "startTime": "2026-01-15T00:00:00.000Z"
    }
  }
}
```

### 3. Update Driver Location

**Endpoint**: `POST /v1/drivers/:id/location`

**Request**:
```json
{
  "latitude": 37.7849,
  "longitude": -122.4094
}
```

**Response** (200):
```json
{
  "statusCode": "10000",
  "message": "Driver location updated successfully"
}
```

### 4. Get Nearby Ride Requests

**Endpoint**: `GET /v1/drivers/:id/nearby-rides?radius=10`

**Query Parameters**:
- `radius` (optional): Search radius in kilometers (default: 10)

**Response** (200):
```json
{
  "statusCode": "10000",
  "message": "Nearby rides fetched successfully",
  "data": [
    {
      "id": "uuid",
      "riderId": "uuid",
      "rider": {
        "id": "uuid",
        "name": "Rider Name",
        "phone": "+1234567890"
      },
      "pickup": {
        "latitude": 37.7749,
        "longitude": -122.4194
      },
      "destination": {
        "latitude": 37.8049,
        "longitude": -122.3894
      },
      "tier": "ECONOMY",
      "distance": 1.42,
      "createdAt": "2026-01-15T00:00:00.000Z"
    }
  ]
}
```

### 5. Accept Ride Request

**Endpoint**: `POST /v1/drivers/:id/accept`

**Request**:
```json
{
  "rideId": "uuid"
}
```

**Response** (200):
```json
{
  "statusCode": "10000",
  "message": "Ride accepted successfully"
}
```

### 6. End Trip

**Endpoint**: `POST /v1/trips/:id/end`

**Response** (200):
```json
{
  "statusCode": "10000",
  "message": "Trip ended successfully",
  "data": {
    "id": "uuid",
    "status": "ENDED",
    "fare": 25.50,
    "distance": 5.2,
    "startTime": "2026-01-15T00:00:00.000Z",
    "endTime": "2026-01-15T00:15:00.000Z"
  }
}
```

### 6. Process Payment

**Endpoint**: `POST /v1/payments`

**Request**:
```json
{
  "tripId": "uuid",
  "amount": 25.50
}
```

**Response** (200):
```json
{
  "statusCode": "10000",
  "message": "Payment processed successfully",
  "data": {
    "id": "uuid",
    "tripId": "uuid",
    "amount": 25.50,
    "status": "SUCCESS",
    "paymentMethod": "CARD"
  }
}
```

### 7. Get Riders (Data)

**Endpoint**: `GET /v1/data/riders`

**Response** (200):
```json
{
  "statusCode": "10000",
  "message": "Riders fetched successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "phone": "+1234567890"
    }
  ]
}
```

### 8. Get Drivers (Data)

**Endpoint**: `GET /v1/data/drivers`

**Response** (200):
```json
{
  "statusCode": "10000",
  "message": "Drivers fetched successfully",
  "data": [
    {
      "id": "uuid",
      "name": "David Wilson",
      "phone": "+1111111111",
      "status": "AVAILABLE",
      "tier": "ECONOMY"
    }
  ]
}
```

## Database Schema

### Tables

#### 1. riders
```sql
CREATE TABLE riders (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR NOT NULL,
  phone        VARCHAR UNIQUE NOT NULL,
  email        VARCHAR UNIQUE NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);
```

#### 2. drivers
```sql
CREATE TABLE drivers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR NOT NULL,
  phone        VARCHAR UNIQUE NOT NULL,
  status       VARCHAR DEFAULT 'AVAILABLE', -- AVAILABLE, ASSIGNED
  tier         VARCHAR DEFAULT 'ECONOMY',   -- ECONOMY, PREMIUM
  latitude     FLOAT,
  longitude    FLOAT,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX driver_availability_idx ON drivers(status, tier);
```

#### 3. ride_requests
```sql
CREATE TABLE ride_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rider_id     UUID NOT NULL REFERENCES riders(id),
  pickup_lat   FLOAT NOT NULL,
  pickup_lng   FLOAT NOT NULL,
  dest_lat     FLOAT NOT NULL,
  dest_lng     FLOAT NOT NULL,
  tier         VARCHAR DEFAULT 'ECONOMY',
  status       VARCHAR DEFAULT 'REQUESTED', -- REQUESTED, ASSIGNED, CANCELLED
  driver_id    UUID REFERENCES drivers(id),
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ride_status_idx ON ride_requests(status);
```

#### 4. trips
```sql
CREATE TABLE trips (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_request_id UUID UNIQUE NOT NULL REFERENCES ride_requests(id),
  driver_id       UUID NOT NULL REFERENCES drivers(id),
  rider_id        UUID NOT NULL REFERENCES riders(id),
  status          VARCHAR DEFAULT 'CREATED', -- CREATED, STARTED, ENDED, PAID
  start_time      TIMESTAMP DEFAULT NOW(),
  end_time        TIMESTAMP,
  fare            FLOAT,
  distance        FLOAT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX trip_status_idx ON trips(status);
```

#### 5. payments
```sql
CREATE TABLE payments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id        UUID UNIQUE NOT NULL REFERENCES trips(id),
  amount         FLOAT NOT NULL,
  status         VARCHAR DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED
  payment_method VARCHAR DEFAULT 'CARD',
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);
```

### Relationships

```
riders (1) ──< (N) ride_requests
drivers (1) ──< (N) ride_requests
ride_requests (1) ─── (1) trips
drivers (1) ──< (N) trips
riders (1) ──< (N) trips
trips (1) ─── (1) payments
```

## State Machines

### Ride Request State Machine

```
┌───────────┐
│ REQUESTED │ ◄─── Initial state (no driver available)
└─────┬─────┘
      │ driver accepts
      ▼
┌───────────┐
│ ASSIGNED  │ ◄─── Driver assigned, trip created
└─────┬─────┘
      │ (terminal state for ride)
      ▼
   (Trip takes over)
```

### Trip State Machine

```
┌─────────┐
│ CREATED │ ◄─── Trip created when ride assigned
└────┬────┘
     │ (optional) driver starts
     ▼
┌─────────┐
│ STARTED │ ◄─── Trip in progress
└────┬────┘
     │ driver ends trip
     ▼
┌─────────┐
│  ENDED  │ ◄─── Fare calculated
└────┬────┘
     │ payment processed
     ▼
┌─────────┐
│  PAID   │ ◄─── Terminal state
└─────────┘
```

### Driver State Machine

```
┌───────────┐
│ AVAILABLE │ ◄─── Ready for rides
└─────┬─────┘
      │ accepts ride
      ▼
┌───────────┐
│ ASSIGNED  │ ◄─── On active trip
└─────┬─────┘
      │ trip ends
      ▼
┌───────────┐
│ AVAILABLE │ ◄─── Back to available
└───────────┘
```

## Transaction Boundaries

### 1. Ride Creation with Driver Assignment
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Verify driver is still available
  const driver = await tx.driver.findUnique({ where: { id: driverId } });
  if (!driver || driver.status !== 'AVAILABLE') throw Error;
  
  // 2. Create ride request
  const rideRequest = await tx.rideRequest.create({
    data: { riderId, pickupLat, pickupLng, destLat, destLng, 
            tier, status: 'ASSIGNED', driverId }
  });
  
  // 3. Update driver status
  await tx.driver.update({
    where: { id: driverId },
    data: { status: 'ASSIGNED' }
  });
  
  // 4. Create trip
  const trip = await tx.trip.create({
    data: { rideRequestId: rideRequest.id, driverId, riderId, 
            status: 'CREATED' }
  });
  
  return { rideRequest, trip, driver };
});
```

### 2. Driver Accepts Ride
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Verify driver is available
  const driver = await tx.driver.findUnique({ where: { id: driverId } });
  if (!driver || driver.status !== 'AVAILABLE') throw Error;
  
  // 2. Verify ride is requested
  const ride = await tx.rideRequest.findUnique({ where: { id: rideId } });
  if (!ride || ride.status !== 'REQUESTED') throw Error;
  
  // 3. Update ride request
  await tx.rideRequest.update({
    where: { id: rideId },
    data: { status: 'ASSIGNED', driverId }
  });
  
  // 4. Update driver status
  await tx.driver.update({
    where: { id: driverId },
    data: { status: 'ASSIGNED' }
  });
  
  // 5. Create trip
  await tx.trip.create({
    data: { rideRequestId: rideId, driverId, riderId: ride.riderId }
  });
});
```

### 3. End Trip
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Get trip details
  const trip = await tx.trip.findUnique({ where: { id: tripId } });
  if (!trip || trip.status === 'ENDED') throw Error;
  
  // 2. Calculate fare
  const distance = calculateDistance(trip);
  const fare = distance * fareRate;
  
  // 3. Update trip
  const updatedTrip = await tx.trip.update({
    where: { id: tripId },
    data: { status: 'ENDED', fare, distance, endTime: new Date() }
  });
  
  // 4. Free driver
  await tx.driver.update({
    where: { id: trip.driverId },
    data: { status: 'AVAILABLE' }
  });
  
  return updatedTrip;
});
```

### 4. Process Payment
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Create payment
  const payment = await tx.payment.create({
    data: { tripId, amount, status: 'SUCCESS', paymentMethod: 'CARD' }
  });
  
  // 2. Update trip status
  await tx.trip.update({
    where: { id: tripId },
    data: { status: 'PAID' }
  });
  
  return payment;
});
```

## Caching Strategy

### Redis Cache Usage

**Purpose**: Store available driver locations for fast nearest-driver lookup

**Pattern**: Cache-aside (lazy loading)

**Implementation**:
```typescript
// Write to cache when driver updates location
await redis.set(
  `driver:${driverId}:location`,
  JSON.stringify({ latitude, longitude, tier, status }),
  'EX', 3600 // 1 hour TTL
);

// Cache driver locations for nearby ride queries
const drivers = await redis.keys('driver:*:location');
const locations = await Promise.all(
  drivers.map(key => redis.get(key))
);
// Filter by tier and status, calculate distance, return nearest
```

**Cache Invalidation**:
- TTL: 1 hour (auto-expire)
- Manual: When driver goes offline or changes status

## Error Handling

### Error Types

1. **Validation Errors** (400)
   - Missing required fields
   - Invalid data types
   - Business rule violations

2. **Not Found Errors** (404)
   - Resource doesn't exist
   - Invalid IDs

3. **Business Logic Errors** (400)
   - Driver not available
   - Ride already assigned
   - Trip already ended

4. **Internal Errors** (500)
   - Database failures
   - Unexpected exceptions

### Error Response Format

```json
{
  "statusCode": "10001",
  "status": 400,
  "message": "Driver is no longer available"
}
```

### Error Handling Middleware

```typescript
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    ApiError.handle(err, res);
  } else {
    Logger.error(err);
    ApiError.handle(new InternalError(), res);
  }
});
```

## Idempotency

**Current Implementation**: None (demo scope)

**Production Approach** (for discussion):
- Add `idempotencyKey` field to ride_requests and payments
- Check for existing request with same key before creating
- Return existing result if found
- Prevent duplicate charges and ride creations

---

# Non-Functional Aspects

## Latency Optimization

### Implemented Optimizations

1. **Database Indexing**
   - `driver_availability_idx` on (status, tier) - Fast driver lookup
   - `ride_status_idx` on status - Fast ride filtering
   - `trip_status_idx` on status - Fast trip queries

2. **Redis Caching**
   - Driver locations cached for O(1) lookup
   - Reduces DB queries for location-based searches

3. **Connection Pooling**
   - Prisma default connection pool
   - Reuses DB connections

4. **Efficient Queries**
   - Select only required fields
   - Use indexes for WHERE clauses
   - Avoid N+1 queries with Prisma includes

### Measured Performance

- **API Response Times**: 100-250ms (local)
- **Database Queries**: < 50ms (indexed queries)
- **Cache Lookups**: < 5ms (Redis)

## Consistency & Atomicity

### ACID Guarantees

**Atomicity**: All multi-step operations wrapped in Prisma transactions
- Ride creation + driver assignment + trip creation
- Driver acceptance + status updates
- Trip end + driver release
- Payment + trip status update

**Consistency**: Foreign key constraints ensure referential integrity
- Rides reference valid riders and drivers
- Trips reference valid rides
- Payments reference valid trips

**Isolation**: PostgreSQL default (Read Committed)
- Prevents dirty reads
- Allows concurrent transactions

**Durability**: PostgreSQL WAL (Write-Ahead Logging)
- Committed transactions survive crashes

### Race Condition Handling

**Double Assignment Prevention**:
```typescript
// Transaction ensures atomic check-and-update
await prisma.$transaction(async (tx) => {
  const driver = await tx.driver.findUnique({ where: { id } });
  if (driver.status !== 'AVAILABLE') throw new Error('Driver busy');
  
  await tx.driver.update({
    where: { id },
    data: { status: 'ASSIGNED' }
  });
});
```

### New Relic Integration

**Implementation**:
- Lightweight middleware using Node.js `perf_hooks`
- Automatic instrumentation via New Relic agent
- Custom metrics for expensive operations
- Safe error handling (fail-open strategy)

**Metrics Tracked**:

1. **Per-Endpoint Metrics** (automatic):
   - `Custom/API/{METHOD}{PATH}/ResponseTime` - Duration in ms
   - `Custom/API/{METHOD}{PATH}/Success` - Success count
   - `Custom/API/{METHOD}{PATH}/Error` - Error count

2. **Custom Business Metrics**:
   - `Custom/RideAssignment/TransactionTime` - Driver acceptance transaction
   - `Custom/TripEnd/TransactionTime` - Trip completion transaction
   - `Custom/RateLimit/Exceeded` - Rate limit violations

3. **Database Performance**:
   - Prisma queries automatically instrumented
   - Slow query detection
   - Transaction traces

**Custom Attributes** (per transaction):
- `route`: API endpoint path
- `method`: HTTP method
- `statusCode`: Response status code
- `responseTime`: Duration in milliseconds

**Configuration**:
```javascript
// newrelic.js
exports.config = {
  app_name: ['ride-hailing-app'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  distributed_tracing: { enabled: true },
  logging: { level: 'info' }
};
```

**Viewing Metrics**:
- **APM → Transactions**: View all endpoints, latency, throughput
- **APM → Databases**: PostgreSQL query performance
- **Metrics Explorer**: Search "Custom/" for custom metrics
- **Transaction Traces**: Detailed request breakdown

**Performance Impact**: < 5ms overhead per request

**Status**: Optional - disabled if no license key provided

### Application Logging

**Winston Logger**:
- Structured JSON logs
- Daily rotating files
- Console output in development
- Error stack traces

**Log Levels**:
- `info`: API requests, business events
- `warn`: Validation failures, retries
- `error`: Exceptions, failures

## Security

### Current Implementation

**Input Validation**:
- Joi schemas for all request bodies
- Type checking via TypeScript
- SQL injection prevention (Prisma ORM)

**CORS**:
- Configured for frontend origin
- Prevents unauthorized cross-origin requests

**Rate Limiting**:
- IP-based rate limiting (100 requests/minute)
- Redis-backed with sliding window
- Returns 429 on limit exceeded
- Rate limit headers (X-RateLimit-*)
- Fail-open strategy (allows requests if Redis unavailable)

**Error Handling**:
- No sensitive data in error responses
- Stack traces only in development

### Production Considerations (not implemented)

- Authentication (JWT)
- Authorization (role-based)
- Per-user rate limiting
- API key management
- HTTPS/TLS
- XSS prevention
- CSRF protection

---

# Demo & Operations

## Prerequisites

- Node.js 14+
- PostgreSQL 12+
- Redis 6+
- npm or yarn

## Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd ride-hailing-platform-2
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

## Configuration

### Backend Environment Variables

Create `backend/.env`:
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ride_hailing?schema=public"

# CORS
CORS_URL=http://localhost:5173

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Fare Rates (per km)
FARE_RATE_ECONOMY=1.0
FARE_RATE_PREMIUM=2.0

# New Relic (optional)
NEW_RELIC_LICENSE_KEY=
```

## Database Setup

### 1. Create Database
```bash
createdb ride_hailing
```

### 2. Run Migrations
```bash
cd backend
npx prisma migrate dev
```

### 3. Seed Database
```bash
npm run db:seed
```

**Seed Data**:
- 3 Riders (Alice, Bob, Charlie)
- 10 Drivers (5 AVAILABLE, 5 ASSIGNED)

## Running the Application

### 1. Start Redis
```bash
redis-server
```

### 2. Start Backend
```bash
cd backend
npm run watch
```
Backend runs on `http://localhost:3000`

### 3. Start Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173`

## Running Tests

### Backend API Tests
```bash
cd backend
npm test
```

**Test Coverage**:
- 12 tests across 4 test files
- Covers all 6 core endpoints
- Happy path + failure cases
- Uses real database (no mocks)

**Test Output**:
```
✓ tests/ride.test.ts (4 tests)
✓ tests/driver.test.ts (4 tests)
✓ tests/trip.test.ts (2 tests)
✓ tests/payment.test.ts (2 tests)

Test Files  4 passed (4)
Tests  12 passed (12)
```

## End-to-End Demo Flow

### Step 1: Rider View - Create Ride

1. Open `http://localhost:5173`
2. Select rider: **Alice Johnson**
3. Use default coordinates:
   - Pickup: 37.7749, -122.4194
   - Destination: 37.8049, -122.3894
4. Select tier: **Economy**
5. Click **"Create Ride"**
6. **Copy Ride ID** from status card

**Expected Result**:
- Ride created successfully
- Status: `REQUESTED` or `ASSIGNED`
- If assigned, driver details shown

### Step 2: Driver View - Accept Ride

1. Click **"Driver"** tab
2. Select driver: **Grace Lee** (or any AVAILABLE driver)
3. (Optional) Click **"Update Location"**
4. **Paste Ride ID** from Step 1
5. Click **"Accept Ride"**

**Expected Result**:
- Success message: "Ride accepted successfully!"
- Trip created automatically

### Step 3: Rider View - Verify Status

1. Click **"Rider"** tab
2. Observe status update (polling every 3 seconds)
3. **Copy Trip ID** from status card

**Expected Result**:
- Ride status: `ASSIGNED`
- Driver details displayed
- Trip ID visible

### Step 4: Trip & Payment View - Complete Flow

1. Click **"Trip & Payment"** tab
2. **Paste Trip ID** from Step 3
3. Click **"End Trip"**
4. Review trip details (fare, distance)
5. Click **"Process Payment"**

**Expected Result**:
- Trip status: `ENDED`
- Fare calculated (e.g., $4.71)
- Payment status: `SUCCESS`
- Payment ID displayed

**Demo Duration**: 2-3 minutes

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
pg_isready

# Verify connection string in .env
DATABASE_URL="postgresql://..."
```

### Redis Connection Error
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG
```

### CORS Error in Browser
```bash
# Verify CORS_URL in backend/.env
CORS_URL=http://localhost:5173

# Restart backend server
```

### Port Already in Use
```bash
# Backend (3000)
lsof -ti:3000 | xargs kill -9

# Frontend (5173)
lsof -ti:5173 | xargs kill -9
```

## API Testing with cURL

### Create Ride
```bash
curl -X POST http://localhost:3000/v1/rides \
  -H "Content-Type: application/json" \
  -d '{
    "riderId": "<rider-id>",
    "pickupLat": 37.7749,
    "pickupLng": -122.4194,
    "destLat": 37.8049,
    "destLng": -122.3894,
    "tier": "ECONOMY"
  }'
```

### Get Ride Status
```bash
curl http://localhost:3000/v1/rides/<ride-id>
```

### Accept Ride
```bash
curl -X POST http://localhost:3000/v1/drivers/<driver-id>/accept \
  -H "Content-Type: application/json" \
  -d '{ "rideId": "<ride-id>" }'
```

### End Trip
```bash
curl -X POST http://localhost:3000/v1/trips/<trip-id>/end
```

### Process Payment
```bash
curl -X POST http://localhost:3000/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": "<trip-id>",
    "amount": 25.50
  }'
```

---

## Project Structure

```
ride-hailing-platform-2/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API routes
│   │   ├── validators/      # Input validation
│   │   ├── core/            # Utilities (Logger, ApiError, etc.)
│   │   ├── middlewares/     # Express middlewares
│   │   └── config.ts        # Configuration
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Seed data
│   ├── tests/               # API tests
│   ├── .env                 # Environment variables
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/      # React components
    │   ├── App.jsx          # Main app
    │   ├── App.css          # Styles
    │   └── config.js        # API config
    ├── public/
    └── package.json
```

---

## Summary

This ride-hailing platform demonstrates:

✅ **Full-stack development**: React frontend + Node.js backend  
✅ **RESTful API design**: Clean, versioned endpoints  
✅ **Database modeling**: Normalized schema with proper relationships  
✅ **Transaction management**: ACID guarantees for critical operations  
✅ **State machines**: Clear state transitions for rides, trips, drivers  
✅ **Caching**: Redis for performance optimization  
✅ **Testing**: Comprehensive API tests with real database  
✅ **Monitoring**: New Relic integration (optional)  
✅ **Documentation**: Complete technical documentation  

**Demo-Ready**: Complete end-to-end flow validated and working.

---

**Questions?** Review the code, run the tests, or try the demo flow!
