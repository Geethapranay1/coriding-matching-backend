# Route Matching Algorithm

Advanced live route matching system for ride-sharing applications built with Node.js, TypeScript, PostgreSQL, and Redis.

## Features

- Real route geometry using OSRM API
- Polyline overlap calculation with improved tolerance
- Time window matching (±30 minutes)
- Distance deviation constraints (≤20%)
- Smart match scoring algorithm with route compatibility
- Redis caching for performance
- PostgreSQL storage with Prisma ORM

## 🛠️ Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis
- **Route Service**: OSRM (Open Source Routing Machine)
- **Language**: TypeScript

## 📋 Requirements Met

### Core Requirements ✅
- [x] Route geometry analysis using OSRM Directions API
- [x] Polyline similarity calculation for overlap detection
- [x] Route deviation constraint (≤15% extra distance)
- [x] Departure time window matching (±30 minutes)
- [x] Match percentage calculation
- [x] Sample data with Bengaluru coordinates

### Extra Credit ✅
- [x] Redis caching for API responses
- [x] PostgreSQL database storage
- [x] RESTful API endpoints
- [x] Comprehensive testing and documentation

## 🏗️ Architecture

```
src/
├── db/
│   ├── prismaClient.ts    # Database client
│   └── redisClient.ts     # Redis caching client
├── services/
│   ├── osrmService.ts     # Route calculation service
│   └── matchingService.ts # Core matching algorithm
├── utils/
│   └── polylineUtils.ts   # Polyline encoding/decoding
├── scripts/
│   ├── sampleData.ts      # Sample data generation
│   └── testApp.ts         # Application testing
└── index.ts               # Main application server
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL
- Redis
- Docker (optional, for easy setup)

### Installation

1. **Clone and setup:**
   ```bash
   git clone <your-repo>
   cd coriding-matching
   npm install
   ```

2. **Start PostgreSQL and Redis:**
   ```bash
   # Using Docker
   docker run --name my-postgres1 -e POSTGRES_PASSWORD=mysecretpassword -d -p 5432:5432 postgres
   docker run --name my-redis -d -p 6379:6379 redis
   ```

3. **Setup environment:**
   ```bash
   # .env file is already configured with:
   DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/postgres?schema=public"
   REDIS_URL="redis://localhost:6379"
   OSRM_URL="https://router.project-osrm.org"
   ```

4. **Run database migrations:**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Create sample data:**
   ```bash
   npm run create-sample-data
   ```

6. **Start the server:**
   ```bash
   npm run dev
   ```

## 📡 API Endpoints

### 1. Health Check
```http
GET /health
```

### 2. Create Trip
```http
POST /trips
Content-Type: application/json

{
  "pickupLat": 12.9352,
  "pickupLng": 77.6245,
  "dropLat": 12.9698,
  "dropLng": 77.7500,
  "departureTime": "2025-09-01T09:00:00.000Z"
}
```

### 3. List All Trips
```http
GET /trips
```

### 4. Get Matches for Trip
```http
GET /matches/:tripId
```

## 🧪 Testing & Demo

### Automated Testing
```bash
npm run test-app
```

### Manual Testing with Sample Data

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Create sample trips:**
   ```bash
   npm run create-sample-data
   ```

3. **Test matching:**
   ```bash
   npm run test-app
   ```

### Sample Output

```json
{
  "success": true,
  "baseTrip": {
    "id": 8,
    "pickup": { "lat": 12.9352, "lng": 77.6245 },
    "drop": { "lat": 12.9698, "lng": 77.7500 },
    "departureTime": "2025-09-01T09:08:00.000Z",
    "distance": "18.45 km",
    "duration": "45 minutes"
  },
  "matches": [
    {
      "matchedTripId": 1,
      "overlapPercent": 95.2,
      "extraDistancePercent": 2.1,
      "matchPercent": 85.6,
      "isValidMatch": true,
      "additionalDistance": "0.35 km",
      "status": "Good Match"
    }
  ],
  "matchCount": 1
}
```

## 🔧 Matching Algorithm

### Core Logic
1. **Time Window Filtering**: Find trips within ±30 minutes
2. **Route Geometry Analysis**: Decode polylines and calculate overlap
3. **Distance Validation**: Ensure extra distance ≤ 15%
4. **Scoring**: Weighted algorithm considering overlap and distance penalty

### Matching Criteria
- **Minimum Overlap**: 30% route similarity
- **Maximum Extra Distance**: 15% additional travel
- **Time Window**: ±30 minutes from departure time
- **Match Score**: Weighted combination of overlap and distance factors

## 📊 Sample Bengaluru Locations

The application includes realistic sample data with these Bengaluru locations:
- Koramangala ↔ Whitefield
- Indiranagar ↔ Electronic City  
- Banashankari ↔ Jayanagar
- HSR Layout ↔ BTM Layout
- And more...

## 🎯 Key Features Demonstrated

1. **Real Route Geometry**: Uses OSRM for actual driving routes
2. **Intelligent Matching**: Beyond simple radius-based matching
3. **Performance Optimization**: Redis caching for API calls
4. **Scalable Architecture**: Clean separation of concerns
5. **Comprehensive Testing**: Automated test suite with real data

## 📝 npm Scripts

```json
{
  "dev": "nodemon --exec ts-node src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "create-sample-data": "ts-node src/scripts/sampleData.ts",
  "test-app": "ts-node src/scripts/testApp.ts"
}
```

## 🔍 Algorithm Complexity

- **Time Complexity**: O(n × m) where n = candidate trips, m = polyline points
- **Space Complexity**: O(p) where p = total polyline points
- **Optimizations**: Redis caching, indexed database queries, time window filtering

## 🏆 Extra Mile Features

- **Detailed Match Analysis**: Shows overlap percentage, extra distance, and time difference
- **Smart Scoring**: Weighted algorithm for better match ranking
- **Real-world Testing**: Bangalore coordinates with realistic routes
- **Production Ready**: Error handling, logging, and comprehensive API responses

## 🚧 Future Enhancements

- Real-time matching with WebSockets
- Machine learning for dynamic matching weights
- Multi-modal transport support
- Geographic clustering for performance
- Advanced route optimization
