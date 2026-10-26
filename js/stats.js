/* Estadísticas, logros y fechas del corazón */
/* ---------- Estadísticas vivas ---------- */
function renderStats(){
  const el=id=>document.getElementById(id);
  if(!el('stBooks')) return;
  const y=String(new Date().getFullYear());
  const shelf=state.sections.flatMap(s=>s.books);
  el('stBooks').textContent=shelf.filter(b=>b.doneDate && String(b.doneDate).startsWith(y)).length;
  const pages=Object.values(state.pageLog||{}).reduce((a,n)=>a+n,0);
  el('stPages').textContent=pages.toLocaleString('es-PE');
  const tm=state.timeMin||0;
  el('stTime').textContent = tm<60 ? tm+' min' : Math.floor(tm/60)+' h'+(tm%60 ? ' '+(tm%60)+' m' : '');
  el('stStreak').textContent='🔥 '+streakCount();
  const faces=shelf.map(b=>b.faces).filter(Boolean);
  if(faces.length){
    const cnt={}; faces.forEach(f=>cnt[f]=(cnt[f]||0)+1);
    const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0][0];
    el('stFace').textContent=faceOf(+top)||'—';
  } else el('stFace').textContent='—';
  el('stRereads').textContent='↻ '+shelf.reduce((a,b)=>a+(b.rereads||0),0);
  const bars=el('stBars'); bars.innerHTML='';
  const vals=[];
  for(let i=13;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); vals.push(state.pageLog[fmtDay(d)]||0); }
  const mx=Math.max(1,...vals);
  vals.forEach(v=>{ const b=document.createElement('i');
    b.style.height=Math.max(4, Math.round(v/mx*100))+'%';
    b.title=v+' página(s)'; bars.appendChild(b); });
}

