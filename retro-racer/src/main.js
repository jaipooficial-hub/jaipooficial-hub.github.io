import { createRace, startRace, pauseRace, activateNitro, stepRace } from './race-model.js';
import { input, bindControls, clearInput } from './arcade-controls.js';
import { drawRace, loadCarSprites } from './arcade-view.js';
const canvas = document.getElementById('canvas'), ctx = canvas.getContext('2d');
const audio = document.getElementById('music-background');
let state = createRace(), lastTime = 0, accumulator = 0, best = 0, assetsReady = false, assetError = '';
try { best = Math.max(0, Number(localStorage.getItem('axbyz-racer-combat-best')) || 0); } catch (_) {}
function music(play) {
  if (!audio) return;
  audio.volume = 0.2;
  if (play) { const promise = audio.play(); if (promise?.catch) promise.catch(() => {}); }
  else audio.pause();
}
function reset() { clearInput(); state = createRace(); accumulator = 0; lastTime = 0; music(false); updateUI(); }
function start() {
  if (!assetsReady || ['racing','countdown'].includes(state.phase)) return;
  if (['won','over'].includes(state.phase)) reset();
  if (state.phase === 'paused') pauseRace(state);
  else startRace(state);
  music(true); updateUI();
}
function pause() { pauseRace(state); clearInput(); accumulator = 0; lastTime = 0; music(state.phase !== 'paused' && state.phase !== 'ready'); updateUI(); }
function suspend() { if (['racing','countdown'].includes(state.phase)) pause(); }
function updateUI() {
  const status = document.getElementById('race-status');
  const descriptions = { ready: assetError || (!assetsReady ? 'Cargando los autos originales…' : 'Llega a la meta. Cada sector da +18 s. El auto acompaña las curvas; tú eliges el carril.'), countdown: 'Preparados. Mantén ACELERAR para salir.', racing: 'C / Espacio: disparar. R: nitro recargable. P: pausa.', paused: 'Partida en pausa. Pulsa Continuar.', won: '¡Meta! '+state.elapsed.toFixed(1)+' s · '+state.overtakes+' adelantamientos · '+state.hits+' blancos.', over: 'Se acabó el tiempo. Pulsa Otra carrera.' };
  if (status.textContent !== descriptions[state.phase]) status.textContent = descriptions[state.phase];
  const startBtn = document.getElementById('btn-start');
  const startLabel = ['won','over'].includes(state.phase) ? 'Otra carrera' : state.phase === 'paused' ? 'Continuar' : state.phase === 'ready' ? 'Jugar' : 'En carrera';
  if (startBtn.textContent !== startLabel) startBtn.textContent = startLabel;
  startBtn.disabled = !assetsReady || ['racing','countdown'].includes(state.phase);
  document.getElementById('btn-pause').disabled = !['racing','countdown','paused'].includes(state.phase);
  document.getElementById('btn-pause').textContent = state.phase === 'paused' ? 'Continuar' : 'Pausa';
  const nitro = document.getElementById('btn-touch-nitro');
  nitro.disabled = state.phase !== 'racing' || state.nitro > 0 || state.nitroCharge < 100;
  const label = state.nitro > 0 ? 'NITRO '+state.nitro.toFixed(1) : state.nitroCharge < 100 ? 'CARGA '+Math.floor(state.nitroCharge)+'%' : 'NITRO [R]';
  if (nitro.textContent !== label) nitro.textContent = label;
  nitro.classList.toggle('boosting', state.nitro > 0);
}
bindControls({ start, pause, reset, suspend, nitro: () => activateNitro(state) });
document.getElementById('btn-audio-toggle').addEventListener('click', () => {
  audio.muted = !audio.muted;
  document.getElementById('btn-audio-toggle').textContent = audio.muted ? 'Sonido: OFF' : 'Sonido: ON';
});
function frame(timestamp) {
  requestAnimationFrame(frame);
  const dt = lastTime ? Math.min(0.2, Math.max(0, (timestamp-lastTime)/1000)) : 0;
  lastTime = timestamp;
  accumulator += dt;
  while (accumulator >= 1/60) { stepRace(state,input,1/60); accumulator -= 1/60; }
  state.steerLeft = input.left; state.steerRight = input.right;
  if (state.phase === 'won' && !state.recordSaved) {
    state.recordSaved = true;
    if (!best || state.elapsed < best) { best = state.elapsed; try { localStorage.setItem('axbyz-racer-combat-best',String(best)); } catch (_) {} }
    music(false);
  } else if (state.phase === 'over') music(false);
  drawRace(ctx,state,best); updateUI();
}
updateUI(); requestAnimationFrame(frame);
loadCarSprites().then(() => { assetsReady = true; updateUI(); }).catch(error => { assetError = error.message; updateUI(); });
