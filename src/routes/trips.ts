import express from 'express';
import prisma from '../db/prismaClient';
import { getRoute } from '../services/osrmService';

const router = express.Router();

router.get('/', async (req, res) => {
  const trips = await prisma.trip.findMany({});
  res.json(trips);
});

router.post('/', async (req, res) => {
  try {
    const { pickupLat, pickupLng, dropLat, dropLng, departureTime } = req.body;

    const routeData = await getRoute(pickupLat, pickupLng, dropLat, dropLng);

    const trip = await prisma.trip.create({
      data: {
        pickupLat,
        pickupLng,
        dropLat,
        dropLng,
        departureTime: new Date(departureTime),
        routePolyline: routeData.polyline,
        routeDistance: routeData.distance,
        routeDuration: routeData.duration,
      },
    });

    res.status(201).json(trip);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
