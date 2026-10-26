import { RACE_LENGTH } from './race-model.js';
import { SEGMENT_LENGTH, DRAW_DISTANCE, HORIZON } from './config.js';
import { createRoadSegments, convertZPositionRoadTo2dCoords, roadAt } from './road.js';
import { drawShape } from './canvas-view.js';
import { loadCarSheet, drawCarSprite, playerSprite } from './car-sprites.js';
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
let sprites = { player: {}, traffic: [], baseWidth: 1 };
export async function loadCarSprites() { sprites = await loadCarSheet(); }
function quad(ctx,color,far,near,left,right) {
  drawShape(ctx,{x1:near.x+near.w*left,y1:Math.ceil(near.y),x2:near.x+near.w*right,y2:Math.ceil(near.y),
    x3:far.x+far.w*right,y3:Math.floor(far.y),x4:far.x+far.w*left,y4:Math.floor(far.y),color});
}
const project = (s,z,x=0) => convertZPositionRoadTo2dCoords(s.x,z,s.distance,320,x);
function drawCar(ctx, sprite, x, y, w) {
  drawCarSprite(ctx, sprite, x, y, w, sprites.baseWidth);
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
  const visible = [], occlusion = new Map();
  let clipY = 240;
  // Determine visibility near-to-far: a crest hides the descending road and
  // cars behind it. Then paint back-to-front using those saved clipping lines.
  for(let n=base;n<=base+DRAW_DISTANCE;n++) {
    const segment=segments[n]; if(!segment)continue;
    const near=project(s,segment.z1),far=project(s,segment.z2);
    occlusion.set(n, clipY);
    if(!near||!far||far.y>=clipY||near.y<=far.y)continue;
    visible.push({segment,near,far,clip:clipY});
    clipY=Math.min(clipY,far.y);
  }
  for(let i=visible.length-1;i>=0;i--) {
    const {segment,near,far,clip}=visible[i];
    ctx.save();ctx.beginPath();ctx.rect(0,0,320,Math.ceil(clip));ctx.clip();
    ctx.fillStyle=segment.grassColor;ctx.fillRect(0,Math.floor(far.y),320,Math.ceil(near.y)-Math.floor(far.y)+1);
    quad(ctx,segment.rumbleColor,far,near,-1.14,1.14);
    quad(ctx,segment.roadColor,far,near,-1,1);
    if(segment.showLaneStripe)for(const lane of [-1/3,1/3])quad(ctx,'#fff',far,near,lane-.012,lane+.012);
    ctx.restore();
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
    const limit=occlusion.get(Math.floor(obj.z/SEGMENT_LENGTH))??240;
    ctx.save();ctx.beginPath();ctx.rect(0,0,320,Math.ceil(limit));ctx.clip();
    if(obj.post) {
      const w=Math.max(1,Math.round(p.w*.02)),h=Math.max(2,Math.round(p.w*.11));
      ctx.fillStyle='#ddd';ctx.fillRect(Math.round(p.x),Math.round(p.y-h),w,h);
      ctx.fillStyle='#d84838';ctx.fillRect(Math.round(p.x),Math.round(p.y-h),w,Math.ceil(h/3));
    } else if(obj.bullet) {
      const w=Math.max(2,Math.round(p.w*.045)),h=Math.max(4,Math.round(p.w*.12));
      const y=p.y-p.scale*(obj.height??.6);
      ctx.fillStyle='#ffec48';ctx.fillRect(Math.round(p.x-w/2),Math.round(y-h-3),w,h);
      ctx.fillStyle='#fff';ctx.fillRect(Math.round(p.x),Math.round(y-h-3),Math.max(1,w/2),h/2);
    } else if(obj.effect) {
      const size=Math.max(6,Math.round(p.w*.38*(1.5-obj.life)));
      ctx.fillStyle='#ff7828';ctx.fillRect(Math.round(p.x-size/2),Math.round(p.y-size),size,size);
      ctx.fillStyle='#fff050';ctx.fillRect(Math.round(p.x-size/4),Math.round(p.y-size*.75),size/2,size/2);
    } else drawCar(ctx,sprites.traffic?.[obj.color],p.x,p.y,Math.max(3,p.w*.42));
    ctx.restore();
  }
  const contact=project(s,s.distance,s.x);
  // The shadow stays on the road while the black player sprite rises. Compress
  // the screen lift on huge nitro jumps so the car remains visible above the HUD.
  const lift=115*(1-Math.exp(-s.airHeight*contact.scale/115));
  const shadowWidth=Math.round(contact.w*.34/(1+s.airHeight*.12));
  ctx.fillStyle='#303030';ctx.fillRect(160-Math.floor(shadowWidth/2),Math.round(contact.y-3),shadowWidth,3);
  if(s.flash<=0||Math.floor(s.flash*16)%2===0) {
    const img = playerSprite(sprites.player,s);
    drawCar(ctx,img,160,contact.y-lift,contact.w*.42);
    if(s.nitro>0) {
      const exhaustY=Math.round(contact.y-lift-3);
      ctx.fillStyle='#ff7828';ctx.fillRect(141,exhaustY,6,8);ctx.fillRect(173,exhaustY,6,8);
      ctx.fillStyle='#fff050';ctx.fillRect(143,exhaustY,2,5);ctx.fillRect(175,exhaustY,2,5);
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
  if(s.airHeight>.15) {
    ctx.fillStyle='#101820';ctx.fillRect(237,221,78,17);
    pixelText(ctx,'EN EL AIRE',242,226,'#fffbbc');
  }
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
