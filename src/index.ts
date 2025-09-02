import express from 'express';
import 'dotenv/config';
import db from './db/prismaClient';
import { getRoute } from './services/osrmService';
import { calculateMatch } from './services/matchingService';

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

app.post('/trips', async (req, res) => {
  try {
    const { pickupLat, pickupLng, dropLat, dropLng, departureTime } = req.body;

    if (!pickupLat || !pickupLng || !dropLat || !dropLng || !departureTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const route = await getRoute(pickupLat, pickupLng, dropLat, dropLng);
    
    const trip = await db.trip.create({
      data: {
        pickupLat: Number(pickupLat),
        pickupLng: Number(pickupLng),
        dropLat: Number(dropLat),
        dropLng: Number(dropLng),
        departureTime: new Date(departureTime),
        routePolyline: route.polyline,
        routeDistance: route.distance,
        routeDuration: route.duration
      }
    });

    res.json({
      success: true,
      trip: {
        id: trip.id,
        pickup: { lat: trip.pickupLat, lng: trip.pickupLng },
        drop: { lat: trip.dropLat, lng: trip.dropLng },
        departureTime: trip.departureTime.toISOString()
      },
      info: {
        distance: `${(route.distance / 1000).toFixed(2)} km`,
        duration: `${Math.round(route.duration / 60)} min`
      }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/trips', async (req, res) => {
  try {
    const trips = await db.trip.findMany({
      orderBy: { departureTime: 'asc' }
    });
    
    res.json({
      success: true,
      trips: trips.map(t => ({
        id: t.id,
        pickup: { lat: t.pickupLat, lng: t.pickupLng },
        drop: { lat: t.dropLat, lng: t.dropLng },
        departureTime: t.departureTime.toISOString(),
        distance: `${(t.routeDistance / 1000).toFixed(2)} km`,
        duration: `${Math.round(t.routeDuration / 60)} min`
      })),
      count: trips.length
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/matches/:tripId', async (req, res) => {
  const tripId = Number(req.params.tripId);

  try {
    const base = await db.trip.findUnique({ where: { id: tripId } });
    if (!base) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const windowStart = new Date(base.departureTime.getTime() - 30 * 60 * 1000);
    const windowEnd = new Date(base.departureTime.getTime() + 30 * 60 * 1000);

    const cands = await db.trip.findMany({
      where: {
        id: { not: tripId },
        departureTime: { gte: windowStart, lte: windowEnd }
      }
    });

    const matches = cands
      .map((c) => {
        const match = calculateMatch(
          base.routePolyline,
          c.routePolyline,
          base.routeDistance,
          c.routeDistance,
          base.departureTime,
          c.departureTime
        );

        const timeDiff = Math.abs(base.departureTime.getTime() - c.departureTime.getTime()) / (1000 * 60);
        const addDist = ((c.routeDistance - base.routeDistance) / 1000);

        return {
          tripId: c.id,
          pickup: { lat: c.pickupLat, lng: c.pickupLng },
          drop: { lat: c.dropLat, lng: c.dropLng },
          departureTime: c.departureTime.toISOString(),
          timeDiff: Math.round(timeDiff),
          overlap: match.overlap,
          extraDist: match.extraDist,
          score: match.score,
          valid: match.valid,
          frechetDist: match.frechetDist,
          similarity: match.similarity,
          addDist: `${addDist >= 0 ? '+' : ''}${addDist.toFixed(2)} km`,
          status: match.valid ? 'Match' : 'No Match'
        };
      })
      .filter((m) => m.valid && m.score > 20)
      .sort((a, b) => b.score - a.score);

    res.json({ 
      success: true,
      base: {
        id: base.id,
        pickup: { lat: base.pickupLat, lng: base.pickupLng },
        drop: { lat: base.dropLat, lng: base.dropLng },
        departureTime: base.departureTime.toISOString(),
        distance: `${(base.routeDistance / 1000).toFixed(2)} km`,
        duration: `${Math.round(base.routeDuration / 60)} min`
      },
      matches,
      count: matches.length,
      window: {
        start: windowStart.toISOString(),
        end: windowEnd.toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
