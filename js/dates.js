/* v1.5: nuestras fechas — mensajes que cambian cada año/mes, fechas propias desde el escritorio y cuenta regresiva */

const HER=()=> (state.name && state.name!=='Lector(a)') ? state.name : 'Xiomara';

/* --- mensajes del aniversario (13 de junio de 2023): uno distinto cada año --- */
const ANNIV_MSGS=[
 (n,y)=>'Yo los conozco muy bien a los dos…\nUn 13 de junio de 2023 empezó todo,\n¡y hoy cumplen '+y+'! 🎆\n'+HIM+' construyó este salón entero para ti,\ny me pidió gritarte su secreto:\nte ama con cada latido, más de lo que caben\nlas palabras en todos los libros del mundo.\nEres su historia favorita, '+n+' 💍💗',
 (n,y)=>'Hoy hace '+y+' que dos historias se volvieron una sola 📖💞\nSi su amor fuera un libro, '+n+',\nsería de esos que nadie quiere terminar\ny que se releen con el corazón apretadito.\n'+HIM+' me dejó dicho: «Gracias por elegirme cada día» 💍',
 (n,y)=>'¡'+y.charAt(0).toUpperCase()+y.slice(1)+' de risas, abrazos y capítulos nuevos! 🥂\nLos estantes de este salón están llenos,\npero el más bonito es el que guarda\nlos recuerdos de ustedes dos.\nFeliz aniversario, '+n+' 💗✨',
 (n,y)=>'13 de junio otra vez… y el salón huele a rosas 🌹\nDicen que el amor verdadero no se encuentra:\nse escribe, página a página, con paciencia y ternura.\nUstedes llevan '+y+' escribiendo el suyo\ny yo tengo el honor de ser testigo 📜💍',
 (n,y)=>'Feliz aniversario, '+n+' 💍\n'+y+' juntos y '+HIM+' sigue mirándote\ncomo quien encuentra su libro favorito por primera vez.\nQue vengan muchísimos años más,\ncon muchísimos libros y muchísimos abrazos 🥹💗',
 (n,y)=>'Hoy no hay retos, ni metas, ni páginas pendientes:\nhoy solo se celebra el amor 🎆\n'+y+' desde aquel 13 de junio de 2023.\n'+HIM+' quiere que sepas que sigues siendo\nsu lugar favorito en el mundo 🏰💞'
];
/* --- mesaniversario (cada 13): un mensaje distinto cada mes --- */
const MONTH_MSGS=[
 'Como yo vivo aquí, veo cosas… y te cuento:\n'+HIM+' te ama más cada mes que pasa 💗',
 'Un mesecito más de historia compartida 📖\nY todavía quedan miles de capítulos por escribir juntos ✨',
 HIM+' me pidió recordarte hoy que eres\nlo mejor que le ha pasado en la vida 🥹',
 'Cada 13 el salón se perfuma de rosas 🌹\nes la forma que tengo de celebrarlos',
 'Dato curioso del día: el amor de ustedes\nno cabe en ningún estante. Lo intenté 📚💞',
 'Hoy toca abrazo largo, mensaje bonito\ny, si se puede, leer un ratito juntos 🤗',
 'Si cada mes juntos fuera un libro,\nustedes ya tendrían una biblioteca entera 📚💗',
 'Otro 13, otra razón para sonreír 😊\nGracias por hacer tan feliz a quien construyó este salón',
 'Un mes más de «te quiero», de «¿ya comiste?»\ny de «buenas noches» 🌙 Eso también es amor',
 'Los mejores romances de la literatura\nse quedan cortos al lado del suyo 💌',
 'Hoy el salón entero está de fiesta 🎀\n¡feliz mesaniversario a los dos!',
 'Que nunca falten las risas, los abrazos\ny las ganas de seguir eligiéndose 💞'
];
const YERI_BDAY=[
 n=>'¡22 de mayo! 🎈\nEl arquitecto de este salón, quien puso\ncada estante, cada velita y cada detalle\npensando solo en ti… hoy está de cumpleaños 💙\n'+n+', ¿le recuerdas hoy cuánto lo quieres?',
 n=>'¡Hoy cumple años '+HIM+'! 🎂💙\nYo existo gracias a esas manos que me construyeron.\n'+n+', ¿le das el abrazo más grande de todos de mi parte? 🤗',
 n=>'Feliz cumpleaños a quien llenó de libros, flores\ny sorpresas este rincón para ti 🎁\nHoy el mejor regalo para '+HIM+' es tu sonrisa, '+n+' 💙',
 n=>'22 de mayo: el salón se viste de azul 💙\nQue este nuevo año le traiga a '+HIM+'\nsalud, sueños cumplidos y muchísimo amor… ¡como el tuyo! 🎂'
];
const HER_BDAY=[
 n=>'¡Llegó el día más esperado del salón! 🎈\n'+HIM+' me tiene prohibido contar cuánto habló de hoy…\npero te ama tanto que hasta los libros lo saben 🥹\nGracias por existir, '+n+' 🎂💗',
 n=>'¡Feliz cumpleaños, '+n+'! 🎂\nHoy todos los personajes del salón salieron de sus libros\npara cantarte. Yo desafino un poquito, pero con amor 🎶📚',
 n=>'Un año más de la lectora más bonita del mundo 👑\nQue este nuevo capítulo de tu vida tenga\naventuras, calma, risas y finales felices 🎂💗\nCon todo el amor de '+HIM+' (y mío)',
 n=>'26 de agosto: el día en que el mundo ganó a '+n+' 🌹\nSi pudiera, te regalaría todas las bibliotecas.\n'+HIM+' dice que tú ya eres su mejor regalo 🎁💗',
 n=>'¡Hoy se celebra a la dueña de este salón! 🎉\nPide un deseo, sopla las velitas…\ny luego ven, que te guardé una página especial 📖🎂'
];
function yearsWord(n){ return n===1?'UN AÑO':n+' AÑOS'; }

