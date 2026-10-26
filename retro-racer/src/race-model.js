import { MAX_SPEED, TRAFFIC_COLORS } from './config.js';
import { elevationAt } from './road.js';
export { MAX_SPEED } from './config.js';
export const RACE_LENGTH = 4800;
export const CHECKPOINTS = [1600, 3200];
const LANES = [-0.64, 0, 0.64];
export function createRace(random = Math.random) {
  return { phase: 'ready', resumePhase: 'racing', countdown: 1, speed: 0, x: 0,
    distance: 0, timeLeft: 65, elapsed: 0, sector: 0, overtakes: 0, hits: 0,
    nitro: 0, nitroCharge: 100, hitCooldown: 0, flash: 0, message: '', messageTime: 0,
    shotCooldown: 0, bullets: [], effects: [],
    y: 0, verticalSpeed: 0, airHeight: 0, airborne: false, landingTime: 0, jumps: 0,
    traffic: Array.from({ length: 30 }, (_, i) => ({ z: 80 + i * 52,
      x: LANES[i % 3], speed: 24 + random() * 12, color: i % TRAFFIC_COLORS.length, passed: false, destroyed: false })) };
}
export function startRace(s) { if (s.phase === 'ready') s.phase = 'countdown'; }
export function pauseRace(s) {
  if (s.phase === 'paused') s.phase = s.resumePhase;
  else if (['racing', 'countdown'].includes(s.phase)) { s.resumePhase = s.phase; s.phase = 'paused'; }
}
export function activateNitro(s) {
  if (s.phase !== 'racing' || s.nitro > 0 || s.nitroCharge < 100) return false;
  s.nitro = 3; return true;
}
export function fireShot(s) {
  if (s.phase !== 'racing' || s.shotCooldown > 0) return false;
  s.shotCooldown = 0.24;
  s.bullets.push({ z: s.distance + 3, x: s.x, speed: s.speed + 180, life: 1.6, height: s.airHeight + .6 });
  return true;
}
export function stepJump(s, previousDistance, dt) {
  const ground = elevationAt(s.distance), before = elevationAt(previousDistance);
  s.landingTime = Math.max(0, s.landingTime - dt);
  if (!s.airborne) {
    // Road-relative downforce becomes negative near the crest. Leave the road
    // with the upward velocity of the ramp instead of popping up vertically.
    const requiredForce = 9.8 + before.curvature * s.speed * s.speed;
    if (s.speed >= 45 && before.grade > .005 && requiredForce < 0 && !s.landingTime) {
      s.airborne = true; s.y = before.height;
      s.verticalSpeed = before.grade * s.speed; s.jumps++;
      s.message = 'SALTO'; s.messageTime = .7;
    } else { s.y = ground.height; s.verticalSpeed = ground.grade * s.speed; }
  }
  if (s.airborne) {
    s.y += s.verticalSpeed * dt - 4.9 * dt * dt;
    s.verticalSpeed -= 9.8 * dt;
    if (s.y <= ground.height && s.verticalSpeed <= ground.grade * s.speed) {
      s.y = ground.height; s.verticalSpeed = ground.grade * s.speed;
      s.airborne = false; s.landingTime = .3;
    }
  }
  s.airHeight = Math.max(0, s.y - ground.height);
}
export function stepRace(s, input, dt, random = Math.random) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  dt = Math.min(dt, 0.05);
  if (s.phase === 'countdown') {
    s.countdown = Math.max(0, s.countdown - dt);
    if (s.countdown < 1e-8) { s.countdown = 0; s.phase = 'racing'; }
    return;
  }
  if (s.phase !== 'racing') return;
  s.elapsed += dt; s.timeLeft = Math.max(0, s.timeLeft - dt);
  s.hitCooldown = Math.max(0, s.hitCooldown - dt); s.flash = Math.max(0, s.flash - dt);
  s.messageTime = Math.max(0, s.messageTime - dt);
  s.shotCooldown = Math.max(0, s.shotCooldown - dt);
  const boost = s.nitro > 0;
  if (boost) {
    s.nitro = Math.max(0, s.nitro - dt);
    if (s.nitro < 1e-8) s.nitro = 0;
    s.nitroCharge = s.nitro / 3 * 100;
  } else {
    s.nitroCharge = Math.min(100, s.nitroCharge + 12.5 * dt);
    if (s.nitroCharge > 100 - 1e-8) s.nitroCharge = 100;
  }
  const accel = input.down ? -65 : boost ? 90 : input.up ? 45 : -10;
  s.speed = Math.max(0, Math.min(boost ? MAX_SPEED * 1.75 : Math.max(MAX_SPEED, s.speed - 24 * dt), s.speed + accel * dt));
  const steering = Number(!!input.right) - Number(!!input.left);
  // x is relative to the road, just like traffic and shots. The camera and car
  // follow the track tangent automatically; steering only changes lane offset.
  s.x += steering * Math.min(2.1, s.speed / MAX_SPEED * 1.6) * dt;
  s.x = Math.max(-1.65, Math.min(1.65, s.x));
  if (Math.abs(s.x) > 0.94 && s.speed > 22) s.speed = Math.max(22, s.speed - 55 * dt);
  const previousDistance = s.distance;
  s.distance = Math.min(RACE_LENGTH, s.distance + s.speed * dt);
  stepJump(s, previousDistance, dt);
  for (const car of s.traffic) { car.previousZ = car.z; car.z += car.speed * dt; }
  s.effects = s.effects.filter(effect => (effect.life -= dt) > 0);
  if (input.fire) fireShot(s);
  for (const bullet of s.bullets) {
    const previousZ = bullet.z;
    bullet.z += bullet.speed * dt; bullet.life -= dt;
    // Guided arcade rounds settle towards traffic after firing during a jump.
    bullet.height = Math.max(.6, (bullet.height ?? .6) - 5 * dt);
    // Swept relative collision: even at nitro speed a shot cannot skip a car.
    let target = null, firstHit = Infinity;
    for (const car of s.traffic) {
      if (car.destroyed || bullet.height > 1.5 || Math.abs(car.x - bullet.x) > 0.22) continue;
      const before = car.previousZ - previousZ, after = car.z - bullet.z;
      if (before >= -3 && after <= 3) {
        const hit = Math.max(0, (before - 3) / Math.max(0.001, before - after));
        if (hit < firstHit) { firstHit = hit; target = car; }
      }
    }
    if (target) {
      target.destroyed = true; bullet.life = 0; s.hits++;
      s.effects.push({ x: target.x, z: target.z, life: 0.45 });
    }
  }
  s.bullets = s.bullets.filter(b => b.life > 0 && b.z > s.distance - 5);
  for (const car of s.traffic) {
    const gap = car.z - s.distance;
    const crossed = car.previousZ >= previousDistance && car.z <= s.distance;
    if (!car.destroyed && s.airHeight < 1.2 && !s.hitCooldown && (Math.abs(gap) < 4 || crossed) && Math.abs(car.x - s.x) < 0.32) {
      s.speed *= 0.42; s.hitCooldown = 1.4; s.flash = 0.4;
      s.message = 'CHOQUE'; s.messageTime = 1;
    }
    if (gap < -8 && !car.passed) { car.passed = true; if (!car.destroyed) s.overtakes++; }
    if (gap < -80) {
      // Append behind the final car instead of stacking a new three-car wall.
      car.z = Math.max(s.distance + 600, ...s.traffic.map(other => other.z)) + 36 + random() * 24;
      car.x = LANES[Math.floor(random() * 3)]; car.speed = 24 + random() * 12;
      car.passed = false; car.destroyed = false;
    }
  }
  while (s.sector < CHECKPOINTS.length && s.distance >= CHECKPOINTS[s.sector]) {
    s.sector++; s.timeLeft += 18; s.message = 'CHECKPOINT +18s'; s.messageTime = 2;
  }
  if (s.distance >= RACE_LENGTH) s.phase = 'won';
  else if (!s.timeLeft) s.phase = 'over';
}
