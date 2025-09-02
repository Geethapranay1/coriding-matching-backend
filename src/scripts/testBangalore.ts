import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

const locations = {
  koramangala: { lat: 12.9352, lng: 77.6245, name: "Koramangala" },
  whitefield: { lat: 12.9698, lng: 77.7500, name: "Whitefield" },
  electronicCity: { lat: 12.8456, lng: 77.6603, name: "Electronic City" },
  indiranagar: { lat: 12.9784, lng: 77.6408, name: "Indiranagar" },
  banashankari: { lat: 12.9249, lng: 77.5500, name: "Banashankari" },
  jayanagar: { lat: 12.9279, lng: 77.5937, name: "Jayanagar" },
  hsrLayout: { lat: 12.9116, lng: 77.6370, name: "HSR Layout" },
  btmLayout: { lat: 12.9165, lng: 77.6101, name: "BTM Layout" },
  mgRoad: { lat: 12.9716, lng: 77.5946, name: "MG Road" },
  marathahalli: { lat: 12.9591, lng: 77.6974, name: "Marathahalli" },
  silkBoard: { lat: 12.9177, lng: 77.6162, name: "Silk Board" },
  hebbal: { lat: 13.0356, lng: 77.5970, name: "Hebbal" },
  vijayanagar: { lat: 12.9626, lng: 77.5382, name: "Vijayanagar" },
  rajajinagar: { lat: 12.9964, lng: 77.5553, name: "Rajajinagar" },
  malleshwaram: { lat: 13.0031, lng: 77.5748, name: "Malleshwaram" }
};

interface Trip {
  pickup: typeof locations.koramangala;
  drop: typeof locations.whitefield;
  time: string;
  desc: string;
}

const scenarios: Trip[] = [
  {
    pickup: locations.koramangala,
    drop: locations.whitefield,
    time: '2025-09-01T08:30:00.000Z',
    desc: 'Morning commute Koramangala to Whitefield'
  },
  {
    pickup: locations.indiranagar,
    drop: locations.electronicCity,
    time: '2025-09-01T09:00:00.000Z', 
    desc: 'Cross-city Indiranagar to Electronic City'
  },
  {
    pickup: locations.hebbal,
    drop: locations.hsrLayout,
    time: '2025-09-01T08:45:00.000Z',
    desc: 'North to South Hebbal to HSR'
  },
  {
    pickup: locations.malleshwaram,
    drop: locations.marathahalli,
    time: '2025-09-01T09:15:00.000Z',
    desc: 'West to East Malleshwaram to Marathahalli'
  },
  {
    pickup: locations.banashankari,
    drop: locations.mgRoad,
    time: '2025-09-01T08:50:00.000Z',
    desc: 'South to Central Banashankari to MG Road'
  }
];

