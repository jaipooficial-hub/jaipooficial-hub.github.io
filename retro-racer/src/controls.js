import {
  FPS,
  MAX_SPEED,
  ACCEL_SPEED,
  BREAKING_SPEED,
  DECEL_SPEED,
  OFFROAD_DECEL_SPEED,
  OFFROAD_MAX_SPEED,
  NITRO_DURATION,
  NITRO_MAX_SPEED,
  NITRO_ACCEL_SPEED,
} from "./config.js";

const KEY_PRESSED = {
  UP: false,
  DOWN: false,
  LEFT: false,
  RIGHT: false,
  SHOOT: false,
};

let nitroRemaining = 0; // segundos restantes de nitro
let nitroCooldownRemaining = 0; // cooldown
const NITRO_COOLDOWN = 10.0; // 10 seconds cooldown

export function activateNitro() {
  if (nitroRemaining <= 0 && nitroCooldownRemaining <= 0) {
    nitroRemaining = NITRO_DURATION;
  }
}

export function isNitroActive() {
  return nitroRemaining > 0;
}

export function getNitroRemaining() {
  return nitroRemaining;
}

export function getNitroCooldown() {
  return nitroCooldownRemaining;
}

export function updateNitro(dt) {
  if (nitroRemaining > 0) {
    nitroRemaining -= dt;
    if (nitroRemaining <= 0) {
      nitroRemaining = 0;
      nitroCooldownRemaining = NITRO_COOLDOWN; // Start cooldown
    }
  } else if (nitroCooldownRemaining > 0) {
    nitroCooldownRemaining -= dt;
    if (nitroCooldownRemaining <= 0) nitroCooldownRemaining = 0;
  }
}

window.triggerRetroNitro = activateNitro;
window.isRetroNitroActive = isNitroActive;
window.getRetroNitroTime = getNitroRemaining;
window.getRetroNitroCooldown = getNitroCooldown;

export function getCarImage() {
  if (KEY_PRESSED.LEFT) {
    return carTurnLeftImage;
  } else if (KEY_PRESSED.RIGHT) {
    return carTurnRightImage;
  }
  return carImage;
}

export function calculateNewPlayerHorizontalPosition(currentXPos, speed) {
  let newXPos = currentXPos;
  const dx = (1 / FPS) * 2 * (speed / MAX_SPEED);
  if (KEY_PRESSED.LEFT) {
    newXPos = newXPos - dx;
  } else if (KEY_PRESSED.RIGHT) {
    newXPos = newXPos + dx;
  }

  // Limit how far in each direction you can be
  if (newXPos > 2) {
    newXPos = 2;
  } else if (newXPos < -2) {
    newXPos = -2;
  }
  return newXPos;
}

export function calculateNewSpeed(currentXPos, currentSpeed) {
  let newSpeed = currentSpeed;
  const isNitro = nitroRemaining > 0;
  const effectiveMaxSpeed = isNitro ? NITRO_MAX_SPEED : MAX_SPEED;

  if (isNitro) {
    // Aceleración explosiva continua de nitro
    newSpeed = newSpeed + NITRO_ACCEL_SPEED / FPS;
  } else if (KEY_PRESSED.UP) {
    if (newSpeed > MAX_SPEED) {
      // Desaceleración suave post-nitro hacia la velocidad estándar
      newSpeed = newSpeed + DECEL_SPEED / FPS;
    } else {
      newSpeed = newSpeed + ACCEL_SPEED / FPS;
    }
  } else if (KEY_PRESSED.DOWN) {
    newSpeed = newSpeed + BREAKING_SPEED / FPS;
  } else {
    // Si terminó el nitro y vamos por encima del máximo, desacelera rápidamente
    if (newSpeed > MAX_SPEED) {
      newSpeed = newSpeed + (DECEL_SPEED * 2) / FPS;
    } else {
      newSpeed = newSpeed + DECEL_SPEED / FPS;
    }
  }

  // Fuera de pista (Offroad)
  const isOffroad = currentXPos < -1 || currentXPos > 1;
  const offroadMax = isNitro ? OFFROAD_MAX_SPEED * 1.8 : OFFROAD_MAX_SPEED;
  if (isOffroad && newSpeed > offroadMax) {
    newSpeed = newSpeed + OFFROAD_DECEL_SPEED / FPS;
  }

  if (newSpeed < 0) {
    newSpeed = 0;
  } else if (newSpeed > effectiveMaxSpeed) {
    newSpeed = effectiveMaxSpeed;
  }
  return newSpeed;
}

export function setKey(direction, pressed) {
  if (direction in KEY_PRESSED) {
    KEY_PRESSED[direction] = !!pressed;
  }
}
window.setRetroKey = setKey;
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

function keyDownHandler(event) {
  switch (event.keyCode) {
    case 37: // ArrowLeft
    case 65: // A
      KEY_PRESSED.LEFT = true;
      break;
    case 39: // ArrowRight
    case 68: // D
      KEY_PRESSED.RIGHT = true;
      break;
    case 40: // ArrowDown
    case 83: // S
      KEY_PRESSED.DOWN = true;
      break;
    case 38: // ArrowUp
    case 87: // W
      KEY_PRESSED.UP = true;
      break;
    case 82: // R (Nitro)
      activateNitro();
      break;
    case 67: // C (Shoot)
      if (window.triggerRetroShoot) window.triggerRetroShoot();
      break;
  }
}

function keyUpHandler(event) {
  switch (event.keyCode) {
    case 37: // ArrowLeft
    case 65: // A
      KEY_PRESSED.LEFT = false;
      break;
    case 39: // ArrowRight
    case 68: // D
      KEY_PRESSED.RIGHT = false;
      break;
    case 40: // ArrowDown
    case 83: // S
      KEY_PRESSED.DOWN = false;
      break;
    case 38: // ArrowUp
    case 87: // W
      KEY_PRESSED.UP = false;
      break;
  }
}
