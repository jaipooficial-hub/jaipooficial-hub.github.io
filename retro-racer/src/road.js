// Road segments and perspective adapted from simondiep/retro-racer/src/road.js.
// All actors use road-relative x and the same tangent-aligned camera.
import { RUMBLE_LENGTH, SEGMENT_LENGTH, TOTAL_SEGMENTS, ROAD_WIDTH,
  CAMERA_BACK, CAMERA_HEIGHT, CAMERA_DEPTH, HORIZON } from './config.js';

// [start metre, end metre, new tangent]. Cosine easing gives zero curvature
// at both ends of every bend, with real straight sections between bends.
export const BENDS = [
  [180, 450, 0.38], [760, 1100, -0.28], [1450, 1780, 0.25],
  [2200, 2520, -0.36], [2900, 3240, 0.3], [3600, 3900, -0.24],
  [4240, 4570, 0]
];
// Smooth humps return to flat ground with continuous height, grade and curvature.
// The crests can unload the suspension at high speed; no invisible jump trigger.
export const HILLS = [
  [480, 680, 6], [1180, 1390, 5], [1830, 2050, 7],
  [2690, 2900, 6], [3420, 3650, 8], [4040, 4250, 6]
];
export function elevationAt(z) {
  for (const [start, end, amplitude] of HILLS) {
    if (z <= start || z >= end) continue;
    const k = Math.PI / (end - start), t = (z - start) * k;
    const sin = Math.sin(t), cos = Math.cos(t);
    return { height: amplitude * sin ** 4,
      grade: 4 * amplitude * k * sin ** 3 * cos,
      curvature: 4 * amplitude * k * k * (3 * sin * sin * cos * cos - sin ** 4) };
  }
  return { height: 0, grade: 0, curvature: 0 };
}
export function roadAt(z) {
  let center = 0, heading = 0, end = 0;
  for (const [start, finish, target] of BENDS) {
    if (z <= start) return { center: center + heading * (z - end), heading, curvature: 0 };
    center += heading * (start - end);
    const length = finish - start, t = Math.min(1, (z - start) / length), delta = target - heading;
    const integral = length * (t / 2 - Math.sin(Math.PI * t) / (2 * Math.PI));
    if (z < finish) return {
      center: center + heading * (z - start) + delta * integral,
      heading: heading + delta * (1 - Math.cos(Math.PI * t)) / 2,
      curvature: delta * Math.PI * Math.sin(Math.PI * t) / (2 * length)
    };
    center += heading * length + delta * length / 2;
    heading = target; end = finish;
  }
  return { center: center + heading * (z - end), heading, curvature: 0 };
}
export function createRoadSegments() {
  return Array.from({ length: TOTAL_SEGMENTS }, (_, n) => {
    const showLaneStripe = Math.floor(n / RUMBLE_LENGTH) % 2;
    return { index: n, z1: n * SEGMENT_LENGTH, z2: (n + 1) * SEGMENT_LENGTH,
      showLaneStripe, grassColor: showLaneStripe ? '#528f3b' : '#4f8e3b',
      roadColor: showLaneStripe ? '#525e68' : '#505c66',
      rumbleColor: showLaneStripe ? '#f4dec1' : '#ad4e43' };
  });
}
export function convertZPositionRoadTo2dCoords(playerX, z, currentZPosition, width = 320, objectX = 0) {
  const origin = roadAt(currentZPosition), point = roadAt(z);
  const dz = z - currentZPosition;
  const translatedZ = dz + CAMERA_BACK;
  if (translatedZ <= 0) return null;
  // Subtract the local tangent as well as the centre. Without this term the
  // road slides sideways on straights after a bend and disagrees with steering.
  const translatedX = point.center - origin.center - origin.heading * dz + (objectX - playerX) * ROAD_WIDTH;
  const scale = CAMERA_DEPTH * width / (2 * translatedZ);
  const elevation = elevationAt(z).height - elevationAt(currentZPosition).height;
  return { x: width / 2 + scale * translatedX,
    y: HORIZON + scale * (CAMERA_HEIGHT - elevation), w: scale * ROAD_WIDTH, scale };
}
export function carTurn(s, steering = 0) {
  if (s.speed < 0.5) return 0;
  const bend = roadAt(s.distance).curvature * 45;
  return Math.max(-1, Math.min(1, steering * 0.75 + bend));
}
