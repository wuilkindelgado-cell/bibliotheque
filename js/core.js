/* Estado, navegación, biblioteca, estantes, arrastre, ficha, alta de libros y ceremonia */
const state = {
  name:'Lector(a)', fav:'Mi libro',
  sections:[
    {name:'Novelas', decor:'🕯️', books:[]},
    {name:'Poesía', decor:'🏺', books:[]},
    {name:'Historia', decor:'🗝️', books:[]},
    {name:'Filosofía', decor:'🦢', books:[]},
    {name:'Para llorar', decor:'💧', books:[]},
    {name:'Universidad', decor:'✒️', books:[]}
  ],
  floor:[],
  readingIdx:null,
  readDays:[],
  pageLog:{}, timeMin:0, c:{}, ach:{}, celeb:{},
  quotes:[],
  diary:[]
};
const covers = ['#7C8B5E','#8FA8BD','#C48A90','#B08BA5','#A98F6B','#7E8FB0'];
const FACES = ['😴','😐','🙂','😄','🤩'];

/* ===== Navegación ===== */
function show(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.navi button').forEach(b=>b.classList.toggle('on', b.dataset.v===id));
  if(id==='v-library') renderLibrary();
}
function nav(btn){ show(btn.dataset.v); }

function openDoors(){
  doorSound();
  document.getElementById('doors').classList.add('open');
  document.getElementById('welcomeOv').style.opacity=0;
  setTimeout(()=>{ document.getElementById('welcomeOv').style.opacity=1; show('v-register'); }, 950);
}
async function doRegister(){
  const n=document.getElementById('inName').value.trim();
  const f=document.getElementById('inFav').value.trim();
  if(!n){ toast('«Necesito tu nombre para abrirte el salón 🥺✒️»'); document.getElementById('inName').focus(); return; }
  if(!f){ toast('«Cuéntame tu libro favorito… ¡es la llave del salón! 📖🗝️»'); document.getElementById('inFav').focus(); return; }
  state.name=n;
  if(f) state.fav=f;
  const ag=parseInt(document.getElementById('inAge').value); if(ag) state.age=ag;
  /* su libro favorito cae al suelo, con PDF y fotos si las eligió */
  if(f || nbFiles.pdf || nbFiles.cover || nbFiles.floor){
    const id=Date.now().toString(36)+Math.floor(Math.random()*999);
    const bk={id, t:f||'Mi libro favorito', c:covers[Math.floor(Math.random()*covers.length)],
      desc:'Mi libro favorito 💗', done:false, reread:false, justFell:true,
      hasPdf:!!nbFiles.pdf, hasCover:!!nbFiles.cover, hasFloor:!!nbFiles.floor,
      page:1, posits:{}, hls:{}, startedDate:null, addedDate:fmtDay(new Date())};
    const fmt=nbFiles.pdf?bookFormat(nbFiles.pdf):null; if(fmt) bk.fmt=fmt;
    if(nbFiles.pdf){  await idbPut('files','f_'+id+'_pdf',   nbFiles.pdf);  fsMirror((fmt==='epub'?'libros/':'pdfs/')+fsSafe(f)+'_'+id+'.'+fmt, nbFiles.pdf); }
    if(nbFiles.cover){ await idbPut('files','f_'+id+'_cover', nbFiles.cover); urlMap[id+'_cover']=URL.createObjectURL(nbFiles.cover); fsMirror('portadas/'+fsSafe(f)+'_'+id+'.png', nbFiles.cover); }
    if(nbFiles.floor){ await idbPut('files','f_'+id+'_floor', nbFiles.floor); urlMap[id+'_floor']=URL.createObjectURL(nbFiles.floor); fsMirror('suelo/'+fsSafe(f)+'_'+id+'.png', nbFiles.floor); }
    state.floor.push(bk);
    nbFiles={pdf:null, cover:null, floor:null};
  }
  document.querySelectorAll('.buddy-name').forEach(e=>e.textContent=state.fav);
  document.getElementById('sideCap').textContent='soy '+state.fav+' ✨';
  document.getElementById('profChip').textContent='👤 '+state.name;
  renderLibrary();
  show('v-library');
  toast(`«¡${state.name}! Soy <b>${state.fav}</b>… ¡y ahora estoy vivo! 🎀 Esta es tu biblioteca.»`);
  setTimeout(startTutorial, 1600);
}

