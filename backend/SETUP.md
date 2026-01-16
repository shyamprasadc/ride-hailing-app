# Ride-Hailing Platform - Setup & Testing Guide

## Prerequisites

- Node.js v14+
- PostgreSQL database
- Redis server (optional, but recommended)

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.sample` to `.env` and update with your configuration:

```bash
cp .env.sample .env
```

**Required configuration**:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` - Redis host (default: localhost)
- `REDIS_PORT` - Redis port (default: 6379)

**Optional**:
- `NEW_RELIC_LICENSE_KEY` - For monitoring (leave empty to disable)

### 3. Setup Database

Generate Prisma client:
```bash
npm run db:generate
```

Run migrations:
```bash
npm run db:migrate
```

Seed database with sample data:
```bash
npm run db:seed
```

### 4. Start Redis (if not running)

```bash
redis-server
```

### 5. Start the Server

Development mode (with hot reload):
```bash
npm run watch
```

Production mode:
```bash
npm start
```

Server will run on `http://localhost:3000`

---

## API Testing Guide

### Health Check

```bash
curl http://localhost:3000/v1
```

### 1. Create Ride Request

```bash
curl -X POST http://localhost:3000/v1/rides \
  -H "Content-Type: application/json" \
  -d '{
    "riderId": "<RIDER_ID_FROM_SEED>",
    "pickupLat": 37.7749,
    "pickupLng": -122.4194,
    "destLat": 37.7849,
    "destLng": -122.4094,
    "tier": "ECONOMY"
  }'
```

**Response**: Returns `rideId`, `status` (REQUESTED), and message.

### 2. Get Ride Status

```bash
curl http://localhost:3000/v1/rides/<RIDE_ID>
```

### 3. Update Driver Location

```bash
curl -X POST http://localhost:3000/v1/drivers/<DRIVER_ID>/location \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7849,
    "longitude": -122.4094
  }'
```

### 4. Driver Accept Ride (Manual Assignment)

```bash
curl -X POST http://localhost:3000/v1/drivers/<DRIVER_ID>/accept \
  -H "Content-Type: application/json" \
  -d '{
    "rideId": "<RIDE_ID>"
  }'
```

### 5. End Trip

```bash
curl -X POST http://localhost:3000/v1/trips/<TRIP_ID>/end
```

**Response**: Returns trip details with calculated `fare` and `distance`.

### 6. Process Payment

```bash
curl -X POST http://localhost:3000/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": "<TRIP_ID>",
    "amount": 5.50,
    "paymentMethod": "CARD"
  }'
```

**Note**: Payment has 90% success rate (simulated).

---

## Testing Scenarios

### Scenario 1: Complete Ride Flow

1. Create ride request → Ride status: REQUESTED
2. Get ride status → Verify driver assigned
3. End trip → Verify fare calculated
4. Process payment → Verify payment success
5. Get ride status → Verify trip status is PAID

### Scenario 2: No Drivers Available

1. Create ride with tier that has no available drivers
2. Verify ride status is REQUESTED (not ASSIGNED)

### Scenario 3: Driver Location Update

1. Update driver location
2. Create ride near that location
3. Verify that driver is assigned

### Scenario 4: Race Condition Test

1. Get an available driver ID
2. Create 2 concurrent ride requests
3. Verify only 1 ride is assigned to that driver

---

## Database Queries (for debugging)

```sql
-- Check available drivers
SELECT id, name, status, tier, latitude, longitude FROM drivers WHERE status = 'AVAILABLE';

-- Check ride requests
SELECT id, status, tier, "driverId", "riderId" FROM ride_requests;

-- Check trips
SELECT id, status, fare, distance, "startTime", "endTime" FROM trips;

-- Check payments
SELECT id, "tripId", amount, status, "paymentMethod" FROM payments;
```

---

## Troubleshooting

### Redis Connection Error

Ensure Redis is running:
```bash
redis-cli ping
```

Should return `PONG`.

### Database Connection Error

Verify `DATABASE_URL` in `.env` is correct and PostgreSQL is running.

### No Drivers Available

Run seed script again:
```bash
npm run db:seed
```

---

## Monitoring

If New Relic is configured, view metrics at:
- APM Dashboard: https://one.newrelic.com/
- Track API latency, slow queries, and errors

---

## Sample Data (from seed)

### Riders
- Alice Johnson: `alice@example.com`
- Bob Smith: `bob@example.com`
- Charlie Brown: `charlie@example.com`

### Drivers (5 AVAILABLE)
- David Wilson (ECONOMY)
- Emma Davis (ECONOMY)
- Frank Miller (PREMIUM)
- Grace Lee (PREMIUM)
- Henry Taylor (ECONOMY)

**Note**: Run `npm run db:seed` to get actual UUIDs for testing.
