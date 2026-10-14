// Quadrilateral drawing from simondiep/retro-racer, made context-independent.
export function drawShape(context, shape) {
  const { x1, y1, x2, y2, x3, y3, x4, y4, color } = shape;
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(Math.round(x1), Math.round(y1));
  context.lineTo(Math.round(x2), Math.round(y2));
  context.lineTo(Math.round(x3), Math.round(y3));
  context.lineTo(Math.round(x4), Math.round(y4));
  context.closePath();
  context.fill();
}