/* ===== Render ===== */
function renderLibrary(){
  const wall=document.getElementById('wall'); wall.innerHTML='';
  state.sections.forEach((sec,si)=>{
    const c=document.createElement('div'); c.className='cabinet';
    c.innerHTML=`<div class="cname">❦ ${sec.name.toUpperCase()} 🌹</div>
                 <button class="cdel" title="Eliminar estante" onclick="delSection(${si})">✕</button>`;
    const plank=document.createElement('div'); plank.className='plank'; plank.dataset.si=si;
    if(sec.decor){ const d=document.createElement('span'); d.className='decor'; d.textContent=sec.decor; plank.appendChild(d); }
    if(!sec.books.length){
      const h=document.createElement('span'); h.className='empty-hint'; h.textContent='estante vacío…'; plank.appendChild(h);
    }
    sec.books.forEach((b,bi)=>{
      const s=document.createElement('div'); s.className='spine';
      s.style.background=`linear-gradient(180deg, ${b.c}, ${b.c}88), linear-gradient(#E8DCC6,#E8DCC6)`;
      s.style.backgroundBlendMode='multiply';
      s.innerHTML=`<span>${esc(b.t)}</span>${b.rereads>0?'<span class="rr">↻</span>':''}${b.series&&b.series.n?'<span class="sg" title="'+esc(b.series.name)+'">'+b.series.n+'</span>':''}`;
      s.title=b.t+(b.author?' — '+b.author:'')+' · clic derecho para editar'; s.dataset.id=b.id||''; attachSpineEvents(s,si,bi);
      s.addEventListener('contextmenu', ev=>{ ev.preventDefault(); openEdit(b.id); });
      plank.appendChild(s);
    });
    c.appendChild(plank); wall.appendChild(c);
  });
  // Tarjeta "agregar estante"
  const add=document.createElement('div'); add.className='add-cabinet'; add.id='addCab';
  add.innerHTML='<span class="plus">➕</span><span>Nuevo estante</span>';
  add.onclick=startAddSection;
  wall.appendChild(add);

  const fl=document.getElementById('floorBooks'); fl.innerHTML='';
  state.floor.forEach((b,i)=>{
    if(b.status) return; /* v1.2: en pausa o abandonado → vive en el rincón */
    const e=document.createElement('div');
    e.className='fbook tilt'+((i%3)+1)+(b.done?' done':'')+(b.reread?' reread':'')+(b.justFell?' falling':'');
    e.dataset.id=b.id||'';
    const fURL = b.id && (urlMap[b.id+'_floor'] || urlMap[b.id+'_cover']); /* v1.2: sin imagen de suelo, se ve su portada */
    if(fURL){ e.classList.add('hasimg'); e.style.background='url('+fURL+')'; e.title=b.t; }
    else e.style.background = b.reread
      ? `linear-gradient(150deg, ${b.c} 30%, #D8A0AA 100%)`
      : `linear-gradient(150deg, ${b.c}, #6b5646)`;
    e.innerHTML=`<div class="cov">${esc(b.t)}</div>${b.reread?'<span class="rrtag">↻ relectura</span>':''}`
      +`<span class="fedit" title="Editar o eliminar">✎</span>`;
    if(!fURL) e.title=b.t;
    e.title+=' · clic derecho o ✎ para editar';
    e.addEventListener('contextmenu', ev=>{ ev.preventDefault(); openEdit(b.id); });
    attachBookEvents(e, i, b);
    fl.appendChild(e); b.justFell=false;
  });
  filterBooks();
  if(typeof updateGoal==='function') updateGoal();
  if(typeof updateResumeBtn==='function') updateResumeBtn();
}

