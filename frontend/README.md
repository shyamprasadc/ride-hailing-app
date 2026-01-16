# Ride Hailing Platform - Frontend Demo

Minimal React frontend to demonstrate the ride-hailing backend APIs.

## Prerequisites

- Node.js (v14+)
- Backend server running on `http://localhost:3000`
- Database seeded with riders and drivers

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   ```
   http://localhost:5173
   ```

## Demo Flow

### 1. Rider View
- Select a rider from the dropdown (populated from seed data)
- Enter pickup and destination coordinates
- Select tier (Economy/Premium)
- Click "Create Ride"
- Ride status will show "REQUESTED" with message "Searching for drivers..."
- Wait for a driver to accept (status will update to "ASSIGNED")

### 2. Driver View
- Select a driver from the dropdown
- Update driver location (required to see nearby rides)
- View "Nearby Ride Requests" section
- Rides are displayed with distance, rider info, and tier
- Click "Accept Ride" on any available ride
- Note the **Trip ID** created after acceptance

### 3. Trip & Payment View
- Paste the **Trip ID** from step 2
- Click "End Trip" to complete the trip and calculate fare
- Click "Process Payment" to simulate payment

## API Endpoints Used

- `POST /v1/rides` - Create ride request (status: REQUESTED)
- `GET /v1/rides/:id` - Get ride status (polled every 3s)
- `GET /v1/drivers/:id/nearby-rides` - Get nearby ride requests
- `POST /v1/drivers/:id/location` - Update driver location
- `POST /v1/drivers/:id/accept` - Accept ride (manual)
- `POST /v1/trips/:id/end` - End trip
- `POST /v1/payments` - Process payment
- `GET /v1/data/riders` - Fetch riders
- `GET /v1/data/drivers` - Fetch drivers

## Features

- ✅ Tab-based navigation (no routing library)
- ✅ Real-time ride status polling
- ✅ Simple error handling
- ✅ Minimal CSS styling
- ✅ No external state management

## Tech Stack

- React 18
- Vite
- Native Fetch API
- Plain CSS

## Notes

- This is a **demo-only** UI for testing backend APIs
- No authentication or authorization
- No maps or geolocation
- Coordinates are entered manually
- Simple polling instead of WebSockets
