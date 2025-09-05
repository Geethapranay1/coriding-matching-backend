import express from 'express';
import prisma from '../db/prismaClient';
import { calculateMatch } from '../services/matchingService';

const router = express.Router();

router.get('/:tripId', async (req, res) => {
  const tripId = Number(req.params.tripId);

  try {
    const baseTrip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!baseTrip) return res.status(404).json({ error: 'Trip not found' });

    const startWindow = new Date(baseTrip.departureTime.getTime() - 30 * 60 * 1000);
    const endWindow = new Date(baseTrip.departureTime.getTime() + 30 * 60 * 1000);

    const candidates = await prisma.trip.findMany({
      where: {
        departureTime: { gte: startWindow, lte: endWindow },
        NOT: { id: tripId },
      },
    });

    const matches = candidates
      .map((candidate) => {
        const match = calculateMatch(
          baseTrip.routePolyline,
          candidate.routePolyline,
          baseTrip.routeDistance,
          candidate.routeDistance,
          baseTrip.departureTime,
          candidate.departureTime
        );
        return {
          matchedTripId: candidate.id,
          overlapPercent: match.overlap,
          extraDistancePercent: match.extraDist,
          matchScore: match.score,
          valid: match.valid,
          frechetDistance: match.frechetDist,
          similarity: match.similarity,
          destinationMatch: match.destMatch,
          routeType: match.routeType,
        };
      })
      .filter((m) => m.valid && m.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);

   res.json({
      baseTrip: {
        id: baseTrip.id,
        pickup: [baseTrip.pickupLat, baseTrip.pickupLng],
        drop: [baseTrip.dropLat, baseTrip.dropLng],
        departureTime: baseTrip.departureTime,
      },
      matches,
  });

  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
