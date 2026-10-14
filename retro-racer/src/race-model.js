export const MAX_SPEED = 60, RACE_LENGTH = 4800;
export const CHECKPOINTS = [1600, 3200];
export function roadCenter(z) { return Math.sin(z / 460) * 600 + Math.sin(z / 900) * 850; }
export function createRace(random = Math.random) {
  return { phase: 'ready', resumePhase: 'racing', countdown: 1, speed: 0, x: 0,
    distance: 0, timeLeft: 65, elapsed: 0, sector: 0, overtakes: 0,
    nitro: 0, cooldown: 0, hitCooldown: 0, flash: 0, message: '', messageTime: 0,
    traffic: Array.from({ length: 12 }, (_, i) => ({ z: 280 + i * 220,
      x: [-0.64, 0, 0.64][i % 3], speed: 24 + random() * 12, color: i % 4, passed: false })) };
}
export function startRace(s) { if (s.phase === 'ready') s.phase = 'countdown'; }
export function pauseRace(s) {
  if (s.phase === 'paused') s.phase = s.resumePhase;
  else if (['racing', 'countdown'].includes(s.phase)) { s.resumePhase = s.phase; s.phase = 'paused'; }
}
export function activateNitro(s) {
  if (s.phase !== 'racing' || s.nitro > 0 || s.cooldown > 0) return false;
  s.nitro = 3; return true;
}
export function stepRace(s, input, dt, random = Math.random) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  dt = Math.min(dt, 0.05);
  if (s.phase === 'countdown') { s.countdown = Math.max(0, s.countdown - dt); if (!s.countdown) s.phase = 'racing'; return; }
  if (s.phase !== 'racing') return;
  s.elapsed += dt; s.timeLeft = Math.max(0, s.timeLeft - dt);
  s.hitCooldown = Math.max(0, s.hitCooldown - dt); s.flash = Math.max(0, s.flash - dt);
  s.messageTime = Math.max(0, s.messageTime - dt);
  if (s.nitro > 0) { s.nitro = Math.max(0, s.nitro - dt); if (!s.nitro) s.cooldown = 10; }
  else s.cooldown = Math.max(0, s.cooldown - dt);
  const boost = s.nitro > 0;
  const accel = input.down ? -65 : boost ? 90 : input.up ? 45 : -10;
  s.speed = Math.max(0, Math.min(boost ? MAX_SPEED * 1.75 : Math.max(MAX_SPEED, s.speed - 24 * dt), s.speed + accel * dt));
  const steering = Number(!!input.right) - Number(!!input.left);
  s.x += steering * (0.35 + s.speed / MAX_SPEED * 1.25) * dt;
  s.x -= Math.sin(s.distance / 460) * 0.32 * (s.speed / MAX_SPEED) ** 2 * dt;
  s.x = Math.max(-1.65, Math.min(1.65, s.x));
  if (Math.abs(s.x) > 0.94 && s.speed > 22) s.speed = Math.max(22, s.speed - 55 * dt);
  const previousDistance = s.distance;
  s.distance = Math.min(RACE_LENGTH, s.distance + s.speed * dt);
  for (const car of s.traffic) {
    const previousZ = car.z; car.z += car.speed * dt;
    const gap = car.z - s.distance;
    const crossed = previousZ >= previousDistance && car.z <= s.distance;
    if (!s.hitCooldown && (Math.abs(gap) < 10 || crossed) && Math.abs(car.x - s.x) < 0.23) {
      s.speed *= 0.42; s.hitCooldown = 1.4; s.flash = 0.4;
      s.message = 'CHOQUE'; s.messageTime = 1;
    }
    if (gap < -12 && !car.passed) { car.passed = true; s.overtakes++; }
    if (gap < -140) { car.z = s.distance + 1300 + random() * 1000;
      car.x = [-0.64, 0, 0.64][Math.floor(random() * 3)]; car.speed = 24 + random() * 12; car.passed = false; }
  }
  while (s.sector < CHECKPOINTS.length && s.distance >= CHECKPOINTS[s.sector]) {
    s.sector++; s.timeLeft += 18; s.message = 'CHECKPOINT +18s'; s.messageTime = 2;
  }
  if (s.distance >= RACE_LENGTH) s.phase = 'won';
  else if (!s.timeLeft) s.phase = 'over';
}
