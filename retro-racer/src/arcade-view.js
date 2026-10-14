import { MAX_SPEED, RACE_LENGTH, roadCenter } from './race-model.js';
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
function polygon(ctx, color, points) {
  ctx.fillStyle = color; ctx.beginPath();
  points.forEach(([x,y],i) => i ? ctx.lineTo(Math.round(x),Math.round(y)) : ctx.moveTo(Math.round(x),Math.round(y)));
  ctx.closePath(); ctx.fill();
}
const carSprites = new Map();
function carSprite(color) {
  if (carSprites.has(color)) return carSprites.get(color);
  const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 24;
  const ctx = canvas.getContext('2d');
  const rect = (c,x,y,w,h) => { ctx.fillStyle = c; ctx.fillRect(x,y,w,h); };
  rect('#101020',4,1,24,21); rect('#101020',1,11,30,11);
  rect(color,5,2,22,18); rect(color,2,12,28,7);
  rect('#f8d878',6,3,20,1); rect('#181838',7,5,18,6);
  rect('#88b8c8',8,5,16,2); rect('#385868',8,7,16,3);
  rect('#101020',2,20,5,4); rect('#101020',25,20,5,4);
  rect('#f8f8e8',3,13,6,3); rect('#f8f8e8',23,13,6,3);
  rect('#b82828',3,15,6,2); rect('#b82828',23,15,6,2);
  rect('#d8d8d8',3,18,26,2); rect('#101020',12,17,8,3);
  rect('#f8d878',13,18,6,1); carSprites.set(color,canvas); return canvas;
}
function project(s,z,x=0) {
  const scale = 0.85 / Math.max(20,z-s.distance+700);
  return { x:160+(roadCenter(z)-roadCenter(s.distance)+(x-s.x)*1000)*scale*160,
    y:80+scale*130000, w:scale*160000 };
}
export function drawRace(ctx,s,best) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle='#302858'; ctx.fillRect(0,0,320,240);
  const sky=['#584078','#885080','#b86878','#d88878','#e8b888'];
  sky.forEach((c,i)=>{ctx.fillStyle=c;ctx.fillRect(0,24+i*12,320,12);});
  for(let i=0;i<7;i++){ctx.fillStyle=i%2?'#e8b888':'#f8d878';ctx.fillRect(226+(i<2?4:0),35+i*4,i<2?34:42,3);}
  const shift=Math.sin(s.distance/900)*16;
  polygon(ctx,'#504060',[[0,88],[0,68],[28+shift,48],[52+shift,74],[84+shift,58],[126+shift,86],[180,64],[218,88],[320,67],[320,96]]);
  ctx.fillStyle='#3888a8';ctx.fillRect(0,85,320,155);
  for(let i=0;i<8;i++){ctx.fillStyle=i%2?'#58a8b8':'#286888';ctx.fillRect(0,95+i*18,320,2);}
  for(let i=150;i>=1;i--){
    const z=s.distance+i*20, far=project(s,z),near=project(s,z-20);
    const light=Math.floor(z/100)%2===0;
    ctx.fillStyle=light?'#b8a858':'#a89848';ctx.fillRect(0,Math.round(far.y),320,Math.ceil(near.y-far.y)+1);
    polygon(ctx,light?'#f8f8e8':'#c84838',[[far.x-far.w*1.12,far.y],[far.x+far.w*1.12,far.y],[near.x+near.w*1.12,near.y],[near.x-near.w*1.12,near.y]]);
    polygon(ctx,light?'#585868':'#505060',[[far.x-far.w,far.y],[far.x+far.w,far.y],[near.x+near.w,near.y],[near.x-near.w,near.y]]);
    if(light) for(const lane of [-1/3,1/3]) polygon(ctx,'#e8d8a8',[[far.x+far.w*lane-1,far.y],[far.x+far.w*lane+1,far.y],[near.x+near.w*lane+Math.max(1,near.w/70),near.y],[near.x+near.w*lane-Math.max(1,near.w/70),near.y]]);
  }
  const objects=[];
  for(let i=0;i<15;i++){const z=(Math.floor(s.distance/180)+i+1)*180;objects.push({z,x:i%2?1.5:-1.5,palm:true});}
  for(const car of s.traffic) if(car.z>s.distance-15 && car.z<s.distance+2500) objects.push(car);
  objects.sort((a,b)=>b.z-a.z);
  for(const obj of objects){
    const p=project(s,obj.z,obj.x);
    if(p.y<83||p.y>244||p.x<-150||p.x>470)continue;
    if(obj.palm){
      const h=Math.max(3,Math.round(p.w*.32)),w=Math.max(1,Math.round(h/9));
      ctx.fillStyle='#785028';ctx.fillRect(Math.round(p.x),Math.round(p.y-h),w,h);
      ctx.fillStyle='#286838';ctx.fillRect(Math.round(p.x-h/3),Math.round(p.y-h),Math.round(h*.75),w*2);
      ctx.fillRect(Math.round(p.x-h/4),Math.round(p.y-h-w*2),Math.round(h*.5),w*2);
      ctx.fillRect(Math.round(p.x-h/2),Math.round(p.y-h+w*2),Math.round(h),w);
    }else{const w=Math.max(4,Math.round(p.w*.24)),h=Math.round(w*.75);ctx.drawImage(carSprite(['#e8b838','#58a878','#b878c8','#d8d8d8'][obj.color]),Math.round(p.x-w/2),Math.round(p.y-h),w,h);}
  }
  if(s.flash<=0 || Math.floor(s.flash*16)%2===0){
    const x=132+Math.round((Number(!!s.steerRight)-Number(!!s.steerLeft))*2);
    ctx.drawImage(carSprite('#e85838'),x,194,56,42);
    if(s.nitro>0){ctx.fillStyle='#f89828';ctx.fillRect(x+8,233,8,7);ctx.fillRect(x+40,233,8,7);ctx.fillStyle='#f8d878';ctx.fillRect(x+10,232,4,6);ctx.fillRect(x+42,232,4,6);}
  }
  ctx.fillStyle='#101020';ctx.fillRect(0,0,320,24);
  pixelText(ctx,'TIME '+Math.ceil(s.timeLeft).toString().padStart(2,'0'),8,4,s.timeLeft<15?'#e85838':'#f8d878');
  pixelText(ctx,'SECTOR '+Math.min(3,s.sector+1)+'/3',122,4);
  pixelText(ctx,Math.round(s.speed*3.6).toString().padStart(3,'0')+' KM/H',246,4);
  pixelText(ctx,'META '+Math.ceil((RACE_LENGTH-s.distance)/10)/100+' KM',8,15,'#88b8c8');
  pixelText(ctx,'PASES '+s.overtakes,170,15,'#88b8c8');
  ctx.fillStyle='#101020';ctx.fillRect(6,224,82,12);
  pixelText(ctx,s.nitro>0?'NITRO':s.cooldown>0?'RECARGA':'NITRO LISTO',9,227,s.nitro>0?'#f8d878':'#f8f8e8');
  if(s.messageTime>0){ctx.fillStyle='#101020';ctx.fillRect(85,37,150,17);pixelText(ctx,s.message,92,42,'#f8d878');}
  if(s.phase!=='racing'){
    ctx.fillStyle='#101020';ctx.fillRect(18,96,284,85);ctx.fillStyle='#f8d878';ctx.fillRect(20,98,280,2);
    const title={ready:'COAST RUN',paused:'PAUSA',won:'META ALCANZADA',over:'TIEMPO AGOTADO',countdown:String(Math.max(1,Math.ceil(s.countdown)))}[s.phase];
    pixelText(ctx,title,(320-title.length*12)/2,110,'#f8d878',2);
    const line=s.phase==='ready'?'4.8 KM / 3 SECTORES':s.phase==='won'?'TIEMPO '+s.elapsed.toFixed(1)+' S':s.phase==='over'?'REINTENTA LA CARRERA':s.phase==='paused'?'P O CONTINUAR': 'PREPARATE';
    pixelText(ctx,line,(320-line.length*6)/2,137);
    const hint=s.phase==='ready'?'ACELERA Y ESQUIVA EL TRAFICO':s.phase==='won'&&best?'RECORD '+best.toFixed(1)+' S':'ENTER / BOTON JUGAR';
    pixelText(ctx,hint,(320-hint.length*6)/2,154,'#88b8c8');
  }
}
