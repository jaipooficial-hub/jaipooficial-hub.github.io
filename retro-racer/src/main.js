import { drawIntroScreen, drawShape } from "./canvas-view.js";
import { LANES, SEGMENT_LENGTH, FPS, SHAKE_INTENSITY, MAX_SPEED, NITRO_MAX_SPEED, DRAW_DISTANCE } from "./config.js";
import {
  calculateNewPlayerHorizontalPosition,
  calculateNewSpeed,
  getCarImage,
  updateNitro,
  isNitroActive,
  getNitroRemaining,
  getNitroCooldown
} from "./controls.js";
import { createRoadSegments, convertZPositionRoadTo2dCoords } from "./road.js";

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

let segments = createRoadSegments();
let trackLength = segments.length * SEGMENT_LENGTH;
let speed = 0;
let playerHorizontalDistanceFromCenter = 0;

let currentZPosition = 0;
let baseSegment = segments[currentZPosition];

let enemyCars = [];
for (let i = 0; i < 30; i++) {
  enemyCars.push({
    z: Math.random() * trackLength,
    x: (Math.random() * 2.5) - 1.25,
    speed: (MAX_SPEED * 0.4) + Math.random() * (MAX_SPEED * 0.4),
    exploded: false,
    explosionTime: 0
  });
}
let bullets = [];
window.triggerRetroShoot = () => {
  bullets.push({
    z: currentZPosition + 150,
    x: playerHorizontalDistanceFromCenter,
    speed: MAX_SPEED * 3
  });
};

drawIntroScreen();

let gameStarted = false;
window.addEventListener("keydown", startGameEventListener);
window.addEventListener("pointerdown", startGameEventListener);
window.startRetroRacerGame = startGameEventListener;

function startGameEventListener() {
  if (gameStarted) return;
  gameStarted = true;
  window.removeEventListener("keydown", startGameEventListener);
  window.removeEventListener("pointerdown", startGameEventListener);
  playBackgroundMusic();
  setInterval(() => {
    requestAnimationFrame(renderLoop);
  }, 1000 / FPS);
}