/* ===== Agregar / eliminar estantes ===== */
function startAddSection(){
  const add=document.getElementById('addCab');
  add.onclick=null;
  add.innerHTML='<span class="plus">🏷️</span>'+
    '<input type="text" id="newSecName" placeholder="Nombre del estante…" maxlength="24">'+
    '<div style="display:flex; gap:8px"><button class="btn small" onclick="event.stopPropagation(); renderLibrary()">Cancelar</button>'+
    '<button class="btn rose small" onclick="event.stopPropagation(); confirmAddSection()">Crear ⚜</button></div>';
  document.getElementById('newSecName').focus();
  document.getElementById('newSecName').addEventListener('keydown',e=>{ if(e.key==='Enter') confirmAddSection(); });
}
function confirmAddSection(){
  const v=document.getElementById('newSecName').value.trim();
  if(!v){ toast('«Ponle un nombre bonito a tu estante 🥺»'); return; }
  const decors=['🕯️','🏺','🗝️','🦢','🖼️','👑','🌹','☕'];
  state.sections.push({name:v, decor:decors[state.sections.length % decors.length], books:[]});
  renderLibrary();
  const unlocked = state.sections.length>=8 ? ' · Logro: 🏛️ Curador(a)' : '';
  toast(`«¡El estante “<b>${v}</b>” ya luce en tu salón! ⚜»${unlocked}`);
}
function delSection(si){
  const sec=state.sections[si];
  if(sec.books.length){ toast(`«“${sec.name}” aún guarda libros… muévelos a otro estante primero 🥺»`); return; }
  state.sections.splice(si,1); renderLibrary();
  toast(`«El estante “${sec.name}” se retiró del salón con una reverencia 🖼️»`);
}

/* ===== Tap vs Drag ===== */
function attachBookEvents(el, i, b){
  el.addEventListener('pointerdown', ev=>{
    ev.preventDefault();
    if(ev.button===2) return;
    if(ev.target.closest('.fedit')){ ev.stopPropagation(); openEdit(b.id); return; }
    const start={x:ev.clientX, y:ev.clientY};
    let moved=false, ghost=null;
    const move=e2=>{
      const dx=e2.clientX-start.x, dy=e2.clientY-start.y;
      if(!moved && Math.hypot(dx,dy)>10){
        if(!b.done){ cleanup(); toast('«Aún no lo terminas… ¡sigue leyendo! 😉»'); return; }
        moved=true; el.classList.add('dragging');
        document.querySelectorAll('.plank').forEach(p=>p.classList.add('droptarget'));
        ghost=document.createElement('div'); ghost.className='drag-ghost';
        ghost.style.background=el.style.background;
        ghost.innerHTML=`<div class="cov">${b.t}</div>`;
        document.body.appendChild(ghost);
      }
      if(moved && ghost){
        ghost.style.left=e2.clientX+'px'; ghost.style.top=e2.clientY+'px';
        document.querySelectorAll('.plank').forEach(p=>{
          const r=p.getBoundingClientRect();
          p.classList.toggle('dropover', e2.clientX>=r.left && e2.clientX<=r.right && e2.clientY>=r.top && e2.clientY<=r.bottom);
        });
      }
    };
    const up=e2=>{
      if(moved){
        const target=[...document.querySelectorAll('.plank')].find(p=>{
          const r=p.getBoundingClientRect();
          return e2.clientX>=r.left && e2.clientX<=r.right && e2.clientY>=r.top && e2.clientY<=r.bottom;
        });
        cleanup();
        if(target){ dropOnShelf(i, parseInt(target.dataset.si)); }
        else{ renderLibrary(); toast('«Casi… suéltalo sobre un estante iluminado ✨»'); }
      } else { cleanup(); tapFloorBook(i); }
    };
    const cleanup=()=>{
      window.removeEventListener('pointermove',move);
      window.removeEventListener('pointerup',up);
      window.removeEventListener('pointercancel',cleanup);
      el.classList.remove('dragging');
      document.querySelectorAll('.plank').forEach(p=>p.classList.remove('droptarget','dropover'));
      if(ghost) ghost.remove();
    };
    window.addEventListener('pointermove',move);
    window.addEventListener('pointerup',up);
    window.addEventListener('pointercancel',cleanup);   /* en pantallas táctiles: el dedo empezó a desplazar la página */
  });
}