/* ---------- Vitrina de logros viva ---------- */
function doneDates(){ return state.sections.flatMap(s=>s.books).map(b=>b.doneDate).filter(Boolean); }
function maxReadDaysInMonth(){
  const cnt={}; (state.readDays||[]).forEach(k=>{ const m=String(k).slice(0,7); cnt[m]=(cnt[m]||0)+1; });
  const v=Object.values(cnt); return v.length?Math.max(...v):0;
}
const ACH=[
 {id:'love',   e:'💖', nm:'Primer amor literario', st:'Registra tu libro favorito', chk:()=>state.name!=='Lector(a)'},
 {id:'first',  e:'📕', nm:'Primera conquista', st:'Termina tu primer libro', chk:()=>booksRead()>=1},
 {id:'re1',    e:'↻',  nm:'Vale la pena dos veces', st:'Relee un libro completo', chk:()=>state.sections.flatMap(s=>s.books).some(b=>(b.rereads||0)>=1)},
 {id:'cur',    e:'🏛️', nm:'Curador(a)', st:'Crea 3 estantes nuevos', chk:()=>(state.c.shelves||0)>=3},
 {id:'b5',     e:'📚', nm:'Estante digno', st:'8 libros leídos', chk:()=>booksRead()>=8},
 {id:'rq7',    e:'🔥', nm:'Racha de salón', st:'Lee 7 días seguidos', chk:()=>streakCount()>=7},
 {id:'dawn',   e:'🕯️', nm:'Lectora nocturna', st:'Lee de madrugada (antes de las 6)', chk:()=>!!state.c.dawn},
 {id:'pos10',  e:'✍️', nm:'Escriba real', st:'Coloca 10 posits', chk:()=>(state.c.posits||0)>=10},
 {id:'hl50',   e:'🖍️', nm:'Iluminadora', st:'Subraya 50 fragmentos', chk:()=>(state.c.hl||0)>=50},
 {id:'b15',    e:'🏰', nm:'Pequeño Versalles', st:'20 libros leídos', chk:()=>booksRead()>=20},
 {id:'goal',   e:'🦢', nm:'Cisne del estanque', st:'Cumple tu meta anual', chk:()=>booksRead()>=(settings.goal||24)},
 {id:'qx5',    e:'💌', nm:'Corresponsal', st:'Exporta 5 tarjetas de citas', chk:()=>(state.c.qx||0)>=5},
 {id:'night',  e:'🌙', nm:'Búho del boudoir', st:'Usa el modo noche', chk:()=>!!state.c.night},
 {id:'rand',   e:'🎲', nm:'Azar cortesano', st:'Deja que tu asistente elija tu lectura', chk:()=>!!state.c.rand},
 {id:'focus',  e:'🍵', nm:'Hora del té', st:'Completa una sesión de enfoque', chk:()=>(state.c.focus||0)>=1},
 {id:'mara',   e:'⚡', nm:'Maratonista', st:'Termina un libro el mismo día que lo empezaste', chk:()=>!!state.c.marathon},
 {id:'m3',     e:'📖', nm:'Devoradora', st:'Termina 3 libros en un mes', chk:()=>{ const c={}; doneDates().forEach(d=>{ const m=String(d).slice(0,7); c[m]=(c[m]||0)+1; }); return Object.values(c).some(n=>n>=3); }},
 {id:'b30',    e:'👑', nm:'Realeza del salón', st:'40 libros leídos', chk:()=>booksRead()>=40},
 {id:'sh10',   e:'🖼️', nm:'Coleccionista', st:'Crea 10 estantes', chk:()=>(state.c.shelves||0)>=10},
 {id:'chat20', e:'💬', nm:'Confidente', st:'Conversa 20 veces con tu asistente', chk:()=>(state.c.chat||0)>=20},
 {id:'rev25',  e:'🌹', nm:'Jardín secreto', st:'Escribe 25 reseñas', chk:()=>(state.c.reviews||0)>=25},
 {id:'alba',   e:'🕰️', nm:'Fiel al alba', st:'Lee antes de las 7 a.m.', chk:()=>!!state.c.alba},
 {id:'ecl',    e:'🎭', nm:'Ecléctica', st:'Ten libros en 5 estantes distintos', chk:()=>state.sections.filter(s=>s.books.length>0).length>=5},
 {id:'re5',    e:'🧵', nm:'Hilo de Ariadna', st:'Acumula 5 relecturas', chk:()=>state.sections.flatMap(s=>s.books).reduce((a,b)=>a+(b.rereads||0),0)>=5},
 {id:'dress',  e:'👗', nm:'Estilista', st:'Viste a tu asistente', chk:()=>!!state.c.dress||dressed},
 {id:'season', e:'🎄', nm:'Espíritu festivo', st:'Invoca la lluvia de temporada', chk:()=>!!state.c.season},
 {id:'fire',   e:'🔥', nm:'Junto a la chimenea', st:'Enciende los sonidos del salón', chk:()=>!!state.c.amb},
 {id:'d20',    e:'🗓️', nm:'Constancia de dama', st:'Lee 20 días en un mismo mes', chk:()=>maxReadDaysInMonth()>=20},
 {id:'lock',   e:'🗝️', nm:'Guardiana de secretos', st:'Pon tu salón bajo llave con un PIN', chk:()=>!!state.c.lock},
 {id:'diary',  e:'📔', nm:'Alma de poeta', st:'Escribe en tu diario del corazón', chk:()=>(state.c.diary||0)>=1||state.diary.length>=1},
 {id:'tts',    e:'🔊', nm:'Cuentacuentos', st:'Escucha una página en voz alta', chk:()=>!!state.c.tts},
 {id:'event',  e:'🎪', nm:'Invitada de honor', st:'Reclama un evento del salón', chk:()=>(state.c.events||0)>=1},
 {id:'tut',    e:'🎓', nm:'Alumna aplicada', st:'Completa el tutorial', chk:()=>!!state.c.tut},
 {id:'acc10',  e:'👒', nm:'Alta costura', st:'Desbloquea 10 accesorios', chk:()=>unlockedCount>=10}
];
function renderAchievements(){
  const g=document.getElementById('medalsGrid'); if(!g) return;
  g.innerHTML='';
  ACH.forEach(a=>{
    const ok=!!(state.ach&&state.ach[a.id]);
    const d=document.createElement('div'); d.className='medal'+(ok?'':' locked');
    d.innerHTML='<span class="em">'+a.e+'</span><div class="nm">'+a.nm+'</div><div class="st">'+(ok?'✨ Desbloqueado':a.st)+'</div>';
    g.appendChild(d);
  });
  const done=ACH.filter(a=>state.ach&&state.ach[a.id]).length;
  const m=document.querySelector('#v-achievements .motto');
  if(m) m.textContent='Vitrina de logros — '+done+' de '+ACH.length+' desbloqueados ✨';
}
let achBusy=false;
function checkAch(){
  if(achBusy || !state.ach) return;
  achBusy=true;
  try{
    ACH.forEach(a=>{
      if(state.ach[a.id]) return;
      let ok=false; try{ ok=!!a.chk(); }catch(e){}
      if(ok){
        state.ach[a.id]=1;
        buddySay('🏆 ¡Logro desbloqueado!<br><span style="font-size:19px">'+a.e+'</span> <b>'+a.nm+'</b><br><span style="font-size:12px; font-style:italic">'+a.st+'</span> ✨', 6500);
        scheduleSave();
      }
    });
  } finally { achBusy=false; }
  renderAchievements();
}