function playBackgroundMusic() {
  const music = document.getElementById("music-background");
  if (music) {
    music.volume = 0.2;
    try {
      const p = music.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
  }
}

function renderLoop() {
  // Sky
  context.fillStyle = "#72D7EE";
  context.fillRect(0, 0, canvas.width, canvas.height);
  // TODO render scenery/background

  updateNitro(1 / FPS);
  const nitroActive = isNitroActive();
  const nitroTime = getNitroRemaining();

  playerHorizontalDistanceFromCenter = calculateNewPlayerHorizontalPosition(playerHorizontalDistanceFromCenter, speed);
  speed = calculateNewSpeed(playerHorizontalDistanceFromCenter, speed);

  currentZPosition += speed;
  if (currentZPosition > trackLength) {
    currentZPosition -= trackLength;
  }

  // Update enemies and bullets
  enemyCars.forEach(car => {
    if (!car.exploded) {
      car.z += car.speed;
      if (car.z > trackLength) car.z -= trackLength;
      
      // Collision with player
      let dz = Math.abs(car.z - currentZPosition);
      if (dz > trackLength / 2) dz = trackLength - dz; // wrap around distance
      if (dz < 200 && Math.abs(car.x - playerHorizontalDistanceFromCenter) < 0.4) {
        speed *= 0.5; // Slow down the player
        car.speed = speed * 0.8; // Car also slows down slightly
      }
    } else {
      car.explosionTime += 1 / FPS;
      if (car.explosionTime > 1.5) {
        // Respawn car far away
        car.exploded = false;
        car.explosionTime = 0;
        car.z = currentZPosition + trackLength * 0.8;
        if (car.z > trackLength) car.z -= trackLength;
        car.x = (Math.random() * 2.5) - 1.25;
        car.speed = (MAX_SPEED * 0.4) + Math.random() * (MAX_SPEED * 0.4);
      }
    }
  });

  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.z += b.speed;
    if (b.z > trackLength) b.z -= trackLength;
    
    // Check collisions with cars
    let hit = false;
    for (let j = 0; j < enemyCars.length; j++) {
      let car = enemyCars[j];
      if (car.exploded) continue;
      let dz = Math.abs(car.z - b.z);
      if (dz > trackLength / 2) dz = trackLength - dz;
      if (dz < 300 && Math.abs(car.x - b.x) < 0.4) {
        car.exploded = true;
        car.explosionTime = 0;
        hit = true;
        break;
      }
    }
    
    // Remove bullet if it hits or goes too far
    let bdz = b.z - currentZPosition;
    if (bdz < 0) bdz += trackLength;
    if (hit || bdz > DRAW_DISTANCE * SEGMENT_LENGTH) {
      bullets.splice(i, 1);
    }
  }

  for (let n = 0; n < DRAW_DISTANCE; n++) {
    const segment = segments[(baseSegment.index + n) % segments.length];
    const isLooped = segment.index < baseSegment.index;
    const segment2D_1 = convertZPositionRoadTo2dCoords(
      playerHorizontalDistanceFromCenter,
      segment.z1,
      currentZPosition,
      isLooped,
      trackLength,
    );
    const segment2D_2 = convertZPositionRoadTo2dCoords(
      playerHorizontalDistanceFromCenter,
      segment.z2,
      currentZPosition,
      isLooped,
      trackLength,
    );

    context.fillStyle = segment.grassColor;
    context.fillRect(0, segment2D_2.y, canvas.width, segment2D_1.y - segment2D_2.y);
    const rumbleWidth1 = segment2D_1.w / 6;
    const rumbleWidth2 = segment2D_2.w / 6;

    // left rumble
    drawShape({
      x1: segment2D_1.x - segment2D_1.w - rumbleWidth1,
      y1: segment2D_1.y,
      x2: segment2D_1.x - segment2D_1.w,
      y2: segment2D_1.y,
      x3: segment2D_2.x - segment2D_2.w,
      y3: segment2D_2.y,
      x4: segment2D_2.x - segment2D_2.w - rumbleWidth2,
      y4: segment2D_2.y,
      color: segment.rumbleColor,
    });
    // right rumble
    drawShape({
      x1: segment2D_1.x + segment2D_1.w + rumbleWidth1,
      y1: segment2D_1.y,
      x2: segment2D_1.x + segment2D_1.w,
      y2: segment2D_1.y,
      x3: segment2D_2.x + segment2D_2.w,
      y3: segment2D_2.y,
      x4: segment2D_2.x + segment2D_2.w + rumbleWidth2,
      y4: segment2D_2.y,
      color: segment.rumbleColor,
    });
    // road
    drawShape({
      x1: segment2D_1.x - segment2D_1.w,
      y1: segment2D_1.y,
      x2: segment2D_1.x + segment2D_1.w,
      y2: segment2D_1.y,
      x3: segment2D_2.x + segment2D_2.w,
      y3: segment2D_2.y,
      x4: segment2D_2.x - segment2D_2.w,
      y4: segment2D_2.y,
      color: segment.roadColor,
    });

    if (segment.showLaneStripe) {
      const laneMarkerWidth1 = segment2D_1.w / 32;
      const laneMarkerWidth2 = segment2D_2.w / 32;
      const laneWidth1 = (segment2D_1.w * 2) / LANES;
      const laneWidth2 = (segment2D_2.w * 2) / LANES;
      let laneX1 = segment2D_1.x - segment2D_1.w + laneWidth1;
      let laneX2 = segment2D_2.x - segment2D_2.w + laneWidth2;
      for (let lane = 1; lane < LANES; lane++) {
        // Lane stripe
        drawShape({
          x1: laneX1 - laneMarkerWidth1 / 2,
          y1: segment2D_1.y,
          x2: laneX1 + laneMarkerWidth1 / 2,
          y2: segment2D_1.y,
          x3: laneX2 + laneMarkerWidth2 / 2,
          y3: segment2D_2.y,
          x4: laneX2 - laneMarkerWidth2 / 2,
          y4: segment2D_2.y,
          color: "white",
        });
        laneX1 += laneWidth1;
        laneX2 += laneWidth2;
      }
    }

    baseSegment = segments[Math.floor(currentZPosition / SEGMENT_LENGTH) % segments.length];
    // TODO render fog
  }

  let spritesToDraw = [];
  enemyCars.forEach(car => {
    let dz = car.z - currentZPosition;
    if (dz < 0) dz += trackLength;
    if (dz > 0 && dz < DRAW_DISTANCE * SEGMENT_LENGTH) {
      let isLooped = car.z < currentZPosition;
      let pos2D = convertZPositionRoadTo2dCoords(playerHorizontalDistanceFromCenter, car.z, currentZPosition, isLooped, trackLength);
      spritesToDraw.push({
        type: 'car',
        car: car,
        z: dz,
        x: pos2D.x + car.x * pos2D.w,
        y: pos2D.y,
        w: pos2D.w * 0.6,
      });
    }
  });

  bullets.forEach(b => {
    let dz = b.z - currentZPosition;
    if (dz < 0) dz += trackLength;
    if (dz > 0 && dz < DRAW_DISTANCE * SEGMENT_LENGTH) {
      let isLooped = b.z < currentZPosition;
      let pos2D = convertZPositionRoadTo2dCoords(playerHorizontalDistanceFromCenter, b.z, currentZPosition, isLooped, trackLength);
      spritesToDraw.push({
        type: 'bullet',
        z: dz,
        x: pos2D.x + b.x * pos2D.w,
        y: pos2D.y,
        w: pos2D.w * 0.1,
      });
    }
  });

  spritesToDraw.sort((a, b) => b.z - a.z);

  spritesToDraw.forEach(s => {
    if (s.type === 'car') {
      if (s.car.exploded) {
         context.fillStyle = 'rgba(255, 100, 0, ' + (1 - s.car.explosionTime/1.5) + ')';
         context.beginPath();
         context.arc(s.x, s.y - s.w/2, s.w, 0, Math.PI*2);
         context.fill();
      } else {
         let h = s.w * 0.7;
         context.drawImage(getCarImage(), s.x - s.w/2, s.y - h, s.w, h);
      }
    } else if (s.type === 'bullet') {
      context.fillStyle = '#ffff00';
      context.beginPath();
      context.arc(s.x, s.y - s.w, s.w, 0, Math.PI*2);
      context.fill();
    }
  });

  // Efectos de velocidad y Nitro
  const intensity = nitroActive ? SHAKE_INTENSITY * 2 : SHAKE_INTENSITY;
  const shakeCarX = (speed / MAX_SPEED) * getRandom(-intensity, intensity);
  const shakeCarY = (speed / MAX_SPEED) * getRandom(-intensity, intensity);

  // Líneas de viento / velocidad durante Nitro
  if (nitroActive) {
    context.save();
    context.strokeStyle = "rgba(147, 197, 253, 0.65)";
    context.lineWidth = 2.5;
    for (let i = 0; i < 7; i++) {
      const sx = getRandom(20, canvas.width - 20);
      const sy = getRandom(50, canvas.height - 120);
      const slen = getRandom(30, 90);
      context.beginPath();
      context.moveTo(sx, sy);
      context.lineTo(sx, sy + slen);
      context.stroke();
    }
    context.restore();
  }

  const carX = canvas.width / 2 - 100;
  const carY = canvas.height - 200;

  // Llamas de Nitro detrás del auto (tubos de escape)
  if (nitroActive) {
    context.save();
    const flameFlicker = getRandom(25, 45);
    // Escape izquierdo
    const leftPipeX = canvas.width / 2 - 40;
    const rightPipeX = canvas.width / 2 + 40;
    const pipeY = canvas.height - 40;

    [leftPipeX, rightPipeX].forEach((px) => {
      // Llama exterior naranja/fuego
      const grad = context.createLinearGradient(px, pipeY, px, pipeY + flameFlicker);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      grad.addColorStop(0.3, "rgba(56, 189, 248, 0.9)");
      grad.addColorStop(0.7, "rgba(249, 115, 22, 0.85)");
      grad.addColorStop(1, "rgba(239, 68, 68, 0)");

      context.fillStyle = grad;
      context.beginPath();
      context.moveTo(px - 10, pipeY);
      context.lineTo(px + 10, pipeY);
      context.lineTo(px, pipeY + flameFlicker);
      context.closePath();
      context.fill();
    });
    context.restore();
  }

  // Draw Car
  context.drawImage(getCarImage(), carX, carY, 200 + shakeCarX, 200 + shakeCarY);

  // Draw Distance and Speed indicators
  context.save();
  context.fillStyle = "white";
  context.font = "bold 26px Arial";
  context.shadowColor = "rgba(0,0,0,0.8)";
  context.shadowBlur = 4;
  context.fillText("Speed: " + Math.round(speed), 20, 90);
  context.fillText("Distance: " + Math.round(currentZPosition), 20, 45);

  // HUD Indicator de Nitro
  const cooldownTime = getNitroCooldown();
  if (nitroActive) {
    context.fillStyle = "#f97316";
    context.font = "bold 24px Arial";
    context.fillText("🔥 NITRO BOOST: " + nitroTime.toFixed(1) + "s", 20, 135);

    // Barra de tiempo de nitro
    const barW = 160;
    const fillW = Math.max(0, (nitroTime / 3.0) * barW);
    context.fillStyle = "rgba(0,0,0,0.5)";
    context.fillRect(20, 145, barW, 10);
    context.fillStyle = "#38bdf8";
    context.fillRect(20, 145, fillW, 10);
  } else if (cooldownTime > 0) {
    context.fillStyle = "#ef4444";
    context.font = "bold 20px Arial";
    context.fillText("⏳ COOLDOWN: " + cooldownTime.toFixed(1) + "s", 20, 135);
    
    // Barra de cooldown
    const barW = 160;
    const fillW = Math.max(0, (cooldownTime / 10.0) * barW); // 10s cooldown
    context.fillStyle = "rgba(0,0,0,0.5)";
    context.fillRect(20, 145, barW, 10);
    context.fillStyle = "#ef4444";
    context.fillRect(20, 145, fillW, 10);
  } else {
    context.fillStyle = "#94a3b8";
    context.font = "16px Arial";
    context.fillText("Nitro: [R] / Botón | Shoot: [C] / Botón", 20, 130);
  }
  context.restore();

  // Actualizar botón en la interfaz si existe
  const nitroBtn = document.getElementById("btn-touch-nitro");
  if (nitroBtn) {
    if (nitroActive) {
      nitroBtn.textContent = "🔥 " + nitroTime.toFixed(1) + "s";
      nitroBtn.style.background = "#ea580c";
      nitroBtn.style.borderColor = "#f97316";
      nitroBtn.style.boxShadow = "0 0 12px rgba(249, 115, 22, 0.8)";
    } else if (cooldownTime > 0) {
      nitroBtn.textContent = "⏳ " + cooldownTime.toFixed(1) + "s";
      nitroBtn.style.background = "#52525b"; // gray
      nitroBtn.style.borderColor = "#3f3f46";
      nitroBtn.style.boxShadow = "none";
    } else {
      nitroBtn.textContent = "🔥 NITRO";
      nitroBtn.style.background = "";
      nitroBtn.style.borderColor = "";
      nitroBtn.style.boxShadow = "";
    }
  }
}

/**
 * Helper functions
 */

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}
