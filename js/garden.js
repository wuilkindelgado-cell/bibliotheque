/* v1.3: jardín de lectura — un rosal que crece con cada día leído, florece con las rachas y tiene sed si lo olvidas */

const GARDEN_STAGES=[
  {d:0,   n:'Semillita',               e:'🌰'},
  {d:1,   n:'Brote',                   e:'🌱'},
  {d:4,   n:'Plantita',                e:'🌿'},
  {d:10,  n:'Arbusto joven',           e:'🌳'},
  {d:20,  n:'Rosal joven',             e:'🌹'},
  {d:40,  n:'Rosal en flor',           e:'💐'},
  {d:75,  n:'Rosal real',              e:'👑'},
  {d:120, n:'Árbol de rosas encantado', e:'✨'}
];
function gardenInfo(){
  const days=[...new Set(state.readDays||[])].sort();
  const total=days.length;
  let stage=0; GARDEN_STAGES.forEach((s,i)=>{ if(total>=s.d) stage=i; });
  const last=days[days.length-1];
  const gap=last ? Math.round((isoToDate(fmtDay(new Date()))-isoToDate(last))/864e5) : 99;
  const mood=gap===0?'regada':gap<=1?'feliz':gap<=3?'sed':'marchita';
  const streak=streakCount();
  const flowers=stage<3?0:Math.min(14, Math.floor(streak/2)+(stage-2));
  const next=GARDEN_STAGES[stage+1];
  return {total, stage, mood, gap, streak, flowers, next, s:GARDEN_STAGES[stage]};
}
/* dibuja el rosal como SVG según su etapa y su ánimo */
function plantSVG(g, big){
  const W=120, H=150;
  const sick=g.mood==='sed'?1:g.mood==='marchita'?2:0;
  const leaf=['#7C9A5E','#A3AE6A','#B39A5E'][sick], stem=['#5E7A45','#7E8550','#8A7448'][sick];
  const droop=[0,10,24][sick];
  const h=[6,18,34,52,66,78,88,96][g.stage];
  let s='<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" class="plant'+(big?' big':'')+'">';
  // tallo y hojas
  const baseY=112, topY=baseY-h;
  if(g.stage===0) s+='<ellipse cx="60" cy="'+(baseY-2)+'" rx="7" ry="5" fill="#8A6F4A"/>';
  else{
    s+='<path d="M60 '+baseY+' C 56 '+(baseY-h*.4)+', 64 '+(baseY-h*.7)+', 60 '+topY+'" stroke="'+stem+'" stroke-width="'+(2.5+g.stage*.45)+'" fill="none" stroke-linecap="round"/>';
    const nLeaves=Math.min(10, 2+g.stage*1.4|0);
    for(let i=0;i<nLeaves;i++){
      const t=(i+1)/(nLeaves+1), y=baseY-h*t, side=i%2?1:-1;
      const ang=side*(38+droop)+(side>0?0:0);
      s+='<ellipse cx="'+(60+side*9)+'" cy="'+y.toFixed(1)+'" rx="9" ry="4.2" fill="'+leaf+'" transform="rotate('+(side*-28+side*droop)+' '+(60+side*9)+' '+y.toFixed(1)+')"/>';
    }
    if(g.stage>=6){ // copa del rosal real / árbol
      s+='<ellipse cx="60" cy="'+(topY+6)+'" rx="'+(30+g.stage*2)+'" ry="'+(20+g.stage)+'" fill="'+leaf+'" opacity=".9"/>';
    }
  }
  // flores
  const fCol=sick===2?'#C9A0A0':'#D9788A', fIn=sick===2?'#B98585':'#F4CBCC';
  const pts=[];
  for(let i=0;i<g.flowers;i++){
    const a=i*2.39996, r=g.stage>=6?8+i*1.9:4+i*1.6;
    pts.push([60+Math.cos(a)*Math.min(r, 30+g.stage*2), topY+6+Math.sin(a)*Math.min(r*.6, 16+g.stage)]);
  }
  pts.forEach(([x,y],i)=>{ const rr=4.6+(i%3)*.7;
    s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+rr+'" fill="'+fCol+'"/><circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(rr*.45)+'" fill="'+fIn+'"/>'; });
  if(g.stage>=4 && g.stage<6 && !g.flowers) s+='<circle cx="60" cy="'+topY+'" r="4" fill="#C47983"/>'; // botón de rosa
  if(sick===2) s+='<circle cx="48" cy="'+(baseY+6)+'" r="2.4" fill="#D9A0A8"/><circle cx="74" cy="'+(baseY+8)+'" r="2" fill="#D9A0A8"/>';
  // maceta rococó
  s+='<path d="M34 112 L86 112 L80 142 Q60 148 40 142 Z" fill="#E7C9A8" stroke="#9A7A1B" stroke-width="2"/>'
   +'<rect x="30" y="106" width="60" height="9" rx="3" fill="#F3E2C3" stroke="#9A7A1B" stroke-width="2"/>'
   +'<path d="M46 126 q14 8 28 0" stroke="#C48A90" stroke-width="2" fill="none"/><circle cx="60" cy="131" r="2.6" fill="#C9A227"/>';
  if(g.mood==='regada') s+='<text x="92" y="58" font-size="13">💧</text><text x="18" y="70" font-size="11">✨</text>';
  if(g.mood==='sed') s+='<text x="88" y="70" font-size="13">🥺</text>';
  if(g.mood==='marchita') s+='<text x="86" y="70" font-size="13">🍂</text>';
  return s+'</svg>';
}
function renderGarden(){
  const fl=document.querySelector('#v-library .floor'); if(!fl) return;
  let el=document.getElementById('garden');
  if(!el){ el=document.createElement('div'); el.id='garden'; el.title='Tu jardín de lectura'; el.onclick=openGarden; fl.appendChild(el); }
  const g=gardenInfo();
  el.innerHTML=plantSVG(g)+'<span class="glbl">'+g.s.n+'</span>';
  el.classList.toggle('thirsty', g.mood==='sed'||g.mood==='marchita');
}
function openGarden(){
  const g=gardenInfo();
  let ov=document.getElementById('gardenOv');
  if(!ov){ ov=document.createElement('div'); ov.id='gardenOv'; ov.className='ficha-overlay'; ov.style.zIndex=45;
    ov.onclick=e=>{ if(e.target===ov) ov.classList.remove('show'); }; document.getElementById('v-library').appendChild(ov); }
  const moodTxt={regada:'¡Hoy me regaste leyendo! Estoy feliz y brillante 💧✨', feliz:'Estoy contenta, pero hoy aún no me riegas… unas paginitas bastan 🌸',
    sed:'Tengo sed… hace '+g.gap+' días que no lees 🥺 Con una sola página reviviré', marchita:'Me estoy marchitando… pero no me rindo. Lee un poquito y volveré a florecer 🍂→🌹'}[g.mood];
  ov.innerHTML='<div class="frame-card" style="width:100%; max-width:440px; text-align:center">'
    +'<div style="font-family:var(--disp); font-weight:700; font-size:20px">🌹 Tu jardín de lectura</div>'
    +'<div class="garden-big">'+plantSVG(g, true)+'</div>'
    +'<div style="font-family:var(--disp); font-weight:700; font-size:17px">'+g.s.e+' '+g.s.n+'</div>'
    +'<div style="font-family:var(--hand); font-size:18px; margin:4px 0 8px">'+moodTxt+'</div>'
    +'<div class="lbl" style="font-size:12.5px">🌸 '+g.total+' día(s) de lectura en total · 🔥 racha de '+g.streak+' · 🌺 '+g.flowers+' flor(es)</div>'
    +(g.next?'<div class="gbar" style="margin:10px 0 4px"><i style="width:'+Math.round((g.total-g.s.d)/(g.next.d-g.s.d)*100)+'%"></i></div><div class="lbl" style="font-size:12px">Faltan '+(g.next.d-g.total)+' día(s) de lectura para convertirme en '+g.next.e+' '+g.next.n+'</div>'
            :'<div class="lbl" style="font-size:12.5px; margin-top:8px">¡Llegaste a la etapa más alta! El salón entero huele a rosas 👑🌹</div>')
    +'<div class="garden-stages">'+GARDEN_STAGES.map((s,i)=>'<span class="'+(i<=g.stage?'on':'')+'" title="'+s.n+' · '+s.d+' días">'+s.e+'</span>').join('')+'</div>'
    +'<div class="lbl" style="font-size:11.5px; font-style:italic; margin-top:6px">Cada día que lees me riegas. Las flores nacen con tu racha 🔥 y nunca me muero: siempre puedo volver a florecer 💗</div>'
    +'<div style="margin-top:12px"><button class="btn small" onclick="document.getElementById(\'gardenOv\').classList.remove(\'show\')">Cerrar</button></div></div>';
  ov.classList.add('show');
  state.c.garden=1; checkAch(); scheduleSave();
}
/* el rosal reacciona al leer */
let lastGardenStage=null;
const _mrtG=markReadToday;
markReadToday=function(){
  const before=gardenInfo().stage;
  _mrtG();
  const g=gardenInfo();
  if(lastGardenStage!==null && g.stage>before) buddySay('🌹 ¡Tu jardín creció! Ahora es <b>'+g.s.e+' '+g.s.n+'</b> ✨ Gracias por regarlo leyendo', 9000);
  lastGardenStage=g.stage;
  renderGarden();
};
const _rlG=renderLibrary; renderLibrary=function(){ const r=_rlG(); renderGarden(); return r; };
/* el libro avisa cuando la planta tiene sed */
chatter.push(()=>{ const g=gardenInfo(); return g.mood==='sed'||g.mood==='marchita' ? '«Tu rosal tiene sed 🥺🌹 ¿lo riegas con unas paginitas?»' : '«Tu jardín de lectura está precioso: '+g.s.e+' '+g.s.n+' 🌹»'; });
ACH.push(
 {id:'garden20', e:'🌹', nm:'Jardinera de rosas', st:'Haz crecer tu jardín hasta rosal joven (20 días)', chk:()=>gardenInfo().stage>=4},
 {id:'garden75', e:'👑', nm:'Rosal real', st:'Llega a 75 días de lectura en tu jardín', chk:()=>gardenInfo().stage>=6}
);