/* --- fechas propias de ustedes (desde el escritorio de Yeri) --- */
function ourDates(){ return state.ourDates||[]; }
function ourDateToday(d){
  const mo=d.getMonth()+1, day=d.getDate(), y=d.getFullYear();
  for(const x of ourDates()){
    const [Y,M,D]=x.date.split('-').map(Number);
    const hit = x.rep==='mensual' ? day===D && (y>Y || (y===Y && mo>M))
              : x.rep==='unica' ? (y===Y && mo===M && day===D)
              : (mo===M && day===D && y>=Y);
    if(!hit) continue;
    const yrs=y-Y, months=(y-Y)*12+(mo-M);
    const msgs=(x.msgs||[]).filter(Boolean); if(!msgs.length) msgs.push('Hoy es un día especial para ustedes 💗');
    const i=(x.rep==='mensual'?months:yrs)%msgs.length;
    const fill=t=>t.replaceAll('{nombre}',HER()).replaceAll('{años}',String(yrs)).replaceAll('{meses}',String(months));
    return {grand:x.rep!=='mensual', emoji:x.emoji||'💞', title:fill(x.title)+(x.rep==='anual'&&yrs>0?' · '+yrs+(yrs===1?' año':' años'):''), msg:fill(msgs[i])};
  }
  return null;
}

/* reemplaza los mensajes fijos por los que cambian con los años */
specialToday=function(d){
  d=d||new Date();
  const mo=d.getMonth()+1, day=d.getDate(), y=d.getFullYear(), n=HER();
  const own=ourDateToday(d); if(own) return own;
  if(mo===6 && day===13){ const yrs=Math.max(0,y-ANNIV_Y);
    return {grand:true, emoji:'💍🎆', title:'¡FELIZ ANIVERSARIO, '+n+'!', msg:ANNIV_MSGS[yrs%ANNIV_MSGS.length](n, yearsWord(Math.max(1,yrs)).toLowerCase())+'\n\n¡Hoy se celebra A LO GRANDE!'}; }
  if(mo===5 && day===22) return {grand:true, emoji:'🎂💙', title:'¡Hoy cumple años '+HIM+'!', msg:YERI_BDAY[y%YERI_BDAY.length](n)};
  if(mo===8 && day===26) return {grand:true, emoji:'🎂🎈', title:'¡Feliz cumpleaños, '+n+'!', msg:HER_BDAY[y%HER_BDAY.length](n)};
  if(day===13){ const months=Math.max(1,(y-ANNIV_Y)*12+(mo-6));
    return {grand:false, emoji:'💗', title:'Feliz mesaniversario, '+n+' 💗', msg:'¡'+months+(months===1?' mes':' meses')+' juntos\ndesde aquel 13 de junio de 2023! 💗\n'+MONTH_MSGS[months%MONTH_MSGS.length]}; }
  return null;
};

/* --- próximas fechas y cuenta regresiva --- */
function upcomingDates(limit){
  const out=[], today=isoToDate(fmtDay(new Date()));
  for(let k=1;k<=400 && out.length<(limit||5);k++){
    const d=new Date(today); d.setDate(d.getDate()+k);
    const s=specialToday(d);
    if(s && (s.grand || k<=31)) out.push({d, k, s});
  }
  return out;
}
function countdownTeaser(){
  const key='cd'+fmtDay(new Date()); if(state.celeb[key]) return;
  const nx=upcomingDates(1)[0]; if(!nx || !nx.s.grand || nx.k>7) return;
  state.celeb[key]=1; scheduleSave();
  setTimeout(()=>buddySay('⏳ ¡Faltan <b>'+nx.k+'</b> día'+(nx.k===1?'':'s')+' para '+esc(nx.s.title.replace(/^¡|!$/g,''))+'! '+nx.s.emoji+'<br><span style="font-size:12px">Shhh… yo ya estoy preparando el salón 🤫</span>', 11000), 26000);
}
function renderOurDatesCard(){
  const host=document.getElementById('dayPanel'); if(!host) return;
  let c=document.getElementById('ourDatesCard');
  if(!c){ c=document.createElement('div'); c.id='ourDatesCard'; c.className='stat-card'; c.style.gridColumn='1/-1'; host.parentNode.insertBefore(c, host.parentNode.firstChild); }
  const up=upcomingDates(4);
  c.innerHTML='<div class="adv-h">💞 Nuestras próximas fechas</div><div class="od-row">'
    +up.map(u=>'<div class="od"><div class="od-e">'+u.s.emoji+'</div><div class="od-t">'+esc(u.s.title)+'</div><div class="od-d">'+esc(niceDate(fmtDay(u.d)))+'</div><div class="od-k">'+(u.k===1?'¡mañana!':'faltan '+u.k+' días')+'</div></div>').join('')+'</div>';
}

