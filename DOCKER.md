# Docker Quick Start

## Prerequisites
- Docker Desktop installed
- Docker Compose installed

## Start Everything

```bash
# Start all services (backend, postgres, redis)
docker-compose up

# Or run in detached mode
docker-compose up -d
```

## Stop Everything

```bash
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

## Seed Database

```bash
# After services are running
docker-compose exec backend npm run db:seed
```

## View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis
```

## Access Services

- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432
  - User: `postgres`
  - Password: `password123`
  - Database: `ride_hailing`
- **Redis**: localhost:6379

## Rebuild After Code Changes

```bash
# Rebuild backend image
docker-compose build backend

# Rebuild and restart
docker-compose up --build
```

## Environment Variables

Edit `docker-compose.yml` to change:
- Database credentials
- Redis configuration
- New Relic license key
- CORS settings

## Troubleshooting

### Database connection error
```bash
# Check postgres is healthy
docker-compose ps

# View postgres logs
docker-compose logs postgres
```

### Backend won't start
```bash
# Check backend logs
docker-compose logs backend

# Rebuild backend
docker-compose build backend
docker-compose up backend
```

### Clean restart
```bash
# Remove everything and start fresh
docker-compose down -v
docker-compose up --build
```

## Notes

- Database data persists in Docker volumes
- Migrations run automatically on backend startup
- Redis data persists in Docker volumes
- Frontend runs separately (not containerized)