async function testBangalore() {
  try {
    console.log('Testing with real Bangalore locations\n');

    const health = await axios.get(`${BASE_URL}/health`);
    console.log('Server:', health.data);
    console.log();

    console.log('Creating trips...\n');

    const trips = [];

    for (let i = 0; i < scenarios.length; i++) {
      const s = scenarios[i];
      console.log(`${i + 1}. ${s.desc}`);
      console.log(`   ${s.pickup.name} (${s.pickup.lat}, ${s.pickup.lng})`);
      console.log(`   ${s.drop.name} (${s.drop.lat}, ${s.drop.lng})`);
      console.log(`   ${new Date(s.time).toLocaleTimeString()}`);
      
      try {
        const resp = await axios.post(`${BASE_URL}/trips`, {
          pickupLat: s.pickup.lat,
          pickupLng: s.pickup.lng,
          dropLat: s.drop.lat,
          dropLng: s.drop.lng,
          departureTime: s.time
        });

        const data = resp.data as any;
        if (data.success) {
          trips.push({
            id: data.trip.id,
            scenario: s,
            dist: data.info.distance,
            dur: data.info.duration
          });
          console.log(`   Created ${data.trip.id} - ${data.info.distance}, ${data.info.duration}`);
        }
      } catch (error: any) {
        console.log(`   Failed: ${error.response?.data?.error || error.message}`);
      }
      
      console.log();
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\nTesting matches\n');

    for (const t of trips) {
      console.log(`Trip ${t.id}: ${t.scenario.pickup.name} to ${t.scenario.drop.name}`);
      console.log(`Distance: ${t.dist}, Duration: ${t.dur}`);
      console.log();

      try {
        const resp = await axios.get(`${BASE_URL}/matches/${t.id}`);
        const data = resp.data as any;

        if (data.success && data.count > 0) {
          console.log(`Found ${data.count} matches:`);
          
          data.matches.forEach((m: any, idx: number) => {
            const pickupName = findName(m.pickup.lat, m.pickup.lng);
            const dropName = findName(m.drop.lat, m.drop.lng);
            
            console.log(`\n  ${idx + 1}:`);
            console.log(`  Route: ${pickupName} to ${dropName}`);
            console.log(`  Time diff: ${m.timeDiff} min`);
            console.log(`  Overlap: ${m.overlap}%`);
            console.log(`  Extra dist: ${m.extraDist}%`);
            console.log(`  Score: ${m.score}%`);
            console.log(`  Rating: ${getRating(m.score)}`);
          });
        } else {
          console.log('No matches found');
        }
      } catch (error: any) {
        console.log(`Error: ${error.response?.data?.error || error.message}`);
      }
      
      console.log('\n' + '-'.repeat(50) + '\n');
    }

    console.log('Testing similar routes\n');
    await testSimilar();

  } catch (error: any) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

async function testSimilar() {
  console.log('Creating similar routes...\n');

  const r1 = {
    pickupLat: locations.koramangala.lat,
    pickupLng: locations.koramangala.lng,
    dropLat: locations.whitefield.lat,
    dropLng: locations.whitefield.lng,
    departureTime: '2025-09-01T09:00:00.000Z'
  };

  const r2 = {
    pickupLat: locations.hsrLayout.lat,
    pickupLng: locations.hsrLayout.lng,
    dropLat: locations.whitefield.lat,
    dropLng: locations.whitefield.lng,
    departureTime: '2025-09-01T09:05:00.000Z'
  };

  try {
    console.log('1. Koramangala to Whitefield');
    const t1 = await axios.post(`${BASE_URL}/trips`, r1);
    
    await new Promise(r => setTimeout(r, 1000));
    
    console.log('2. HSR Layout to Whitefield');
    const t2 = await axios.post(`${BASE_URL}/trips`, r2);

    const d1 = t1.data as any;
    const d2 = t2.data as any;

    if (d1.success && d2.success) {
      const id1 = d1.trip.id;
      const id2 = d2.trip.id;
      
      console.log(`\nTrip ${id1}: ${d1.info.distance}, ${d1.info.duration}`);
      console.log(`Trip ${id2}: ${d2.info.distance}, ${d2.info.duration}`);
      
      await new Promise(r => setTimeout(r, 1000));
      
      console.log(`\nMatches for trip ${id1}:`);
      const m = await axios.get(`${BASE_URL}/matches/${id1}`);
      const md = m.data as any;
      
      if (md.success && md.count > 0) {
        console.log(`Found ${md.count} matches:`);
        
        md.matches.forEach((match: any) => {
          if (match.tripId === id2) {
            console.log(`\nPerfect match found:`);
            console.log(`   Both routes to Whitefield`);
            console.log(`   Pickup distance: 2.5km apart`);
            console.log(`   Time gap: 5 minutes`);
            console.log(`   Overlap: ${match.overlap}%`);
            console.log(`   Score: ${match.score}%`);
            console.log(`   Ideal for carpooling`);
          }
        });
      }
    }
  } catch (error: any) {
    console.log(`Error: ${error.response?.data?.error || error.message}`);
  }
}

function findName(lat: number, lng: number): string {
  const thresh = 0.01;
  
  for (const [key, loc] of Object.entries(locations)) {
    const latDiff = Math.abs(loc.lat - lat);
    const lngDiff = Math.abs(loc.lng - lng);
    
    if (latDiff < thresh && lngDiff < thresh) {
      return loc.name;
    }
  }
  
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function getRating(score: number): string {
  if (score >= 70) return 'Excellent';
  if (score >= 50) return 'Good';
  if (score >= 30) return 'Fair';
  return 'Poor';
}

if (require.main === module) {
  testBangalore()
    .then(() => {
      console.log('\nTest completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test error:', error);
      process.exit(1);
    });
}
