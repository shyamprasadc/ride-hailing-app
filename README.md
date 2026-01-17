# Ride-Hailing Platform

A minimal, demo-ready ride-hailing platform showcasing full-stack development with Node.js, TypeScript, React, PostgreSQL, and Redis.

## 🎯 Purpose

This project demonstrates:
- RESTful API design and implementation
- Database modeling with proper relationships
- Transaction management and ACID guarantees
- State machine design for business workflows
- Full-stack integration (React + Node.js)
- Real-time status updates via polling
- Comprehensive testing with real database

**Built for**: Demo/Interview purposes

## 🏗️ Architecture

```
Frontend (React) → Backend API (Node.js) → PostgreSQL + Redis
```

**Tech Stack**:
- **Backend**: Node.js 14+, Express 4, TypeScript 5, Prisma ORM
- **Frontend**: React 18, Vite, Plain CSS
- **Database**: PostgreSQL 12+
- **Cache**: Redis 6+
- **Monitoring**: New Relic (optional)
- **Testing**: Vitest + Supertest

## 🚀 Quick Start

### Prerequisites
- Node.js 14+
- PostgreSQL 12+
- Redis 6+

### Installation

```bash
# Clone repository
git clone <repository-url>
cd ride-hailing-platform-2

# Backend setup
cd backend
npm install
cp .env.example .env  # Configure database URL and other settings

# Database setup
npx prisma migrate dev
npm run db:seed

# Frontend setup
cd ../frontend
npm install
```

### Running the Application

**Option 1: Docker (Recommended)**
```bash
# Start everything with one command
docker-compose up

# Seed database (in another terminal)
docker-compose exec backend npm run db:seed

# Frontend (separate terminal)
cd frontend
npm run dev
```

**Option 2: Local Development**
```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Backend
cd backend
npm run watch
# Backend runs on http://localhost:3000

# Terminal 3: Start Frontend
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

See [DOCKER.md](./DOCKER.md) for detailed Docker instructions.

### Running Tests

```bash
cd backend
npm test
# 12 tests covering all core endpoints
```

## 📋 Features

### Core Functionality
- ✅ **Ride Creation**: Riders request rides with pickup/destination
- ✅ **Driver Assignment**: Manual driver acceptance with nearby rides discovery (optional auto-assignment available)
- ✅ **Trip Management**: Track trip lifecycle from creation to completion
- ✅ **Payment Processing**: Simulated payment with fare calculation
- ✅ **Real-time Updates**: Status polling every 3 seconds

### Technical Features
- ✅ **ACID Transactions**: Critical operations wrapped in database transactions
- ✅ **State Machines**: Clear state transitions for rides, trips, and drivers
- ✅ **Redis Caching**: Driver location caching for fast lookups
- ✅ **Rate Limiting**: IP-based protection (100 req/min)
- ✅ **Input Validation**: Joi schemas for all API requests
- ✅ **Error Handling**: Structured error responses
- ✅ **API Testing**: Comprehensive test coverage with Vitest
- ✅ **Monitoring**: New Relic integration with custom metrics (optional)

## 🎮 Demo Flow

1. **Rider View**: Create a ride request
   - Select rider, enter coordinates, choose tier
   - Get ride ID and status

2. **Driver View**: Accept the ride
   - Select available driver
   - Enter ride ID and accept

3. **Trip View**: Complete the trip
   - Enter trip ID and end trip
   - View calculated fare

4. **Payment View**: Process payment
   - Confirm payment amount
   - Get payment confirmation

**Demo Duration**: 2-3 minutes

## 📚 Documentation

- **[Technical Documentation](./TECHNICAL_DOCUMENTATION.md)**: Complete HLD, LLD, API specs, database schema
- **[Backend README](./backend/README.md)**: Backend-specific documentation
- **[Frontend README](./frontend/README.md)**: Frontend setup and demo flow
- **[E2E Test Report](./e2e_test_report.md)**: End-to-end validation results

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/rides` | POST | Create ride request |
| `/v1/rides/:id` | GET | Get ride status |
| `/v1/drivers/:id/location` | POST | Update driver location |
| `/v1/drivers/:id/accept` | POST | Accept ride request |
| `/v1/trips/:id/end` | POST | End trip |
| `/v1/payments` | POST | Process payment |
| `/v1/data/riders` | GET | Get all riders |
| `/v1/data/drivers` | GET | Get all drivers |

## 🗄️ Database Schema

**5 Core Tables**:
- `riders`: User accounts for ride requesters
- `drivers`: Driver accounts with status and location
- `ride_requests`: Ride requests with pickup/destination
- `trips`: Active trips linked to rides
- `payments`: Payment records for completed trips

**Relationships**:
- Riders → Ride Requests (1:N)
- Drivers → Ride Requests (1:N)
- Ride Requests → Trips (1:1)
- Trips → Payments (1:1)

## 🧪 Testing

```bash
cd backend
npm test
```

**Test Coverage**:
- ✅ Ride creation and retrieval
- ✅ Driver location updates
- ✅ Ride acceptance workflow
- ✅ Trip completion
- ✅ Payment processing

**Results**: 12/12 tests passing

## 📊 Performance

- **API Response Time**: 100-250ms (local)
- **Database Queries**: < 50ms (indexed)
- **Cache Lookups**: < 5ms (Redis)

## 🔒 Security

**Implemented**:
- Input validation (Joi)
- SQL injection prevention (Prisma ORM)
- CORS configuration
- Rate limiting (100 req/min per IP)
- Error sanitization

**Production Considerations** (not implemented):
- Authentication (JWT)
- Authorization (RBAC)
- Per-user rate limiting
- HTTPS/TLS

## 📁 Project Structure

```
ride-hailing-platform-2/
├── backend/              # Node.js backend
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── routes/       # API routes
│   │   └── validators/   # Input validation
│   ├── prisma/           # Database schema & migrations
│   ├── tests/            # API tests
│   └── package.json
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── App.jsx       # Main app
│   │   └── App.css       # Styles
│   └── package.json
└── TECHNICAL_DOCUMENTATION.md
```

## 🛠️ Development

### Backend Watch Mode
```bash
cd backend
npm run watch
# Auto-recompiles TypeScript on changes
```

### Frontend Dev Server
```bash
cd frontend
npm run dev
# Hot module replacement enabled
```

### Database Management
```bash
# Create new migration
npx prisma migrate dev --name <migration_name>

# Reset database
npm run db:reset

# Seed database
npm run db:seed
```

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
pg_isready

# Verify DATABASE_URL in .env
```

### Redis Connection Error
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG
```

### CORS Error
```bash
# Verify CORS_URL in backend/.env
CORS_URL=http://localhost:5173

# Restart backend server
```

## 📝 License

MIT

## 👤 Author

Shyam Prasad

---

**Ready to use?** Follow the [Quick Start](#-quick-start) guide and run the [Demo Flow](#-demo-flow)!
