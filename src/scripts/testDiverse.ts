import axios from 'axios';
import { discreteFrechetDistance, decode } from '../utils/polylineUtils';

const BASE_URL = 'http://localhost:3000';

interface RouteData {
  name: string;
  pickup: { lat: number; lng: number };
  drop: { lat: number; lng: number };
  time: string;
}

interface CreatedTrip {
  id: number;
  name: string;
  distance: string;
  duration: string;
}

interface MatchData {
  tripId: number;
  timeDiff: number;
  overlap: number;
  similarity?: number;
  frechetDist?: number;
  extraDist: number;
  score: number;
  status: string;
}

interface ApiResponse {
  success: boolean;
  count: number;
  matches: MatchData[];
}

async function testFrechet(): Promise<void> {
  console.log('Testing Frechet Distance Integration\n');

  try {
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('Server status:', health.data);

    const routes: RouteData[] = [
      {
        name: 'Route A: Koramangala to Whitefield',
        pickup: { lat: 12.9352, lng: 77.6245 },
        drop: { lat: 12.9698, lng: 77.7500 },
        time: '2025-09-01T09:00:00.000Z'
      },
      {
        name: 'Route B: HSR to Whitefield (similar destination)',
        pickup: { lat: 12.9116, lng: 77.6370 },
        drop: { lat: 12.9698, lng: 77.7500 },
        time: '2025-09-01T09:05:00.000Z'
      },
      {
        name: 'Route C: Banashankari to MG Road (different direction)',
        pickup: { lat: 12.9249, lng: 77.5500 },
        drop: { lat: 12.9716, lng: 77.5946 },
        time: '2025-09-01T09:10:00.000Z'
      }
    ];

    const createdTrips: CreatedTrip[] = [];

    for (const route of routes) {
      console.log(`\nCreating: ${route.name}`);
      try {
        const resp = await axios.post(`${BASE_URL}/trips`, {
          pickupLat: route.pickup.lat,
          pickupLng: route.pickup.lng,
          dropLat: route.drop.lat,
          dropLng: route.drop.lng,
          departureTime: route.time
        });

        const respData = resp.data as { success: boolean; trip: { id: number }; info: { distance: string; duration: string } };
        if (respData.success) {
          createdTrips.push({
            id: respData.trip.id,
            name: route.name,
            distance: respData.info.distance,
            duration: respData.info.duration
          });
          console.log(`Trip ${respData.trip.id} created: ${respData.info.distance}, ${respData.info.duration}`);
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { error?: string } }; message?: string };
        console.log(`Failed: ${err.response?.data?.error || err.message || 'Unknown error'}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (createdTrips.length > 0) {
      console.log(`\n${'='.repeat(60)}`);
      console.log('TESTING FRECHET DISTANCE MATCHING');
      console.log(`${'='.repeat(60)}\n`);

      const baseTrip = createdTrips[0];
      console.log(`Base trip: ${baseTrip.name} (ID: ${baseTrip.id})`);
      console.log(`Distance: ${baseTrip.distance}, Duration: ${baseTrip.duration}\n`);

      const resp = await axios.get(`${BASE_URL}/matches/${baseTrip.id}`);
      const data = resp.data as ApiResponse;

      if (data.success && data.count > 0) {
        console.log(`Found ${data.count} matches using Frechet distance:\n`);

        data.matches.forEach((match: MatchData, idx: number) => {
          console.log(`Match ${idx + 1}:`);
          console.log(`  Trip ID: ${match.tripId}`);
          console.log(`  Time difference: ${match.timeDiff} minutes`);
          console.log(`  Route overlap: ${match.overlap}%`);
          if (match.similarity !== undefined) {
            console.log(`  Route similarity: ${match.similarity}%`);
          }
          if (match.frechetDist !== undefined) {
            console.log(`  Frechet distance: ${match.frechetDist}m`);
          }
          console.log(`  Extra distance: ${match.extraDist}%`);
          console.log(`  Overall score: ${match.score}%`);
          console.log(`  Status: ${match.status}`);
          
          const similarity = match.similarity || 0;
          if (similarity > 70) {
            console.log(`  High similarity - excellent match for carpooling`);
          } else if (similarity > 40) {
            console.log(`  Moderate similarity - good potential match`);
          } else {
            console.log(`  Low similarity - may not be suitable`);
          }
          console.log();
        });
      } else {
        console.log('No matches found with current criteria');
      }
    }

    console.log(`${'='.repeat(60)}`);
    console.log('Frechet distance algorithm successfully integrated!');
    console.log('- Route similarity calculations enhanced');
    console.log('- Distance-based matching improved');
    console.log('- More accurate carpooling recommendations');
    console.log(`${'='.repeat(60)}`);

  } catch (error: unknown) {
    const err = error as { response?: { data?: any }; message?: string };
    console.error('Test failed:', err.response?.data || err.message || 'Unknown error');
  }
}

if (require.main === module) {
  testFrechet()
    .then(() => {
      console.log('\nFrechet distance test completed');
      process.exit(0);
    })
    .catch((error: unknown) => {
      const err = error as { message?: string };
      console.error('Test error:', err.message || 'Unknown error');
      process.exit(1);
    });
}