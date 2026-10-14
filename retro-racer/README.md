# Retro Racer — Coast Run

Carrera arcade de 4.8 km con sprites y tipografía de píxeles. Completa tres sectores antes de agotar el tiempo; los dos checkpoints suman 18 segundos cada uno. El tráfico, las curvas y la banquina requieren controlar la velocidad.

- W / flecha arriba: acelerar. S / abajo: frenar.
- A-D / izquierda-derecha: girar.
- R: nitro de 3 segundos, con recarga de 10 segundos.
- P / Escape: pausa. Enter / Espacio: comenzar o continuar.
- Los botones también sirven con mouse y pantalla táctil, incluyendo acelerar y girar simultáneamente.

La simulación usa pasos fijos de 1/60 s. `race-model.js` contiene las reglas sin dependencias de navegador; `arcade-view.js` dibuja a 320x240; `arcade-controls.js` combina teclado y contactos táctiles. `main.js` coordina estados, audio y récord local. Perder foco pausa la partida y libera controles.

Se conservan los recursos originales y los módulos anteriores como referencia; la versión activa carga únicamente los módulos indicados arriba. La música original sigue en `assets/sounds/`.