/* ===== Reordenar / mover lomos dentro de los estantes ===== */
function attachSpineEvents(el, si, bi){
  el.addEventListener('pointerdown', ev=>{
    ev.preventDefault();
    if(ev.button===2) return;
    const start={x:ev.clientX, y:ev.clientY};
    let moved=false, ghost=null;
    const move=e2=>{
      if(!moved && Math.hypot(e2.clientX-start.x, e2.clientY-start.y)>10){
        moved=true; el.style.opacity=.35;
        document.querySelectorAll('.plank').forEach(p=>p.classList.add('droptarget'));
        ghost=document.createElement('div'); ghost.className='drag-ghost spineg';
        ghost.style.background=el.style.background;
        ghost.style.backgroundBlendMode='multiply';
        document.body.appendChild(ghost);
      }
      if(moved && ghost){
        ghost.style.left=e2.clientX+'px'; ghost.style.top=e2.clientY+'px';
        document.querySelectorAll('.plank').forEach(p=>{
          const r=p.getBoundingClientRect();
          p.classList.toggle('dropover', e2.clientX>=r.left&&e2.clientX<=r.right&&e2.clientY>=r.top&&e2.clientY<=r.bottom);
        });
      }
    };
    const up=e2=>{
      if(moved){
        const target=[...document.querySelectorAll('.plank')].find(p=>{
          const r=p.getBoundingClientRect();
          return e2.clientX>=r.left&&e2.clientX<=r.right&&e2.clientY>=r.top&&e2.clientY<=r.bottom;
        });
        cleanup();
        if(target){
          const ti=parseInt(target.dataset.si);
          const spines=[...target.querySelectorAll('.spine')];
          let idx=spines.length;
          for(let k=0;k<spines.length;k++){
            const r=spines[k].getBoundingClientRect();
            if(e2.clientX < r.left + r.width/2){ idx=k; break; }
          }
          moveSpine(si,bi,ti,idx);
        } else { renderLibrary(); }
      } else { cleanup(); openFicha(si,bi); }
    };
    const cleanup=()=>{
      window.removeEventListener('pointermove',move);
      window.removeEventListener('pointerup',up);
      window.removeEventListener('pointercancel',cleanup);
      el.style.opacity=1;
      document.querySelectorAll('.plank').forEach(p=>p.classList.remove('droptarget','dropover'));
      if(ghost) ghost.remove();
    };
    window.addEventListener('pointermove',move);
    window.addEventListener('pointerup',up);
    window.addEventListener('pointercancel',cleanup);   /* en pantallas táctiles: el dedo empezó a desplazar la página */
  });
}
function moveSpine(si,bi,ti,idx){
  const b=state.sections[si].books.splice(bi,1)[0];
  if(ti===si && bi<idx) idx--;
  state.sections[ti].books.splice(idx,0,b);
  renderLibrary();
  toast(ti===si
    ? '«Reacomodado con elegancia 🖼️»'
    : `«<b>${b.t}</b> se mudó al estante “${state.sections[ti].name}” 🏛️»`);
}

function dropOnShelf(fi, si){
  const b=state.floor.splice(fi,1)[0];
  const wasReread=b.reread;
  /* v20: se conservan todos los datos del libro (autor, formato, reseña, etc.) */
  const sb=Object.assign({}, b, {faces:b.faces||4,
    rereads:(b.rereads||0)+(wasReread?1:0), doneDate:b.doneDate||fmtDay(new Date())});
  ['done','reread','justFell','page','loc'].forEach(k=>delete sb[k]);
  state.sections[si].books.push(sb);
  if(state.readingIdx!=null){ if(state.readingIdx===fi) state.readingIdx=null; else if(state.readingIdx>fi) state.readingIdx--; }
  scheduleSave(); renderStats(); checkAch();
  renderLibrary();
  toast(wasReread
    ? `«¡<b>${b.t}</b> regresó a su hogar tras la relectura! ↻🏆»`
    : `«¡<b>${b.t}</b> ya vive en “${state.sections[si].name}”! Jamás volverá al suelo 🏆»`);
  setTimeout(checkUnlocks, 2200);
}

