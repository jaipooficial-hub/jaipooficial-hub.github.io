# Retro Racer — AxByZ OS

Adaptación de https://github.com/simondiep/retro-racer, revisión
07d6a46b27b9f5aa448ab807a45b60a55380fb0b. Conserva los tres sprites originales,
la música, la carretera segmentada, la proyección pseudo-3D y los colores de
césped/asfalto. `road.js` y `canvas-view.js` adaptan el código del repositorio.
El bucle original se sustituye por una simulación fija de 60 pasos por segundo.

## Controles y reglas

- Flechas / WASD: acelerar, frenar y cambiar de carril.
- C / Espacio o FUEGO: mantener para disparar (munición ilimitada).
- R / NITRO: turbo de 3 s; recarga automática completa en 8 s, con barra visible.
- P / Escape: pausa. Enter: iniciar / continuar. Reiniciar: nueva carrera.
- Botones con pulsación sostenida, multitáctil y captura de puntero.
- Aceleración rápida (0–216 km/h en 1.33 s), salida de 1 s, 30 autos y colisiones.
- Tres sectores, 4.8 km; cada checkpoint añade 18 s. Récord local de esta variante.
- Pausa automática al perder foco u ocultar la página.

## Geometría

`roadAt(z)` devuelve el centro, la tangente y la curvatura de una carretera con
rectas y siete giros con entrada/salida cosenoidal. La proyección resta el centro
y la tangente en la posición del jugador; esto evita el desplazamiento lateral
erróneo después de los giros. Jugador, rivales y proyectiles comparten coordenadas
relativas al mismo camino. La conducción asistida acompaña las curvas y el
jugador controla el carril. El sprite de giro usa la curvatura real y la dirección
pulsada. Los disparos siguen el carril, comprueban el tramo recorrido contra el
movimiento de cada auto e impactan únicamente en el primer objetivo.

## Módulos activos y verificación

`config.js`, `road.js`, `canvas-view.js`, `race-model.js`, `arcade-view.js`,
`arcade-controls.js` y `main.js`. `controls.js` permanece como referencia histórica
sin importarse. Los recursos se cargan desde `/retro-racer/`.

Desde la raíz de AxByZ OS: `node tools/test-retro-racer.mjs` y `npm run build`.
Las pruebas cubren continuidad y dirección de curvas, alineación de carriles,
aceleración, tráfico, impactos, recarga, pausa, reinicio y una carrera completa.

## Créditos

- Juego base y sprites: simondiep / Retro Racer (paquete original declarado MIT).
- Idea original: Jake Gordon, https://codeincomplete.com/posts/javascript-racer/
- Música: Josh Penn-Pierson, https://github.com/OpenSourceMusic/The-Chip-Life
- Integración, curvas, tráfico, combate y controles táctiles: AxByZ OS.
