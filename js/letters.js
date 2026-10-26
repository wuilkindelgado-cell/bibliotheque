/* v20: cartas secretas — Yeri las escribe en su escritorio con clave; se abren cuando llega su momento */

const COND_TYPES={
  now:{n:'Disponible desde ya', hint:()=>'Lista para abrir 💌'},
  date:{n:'A partir de una fecha', hint:c=>'Se abrirá el '+niceDate(c.v)},
  books:{n:'Al terminar N libros', hint:c=>'Se abrirá cuando termines '+c.v+' libro(s) (llevas '+booksRead()+')'},
  book:{n:'Al terminar un libro específico', hint:c=>'Se abrirá cuando termines «'+(c.label||'un libro especial')+'»'},
  streak:{n:'Al lograr una racha de días', hint:c=>'Se abrirá con una racha de '+c.v+' días seguidos leyendo 🔥'},
  when:{n:'«Ábrela cuando…» (se puede abrir siempre)', hint:c=>'Ábrela cuando '+(c.v||'la necesites')}
};
function letterUnlocked(l){
  const c=l.cond||{t:'now'};
  switch(c.t){
    case 'date': return fmtDay(new Date())>=c.v;
    case 'books': return booksRead()>=(+c.v||1);
    case 'book': return state.sections.some(s=>s.books.some(b=>b.id===c.v));
    case 'streak': return streakCount()>=(+c.v||1) || (state.c.bestStreak||0)>=(+c.v||1);
    default: return true;
  }
}
function lettersNew(){ return (state.letters||[]).filter(l=>!l.openedAt && letterUnlocked(l) && l.cond.t!=='when'); }
function updateLettersBadge(){
  const b=document.getElementById('lettersBadge'); if(!b) return;
  const n=lettersNew().length; b.textContent=n?String(n):'';
}
/* avisa (una sola vez por carta) cuando una carta se desbloquea */
function checkLetters(){
  state.c.bestStreak=Math.max(state.c.bestStreak||0, streakCount());
  (state.letters||[]).forEach(l=>{
    if(!l.announced && !l.openedAt && l.cond.t!=='when' && letterUnlocked(l)){
      l.announced=true; scheduleSave();
      buddySay('💌 ¡Llegó una carta secreta para ti!<br><b>'+esc(l.title)+'</b><br><span style="font-size:12px">Búscala en «Cartas secretas» 🔏</span>', 11000);
    }
  });
  updateLettersBadge();
}
function renderLetters(){
  const g=document.getElementById('lettersGrid'); if(!g) return;
  const ls=(state.letters||[]).slice().sort((a,b)=>(a.created||0)-(b.created||0));
  g.innerHTML='';
  const m=document.getElementById('lettersMotto');
  if(m) m.textContent='Cartas secretas — '+ls.filter(l=>l.openedAt).length+' de '+ls.length+' abiertas 💌';
  if(!ls.length){
    g.innerHTML='<div class="stat-card" style="grid-column:1/-1; text-align:center"><div style="font-size:34px">💌</div>'
      +'<div style="font-family:var(--hand); font-size:19px; margin-top:6px">Aún no hay cartas en el buzón…<br>pero alguien podría estar escribiéndote una 🤫</div></div>';
    return;
  }
  ls.forEach(l=>{
    const open=letterUnlocked(l);
    const e=document.createElement('div');
    e.className='envelope'+(open?'':' locked')+(open && !l.openedAt && l.cond.t!=='when'?' new':'');
    e.innerHTML='<button class="seal">'+(l.openedAt?'💗':open?'💌':'🔒')+'</button>'
      +'<div class="et">'+esc(l.title)+'</div>'
      +'<div class="ec">'+(l.openedAt?'Abierta el '+niceDate(fmtDay(new Date(l.openedAt))):esc(COND_TYPES[l.cond.t].hint(l.cond)))+'</div>'
      +'<div class="ec" style="font-style:normal">de '+esc(l.from||'Yeri')+'</div>';
    e.onclick=()=>{ if(open) readLetter(l.id); else toast('«🔒 '+esc(COND_TYPES[l.cond.t].hint(l.cond))+' 💌»'); };
    g.appendChild(e);
  });
}
function letterOverlay(){
  let ov=document.getElementById('letterOv');
  if(ov) return ov;
  ov=document.createElement('div'); ov.id='letterOv'; ov.className='ficha-overlay'; ov.style.zIndex=75;
  ov.innerHTML='<div class="frame-card" style="width:100%; max-width:560px">'
    +'<div id="lTitle" style="text-align:center; font-family:var(--disp); font-weight:700; font-size:21px; color:var(--bridal-rose)"></div>'
    +'<div id="lMeta" class="lbl" style="text-align:center; font-size:11.5px; font-style:italic; margin-bottom:10px"></div>'
    +'<div class="letter-paper"><div id="lBody"></div><div class="sig" id="lSig"></div></div>'
    +'<div style="text-align:center; margin-top:12px"><button class="btn rose" onclick="document.getElementById(\'letterOv\').classList.remove(\'show\')">La guardo en mi corazón 💗</button></div></div>';
  ov.onclick=ev=>{ if(ev.target===ov) ov.classList.remove('show'); };
  document.querySelector('.win').appendChild(ov);
  return ov;
}
function readLetter(id){
  const l=(state.letters||[]).find(x=>x.id===id); if(!l) return;
  const ov=letterOverlay();
  document.getElementById('lTitle').textContent=l.title;
  document.getElementById('lBody').textContent=l.body;
  document.getElementById('lSig').textContent='— '+(l.from||'Yeri')+' 💌';
  const first=!l.openedAt;
  if(first){ l.openedAt=Date.now(); state.c.letters=(state.c.letters||0)+1; checkAch(); scheduleSave(); }
  document.getElementById('lMeta').textContent=first?'Abriendo el sobre por primera vez… ✨':'Abierta el '+niceDate(fmtDay(new Date(l.openedAt)));
  ov.classList.add('show');
  if(first){ seasonBurstHearts(); }
  renderLetters(); updateLettersBadge();
}
function seasonBurstHearts(){
  const layer=document.getElementById('snowLayer'); if(!layer) return;
  const ov=document.getElementById('letterOv');
  for(let i=0;i<18;i++){ const h=document.createElement('span'); h.className='cel-heart';
    h.textContent=['💗','💌','🌹','✨'][i%4]; h.style.left=(Math.random()*100)+'%';
    h.style.animationDuration=(3+Math.random()*3)+'s'; h.style.animationDelay=(Math.random()*1.5)+'s';
    h.style.fontSize=(14+Math.random()*14)+'px'; ov.appendChild(h); setTimeout(()=>h.remove(), 7000); }
}

