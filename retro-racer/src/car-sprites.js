// User-provided OutRun (Master System) sheet, edited to remove the green backdrop.
// Regions use the 2048-wide preview coordinate system of outrun-transparent.png.
import { TRAFFIC_COLORS } from './config.js';

const FRAMES = {
  rear: [188, 84, 165, 130],
  rear2: [12, 84, 174, 132],
  rear3: [357, 93, 167, 120],
  left: [1789, 217, 240, 104],
  right: [10, 216, 250, 108]
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
    // Swap the red body palette; retain tyres, windows, chrome and passengers.
    const light = Math.min(1, Math.max(.3, r / 255));
    for (let c = 0; c < 3; c++) image.data[i + c] = black
      ? Math.round(rgb[c] * light + (g / 255) * 32)
      : Math.round(rgb[c] * light);
  }
  ctx.putImageData(image, 0, 0);
  return tile;
}

export async function loadCarSheet() {
  const sheet = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudieron cargar los sprites. Recarga la página.'));
    img.src = '/retro-racer/assets/images/outrun-transparent.png';
  });
  const frames = Object.fromEntries(Object.entries(FRAMES).map(([key, rect]) => [key, cutFrame(sheet, rect)]));
  return {
    // Every player angle uses the same exclusive black paint.
    player: Object.fromEntries(Object.entries(frames).map(([key, img]) => [key, withBodyColor(img, PLAYER_COLOR, true)])),
    traffic: TRAFFIC_COLORS.map(rgb => withBodyColor(frames.rear, rgb)),
    baseWidth: frames.rear.width
  };
}

export function drawCarSprite(ctx, sprite, x, tyreY, roadWidth, baseWidth) {
  if (!sprite) return;
  // Preserve the sheet's angle-dependent silhouette and use a common tyre baseline.
  const scale = roadWidth / baseWidth;
  const width = Math.max(1, Math.round(sprite.width * scale));
  const height = Math.max(1, Math.round(sprite.height * scale));
  ctx.drawImage(sprite, Math.round(x - width / 2), Math.round(tyreY - height), width, height);
}
