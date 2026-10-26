/* v20: calendario de recuerdos — cualquier mes, cualquier día, todo lo que pasó */
let calView=null, calSel=null;

/* entradas antiguas del diario guardaban solo "24 de octubre": se ubica el año más reciente posible */
const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','setiembre','octubre','noviembre','diciembre'];
function diaryIso(e){
  if(e.iso) return e.iso;
  const m=String(e.d||'').toLowerCase().match(/(\d{1,2})\s+de\s+([a-záéíóú]+)/);
  if(!m) return null;
  let mi=MESES.indexOf(m[2]); if(mi<0) return null;
  if(mi>=9) mi--; // "setiembre" ocupa un lugar extra
  const now=new Date(); let y=now.getFullYear();
  if(new Date(y, mi, +m[1])>now) y--;
  return fmtDay(new Date(y, mi, +m[1]));
}
function allBooks(){ return [...state.floor, ...state.sections.flatMap(s=>s.books)]; }

/* reúne todo lo ocurrido en un día */
function dayInfo(iso){
  const out={pages:state.pageLog[iso]||0, read:(state.readDays||[]).includes(iso),
    diary:[], hls:[], posits:[], started:[], finished:[], added:[], quotes:[]};
  (state.diary||[]).forEach((e,i)=>{ if(diaryIso(e)===iso) out.diary.push({e,i}); });
  allBooks().forEach(b=>{
    if(b.startedDate===iso) out.started.push(b);
    if(b.doneDate===iso) out.finished.push(b);
    if(b.addedDate===iso) out.added.push(b);
    Object.keys(b.hls||{}).forEach(pg=>(b.hls[pg]||[]).forEach(r=>{ if(r.d===iso) out.hls.push({b, pg, q:r.q, c:r.c}); }));
    (b.ehls||[]).forEach(h=>{ if(h.d===iso) out.hls.push({b, pg:h.pg, q:h.q, c:h.c}); });
    Object.keys(b.posits||{}).forEach(pg=>(b.posits[pg]||[]).forEach(p=>{ if(p.d===iso && p.t) out.posits.push({b, pg, t:p.t}); }));
  });
  return out;
}
function dayMarks(iso){
  const i=dayInfo(iso), m=[];
  if(i.diary.length) m.push('📔');
  if(i.hls.length) m.push('✒️');
  if(i.posits.length) m.push('🗒️');
  if(i.finished.length) m.push('🏆');
  return {i, m};
}
function specialOfDay(d){
  const s=specialToday(d); if(s) return s;
  const mo=d.getMonth()+1, dd=d.getDate();
  if(mo===4 && dd===23) return {emoji:'📖', title:'Día Internacional del Libro', msg:'El día más importante del año para el salón 📚✨'};
  return null;
}

