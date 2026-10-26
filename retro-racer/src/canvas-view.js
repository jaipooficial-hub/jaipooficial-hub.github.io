// Quadrilateral drawing from simondiep/retro-racer, made context-independent.
export function drawShape(context, shape) {
  const { x1, y1, x2, y2, x3, y3, x4, y4, color } = shape;
  context.fillStyle = color;
  // Road trapezoids have horizontal top/bottom edges. Rasterize scanlines on
  // the native pixel grid so diagonal edges never acquire antialiasing fringes.
  const top=Math.round(y3),bottom=Math.round(y1);
  for(let y=Math.max(0,top);y<Math.min(240,bottom);y++) {
    const t=(y+.5-y3)/Math.max(.001,y1-y3);
    const left=Math.round(x4+(x1-x4)*t),right=Math.round(x3+(x2-x3)*t);
    context.fillRect(left,y,Math.max(0,right-left),1);
  }
}
