"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const polylineUtils_1 = require("../utils/polylineUtils");
// Test the polyline overlap calculation directly
function testOverlapCalculation() {
    console.log('=== TESTING POLYLINE OVERLAP CALCULATION ===\n');
    // Test with identical polylines
    const poly1 = "cl}mA_`xxMDFILmDoE_FwGACGGSNw@j@mA|@YRi@VoBp@iA^kAb@IDSHo@d@_Ax@aB`Ba@`@[ZeFpF";
    const poly2 = "cl}mA_`xxMDFILmDoE_FwGACGGSNw@j@mA|@YRi@VoBp@iA^kAb@IDSHo@d@_Ax@aB`Ba@`@[ZeFpF";
    console.log('Test 1: Identical polylines');
    console.log(`Polyline 1: ${poly1.substring(0, 50)}...`);
    console.log(`Polyline 2: ${poly2.substring(0, 50)}...`);
    const decoded1 = (0, polylineUtils_1.decodePolyline)(poly1);
    const decoded2 = (0, polylineUtils_1.decodePolyline)(poly2);
    console.log(`Decoded points 1: ${decoded1.length} points`);
    console.log(`Decoded points 2: ${decoded2.length} points`);
    console.log(`First point 1: ${decoded1[0].lat.toFixed(6)}, ${decoded1[0].lng.toFixed(6)}`);
    console.log(`First point 2: ${decoded2[0].lat.toFixed(6)}, ${decoded2[0].lng.toFixed(6)}`);
    const overlap1 = (0, polylineUtils_1.approximateOverlap)(decoded1, decoded2);
    console.log(`Calculated overlap: ${overlap1.toFixed(2)}%`);
    console.log('Expected: ~100%\n');
    // Test with completely different polylines
    const poly3 = "ak{mAenixMYp@}@e@ICAAK@OGw@c@y@a@{@c@_By@m@YqCwAyA}@OISKmAUk@Ki@K}@QOCYIi@OGEGG";
    const poly4 = "q_qnA_trxMm@KAFIXSf@E~@AJEZEf@ALE`@Eh@EdA?NU`AQz@Sz@Sx@Kf@AHc@zBCLI`@CLg@z@CX";
    console.log('Test 2: Completely different polylines');
    console.log(`Polyline 3: ${poly3.substring(0, 50)}...`);
    console.log(`Polyline 4: ${poly4.substring(0, 50)}...`);
    const decoded3 = (0, polylineUtils_1.decodePolyline)(poly3);
    const decoded4 = (0, polylineUtils_1.decodePolyline)(poly4);
    console.log(`Decoded points 3: ${decoded3.length} points`);
    console.log(`Decoded points 4: ${decoded4.length} points`);
    console.log(`First point 3: ${decoded3[0].lat.toFixed(6)}, ${decoded3[0].lng.toFixed(6)}`);
    console.log(`First point 4: ${decoded4[0].lat.toFixed(6)}, ${decoded4[0].lng.toFixed(6)}`);
    const overlap2 = (0, polylineUtils_1.approximateOverlap)(decoded3, decoded4);
    console.log(`Calculated overlap: ${overlap2.toFixed(2)}%`);
    console.log('Expected: <20%\n');
    // Test the tolerance mechanism
    console.log('Test 3: Testing tolerance mechanism');
    const tolerance = 0.001;
    const point1 = { lat: 12.9352, lng: 77.6245 };
    const point2 = { lat: 12.9353, lng: 77.6246 }; // Very close but different
    const key1 = `${Math.round(point1.lat / tolerance) * tolerance},${Math.round(point1.lng / tolerance) * tolerance}`;
    const key2 = `${Math.round(point2.lat / tolerance) * tolerance},${Math.round(point2.lng / tolerance) * tolerance}`;
    console.log(`Point 1: ${point1.lat}, ${point1.lng} → Key: ${key1}`);
    console.log(`Point 2: ${point2.lat}, ${point2.lng} → Key: ${key2}`);
    console.log(`Keys match: ${key1 === key2}`);
    console.log(`This shows tolerance handling\n`);
    // Test with partially overlapping routes
    console.log('Test 4: Testing current algorithm behavior');
    // Let's check what happens with the actual problematic data
    // These should be the same coordinates but let's see how the algorithm handles them
    const route1 = (0, polylineUtils_1.decodePolyline)("cl}mA_`xxMDFILmDoE_FwGACGGSNw@j@mA|@YRi@VoBp@iA^kAb@IDSHo@d@_Ax@aB`Ba@`@[ZeFpF");
    const route2 = (0, polylineUtils_1.decodePolyline)("cl}mA_`xxMDFILmDoE_FwGACGGSNw@j@mA|@YRi@VoBp@iA^kAb@IDSHo@d@_Ax@aB`Ba@`@[ZeFpF");
    console.log('Testing approximateOverlap function:');
    console.log(`Route 1 length: ${route1.length}`);
    console.log(`Route 2 length: ${route2.length}`);
    // Check the actual overlap calculation step by step
    const tolerance2 = 0.001;
    const setB = new Set(route2.map((p) => `${Math.round(p.lat / tolerance2) * tolerance2},${Math.round(p.lng / tolerance2) * tolerance2}`));
    const shared = route1.filter((p) => setB.has(`${Math.round(p.lat / tolerance2) * tolerance2},${Math.round(p.lng / tolerance2) * tolerance2}`));
    console.log(`Set B size: ${setB.size}`);
    console.log(`Shared points: ${shared.length}`);
    const segmentWeight = Math.min(route1.length, route2.length) / Math.max(route1.length, route2.length);
    const baseOverlap = (shared.length * 2 * 100) / (route1.length + route2.length);
    const finalOverlap = baseOverlap * segmentWeight;
    console.log(`Segment weight: ${segmentWeight.toFixed(4)}`);
    console.log(`Base overlap: ${baseOverlap.toFixed(2)}%`);
    console.log(`Final overlap: ${finalOverlap.toFixed(2)}%`);
}
testOverlapCalculation();
