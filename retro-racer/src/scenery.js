// Hand-authored pixel art. Each character is one native pixel; scenery sprites
// use small/medium/full drawings and integer enlargement, never stretched axes.
const PALETTE = { d:'#234c3b',g:'#39764a',l:'#69a753',h:'#a1c569',
  t:'#674c3e',b:'#936e49',s:'#b5c5b6',w:'#f2edd4',c:'#d0e6db' };
const TREE = [
  '.......dd.......','......dggd......','.....dglggd.....',
  '.....dglggd.....','....dglhlggd....','...dglhllgggd...',
  '...dgllglgggd...','..dglhllgggggd..','...dglglgggd....',
  '..dglhllglggd...','.dglhllglggggd..','.dgllglggggggd..',
  '..dglglgggggd...','.dglhllglggggd..','dglhlllglggggggd',
  'dgllglgggggggggd','.ddddddttddddd..','.......tb.......',
  '.......tb.......','.......tb.......','.......tb.......',
  '......dttd......','....dddddddd....'
];
const SMALL_TREE = ['...dd...','..dggd..','..dglgd.','.dglggd.',
  '..dggd..','.dglggd.','dglggggd','.ddttdd.','...tb...','...tb...','..dddd..'];
const TINY_TREE = ['.g.','glg','ggg','.t.','.t.'];
const CLOUD = ['.....wwww..........','...wwwwwwww........','..wwwwwwwwww..ww...',
  '.wwwwwwwwwwwwwwww..','wwwwwwwwwwwwwwwwww.','.cccccccccccccccc..','...cccccccccccc....'];

export function drawPixelSprite(ctx, rows, x, y, scale=1) {
  scale=Math.max(1,Math.round(scale));x=Math.round(x);y=Math.round(y);
  for(let row=0;row<rows.length;row++)for(let col=0;col<rows[row].length;col++) {
    const color=PALETTE[rows[row][col]];if(!color)continue;
    ctx.fillStyle=color;ctx.fillRect(x+col*scale,y+row*scale,scale,scale);
  }
}

export function drawLandscape(ctx, heading) {
  ctx.fillStyle='#69b5cf';ctx.fillRect(0,0,320,240);
  ctx.fillStyle='#82c9d9';ctx.fillRect(0,47,320,22);
  ctx.fillStyle='#a5d8d9';ctx.fillRect(0,69,320,23);
  const shift=Math.round(-heading*45);
  // Stepped circular sun, without filtered gradients or antialiased curves.
  ctx.fillStyle='#f6dda0';
  const sun=[10,16,20,22,24,24,24,24,22,20,16,10];
  sun.forEach((width,row)=>ctx.fillRect(252+shift-Math.floor(width/2),34+row*2,width,2));
  for(const [x,y] of [[26,39],[105,54],[193,31],[288,60]])drawPixelSprite(ctx,CLOUD,x+shift,y);
  // Native one-pixel columns produce crisp stair-step mountain silhouettes.
  for(let x=0;x<320;x++) {
    const world=x-shift*.45;
    const ridge=Math.round(70+Math.sin(world*.025)*10+Math.sin(world*.067)*5);
    ctx.fillStyle='#739da1';ctx.fillRect(x,ridge,1,92-ridge);
    if(Math.sin(world*.067)>.2){ctx.fillStyle='#88afb0';ctx.fillRect(x,ridge,1,4);}
    const near=Math.round(83+Math.sin((x-shift*.75)*.038)*5+Math.sin(x*.11)*2);
    ctx.fillStyle='#4e8073';ctx.fillRect(x,near,1,94-near);
    if(x%7<2){ctx.fillStyle='#659481';ctx.fillRect(x,near+2,1,2);}
  }
  ctx.fillStyle='#4f8e3b';ctx.fillRect(0,92,320,148);
}

export function drawRoadsideTree(ctx, p) {
  const height=p.scale*4.2;
  const rows=height<10?TINY_TREE:height<24?SMALL_TREE:TREE;
  const scale=Math.max(1,Math.min(5,Math.round(height/rows.length)));
  const width=rows[0].length*scale;
  ctx.fillStyle='#3c7139';ctx.fillRect(Math.round(p.x-width*.4),Math.round(p.y-1),Math.round(width*.8),2);
  drawPixelSprite(ctx,rows,p.x-width/2,p.y-rows.length*scale,scale);
}

export function drawGroundDetail(ctx, state, segment, project) {
  // World-anchored tufts and stones: no random per-frame noise or texture stretch.
  for(let i=0;i<6;i++)for(const side of [-1,1]) {
    const p=project(state,segment.z1+2,side*(1.3+i*.68));
    if(!p||p.scale<1||p.x<0||p.x>319||p.y<94||p.y>240)continue;
    const x=Math.round(p.x),y=Math.round(p.y),size=p.scale>5?2:1;
    ctx.fillStyle=(segment.index+i)%3?'#79a64d':'#a5b767';
    ctx.fillRect(x,y-size,size,size);ctx.fillRect(x-size,y,size*3,1);
  }
  for(let i=0;i<3;i++) {
    const lane=(((segment.index*17+i*31)%101)/100-.5)*1.7;
    const p=project(state,segment.z1+3,lane);
    if(!p||p.scale<2||p.y<94||p.y>240||p.x<0||p.x>319)continue;
    ctx.fillStyle='#606b72';ctx.fillRect(Math.round(p.x),Math.round(p.y),p.scale>7?2:1,1);
  }
}