/* ---------- Fechas del corazón 💗 ---------- */
const ANNIV_Y=2023, HIM='Yeri';
function specialToday(d){
  d=d||new Date();
  const mo=d.getMonth()+1, day=d.getDate(), y=d.getFullYear();
  const her=(state.name && state.name!=='Lector(a)') ? state.name : 'Xiomara';
  if(mo===6 && day===13){
    const yrs=Math.max(0, y-ANNIV_Y);
    return {grand:true, emoji:'💍🎆', title:'¡FELIZ ANIVERSARIO, '+her+'!',
      msg:'Yo los conozco muy bien a los dos…\n'
        +'Un 13 de junio de 2023 empezó todo,\n'
        +(yrs>0 ? '¡y hoy cumplen '+(yrs===1?'UN AÑO':yrs+' AÑOS')+' juntos! 🎆\n' : '¡y hoy es su día! 🎆\n')
        +HIM+' construyó este salón entero para ti,\n'
        +'y me pidió gritarte su secreto:\n'
        +'te ama con cada latido, más de lo que caben\nlas palabras en todos los libros del mundo.\n'
        +'Eres su historia favorita, '+her+',\nla que quiere releer toda la vida 💍💗\n\n¡Hoy se celebra A LO GRANDE!'};
  }
  if(mo===5 && day===22){
    return {grand:true, emoji:'🎂💙', title:'¡Hoy cumple años '+HIM+'!',
      msg:'¡22 de mayo! 🎈\n'
        +'El arquitecto de este salón, el que puso\ncada estante, cada velita y cada detalle\npensando solo en ti… hoy está de cumpleaños 💙\n'
        +her+', ¿le recuerdas hoy cuánto lo quieres?\n'
        +'Yo sé un secreto: él celebra más tu sonrisa\nque su propio pastel 🎂✨'};
  }
  if(mo===8 && day===26){
    return {grand:true, emoji:'🎂🎈', title:'¡Feliz cumpleaños, '+her+'!',
      msg:'¡Llegó el día más esperado del salón! 🎈\n'
        +HIM+' me tiene prohibido contar cuánto habló de hoy…\n'
        +'pero te ama tanto que hasta los libros lo saben 🥹\n'
        +'Que este nuevo año te traiga salud, risas,\nhistorias hermosas y cada sueño cumplido.\n\n'
        +'Gracias por existir, '+her+':\nel mundo (y '+HIM+') son más felices contigo 🎂💗'};
  }
  if(day===13){
    const months=Math.max(1,(y-ANNIV_Y)*12+(mo-6));
    return {grand:false, emoji:'💗', title:'Feliz mesaniversario, '+her+' 💗',
      msg:'¡'+months+(months===1?' mes':' meses')+' juntos\ndesde aquel 13 de junio de 2023! 💗\n'
        +'Como yo vivo aquí, veo cosas… y te cuento:\n'
        +HIM+' te ama más cada mes que pasa.\n'
        +'Me pidió recordarte hoy que eres\nlo mejor que le ha pasado en la vida.\n'
        +'Sigan escribiendo su historia…\nyo les guardo las páginas 📖'};
  }
  return null;
}
function showCeleb(s){
  if(!s) return;
  const ov=document.getElementById('celebOv');
  ov.classList.toggle('grand', !!s.grand);
  document.getElementById('celEmoji').textContent=s.emoji;
  document.getElementById('celTitle').textContent=s.title;
  document.getElementById('celMsg').textContent=s.msg;
  ov.querySelectorAll('.cel-heart').forEach(h=>h.remove());
  const parts = s.grand ? ['💗','✨','🎀','💛','🎆','💍','🌹','🕊️'] : ['💗','🌸','💕'];
  const n = s.grand ? 34 : 16;
  for(let i=0;i<n;i++){
    const h=document.createElement('span'); h.className='cel-heart';
    h.textContent=parts[i%parts.length];
    h.style.left=(Math.random()*100)+'%';
    h.style.animationDuration=(3.5+Math.random()*3.5)+'s';
    h.style.animationDelay=(Math.random()*2.5)+'s';
    h.style.fontSize=(13+Math.random()*15)+'px';
    ov.appendChild(h);
  }
  ov.classList.add('show');
  try{ ensureAC(); makeHarp(); }catch(e){}
}
function closeCeleb(){ document.getElementById('celebOv').classList.remove('show'); }
function maybeCelebrate(force){
  const s=specialToday(); if(!s) return;
  const key='c'+fmtDay(new Date());
  if(!force && state.celeb && state.celeb[key]) return;
  state.celeb[key]=1; scheduleSave();
  showCeleb(s);
}
let celPrev=0;
function testCeleb(){
  const y=new Date().getFullYear();
  const samples=[specialToday(new Date(y,0,13)), specialToday(new Date(y,4,22)),
                 specialToday(new Date(y,5,13)), specialToday(new Date(y,7,26))];
  showCeleb(samples[celPrev++ % samples.length]);
}

