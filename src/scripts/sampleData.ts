import db from '../db/prismaClient';
import { getRoute } from '../services/osrmService';

const locs = [
  { name: 'Koramangala', lat: 12.9352, lng: 77.6245 },
  { name: 'Whitefield', lat: 12.9698, lng: 77.7500 },
  { name: 'Electronic City', lat: 12.8456, lng: 77.6603 },
  { name: 'Indiranagar', lat: 12.9784, lng: 77.6408 },
  { name: 'Banashankari', lat: 12.9249, lng: 77.5500 },
  { name: 'Jayanagar', lat: 12.9279, lng: 77.5937 },
  { name: 'HSR Layout', lat: 12.9116, lng: 77.6370 },
  { name: 'BTM Layout', lat: 12.9165, lng: 77.6101 },
  { name: 'MG Road', lat: 12.9716, lng: 77.5946 },
  { name: 'Marathahalli', lat: 12.9591, lng: 77.6974 }
];

interface Trip {
  pickup: { lat: number; lng: number };
  drop: { lat: number; lng: number };
  departureTime: Date;
}

const trips: Trip[] = [
  {
    pickup: locs[0],
    drop: locs[1],
    departureTime: new Date('2025-09-01T09:00:00.000Z')
  },
  {
    pickup: locs[0],
    drop: locs[2],
    departureTime: new Date('2025-09-01T09:15:00.000Z')
  },
  {
    pickup: locs[3],
    drop: locs[1],
    departureTime: new Date('2025-09-01T09:10:00.000Z')
  },
  {
    pickup: locs[4],
    drop: locs[5],
    departureTime: new Date('2025-09-01T08:45:00.000Z')
  },
  {
    pickup: locs[6],
    drop: locs[2],
    departureTime: new Date('2025-09-01T09:20:00.000Z')
  },
  {
    pickup: locs[7],
    drop: locs[8],
    departureTime: new Date('2025-09-01T09:05:00.000Z')
  },
  {
    pickup: locs[9],
    drop: locs[1],
    departureTime: new Date('2025-09-01T09:12:00.000Z')
  }
];

export async function createSampleTrips() {
  console.log('Creating sample trips...');
  
  await db.trip.deleteMany();
  
  for (let i = 0; i < trips.length; i++) {
    const t = trips[i];
    
    try {
      console.log(`Creating trip ${i + 1}/${trips.length}...`);
      
      const routeData = await getRoute(t.pickup.lat, t.pickup.lng, t.drop.lat, t.drop.lng);
      
      await db.trip.create({
        data: {
          pickupLat: t.pickup.lat,
          pickupLng: t.pickup.lng,
          dropLat: t.drop.lat,
          dropLng: t.drop.lng,
          departureTime: t.departureTime,
          routePolyline: routeData.polyline,
          routeDistance: routeData.distance,
          routeDuration: routeData.duration,
        },
      });
      
      console.log(`Trip ${i + 1} created`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error creating trip ${i + 1}:`, error);
    }
  }
  
  console.log('Sample trips creation completed');
}

if (require.main === module) {
  createSampleTrips()
    .then(() => {
      console.log('Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}