function renderCalendar(){
  /* tarjeta pequeña del Salón de estadísticas: mes actual, con acceso al calendario completo */
  const g=document.getElementById('calGrid');
  if(g){
    const now=new Date();
    const t=now.toLocaleDateString('es-PE',{month:'long', year:'numeric'});
    document.getElementById('calTitle').innerHTML='🗓️ '+t.charAt(0).toUpperCase()+t.slice(1)+' — racha: '+streakCount()+' día(s) 🔥 <span class="chip" style="font-size:11px" onclick="show(\'v-calendar\')">abrir calendario de recuerdos →</span>';
    drawMonth(g, now.getFullYear(), now.getMonth(), iso=>{ show('v-calendar'); calSelect(iso); });
  }
  renderCal2();
}
function drawMonth(g, y, m, onPick){
  g.innerHTML='';
  ['L','M','X','J','V','S','D'].forEach(h=>{ const e=document.createElement('div'); e.className='hd'; e.textContent=h; g.appendChild(e); });
  const start=(new Date(y,m,1).getDay()+6)%7;
  for(let i=0;i<start;i++){ const e=document.createElement('div'); e.className='dy off'; g.appendChild(e); }
  const days=new Date(y,m+1,0).getDate();
  const set=new Set(state.readDays||[]);
  const today=fmtDay(new Date());
  for(let d=1; d<=days; d++){
    const dt=new Date(y,m,d), key=fmtDay(dt);
    const e=document.createElement('div'); e.className='dy';
    const {m:marks}=dayMarks(key);
    if(set.has(key)) { e.classList.add('read'); marks.unshift('🌸'); }
    const sp=specialOfDay(dt);
    if(sp){ e.classList.add(sp.grand?'grand':'love'); marks.push(sp.grand?(sp.emoji||'💗').slice(0,2):'💗'); }
    e.innerHTML=d+(marks.length?'<div class="dots">'+marks.slice(0,3).join('')+'</div>':'');
    if(key===today) e.classList.add('today');
    if(key===calSel) e.classList.add('sel');
    e.title=niceDate(key);
    e.onclick=()=>onPick(key);
    g.appendChild(e);
  }
}
function renderCal2(){
  const g=document.getElementById('calGrid2'); if(!g) return;
  if(!calView){ const n=new Date(); calView={y:n.getFullYear(), m:n.getMonth()}; }
  const t=new Date(calView.y, calView.m, 1).toLocaleDateString('es-PE',{month:'long', year:'numeric'});
  document.getElementById('cal2Title').textContent=t.charAt(0).toUpperCase()+t.slice(1);
  document.getElementById('calMonthIn').value=calView.y+'-'+String(calView.m+1).padStart(2,'0');
  drawMonth(g, calView.y, calView.m, calSelect);
  if(!calSel) calSelect(fmtDay(new Date()), true);
}
function calMove(k){ calView.m+=k; if(calView.m<0){ calView.m=11; calView.y--; } if(calView.m>11){ calView.m=0; calView.y++; } renderCal2(); }
function calJump(v){ const p=String(v).split('-'); if(p.length<2) return; calView={y:+p[0], m:+p[1]-1}; renderCal2(); }
function calToday(){ const n=new Date(); calView={y:n.getFullYear(), m:n.getMonth()}; calSelect(fmtDay(n)); }
function calSelect(iso, quiet){
  calSel=iso;
  const d=isoToDate(iso);
  if(!calView || calView.y!==d.getFullYear() || calView.m!==d.getMonth()){ calView={y:d.getFullYear(), m:d.getMonth()}; }
  if(!quiet) renderCal2(); else document.querySelectorAll('#calGrid2 .dy').forEach(x=>x.classList.toggle('sel', x.title===niceDate(iso)));
  document.getElementById('calDateIn').value=iso;
  renderDayPanel(iso);
}
function renderDayPanel(iso){
  const p=document.getElementById('dayPanel'); if(!p) return;
  const d=isoToDate(iso), i=dayInfo(iso);
  const wd=d.toLocaleDateString('es-PE',{weekday:'long'});
  const isFuture=d>new Date();
  let h='<div class="day-panel"><div class="dp-h">'+wd.charAt(0).toUpperCase()+wd.slice(1)+' '+niceDate(iso)+'</div>';
  const sp=specialOfDay(d);
  if(sp) h+='<div class="dp-sec" style="border-color:var(--bridal-rose)"><b>'+(sp.emoji||'💗')+' '+esc(sp.title)+'</b><div style="font-family:var(--hand); font-size:16px; white-space:pre-line; margin-top:4px">'+esc(sp.msg)+'</div></div>';
  const lt=(state.letters||[]).filter(l=>l.openedAt && fmtDay(new Date(l.openedAt))===iso);
  if(lt.length) h+='<div class="dp-sec"><b>💌 Abriste '+(lt.length>1?'cartas':'una carta')+':</b> '+lt.map(l=>esc(l.title)).join(', ')+'</div>';
  if(i.pages || i.read) h+='<div class="dp-sec"><b>🌸 Lectura:</b> '+(i.pages?i.pages+' página(s) leída(s)':'leíste este día')+'</div>';
  if(i.finished.length) h+='<div class="dp-sec"><b>🏆 Terminaste:</b> '+i.finished.map(b=>'<i>'+esc(b.t)+'</i> '+faceOf(b.faces)).join(', ')+'</div>';
  if(i.started.length) h+='<div class="dp-sec"><b>📖 Empezaste:</b> '+i.started.map(b=>'<i>'+esc(b.t)+'</i>').join(', ')+'</div>';
  if(i.added.length) h+='<div class="dp-sec"><b>📚 Llegaron al salón:</b> '+i.added.map(b=>'<i>'+esc(b.t)+'</i>').join(', ')+'</div>';
  i.diary.forEach(({e})=>{
    const img=(e.pid && urlMap['d_'+e.pid]) ? '<img src="'+urlMap['d_'+e.pid]+'" alt="foto del diario">' : '';
    h+='<div class="dp-sec" style="border-color:var(--rose-quartz); border-style:solid"><b>📔 Diario '+esc(e.f||'')+'</b><div style="font-family:var(--hand); font-size:17px">'+esc(e.t)+'</div>'+img+'</div>';
  });
  if(i.hls.length) h+='<div class="dp-sec"><b>✒️ Subrayaste:</b>'+i.hls.map(x=>'<div style="margin-top:4px">« '+esc(x.q)+' » <span style="color:var(--ink-soft); font-style:italic">— '+esc(x.b.t)+(x.pg?', pág. '+x.pg:'')+'</span></div>').join('')+'</div>';
  if(i.posits.length) h+='<div class="dp-sec"><b>🗒️ Tus notitas:</b>'+i.posits.map(x=>'<div style="margin-top:4px">'+esc(x.t)+' <span style="color:var(--ink-soft); font-style:italic">— '+esc(x.b.t)+', pág. '+x.pg+'</span></div>').join('')+'</div>';
  const empty=!sp && !lt.length && !i.pages && !i.read && !i.finished.length && !i.started.length && !i.added.length && !i.diary.length && !i.hls.length && !i.posits.length;
  if(empty) h+='<div class="dp-sec" style="text-align:center; font-style:italic">'+(isFuture?'Este día aún no llega… ¿qué historia leeremos? ✨':'Este día el salón descansó 🕊️')+'</div>';
  if(!isFuture) h+='<div style="text-align:center"><button class="btn rose small" onclick="diaryForDay(\''+iso+'\')">✍️ Escribir en el diario sobre este día</button></div>';
  h+='</div>';
  p.innerHTML=h;
}
/* el diario puede guardar una página con fecha pasada */
let diaryDate=null;
function diaryForDay(iso){
  diaryDate=(iso===fmtDay(new Date()))?null:iso;
  show('v-diary');
  const lb=document.querySelector('#v-diary .stat-card .lbl');
  if(lb) lb.textContent=diaryDate?'Nueva entrada para el '+niceDate(diaryDate):'Nueva entrada de hoy';
  setTimeout(()=>document.getElementById('dTxt').focus(), 60);
}