/* --- editor en el escritorio de Yeri --- */
const _rdOD=renderDesk;
renderDesk=function(){
  _rdOD();
  const card=document.querySelector('#deskOv .frame-card');
  if(card && !document.getElementById('odBox')){
    const box=document.createElement('div'); box.id='odBox';
    box.innerHTML='<div class="divider">💞</div><div style="font-family:var(--disp); font-weight:700; font-size:15px">Nuestras fechas</div>'
      +'<div class="lbl" style="font-size:11.5px; font-style:italic">Primera cita, primer beso, el día que se conocieron… El salón las celebrará con tus mensajes. Usa {nombre}, {años} y {meses}.</div>'
      +'<div style="display:flex; gap:6px; margin-top:6px; flex-wrap:wrap">'
      +'<input type="text" id="odTitle" placeholder="p. ej. Nuestra primera cita" style="flex:1; min-width:200px">'
      +'<input type="text" id="odEmoji" placeholder="💞" maxlength="4" style="width:60px; text-align:center"></div>'
      +'<div style="display:flex; gap:6px; margin-top:6px; flex-wrap:wrap; align-items:center"><span class="lbl">fecha original</span><input type="date" id="odDate" style="width:auto">'
      +'<select id="odRep" style="width:auto"><option value="anual">🔁 cada año</option><option value="mensual">🌙 cada mes (ese día)</option><option value="unica">⭐ solo esa vez</option></select></div>'
      +'<textarea id="odMsgs" rows="4" style="margin-top:6px" placeholder="Escribe uno o varios mensajes. Separa cada mensaje con una línea en blanco: el salón mostrará uno distinto cada año (o cada mes)."></textarea>'
      +'<div style="text-align:right; margin-top:6px"><button class="btn rose small" onclick="addOurDate()">Guardar fecha 💞</button></div>'
      +'<div id="odList" style="display:flex; flex-direction:column; gap:6px; margin-top:8px"></div>';
    card.insertBefore(box, card.lastElementChild);
  }
  renderOurDatesList();
};
function addOurDate(){
  const title=document.getElementById('odTitle').value.trim(), date=document.getElementById('odDate').value;
  if(!title||!date){ toast('«Necesito el nombre de la fecha y el día 💞»'); return; }
  const msgs=document.getElementById('odMsgs').value.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
  (state.ourDates=state.ourDates||[]).push({id:'D'+Date.now().toString(36), title, date, rep:document.getElementById('odRep').value,
    emoji:document.getElementById('odEmoji').value.trim()||'💞', msgs});
  ['odTitle','odEmoji','odDate','odMsgs'].forEach(i=>document.getElementById(i).value='');
  scheduleSave(); saveState(); renderOurDatesList(); toast('«Fecha guardada: el salón la celebrará 💞»');
}
function renderOurDatesList(){
  const l=document.getElementById('odList'); if(!l) return;
  const ds=ourDates();
  l.innerHTML=ds.length?'':'<div class="lbl" style="font-style:italic">Aún no hay fechas propias 💞 (el aniversario, los mesaniversarios y los cumpleaños ya vienen incluidos)</div>';
  ds.forEach(x=>{ const r=document.createElement('div'); r.className='idx-item'; r.style.cursor='default';
    r.innerHTML='<span class="pg">'+esc(x.emoji)+'</span><span style="flex:1"><b>'+esc(x.title)+'</b><br><span style="font-size:11.5px; color:var(--ink-soft)">'+esc(niceDate(x.date))+' · '+({anual:'cada año',mensual:'cada mes',unica:'solo esa vez'}[x.rep])+' · '+(x.msgs||[]).length+' mensaje(s)</span></span><button class="chip" style="border-color:var(--wax)">✕</button>';
    r.querySelector('button').onclick=()=>{ if(!confirm('¿Quitar «'+x.title+'»?')) return; state.ourDates=state.ourDates.filter(y=>y!==x); scheduleSave(); renderOurDatesList(); };
    l.appendChild(r); });
}
