import { RACE_LENGTH } from './race-model.js';
import { SEGMENT_LENGTH, DRAW_DISTANCE, HORIZON } from './config.js';
import { createRoadSegments, convertZPositionRoadTo2dCoords, carTurn, roadAt } from './road.js';
import { drawShape } from './canvas-view.js';
const FONT = {
 A:[14,17,17,31,17,17,17],B:[30,17,17,30,17,17,30],C:[14,17,16,16,16,17,14],D:[30,17,17,17,17,17,30],E:[31,16,16,30,16,16,31],F:[31,16,16,30,16,16,16],G:[14,17,16,23,17,17,15],H:[17,17,17,31,17,17,17],I:[31,4,4,4,4,4,31],J:[7,2,2,2,18,18,12],K:[17,18,20,24,20,18,17],L:[16,16,16,16,16,16,31],M:[17,27,21,21,17,17,17],N:[17,25,21,19,17,17,17],O:[14,17,17,17,17,17,14],P:[30,17,17,30,16,16,16],Q:[14,17,17,17,21,18,13],R:[30,17,17,30,20,18,17],S:[15,16,16,14,1,1,30],T:[31,4,4,4,4,4,4],U:[17,17,17,17,17,17,14],V:[17,17,17,17,17,10,4],W:[17,17,17,21,21,21,10],X:[17,17,10,4,10,17,17],Y:[17,17,10,4,4,4,4],Z:[31,1,2,4,8,16,31],
 '0':[14,17,19,21,25,17,14],'1':[4,12,4,4,4,4,14],'2':[14,17,1,2,4,8,31],'3':[30,1,1,14,1,1,30],'4':[2,6,10,18,31,2,2],'5':[31,16,16,30,1,1,30],'6':[14,16,16,30,17,17,14],'7':[31,1,2,4,8,8,8],'8':[14,17,17,14,17,17,14],'9':[14,17,17,15,1,1,14],
 ':':[0,4,4,0,4,4,0],'.':[0,0,0,0,0,4,4],'/':[1,2,2,4,8,8,16],'-':[0,0,0,31,0,0,0],'+':[0,4,4,31,4,4,0]
};
export function pixelText(ctx, text, x, y, color = '#f8f8e8', scale = 1) {
  text = String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  ctx.fillStyle = color;
  for (let i = 0; i < text.length; i++) for (let row = 0; row < 7; row++) {
    const bits = (FONT[text[i]] || [])[row] || 0;
    for (let col = 0; col < 5; col++) if (bits & (1 << (4 - col))) ctx.fillRect(Math.round(x + (i * 6 + col) * scale), Math.round(y + row * scale), scale, scale);
  }
}
const segments = createRoadSegments();
const sprites = {};
export async function loadCarSprites() {
  await Promise.all(['car', 'car_turn_left', 'car_turn_right'].map(name => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { sprites[name] = img; resolve(); };
    img.onerror = () => reject(new Error('No se pudo cargar el auto. Recarga la página.'));
    img.src = '/retro-racer/assets/images/' + name + '.png';
  })));
  // Keep the upstream sprite geometry; tint only body-red pixels for traffic.
  sprites.traffic = ['#f0c030','#38a8e0','#b870d8','#e0e0d0'].map(color => {
    const img = sprites.car, tile = document.createElement('canvas');
    tile.width = img.width; tile.height = img.height;
    const c = tile.getContext('2d'); c.drawImage(img,0,0);
    const data = c.getImageData(0,0,tile.width,tile.height);
    const rgb = color.match(/\w\w/g).map(h => parseInt(h,16));
    for(let i=0;i<data.data.length;i+=4) {
      const [r,g,b,a] = data.data.subarray(i,i+4);
      if(a && r>100 && r>g*1.4 && r>b*1.3) {
        const light=r/255;
        for(let channel=0;channel<3;channel++) data.data[i+channel]=rgb[channel]*light;
      }
    }
    c.putImageData(data,0,0); return tile;
  });
}
function quad(ctx,color,far,near,left,right) {
  drawShape(ctx,{x1:near.x+near.w*left,y1:Math.ceil(near.y),x2:near.x+near.w*right,y2:Math.ceil(near.y),
    x3:far.x+far.w*right,y3:Math.floor(far.y),x4:far.x+far.w*left,y4:Math.floor(far.y),color});
}
const project = (s,z,x=0) => convertZPositionRoadTo2dCoords(s.x,z,s.distance,320,x);
function drawCar(ctx,sprite,x,y,w) {
  if (!sprite) return;
  // Upstream sprites include transparent sky above the car. Crop that margin
  // consistently for player and rivals so their road contact is identical.
  ctx.drawImage(sprite,0,45,100,55,Math.round(x-w/2),Math.round(y-w*.55),Math.round(w),Math.round(w*.55));
}
export function drawRace(ctx,s,best) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle='#72D7EE'; ctx.fillRect(0,0,320,240);
  const horizonShift = -roadAt(s.distance).heading * 80;
  ctx.fillStyle='#fffbbc'; ctx.fillRect(234+horizonShift,41,24,24);
  ctx.fillStyle='#dbfaff';
  for(const x of [30,132,280]) {ctx.fillRect(x+horizonShift,47,32,7);ctx.fillRect(x+8+horizonShift,42,17,5);}
  ctx.fillStyle='#4b9548';ctx.fillRect(0,HORIZON-4,320,8);
  ctx.fillStyle='#009A00';ctx.fillRect(0,HORIZON,320,240-HORIZON);
  const base = Math.floor(s.distance / SEGMENT_LENGTH);
  // Same segmented road, rumble strips and three-lane projection as upstream.
  for(let n=base+DRAW_DISTANCE;n>=base;n--) {
    const segment=segments[n]; if(!segment)continue;
    const near=project(s,segment.z1),far=project(s,segment.z2);
    if(!near||!far||far.y>240)continue;
    ctx.fillStyle=segment.grassColor;ctx.fillRect(0,Math.floor(far.y),320,Math.ceil(near.y)-Math.floor(far.y)+1);
    quad(ctx,segment.rumbleColor,far,near,-1.14,1.14);
    quad(ctx,segment.roadColor,far,near,-1,1);
    if(segment.showLaneStripe)for(const lane of [-1/3,1/3])quad(ctx,'#fff',far,near,lane-.012,lane+.012);
  }
  const objects=[];
  for(let i=0;i<12;i++) {
    const z=(Math.floor(s.distance/40)+i+1)*40;
    objects.push({z,x:-1.25,post:true},{z,x:1.25,post:true});
  }
  for(const car of s.traffic) if(!car.destroyed&&car.z>s.distance-2&&car.z<s.distance+500)objects.push(car);
  for(const bullet of s.bullets) objects.push({...bullet,bullet:true});
  for(const effect of s.effects) if(effect.z>s.distance-2)objects.push({...effect,effect:true});
  objects.sort((a,b)=>b.z-a.z);
  for(const obj of objects) {
    const p=project(s,obj.z,obj.x);
    if(!p||p.y<HORIZON||p.y>265||p.x<-150||p.x>470)continue;
    if(obj.post) {
      const w=Math.max(1,Math.round(p.w*.02)),h=Math.max(2,Math.round(p.w*.11));
      ctx.fillStyle='#ddd';ctx.fillRect(Math.round(p.x),Math.round(p.y-h),w,h);
      ctx.fillStyle='#d84838';ctx.fillRect(Math.round(p.x),Math.round(p.y-h),w,Math.ceil(h/3));
    } else if(obj.bullet) {
      const w=Math.max(2,Math.round(p.w*.045)),h=Math.max(4,Math.round(p.w*.12));
      ctx.fillStyle='#ffec48';ctx.fillRect(Math.round(p.x-w/2),Math.round(p.y-h-3),w,h);
      ctx.fillStyle='#fff';ctx.fillRect(Math.round(p.x),Math.round(p.y-h-3),Math.max(1,w/2),h/2);
    } else if(obj.effect) {
      const size=Math.max(6,Math.round(p.w*.38*(1.5-obj.life)));
      ctx.fillStyle='#ff7828';ctx.fillRect(Math.round(p.x-size/2),Math.round(p.y-size),size,size);
      ctx.fillStyle='#fff050';ctx.fillRect(Math.round(p.x-size/4),Math.round(p.y-size*.75),size/2,size/2);
    } else drawCar(ctx,sprites.traffic?.[obj.color],p.x,p.y,Math.max(3,p.w*.42));
  }
  const contact=project(s,s.distance,s.x);
  if(s.flash<=0||Math.floor(s.flash*16)%2===0) {
    const turn=carTurn(s,Number(!!s.steerRight)-Number(!!s.steerLeft));
    const img=turn<-.1?sprites.car_turn_left:turn>.1?sprites.car_turn_right:sprites.car;
    drawCar(ctx,img,160,contact.y,contact.w*.42);
    if(s.nitro>0) {
      ctx.fillStyle='#ff7828';ctx.fillRect(141,232,6,8);ctx.fillRect(173,232,6,8);
      ctx.fillStyle='#fff050';ctx.fillRect(143,232,2,5);ctx.fillRect(175,232,2,5);
    }
  }
  ctx.fillStyle='#101820';ctx.fillRect(0,0,320,24);
  pixelText(ctx,'TIME '+Math.ceil(s.timeLeft).toString().padStart(2,'0'),8,4,s.timeLeft<15?'#ff7858':'#fffbbc');
  pixelText(ctx,'SECTOR '+Math.min(3,s.sector+1)+'/3',112,4);
  pixelText(ctx,Math.round(s.speed*3.6).toString().padStart(3,'0')+' KM/H',246,4);
  pixelText(ctx,'META '+(Math.ceil((RACE_LENGTH-s.distance)/10)/100).toFixed(2),8,15,'#72D7EE');
  pixelText(ctx,'PASES '+s.overtakes,110,15,'#72D7EE');
  pixelText(ctx,'BLANCOS '+s.hits,220,15,'#fffbbc');
  ctx.fillStyle='#101820';ctx.fillRect(5,214,90,24);
  pixelText(ctx,s.nitro>0?'NITRO ACTIVO':'NITRO '+Math.floor(s.nitroCharge),9,218,'#fffbbc');
  ctx.fillStyle='#404850';ctx.fillRect(9,229,80,5);
  ctx.fillStyle=s.nitro>0?'#ff7828':s.nitroCharge>=100?'#70e060':'#f0c030';ctx.fillRect(9,229,Math.floor(s.nitroCharge*.8),5);
  if(s.messageTime>0){ctx.fillStyle='#101820';ctx.fillRect(85,33,150,17);pixelText(ctx,s.message,92,38,'#fffbbc');}
  if(s.phase!=='racing') {
    ctx.fillStyle='#101820';ctx.fillRect(18,96,284,85);ctx.fillStyle='#fffbbc';ctx.fillRect(20,98,280,2);
    const title={ready:'RETRO RACER',paused:'PAUSA',won:'META ALCANZADA',over:'TIEMPO AGOTADO',countdown:String(Math.max(1,Math.ceil(s.countdown)))}[s.phase];
    pixelText(ctx,title,(320-title.length*12)/2,110,'#fffbbc',2);
    const line=s.phase==='ready'?'4.8 KM / 3 SECTORES':s.phase==='won'?'TIEMPO '+s.elapsed.toFixed(1)+' S':s.phase==='over'?'REINTENTA LA CARRERA':s.phase==='paused'?'P O CONTINUAR':'PREPARATE';
    pixelText(ctx,line,(320-line.length*6)/2,137);
    const hint=s.phase==='ready'?'C: DISPARAR / R: NITRO':s.phase==='won'&&best?'RECORD '+best.toFixed(1)+' S':'ENTER / BOTON JUGAR';
    pixelText(ctx,hint,(320-hint.length*6)/2,154,'#72D7EE');
  }
}
