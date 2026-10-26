// Adapted from simondiep/retro-racer (07d6a46), using metres and seconds.
export const LANES = 3;
export const RUMBLE_LENGTH = 2;
export const SEGMENT_LENGTH = 5;
export const TOTAL_SEGMENTS = 1100;
export const DRAW_DISTANCE = 100;
export const FPS = 60;
// Physics uses metres/second; the HUD converts back to the exact km/h limits.
export const MAX_SPEED = 250 / 3.6;
export const NITRO_MAX_SPEED = 380 / 3.6;
export const ROAD_WIDTH = 8;
export const CAMERA_BACK = 7.5;
export const CAMERA_HEIGHT = 8;
export const CAMERA_DEPTH = 1 / Math.tan(50 * Math.PI / 180);
export const HORIZON = 92;
// Bright body paints are reserved for traffic; only the player's car is black.
export const TRAFFIC_COLORS = [
  [245, 48, 60], [255, 210, 45], [45, 155, 255], [65, 220, 105],
  [190, 90, 245], [255, 135, 45], [225, 235, 245], [45, 220, 225]
];
