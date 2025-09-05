import request from "supertest";
import app from "../index"; // adjust import if needed

describe("Trip Matching Backend – Bengaluru (HSR/Koramangala → Airport)", () => {
  let baseTripId: number;

  it("should add a base trip (HSR Layout → BLR Airport)", async () => {
    const res = await request(app)
      .post("/trips")
      .send({
        pickupLat: 12.9121,   // HSR Layout
        pickupLng: 77.6387,
        dropLat: 13.1986,     // Kempegowda Intl. Airport
        dropLng: 77.7066,
        departureTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hr later
      })
      .expect(201);

    baseTripId = res.body.id;
    expect(baseTripId).toBeDefined();
  }, 30000);

  it("should add a candidate trip (Koramangala → BLR Airport)", async () => {
    const res = await request(app)
      .post("/trips")
      .send({
        pickupLat: 12.9279,   // Koramangala
        pickupLng: 77.6271,
        dropLat: 13.1986,     // BLR Airport
        dropLng: 77.7066,
        departureTime: new Date(Date.now() + 70 * 60 * 1000).toISOString(), // 1 hr 10 mins later
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
  }, 30000);

  it("should return a valid match between HSR and Koramangala trips", async () => {
    const res = await request(app)
      .get(`/matches/${baseTripId}`)
      .expect(200);
    baseTripId = res.body.id || res.body.tripId;

    expect(res.body.tripId).toBe(baseTripId);
    expect(Array.isArray(res.body.matches)).toBe(true);

    console.log("Matches:", JSON.stringify(res.body.matches, null, 2));

    const validMatches = res.body.matches.filter((m: any) => m.valid);
    expect(validMatches.length).toBeGreaterThan(0);

    // sanity check: since both end at airport, destMatch should be true
    expect(validMatches[0].destinationMatch).toBe(true);

    // match score should be decent (> 50 ideally, since overlap is large)
    expect(validMatches[0].matchScore).toBeGreaterThan(50);
  }, 30000);
});
