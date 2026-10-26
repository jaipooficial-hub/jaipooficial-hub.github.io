export const input = { up: false, down: false, left: false, right: false, fire: false };
const keyboard = new Set(), touch = new Map();
const keyMap = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', KeyC: 'fire', Space: 'fire' };
function sync() {
  for (const dir of Object.keys(input)) input[dir] = [...keyboard].some(k => keyMap[k] === dir) || [...touch.values()].includes(dir);
}
export function clearInput() { keyboard.clear(); touch.clear(); sync(); document.querySelectorAll('[data-drive]').forEach(button => button.classList.remove('pressed')); }
export function bindControls(actions) {
  // The embedded game has its own document: desktop selection rules do not
  // reach these controls. Cancel long-press selection without blocking clicks.
  const blockControlSelection = event => {
    if (event.target?.closest?.('button, canvas')) event.preventDefault();
  };
  document.addEventListener('selectstart', blockControlSelection);
  document.addEventListener('contextmenu', blockControlSelection);
  document.addEventListener('keydown', e => {
    if (e.target?.matches?.('input, textarea, select')) return;
    if (keyMap[e.code]) { e.preventDefault(); keyboard.add(e.code); sync(); if (!e.repeat) actions.start(); }
    else if (['KeyR', 'Enter', 'KeyP', 'Escape'].includes(e.code)) {
      e.preventDefault(); if (e.repeat) return;
      if (e.code === 'KeyR') actions.nitro();
      else if (e.code === 'KeyP' || e.code === 'Escape') actions.pause();
      else actions.start();
    }
  });
  document.addEventListener('keyup', e => { if (keyMap[e.code]) { e.preventDefault(); keyboard.delete(e.code); sync(); } });
  const bindHold = (button, dir) => {
    const begin = (id, e) => { e.preventDefault(); touch.set(id, dir); sync(); actions.start(); button.classList.add('pressed'); };
    const end = id => { if (touch.get(id) !== dir) return; touch.delete(id); sync(); button.classList.toggle('pressed', [...touch.values()].includes(dir)); };
    if ('PointerEvent' in window) {
      button.addEventListener('pointerdown', e => { begin(e.pointerId, e); button.setPointerCapture(e.pointerId); });
      for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, e => end(e.pointerId));
    } else {
      button.addEventListener('mousedown', e => begin('mouse', e));
      window.addEventListener('mouseup', () => end('mouse'));
      button.addEventListener('touchstart', e => { for (const t of e.changedTouches) begin(t.identifier, e); }, { passive: false });
      for (const event of ['touchend', 'touchcancel']) button.addEventListener(event, e => { e.preventDefault(); for (const t of e.changedTouches) end(t.identifier); }, { passive: false });
    }
  };
  for (const button of document.querySelectorAll('[data-drive]')) bindHold(button, button.dataset.drive);
  document.getElementById('btn-start').addEventListener('click', actions.start);
  document.getElementById('btn-pause').addEventListener('click', actions.pause);
  const nitro = document.getElementById('btn-touch-nitro');
  // Activate on press so a second finger can boost while holding acceleration.
  if ('PointerEvent' in window) nitro.addEventListener('pointerdown', e => { e.preventDefault(); actions.nitro(); });
  else {
    nitro.addEventListener('mousedown', e => { e.preventDefault(); actions.nitro(); });
    nitro.addEventListener('touchstart', e => { e.preventDefault(); actions.nitro(); }, { passive: false });
    nitro.addEventListener('touchend', e => e.preventDefault(), { passive: false });
  }
  nitro.addEventListener('click', e => { if (e.detail === 0) actions.nitro(); });
  document.getElementById('btn-reload-mini').addEventListener('click', actions.reset);
  document.getElementById('canvas').addEventListener('click', actions.start);
  window.addEventListener('blur', () => { clearInput(); actions.suspend(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInput(); actions.suspend(); } });
}
