/* v1.7: decorador del salón — muebles y adornos que se ganan leyendo y se colocan donde quieras */

const SVG_DECOR={
  espejo:'<svg viewBox="0 0 80 110"><ellipse cx="40" cy="56" rx="30" ry="42" fill="#DDE9F1" stroke="#C9A04A" stroke-width="6"/><ellipse cx="40" cy="56" rx="24" ry="36" fill="none" stroke="#F0DA9C" stroke-width="1.5"/><path d="M22 34 q10 -8 22 -2" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/><path d="M26 10 q14 -12 28 0 q-6 4 -14 3 q-8 1 -14 -3z" fill="#C9A04A"/><circle cx="40" cy="7" r="4" fill="#F0DA9C"/><path d="M14 96 q-6 8 4 10 M66 96 q6 8 -4 10" stroke="#C9A04A" stroke-width="3" fill="none"/></svg>',
  arana:'<svg viewBox="0 0 110 90"><path d="M55 0 V18" stroke="#9A782C" stroke-width="2"/><ellipse cx="55" cy="40" rx="40" ry="10" fill="none" stroke="#C9A04A" stroke-width="3"/><path d="M15 40 q40 30 80 0" stroke="#C9A04A" stroke-width="3" fill="none"/><circle cx="55" cy="22" r="6" fill="#F0DA9C" stroke="#9A782C"/>'
    +[15,35,55,75,95].map(x=>'<rect x="'+(x-3)+'" y="28" width="6" height="12" fill="#FFF8EE" stroke="#C9A04A"/><ellipse cx="'+x+'" cy="24" rx="2.5" ry="5" fill="#FFB347" class="cflame"/>').join('')
    +[25,45,65,85].map(x=>'<path d="M'+x+' 50 l3 10 l-3 6 l-3 -6z" fill="#E6F2FA" stroke="#BCD8E8"/>').join('')+'</svg>',
  columna:'<svg viewBox="0 0 50 140"><rect x="6" y="2" width="38" height="10" rx="2" fill="#F7ECDD" stroke="#C9A04A" stroke-width="2"/><path d="M4 12 q21 10 42 0" fill="#F0DA9C" stroke="#C9A04A"/><rect x="12" y="18" width="26" height="108" fill="#FBF6EE" stroke="#D9C9B0"/>'
    +[17,23,29,35].map(x=>'<line x1="'+x+'" y1="20" x2="'+x+'" y2="124" stroke="#E4D3BC" stroke-width="1.5"/>').join('')+'<rect x="6" y="126" width="38" height="12" rx="2" fill="#F7ECDD" stroke="#C9A04A" stroke-width="2"/></svg>',
  arpa:'<svg viewBox="0 0 80 120"><path d="M12 112 L18 12 Q40 4 66 34 L70 112 Z" fill="none" stroke="#C9A04A" stroke-width="5" stroke-linejoin="round"/>'
    +[24,32,40,48,56,63].map((x,i)=>'<line x1="'+x+'" y1="'+(16+i*3)+'" x2="'+x+'" y2="108" stroke="#E7DCD0" stroke-width="1.2"/>').join('')+'<rect x="8" y="108" width="66" height="8" rx="3" fill="#9A782C"/></svg>',
  biombo:'<svg viewBox="0 0 120 100"><g stroke="#C9A04A" stroke-width="2.5">'+[0,1,2].map(i=>'<path d="M'+(6+i*38)+' 10 q17 -10 34 0 v84 h-34z" fill="'+['#F3C9CF','#BCD8E8','#CFE6DB'][i]+'"/><circle cx="'+(23+i*38)+'" cy="46" r="8" fill="#FFF8EE" stroke-width="1.5"/>').join('')+'</g></svg>',
  globo:'<svg viewBox="0 0 80 110"><circle cx="40" cy="44" r="30" fill="#BCD8E8" stroke="#9A782C" stroke-width="2"/><path d="M22 34 q10 -6 16 2 q4 8 -6 10 M46 26 q10 2 12 12 q-6 6 -12 0 M44 56 q8 -4 12 4 q-2 8 -10 6" fill="#CFE6DB" stroke="#94A879"/><path d="M8 44 a32 32 0 0 0 64 0" stroke="#C9A04A" stroke-width="3" fill="none"/><path d="M40 76 V96 M24 104 h32" stroke="#C9A04A" stroke-width="4" stroke-linecap="round"/></svg>'
};
/* catálogo: [id, nombre, libros leídos para desbloquear] */
const DECOR_CATALOG=[
  ['🕯️','Vela',0],['🖼️','Cuadro',0],['💐','Ramo de flores',0],['🏺','Ánfora',0],['svg:espejo','Espejo rococó',0],
  ['🕰️','Reloj de péndulo',1],['🎻','Violín',1],['svg:columna','Columna',2],['🦢','Cisne',2],['🌹','Rosa',2],
  ['svg:arana','Araña de cristal',3],['☕','Taza de té',3],['🎀','Lazo gigante',4],['svg:biombo','Biombo pintado',5],['🎹','Piano',5],
  ['🛋️','Sofá',6],['svg:globo','Globo terráqueo',7],['🧸','Osito',8],['🍰','Pastelito',8],['🦋','Mariposa',9],['svg:arpa','Arpa',10],
  ['👑','Corona',12],['🎠','Carrusel',15],['🌈','Arcoíris',18],['🏰','Castillo',20],['🦚','Pavo real',25]
];
let decorMode=false;
function decorLayer(){
  const wall=document.getElementById('wall'); if(!wall) return null;
  let L=document.getElementById('decorLayer');
  if(!L){ L=document.createElement('div'); L.id='decorLayer'; }
  if(L.parentNode!==wall) wall.appendChild(L);
  L.style.height=Math.max(wall.scrollHeight, wall.clientHeight)+'px';
  return L;
}
function decorHTML(item){ return item.startsWith('svg:') ? SVG_DECOR[item.slice(4)] : '<span class="de">'+item+'</span>'; }
function renderDecor(){
  const L=decorLayer(); if(!L) return;
  L.innerHTML=''; L.classList.toggle('editing', decorMode);
  (state.decor||[]).forEach(d=>{
    const e=document.createElement('div'); e.className='decor-item'; e.innerHTML=decorHTML(d.item);
    e.style.left=d.x+'%'; e.style.top=d.y+'px'; e.style.width=(d.s||70)+'px';
    e.title=decorMode?'Arrástrame · rueda del mouse para cambiar tamaño · clic derecho para quitar':'';
    if(decorMode) makeDecorDraggable(e, d);
    L.appendChild(e);
  });
}
function makeDecorDraggable(e, d){
  e.onpointerdown=ev=>{ ev.preventDefault(); ev.stopPropagation(); e.setPointerCapture(ev.pointerId);
    const L=decorLayer(), r=L.getBoundingClientRect(), sx=ev.clientX, sy=ev.clientY, x0=d.x, y0=d.y;
    e.onpointermove=m=>{ d.x=Math.max(0, Math.min(96, x0+(m.clientX-sx)/r.width*100)); d.y=Math.max(0, y0+(m.clientY-sy)); e.style.left=d.x+'%'; e.style.top=d.y+'px'; };
    e.onpointerup=()=>{ e.onpointermove=null; scheduleSave(); };
  };
  e.onwheel=ev=>{ ev.preventDefault(); d.s=Math.max(28, Math.min(260, (d.s||70)*(ev.deltaY<0?1.1:.9))); e.style.width=d.s+'px'; scheduleSave(); };
  e.oncontextmenu=ev=>{ ev.preventDefault(); state.decor=state.decor.filter(x=>x!==d); scheduleSave(); renderDecor(); toast('«Adorno guardado en el baúl 🧳»'); };
}
function toggleDecorMode(){
  decorMode=!decorMode;
  document.getElementById('decorBtn').classList.toggle('activeTool', decorMode);
  let p=document.getElementById('decorPalette');
  if(decorMode){
    if(!p){ p=document.createElement('div'); p.id='decorPalette'; document.getElementById('v-library').appendChild(p); }
    const lvl=booksRead();
    p.innerHTML='<div class="dp-head"><b>🎨 Decora tu salón</b><span class="lbl">Toca un adorno para ponerlo · arrástralo · rueda del mouse = tamaño · clic derecho = quitar</span><button class="btn rose small" onclick="toggleDecorMode()">Listo ✨</button></div><div class="dp-items">'
      +DECOR_CATALOG.map(([id,n,req])=>{ const ok=lvl>=req; return '<button class="dp-it'+(ok?'':' lk')+'" data-id="'+id+'" title="'+esc(n)+(ok?'':' · se desbloquea con '+req+' libros leídos')+'">'+(ok?decorHTML(id):'🔒')+'<small>'+esc(n)+'</small></button>'; }).join('')+'</div>';
    p.querySelectorAll('.dp-it').forEach(b=>b.onclick=()=>{
      if(b.classList.contains('lk')){ toast('«Termina más libros para desbloquear este adorno 📚✨»'); return; }
      const wall=document.getElementById('wall');
      (state.decor=state.decor||[]).push({item:b.dataset.id, x:30+Math.random()*40, y:wall.scrollTop+wall.clientHeight*.45, s:b.dataset.id.startsWith('svg:')?90:60});
      state.c.decor=(state.c.decor||0)+1; checkAch(); scheduleSave(); renderDecor();
    });
    p.classList.add('show');
    toast('«Modo decoración 🎨 ¡haz del salón tu Versalles!»');
  } else if(p){ p.classList.remove('show'); toast('«¡Qué salón tan bonito te quedó! 👑»'); }
  renderDecor();
}
const _rlD=renderLibrary; renderLibrary=function(){ const r=_rlD(); renderDecor(); return r; };
ACH.push({id:'decor5', e:'🖼️', nm:'Decoradora de Versalles', st:'Coloca 5 adornos en tu salón', chk:()=>(state.decor||[]).length>=5});