/* ===== Ficha ===== */
let ficha={si:null, bi:null};
function openFicha(si,bi){
  ficha={si,bi};
  const b=state.sections[si].books[bi];
  const cURL=b.id && urlMap[b.id+'_cover'];
  document.getElementById('fCover').style.background = cURL
    ? 'url('+cURL+') center/cover' : `linear-gradient(150deg, ${b.c}, #6b5646)`;
  document.getElementById('fCoverT').textContent=cURL?'':b.t;
  document.getElementById('fTitle').textContent=b.t;
  const mm=b.mins?(b.mins<60? b.mins+' min':Math.floor(b.mins/60)+' h '+(b.mins%60)+' m'):null;
  document.getElementById('fMeta').textContent=(b.author?b.author+' · ':'')+`Estante “${state.sections[si].name}” · Terminado`+(b.doneDate?' el '+niceDate(b.doneDate):'')+(b.rereads?` · releído ×${b.rereads}`:'')+(mm?` · ⏱️ ${mm} de lectura`:'');
  document.getElementById('fFaces').textContent=faceSet()[(b.faces||4)-1];
  /* v20: expectativa vs. reseña — lo que esperabas y lo que sentiste */
  const parts=[];
  if(b.expect) parts.push('<div class="fx"><b>Antes de leerlo esperabas…</b><br>'+esc(b.expect)+'</div>');
  const rv=b.review || (!b.expect ? b.desc : '');
  if(rv) parts.push('<div class="fx"><b>'+(b.expect?'Y al terminarlo sentiste…':'Tu reseña')+'</b><br>'+esc(rv)+'</div>');
  if(b.favPart) parts.push('<div class="fx"><b>Tu parte favorita</b><br>'+esc(b.favPart)+'</div>');
  document.getElementById('fDesc').innerHTML=parts.join('')||'Sin descripción registrada.';
  document.getElementById('fichaOv').classList.add('show');
}
function closeFicha(){ document.getElementById('fichaOv').classList.remove('show'); }
function rereadBook(){
  const {si,bi}=ficha; if(si==null) return;
  const b=state.sections[si].books.splice(bi,1)[0];
  state.floor.push(Object.assign({}, b, {rereads:b.rereads||0, done:false, reread:true,
    justFell:true, posits:b.posits||{}, hls:b.hls||{}, page:1, loc:null, startedDate:fmtDay(new Date())}));
  scheduleSave();
  closeFicha(); renderLibrary();
  toast(`«¡Qué emoción, vas a releer <b>${b.t}</b>! 📖↻ Cayó al suelo con su marco de relectura…»`);
}

