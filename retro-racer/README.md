# Retro Racer — AxByZ OS

Adaptación de https://github.com/simondiep/retro-racer, revisión
07d6a46b27b9f5aa448ab807a45b60a55380fb0b. Conserva
la música, la carretera segmentada, la proyección pseudo-3D y los colores de
césped/asfalto. `road.js` y `canvas-view.js` adaptan el código del repositorio.
El bucle original se sustituye por una simulación fija de 60 pasos por segundo.

## Controles y reglas

- Flechas / WASD: acelerar, frenar y cambiar de carril.
- C / Espacio o FUEGO: mantener para disparar (munición ilimitada).
- R / NITRO: turbo de 3 s; recarga automática completa en 8 s, con barra visible.
- P / Escape: pausa. Enter: iniciar / continuar. Reiniciar: nueva carrera.
- Botones con pulsación sostenida, multitáctil y captura de puntero.
- Máximo normal de 250 km/h y de 380 km/h con nitro. Aceleración de 0–250 km/h
  en unos 0.8 s y de 250–380 km/h en 0.25 s; frenado reforzado. El límite
  normal vuelve a aplicarse al terminar el nitro. Salida de 1 s, 30 autos y colisiones.
- Tres sectores, 4.8 km; cada checkpoint añade 18 s. Récord local de esta variante.
- Pausa automática al perder foco u ocultar la página.
- Seis elevaciones suaves. A partir de 162 km/h puede despegar en las crestas;
  el salto depende de la curvatura y de la velocidad, con gravedad y aterrizaje.
  La sombra permanece en la pista. Con suficiente altura puedes pasar sobre autos.

## Sprites

Lámina aportada por el usuario: Ferrari de OutRun (Master System / SEGA), rip de
Yawackhary. Se editó el fondo con la herramienta integrada ImageGen y se guardó
el PNG con alfa en `assets/images/outrun-transparent.png`. El original permanece
intacto en los adjuntos. Especificación/prompt de edición en
`assets/images/outrun-edit-prompt.txt`.

`car-sprites.js` recorta las vistas traseras y de giro, alinea los neumáticos y
aplica la paleta al cargar: negro exclusivo para todas las vistas del jugador;
rojo, amarillo, azul, verde, violeta, naranja, blanco y cian para el tráfico.
Se conservan transparencias, pasajeros, neumáticos, parabrisas y cromados.

## Geometría

`roadAt(z)` devuelve el centro, la tangente y la curvatura de una carretera con
rectas y siete giros con entrada/salida cosenoidal. La proyección resta el centro
y la tangente en la posición del jugador; esto evita el desplazamiento lateral
erróneo después de los giros. Jugador, rivales y proyectiles comparten coordenadas
relativas al mismo camino. La conducción asistida acompaña las curvas y el
jugador controla el carril. El sprite de giro usa la curvatura real y la dirección
pulsada. Los disparos siguen el carril, comprueban el tramo recorrido contra el
movimiento de cada auto e impactan únicamente en el primer objetivo.

`elevationAt(z)` usa seis lomos seno a la cuarta potencia, con altura, pendiente
y curvatura continuas al entrar/salir. La proyección utiliza esa misma elevación.
La visibilidad se calcula desde cerca hacia el horizonte; las cimas ocultan
carretera y objetos lejanos. El jugador despega cuando la aceleración descendente
que exige la cresta supera la gravedad y aterriza al volver a tocar el terreno.

## Módulos activos y verificación

`config.js`, `road.js`, `canvas-view.js`, `race-model.js`, `arcade-view.js`,
`arcade-controls.js`, `car-sprites.js` y `main.js`. `controls.js` permanece como referencia histórica
sin importarse. Los recursos se cargan desde `/retro-racer/`.

Desde la raíz de AxByZ OS: `node tools/test-retro-racer.mjs` y `npm run build`.
Las pruebas cubren continuidad y dirección de curvas, alineación de carriles,
aceleración, tráfico, impactos, recarga, pausa, reinicio, seis elevaciones a tres
velocidades y una carrera completa. `tools/check-retro-racer-render.mjs` comprueba
alfa, paletas y renderiza el juego con Canvas (requiere `@napi-rs/canvas` y `pngjs`;
admite como argumento la ruta de sus node_modules).

## Créditos

- Juego base: simondiep / Retro Racer (paquete original declarado MIT).
- Sprites activos: OutRun / SEGA, rip Yawackhary, lámina aportada por el usuario.
- Idea original: Jake Gordon, https://codeincomplete.com/posts/javascript-racer/
- Música: Josh Penn-Pierson, https://github.com/OpenSourceMusic/The-Chip-Life
- Integración, curvas, tráfico, combate y controles táctiles: AxByZ OS.