/* ---------- escritorio de Yeri (con clave) ---------- */
async function sha(s){ const b=await crypto.subtle.digest('SHA-256', new TextEncoder().encode('bib-desk:'+s)); return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''); }
async function openDesk(){
  if(!state.deskHash){
    const p=await askText('🔏 Escritorio de cartas', 'Es la primera vez: crea una clave SOLO para quien escribe las cartas (mínimo 4 caracteres).', {password:true});
    if(!p) return;
    if(p.length<4){ toast('«La clave necesita al menos 4 caracteres 🔏»'); return; }
    const p2=await askText('🔏 Confirma la clave', 'Repite la clave:', {password:true});
    if(p!==p2){ toast('«Las claves no coinciden 🥺»'); return; }
    state.deskHash=await sha(p); scheduleSave(); saveState();
  } else {
    const p=await askText('🔏 Escritorio de cartas', 'Escribe la clave del escritorio:', {password:true});
    if(!p) return;
    if(await sha(p)!==state.deskHash){ toast('«Esa no es la clave… este escritorio es secreto 🤫»'); return; }
  }
  renderDesk();
}
function deskOverlay(){
  let ov=document.getElementById('deskOv');
  if(ov) return ov;
  ov=document.createElement('div'); ov.id='deskOv'; ov.className='ficha-overlay'; ov.style.zIndex=76;
  ov.innerHTML='<div class="frame-card" style="width:100%; max-width:620px; max-height:92%; overflow-y:auto">'
    +'<div style="text-align:center; font-family:var(--disp); font-weight:700; font-size:20px">🔏 Escritorio de cartas secretas</div>'
    +'<div class="lbl" style="text-align:center; font-size:11.5px; font-style:italic">Solo tú ves esto. Escribe, programa y sella 💌</div>'
    +'<div class="divider">🌹</div>'
    +'<input type="hidden" id="dkId">'
    +'<label class="fld">Título del sobre</label><input type="text" id="dkTitle" maxlength="60" placeholder="p. ej. Para cuando termines tu primer libro">'
    +'<label class="fld">La carta</label><textarea id="dkBody" rows="8" placeholder="Escribe aquí con todo tu corazón…"></textarea>'
    +'<div style="display:flex; gap:10px; flex-wrap:wrap">'
    +'<div style="flex:1; min-width:200px"><label class="fld">¿Cuándo se abre?</label><select id="dkCond" onchange="deskCondUI()"></select></div>'
    +'<div style="flex:1; min-width:200px" id="dkValWrap"><label class="fld" id="dkValLbl">Valor</label><span id="dkValBox"></span></div>'
    +'</div>'
    +'<label class="fld">Firma</label><input type="text" id="dkFrom" maxlength="30" value="Yeri">'
    +'<div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px; flex-wrap:wrap">'
    +'<button class="btn small" onclick="deskClear()">Nueva carta ✨</button>'
    +'<button class="btn rose small" onclick="deskSave()">Sellar carta 💌</button></div>'
    +'<div class="divider">✦</div>'
    +'<div style="font-family:var(--disp); font-weight:700; font-size:15px">Cartas en el buzón</div>'
    +'<div id="dkList" style="display:flex; flex-direction:column; gap:6px; margin-top:6px"></div>'
    +'<div class="divider">✦</div>'
    +'<div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:space-between">'
    +'<span style="display:flex; gap:6px; flex-wrap:wrap">'
    +'<button class="btn small" onclick="deskExport()" title="Guarda las cartas en un archivo para llevarlas a otra PC">📤 Exportar paquete</button>'
    +'<button class="btn small" onclick="document.getElementById(\'dkImp\').click()">📥 Importar paquete</button>'
    +'<input type="file" id="dkImp" accept=".json,application/json" style="display:none" onchange="deskImport(this)">'
    +'<button class="btn small" onclick="deskChangePass()">🔑 Cambiar clave</button></span>'
    +'<button class="btn small" onclick="document.getElementById(\'deskOv\').classList.remove(\'show\')">Cerrar</button></div></div>';
  document.querySelector('.win').appendChild(ov);
  const sel=ov.querySelector('#dkCond');
  Object.keys(COND_TYPES).filter(k=>k!=='goal').forEach(k=>{ const o=document.createElement('option'); o.value=k; o.textContent=COND_TYPES[k].n; sel.appendChild(o); });
  return ov;
}
function deskCondUI(val){
  const t=document.getElementById('dkCond').value, box=document.getElementById('dkValBox'), lbl=document.getElementById('dkValLbl');
  document.getElementById('dkValWrap').style.visibility = t==='now' ? 'hidden' : 'visible';
  if(t==='date'){ lbl.textContent='Fecha'; box.innerHTML='<input type="date" id="dkVal">'; }
  else if(t==='books'){ lbl.textContent='Cantidad de libros terminados'; box.innerHTML='<input type="number" id="dkVal" min="1" max="500" value="5">'; }
  else if(t==='streak'){ lbl.textContent='Días seguidos'; box.innerHTML='<input type="number" id="dkVal" min="2" max="365" value="7">'; }
  else if(t==='book'){ lbl.textContent='Libro';
    const all=[...state.floor, ...state.sections.flatMap(s=>s.books)];
    box.innerHTML='<select id="dkVal">'+all.map(b=>'<option value="'+b.id+'">'+esc(b.t)+'</option>').join('')+'</select>'; }
  else if(t==='when'){ lbl.textContent='Ábrela cuando…'; box.innerHTML='<input type="text" id="dkVal" maxlength="60" placeholder="estés triste / me extrañes / no puedas dormir">'; }
  else box.innerHTML='';
  if(val!=null){ const v=document.getElementById('dkVal'); if(v) v.value=val; }
}
function deskClear(){
  document.getElementById('dkId').value=''; document.getElementById('dkTitle').value='';
  document.getElementById('dkBody').value=''; document.getElementById('dkCond').value='now'; deskCondUI();
}
function renderDesk(){
  const ov=deskOverlay();
  const l=document.getElementById('dkList'); l.innerHTML='';
  const ls=state.letters||[];
  if(!ls.length) l.innerHTML='<div class="lbl" style="font-style:italic">El buzón está vacío. ¡Escribe la primera! 💌</div>';
  ls.forEach(x=>{
    const r=document.createElement('div'); r.className='idx-item'; r.style.cursor='default';
    r.innerHTML='<span class="pg">'+(x.openedAt?'💗 leída':letterUnlocked(x)?'💌 lista':'🔒')+'</span><span style="flex:1"><b>'+esc(x.title)+'</b><br><span style="font-size:11.5px; color:var(--ink-soft)">'+esc(COND_TYPES[x.cond.t].hint(x.cond))+'</span></span>'
      +'<button class="chip">✎</button><button class="chip" style="border-color:var(--wax)">✕</button>';
    const [eb, db2]=r.querySelectorAll('button');
    eb.onclick=()=>{ document.getElementById('dkId').value=x.id; document.getElementById('dkTitle').value=x.title;
      document.getElementById('dkBody').value=x.body; document.getElementById('dkFrom').value=x.from||'Yeri';
      document.getElementById('dkCond').value=x.cond.t; deskCondUI(x.cond.v); ov.querySelector('.frame-card').scrollTop=0; };
    db2.onclick=()=>{ if(!confirm('¿Eliminar la carta «'+x.title+'»?')) return; state.letters=state.letters.filter(y=>y!==x); scheduleSave(); renderDesk(); renderLetters(); updateLettersBadge(); };
    l.appendChild(r);
  });
  if(!document.getElementById('dkId').value) deskCondUI();
  ov.classList.add('show');
}
function deskSave(){
  const title=document.getElementById('dkTitle').value.trim(), body=document.getElementById('dkBody').value.trim();
  if(!title || !body){ toast('«La carta necesita título y contenido 💌»'); return; }
  const t=document.getElementById('dkCond').value, ve=document.getElementById('dkVal');
  let v=ve?ve.value:null;
  if((t==='date' || t==='book') && !v){ toast('«Elige '+(t==='date'?'la fecha':'el libro')+' 📅»'); return; }
  const cond={t, v};
  if(t==='book'){ const b=findBook(v); cond.label=b?b.b.t:''; }
  state.letters=state.letters||[];
  const id=document.getElementById('dkId').value;
  const from=document.getElementById('dkFrom').value.trim()||'Yeri';
  if(id){ const x=state.letters.find(y=>y.id===id); if(x) Object.assign(x,{title, body, cond, from, announced:false}); }
  else state.letters.push({id:'L'+Date.now().toString(36), title, body, cond, from, created:Date.now()});
  scheduleSave(); saveState(); deskClear(); renderDesk(); renderLetters(); updateLettersBadge();
  toast('«Carta sellada con lacre 💌 esperará su momento»');
}
async function deskExport(){
  const data=JSON.stringify({kind:'cartas-bibliotheque', letters:state.letters||[]}, null, 1);
  const buf=new TextEncoder().encode(data).buffer;
  if(window.bibFS && bibFS.saveAs){ const p=await bibFS.saveAs('cartas_secretas.json', buf, 'json'); if(p) toast('«Paquete de cartas guardado 📤»'); }
  else { const a=document.createElement('a'); a.download='cartas_secretas.json'; a.href=URL.createObjectURL(new Blob([data],{type:'application/json'})); a.click(); }
}
function deskImport(inp){
  const f=inp.files[0]; inp.value=''; if(!f) return;
  f.text().then(t=>{
    const d=JSON.parse(t); if(!d || d.kind!=='cartas-bibliotheque') throw 0;
    state.letters=state.letters||[]; let n=0;
    d.letters.forEach(l=>{ const ex=state.letters.find(x=>x.id===l.id);
      if(ex) Object.assign(ex, {title:l.title, body:l.body, cond:l.cond, from:l.from}); else { state.letters.push(Object.assign({}, l, {openedAt:null, announced:false})); n++; } });
    scheduleSave(); renderDesk(); renderLetters(); checkLetters();
    toast('«'+n+' carta(s) nueva(s) en el buzón 📥💌»');
  }).catch(()=>toast('«Ese archivo no es un paquete de cartas 🥺»'));
}
async function deskChangePass(){
  const p=await askText('🔑 Nueva clave', 'Mínimo 4 caracteres', {password:true}); if(!p) return;
  if(p.length<4){ toast('«Muy cortita 🔏»'); return; }
  if(await askText('🔑 Confirma', 'Repite la nueva clave:', {password:true})!==p){ toast('«No coinciden 🥺»'); return; }
  state.deskHash=await sha(p); scheduleSave(); toast('«Clave cambiada 🔑»');
}