/* ===== Libros ===== */
let nbFiles={pdf:null, cover:null, floor:null};
function openAdd(){
  nbFiles={pdf:null, cover:null, floor:null};
  document.getElementById('nbTitle').value=''; document.getElementById('nbDesc').value='';
  document.getElementById('nbAuthor').value='';
  const pb=document.getElementById('nbPdfBtn'); pb.textContent='Elegir PDF o EPUB…'; pb.style.borderColor='';
  ['pvCover','pvFloor'].forEach(id=>{ const e=document.getElementById(id);
    e.classList.remove('ok'); e.style.backgroundImage='';
    e.innerHTML = id==='pvCover' ? 'Portada<br>🖼️ toca para elegir' : 'Libro en el suelo<br>🛋️ toca para elegir'; });
  document.getElementById('addOv').classList.add('show');
}
function closeAdd(){ document.getElementById('addOv').classList.remove('show'); }
function pickPdf(inp, btnId){
  const f=inp.files[0]; if(!f) return;
  if(!bookFormat(f)){ toast('«Ese archivo no es PDF ni EPUB 🥺»'); inp.value=''; return; }
  nbFiles.pdf=f;
  const b=document.getElementById(btnId||'nbPdfBtn');
  b.textContent='✓ '+f.name.slice(0,32)+(f.name.length>32?'…':''); b.style.borderColor='var(--sage)';
  /* v20: si no hay título aún, lo propongo desde el nombre del archivo */
  const ti=document.getElementById('nbTitle');
  if(btnId==='nbPdfBtn' && ti && !ti.value.trim()) ti.value=titleFromFile(f.name);
  inp.value='';
}
function pickImg(inp, pvId){
  const f=inp.files[0]; if(!f) return;
  nbFiles[pvId.indexOf('Cover')>-1?'cover':'floor']=f;
  const pv=document.getElementById(pvId);
  pv.classList.add('ok'); pv.innerHTML='';
  pv.style.backgroundImage='url('+URL.createObjectURL(f)+')';
  inp.value='';
}
async function addBook(){
  const t=(document.getElementById('nbTitle').value.trim())||'Libro sin título';
  const d=document.getElementById('nbDesc').value.trim();
  const au=document.getElementById('nbAuthor').value.trim();
  const id=Date.now().toString(36)+Math.floor(Math.random()*999);
  const fmt=nbFiles.pdf?bookFormat(nbFiles.pdf):null;
  const bk={id, t, c:covers[Math.floor(Math.random()*covers.length)], desc:d, expect:d, done:false, reread:false,
    justFell:true, hasPdf:!!nbFiles.pdf, hasCover:!!nbFiles.cover, hasFloor:!!nbFiles.floor,
    page:1, posits:{}, hls:{}, startedDate:null, addedDate:fmtDay(new Date())};
  if(au) bk.author=au;
  if(fmt) bk.fmt=fmt;
  if(nbFiles.pdf){  await idbPut('files','f_'+id+'_pdf',   nbFiles.pdf);  fsMirror((fmt==='epub'?'libros/':'pdfs/')+fsSafe(t)+'_'+id+'.'+fmt, nbFiles.pdf); }
  /* v20: un EPUB sin portada elegida trae la suya */
  if(fmt==='epub' && !nbFiles.cover){ const cv=await epubCover(nbFiles.pdf); if(cv){ nbFiles.cover=cv; bk.hasCover=true; } }
  if(nbFiles.cover){ await idbPut('files','f_'+id+'_cover', nbFiles.cover); urlMap[id+'_cover']=URL.createObjectURL(nbFiles.cover); fsMirror('portadas/'+fsSafe(t)+'_'+id+'.png', nbFiles.cover); }
  if(nbFiles.floor){ await idbPut('files','f_'+id+'_floor', nbFiles.floor); urlMap[id+'_floor']=URL.createObjectURL(nbFiles.floor); fsMirror('suelo/'+fsSafe(t)+'_'+id+'.png', nbFiles.floor); }
  state.floor.push(bk);
  closeAdd(); renderLibrary(); scheduleSave();
  toast(`«¡<b>${t}</b> cayó al suelo! ${bk.hasPdf?'Tócalo para leer su PDF 📄':'(sin PDF: podrás sellarlo al terminarlo en papel 🎀)'} Solo subirá al estante cuando lo termines 😉»`);
}
function tapFloorBook(i){
  const b=state.floor[i];
  if(b.done){ toast(`«¡Arrastra <b>${b.t}</b> a su estante! 🏛️🖱️»`); }
  else openReaderFor(i);
}
function finishReading(){
  const b=state.floor[state.readingIdx];
  show('v-library');
  document.getElementById('ceremonyOv').style.display='flex';
  document.getElementById('ceremonyTxt').innerHTML = b&&b.reread
    ? `¡¡${state.name}!! ¡Releíste <b>${b.t}</b>! ¿Cambió algo esta segunda vez? 👀↻`
    : `¡¡${state.name}!! ¡Terminaste <b>${b?.t||'tu libro'}</b>! Estoy tan orgulloso 🥹✨ ¿Qué te pareció?`;
}
function pickFace(btn){
  btn.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('sel'));
  btn.classList.add('sel');
}
function ceremonyDone(){
  const b=state.floor[state.readingIdx];
  if(b){
    b.done=true;
    b.doneDate=fmtDay(new Date());
    const sel=document.querySelector('#cFaces .sel');
    if(sel) b.faces=faceSet().indexOf(sel.textContent)+1;
    const rv=document.getElementById('cReview').value.trim();
    /* v20: la expectativa original se conserva para compararla con la reseña */
    if(rv){ if(b.expect===undefined) b.expect=b.desc||''; b.review=rv; b.desc=rv; state.c.reviews=(state.c.reviews||0)+1; }
    const fp=document.getElementById('cFav').value.trim();
    if(fp) b.favPart=fp;
    document.getElementById('cFav').value='';
    if(sel) sel.classList.remove('sel');
    if(b.startedDate && b.startedDate===b.doneDate) state.c.marathon=1;
  }
  markReadToday();
  document.getElementById('ceremonyOv').style.display='none';
  document.getElementById('cReview').value='';
  renderLibrary(); renderStats(); checkAch(); scheduleSave();
  toast('«¡Ahora arrástralo a su lugar de honor! 🎀🖱️ (y tu calendario ya tiene su florcita de hoy 🌸)»');
}

