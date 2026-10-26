// User-provided Ferrari F40 / Turbo OutRun sheet, with transparent backdrop.
// Coordinates use the 2048-wide preview. Only top-row sprites 1, 2, 3 and 7.
import { TRAFFIC_COLORS } from './config.js';

const FRAMES = {
  left: [14, 76, 249, 158],
  leftSoft: [266, 76, 254, 158],
  rear: [520, 76, 245, 158],
  jump: [1532, 62, 252, 172]
};
const PLAYER_COLOR = [28, 30, 36];

function cutFrame(sheet, [x, y, width, height]) {
  const scale = sheet.naturalWidth / 2048;
  const tile = document.createElement('canvas');
  tile.width = Math.round(width / 2); tile.height = Math.round(height / 2);
  const ctx = tile.getContext('2d'); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sheet, Math.round(x * scale), Math.round(y * scale),
    Math.round(width * scale), Math.round(height * scale), 0, 0, tile.width, tile.height);
  // Scan alpha only to align each angle to its tyres, rather than to sheet gaps.
  const pixels = ctx.getImageData(0, 0, tile.width, tile.height).data;
  let left = tile.width, top = tile.height, right = -1, bottom = -1;
  for (let y = 0; y < tile.height; y++) for (let x = 0; x < tile.width; x++) {
    if (pixels[(y * tile.width + x) * 4 + 3] < 180) continue;
    left = Math.min(left, x); top = Math.min(top, y);
    right = Math.max(right, x); bottom = Math.max(bottom, y);
  }
  if (right < left) throw new Error('El sprite del auto está vacío. Recarga la página.');
  const result = document.createElement('canvas');
  result.width = right - left + 1; result.height = bottom - top + 1;
  const out = result.getContext('2d'); out.imageSmoothingEnabled = false;
  out.drawImage(tile, left, top, result.width, result.height, 0, 0, result.width, result.height);
  return result;
}

function withBodyColor(frame, rgb, black = false) {
  const tile = document.createElement('canvas');
  tile.width = frame.width; tile.height = frame.height;
  const ctx = tile.getContext('2d'); ctx.drawImage(frame, 0, 0);
  const image = ctx.getImageData(0, 0, tile.width, tile.height);
  for (let i = 0; i < image.data.length; i += 4) {
    const [r, g, b, a] = image.data.subarray(i, i + 4);
    if (!a || r < 75 || r - g < 38 || r - b < 32) continue;
    if (r > 180 && g > 85 && b < 80) continue; // Keep amber rear lights.
    // Swap the red body palette; retain tyres, windows, chrome and passengers.
    const light = Math.min(1, Math.max(.3, r / 255));
    for (let c = 0; c < 3; c++) image.data[i + c] = black
      ? Math.round(rgb[c] * light + (g / 255) * 32)
      : Math.round(rgb[c] * light);
  }
  ctx.putImageData(image, 0, 0);
  return tile;
}

// Keep each supplied pose intact, centered on the same tyre baseline. Right
// views are exact horizontal reflections of the two supplied left views.
function alignedPose(frame, width, height, flip = false) {
  const tile = document.createElement('canvas');
  tile.width = width; tile.height = height;
  const ctx = tile.getContext('2d'); ctx.imageSmoothingEnabled = false;
  if (flip) { ctx.translate(width, 0); ctx.scale(-1, 1); }
  ctx.drawImage(frame, Math.floor((width-frame.width)/2), height-frame.height);
  return tile;
}

export async function loadCarSheet() {
  const sheet = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudieron cargar los sprites. Recarga la página.'));
    img.src = '/retro-racer/assets/images/f40-transparent.png';
  });
  const frames = Object.fromEntries(Object.entries(FRAMES).map(([key, rect]) => [key, cutFrame(sheet, rect)]));
  const width = Math.max(...Object.values(frames).map(frame => frame.width)) + 4;
  const height = Math.max(...Object.values(frames).map(frame => frame.height));
  const player = Object.fromEntries(Object.entries(frames).map(([key, frame]) =>
    [key, alignedPose(withBodyColor(frame, PLAYER_COLOR, true), width, height)]));
  player.rightSoft = alignedPose(withBodyColor(frames.leftSoft, PLAYER_COLOR, true), width, height, true);
  player.right = alignedPose(withBodyColor(frames.left, PLAYER_COLOR, true), width, height, true);
  player.steering = [player.left, player.leftSoft, player.rear, player.rightSoft, player.right];
  return {
    player,
    traffic: TRAFFIC_COLORS.map(rgb => withBodyColor(frames.rear, rgb)),
    baseWidth: frames.rear.width
  };
}

export function playerSprite(player, state) {
  if (state.airborne) return player.jump;
  const turn = Math.max(-1, Math.min(1, state.visualTurn || 0));
  const amount = Math.abs(turn) < .2 ? 0 : Math.abs(turn) < .6 ? 1 : 2;
  return player.steering?.[2 + Math.sign(turn) * amount];
}

export function drawCarSprite(ctx, sprite, x, tyreY, roadWidth, baseWidth) {
  if (!sprite) return;
  // All player poses share a fixed canvas and a common tyre baseline.
  const scale = roadWidth / baseWidth;
  const width = Math.max(1, Math.round(sprite.width * scale));
  const height = Math.max(1, Math.round(sprite.height * scale));
  ctx.drawImage(sprite, Math.round(x - width / 2), Math.round(tyreY - height), width, height);
}
