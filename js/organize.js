/* v1.2: organizar el salón — importar varios, portada automática, pausa/abandono, deseos, préstamos y sagas */

/* ---------- portada automática ---------- */
/* primera página del PDF como imagen (Blob png) */
async function pdfCoverBlob(blobOrBuf){
  try{
    pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;
    const data=blobOrBuf instanceof Blob ? await blobOrBuf.arrayBuffer() : blobOrBuf;
    const doc=await pdfjsLib.getDocument({data}).promise;
    const pg=await doc.getPage(1);
    const v1=pg.getViewport({scale:1});
    const vp=pg.getViewport({scale:420/v1.width});
    const cv=document.createElement('canvas'); cv.width=vp.width; cv.height=vp.height;
    await pg.render({canvasContext:cv.getContext('2d'), viewport:vp}).promise;
    let meta=null; try{ meta=(await doc.getMetadata()).info; }catch(e){}
    const blob=await new Promise(r=>cv.toBlob(r,'image/jpeg',.86));
    doc.destroy();
    return {blob, meta};
  }catch(e){ return {blob:null, meta:null}; }
}
/* color del lomo a partir de la portada: el tono con más carácter, suavizado al estilo del salón */
async function coverColor(blob){
  try{
    const img=await createImageBitmap(blob);
    const cv=document.createElement('canvas'); cv.width=24; cv.height=36;
    const x=cv.getContext('2d'); x.drawImage(img,0,0,24,36);
    const d=x.getImageData(0,0,24,36).data;
    let best=null, bs=-1, sum=[0,0,0], n=0;
    for(let i=0;i<d.length;i+=4){
      const r=d[i], g=d[i+1], b=d[i+2], mx=Math.max(r,g,b), mn=Math.min(r,g,b);
      const sat=mx?(mx-mn)/mx:0, lum=(mx+mn)/2;
      sum[0]+=r; sum[1]+=g; sum[2]+=b; n++;
      const score=sat*(1-Math.abs(lum-140)/140);
      if(score>bs){ bs=score; best=[r,g,b]; }
    }
    if(bs<=.18) return null; // portada casi sin color (p. ej. página blanca): se queda el color del salón
    const c=best;
    const mix=c.map((v,k)=>Math.round(v*.72+[200,180,160][k]*.28)); // un velo cálido
    return '#'+mix.map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');
  }catch(e){ return null; }
}
function goodMeta(t){ return t && t.length>2 && !/^(microsoft word|untitled|sin título|documento|doc\d|\d+$)/i.test(t.trim()) && !/\.(docx?|pdf|indd)$/i.test(t.trim()); }

/* ---------- importar uno o muchos archivos ---------- */
async function importFiles(files){
  files=[...files];
  const ok=files.filter(f=>bookFormat(f) || mediaFormat(f));
  if(!ok.length){ toast('«No encontré libros ahí… acepto PDF, EPUB, CBZ y audiolibros 📚»'); return; }
  const audios=ok.filter(f=>mediaFormat(f)==='audio');
  const books=ok.filter(f=>!audios.includes(f));
  toast('«Recibiendo '+ok.length+' archivo(s)… ⏳📚»');
  let n=0;
  for(const f of books){ if(await importOne(f)) n++; renderLibrary(); }
  if(audios.length){ if(await importAudiobook(audios)) n++; }
  scheduleSave(); checkAch();
  state.c.bulk=Math.max(state.c.bulk||0, n);
  toast('«¡'+n+' libro(s) cayeron al suelo del salón! 📚✨ Tócalos para leer»');
  buddySay(n>1?'¡Llovieron libros! 📚🌧️ '+n+' tesoros nuevos en el suelo… ¿por cuál empezamos? 🎲':'¡Un libro nuevo! Ya quiero conocerlo 📖✨', 7000);
}
async function importOne(f){
  const fmt=bookFormat(f) || mediaFormat(f); if(!fmt) return false;
  const id=Date.now().toString(36)+Math.floor(Math.random()*99999);
  let t=titleFromFile(f.name), author;
  let cover=null;
  if(fmt==='pdf'){ const r=await pdfCoverBlob(f); cover=r.blob;
    if(r.meta){ if(goodMeta(r.meta.Title)) t=r.meta.Title.trim(); if(goodMeta(r.meta.Author)) author=r.meta.Author.trim(); } }
  else if(fmt==='epub'){ cover=await epubCover(f); }
  else if(fmt==='cbz'){ cover=await cbzCover(f); }
  const bk={id, t, c:covers[Math.floor(Math.random()*covers.length)], desc:'', expect:'', done:false, reread:false,
    justFell:true, hasPdf:true, hasCover:!!cover, hasFloor:false, fmt, page:1, posits:{}, hls:{}, startedDate:null, addedDate:fmtDay(new Date())};
  if(author) bk.author=author;
  await idbPut('files','f_'+id+'_pdf', f);
  fsMirror((fmt==='pdf'?'pdfs/':'libros/')+fsSafe(t)+'_'+id+'.'+fmt, f);
  if(cover){ await idbPut('files','f_'+id+'_cover', cover); urlMap[id+'_cover']=URL.createObjectURL(cover);
    fsMirror('portadas/'+fsSafe(t)+'_'+id+'.jpg', cover); const col=await coverColor(cover); if(col) bk.c=col; }
  state.floor.push(bk);
  return true;
}
/* portada automática al agregar un libro con el formulario, si no se eligió una */
const _addBook12=addBook;
addBook=async function(){
  const f=nbFiles.pdf;
  if(f && !nbFiles.cover && bookFormat(f)==='pdf'){ const r=await pdfCoverBlob(f); if(r.blob) nbFiles.cover=r.blob; }
  const before=state.floor.length;
  await _addBook12();
  const b=state.floor[state.floor.length-1];
  if(state.floor.length>before && b && b.hasCover && urlMap[b.id+'_cover']){
    const bl=await idbGet('files','f_'+b.id+'_cover'); const col=bl && await coverColor(bl);
    if(col){ b.c=col; renderLibrary(); scheduleSave(); }
  }
};
/* portadas para los libros antiguos que no tienen */
async function makeMissingCovers(){
  const all=[...state.floor, ...state.sections.flatMap(s=>s.books)].filter(b=>b.id && b.hasPdf && !b.hasCover);
  if(!all.length){ toast('«Todos tus libros ya tienen portada 🖼️✨»'); return; }
  toast('«Pintando '+all.length+' portada(s)… 🎨⏳»');
  let n=0;
  for(const b of all){
    const bl=await idbGet('files','f_'+b.id+'_pdf'); if(!bl) continue;
    const fmt=b.fmt||'pdf';
    const cover=fmt==='pdf' ? (await pdfCoverBlob(bl)).blob : fmt==='epub' ? await epubCover(bl) : fmt==='cbz' ? await cbzCover(bl) : null;
    if(!cover) continue;
    await idbPut('files','f_'+b.id+'_cover', cover); urlMap[b.id+'_cover']=URL.createObjectURL(cover);
    fsMirror('portadas/'+fsSafe(b.t)+'_'+b.id+'.jpg', cover);
    b.hasCover=true; const col=await coverColor(cover); if(col) b.c=col; n++;
  }
  renderLibrary(); scheduleSave();
  toast('«¡'+n+' portada(s) nuevas en tu salón! 🖼️💗»');
}

/* ---------- arrastrar y soltar en la ventana ---------- */
function initDrop(){
  let depth=0;
  const ov=document.createElement('div'); ov.id='dropOv';
  ov.innerHTML='<div><div style="font-size:54px">📚</div><div style="font-family:var(--disp); font-weight:700; font-size:26px">Suelta aquí tus libros</div><div style="font-family:var(--hand); font-size:19px">PDF · EPUB · CBZ (cómics) · audiolibros — todos a la vez si quieres ✨</div></div>';
  document.querySelector('.win').appendChild(ov);
  const isFiles=e=>e.dataTransfer && [...e.dataTransfer.types].includes('Files');
  window.addEventListener('dragenter', e=>{ if(!isFiles(e)) return; e.preventDefault(); depth++; ov.classList.add('show'); });
  window.addEventListener('dragover', e=>{ if(!isFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect='copy'; });
  window.addEventListener('dragleave', e=>{ if(!isFiles(e)) return; depth=Math.max(0,depth-1); if(!depth) ov.classList.remove('show'); });
  window.addEventListener('drop', e=>{
    if(!isFiles(e)) return;
    e.preventDefault(); depth=0; ov.classList.remove('show');
    if(document.getElementById('v-welcome').classList.contains('active') || document.getElementById('v-register').classList.contains('active')){ toast('«Primero entremos al salón 🚪✨»'); return; }
    show('v-library'); importFiles(e.dataTransfer.files);
  });
}

/* ---------- en pausa / abandonado (sin culpa) ---------- */
function setBookStatus(id, st){
  const loc=findBook(id); if(!loc || loc.where!=='floor') return;
  const b=loc.b;
  if(st){ b.status=st; b.statusDate=fmtDay(new Date()); } else { delete b.status; delete b.statusDate; b.justFell=true; }
  if(st==='abandonado') state.c.abandon=(state.c.abandon||0)+1;
  closeEdit(); closeRincon(); renderLibrary(); scheduleSave(); checkAch();
  toast(st==='pausa' ? '«<b>'+esc(b.t)+'</b> descansa en el rincón ⏸️ Te guardo la página '+(b.page||1)+'»'
    : st==='abandonado' ? '«<b>'+esc(b.t)+'</b> se fue al rincón sin culpa 🕊️ No todos los libros son para todos los momentos»'
    : '«¡<b>'+esc(b.t)+'</b> volvió al suelo! Seguimos en la página '+(b.page||1)+' 📖»');
}
function renderRincon(){
  const wall=document.getElementById('wall'); if(!wall) return;
  const list=state.floor.map((b,i)=>({b,i})).filter(x=>x.b.status);
  if(!list.length) return;
  const c=document.createElement('div'); c.className='cabinet rincon';
  c.innerHTML='<div class="cname">🕰️ RINCÓN DE PAUSA</div>';
  const plank=document.createElement('div'); plank.className='plank';
  list.forEach(({b})=>{
    const e=document.createElement('div'); e.className='rbook'+(b.status==='abandonado'?' aband':'');
    const u=urlMap[b.id+'_cover'];
    e.style.background=u?'url('+u+') center/cover':'linear-gradient(150deg,'+b.c+',#6b5646)';
    e.innerHTML='<span>'+(b.status==='pausa'?'⏸':'🕊️')+'</span>';
    e.title=b.t+' — '+(b.status==='pausa'?'en pausa':'abandonado sin culpa')+' desde el '+niceDate(b.statusDate)+' · toca para decidir';
    e.onclick=()=>openRincon(b.id);
    plank.appendChild(e);
  });
  c.appendChild(plank);
  wall.insertBefore(c, document.getElementById('addCab'));
}
function openRincon(id){
  const loc=findBook(id); if(!loc) return; const b=loc.b;
  let ov=document.getElementById('rinconOv');
  if(!ov){ ov=document.createElement('div'); ov.id='rinconOv'; ov.className='ficha-overlay'; ov.style.zIndex=40;
    ov.onclick=e=>{ if(e.target===ov) closeRincon(); };
    document.getElementById('v-library').appendChild(ov); }
  ov.innerHTML='<div class="frame-card" style="width:100%; max-width:330px; text-align:center">'
    +'<div style="font-family:var(--disp); font-weight:700; font-size:18px">'+esc(b.t)+'</div>'
    +'<div class="lbl" style="font-style:italic; font-size:12px; margin:4px 0 10px">'+(b.status==='pausa'?'⏸️ En pausa':'🕊️ Abandonado sin culpa')+' desde el '+niceDate(b.statusDate)+' · ibas en la página '+(b.page||1)+'</div>'
    +'<div style="display:flex; flex-direction:column; gap:7px">'
    +'<button class="btn rose small" onclick="setBookStatus(\''+b.id+'\', null)">▶ Retomar la lectura</button>'
    +(b.status==='pausa'?'<button class="btn small" onclick="setBookStatus(\''+b.id+'\', \'abandonado\')">🕊️ Dejarlo ir sin culpa</button>':'<button class="btn small" onclick="setBookStatus(\''+b.id+'\', \'pausa\')">⏸ Solo en pausa</button>')
    +'<button class="btn blue small" onclick="closeRincon(); openEdit(\''+b.id+'\')">✎ Editar o eliminar</button>'
    +'<button class="btn small" onclick="closeRincon()">Cerrar</button></div></div>';
  ov.classList.add('show');
}
function closeRincon(){ const o=document.getElementById('rinconOv'); if(o) o.classList.remove('show'); }
const _rl12=renderLibrary; renderLibrary=function(){ const r=_rl12(); renderRincon(); return r; };

/* botones de estado y campos de saga dentro de «Editar libro» */
const _oe12=openEdit;
openEdit=function(id){
  _oe12(id);
  const loc=findBook(id); if(!loc) return; const b=loc.b;
  const st=document.getElementById('edStatus');
  st.style.display=loc.where==='floor'&&!b.done?'flex':'none';
  st.innerHTML=b.status
    ? '<button class="chip" onclick="setBookStatus(\''+id+'\', null)">▶ Retomar</button>'
    : '<button class="chip" onclick="setBookStatus(\''+id+'\', \'pausa\')">⏸ Poner en pausa</button><button class="chip" onclick="setBookStatus(\''+id+'\', \'abandonado\')">🕊️ Abandonar sin culpa</button>';
  document.getElementById('edSaga').value=(b.series&&b.series.name)||'';
  document.getElementById('edSagaN').value=(b.series&&b.series.n)||'';
  document.getElementById('edSagaT').value=(b.series&&b.series.total)||'';
  const dl=document.getElementById('sagaList'); dl.innerHTML='';
  [...new Set(allBooks().map(x=>x.series&&x.series.name).filter(Boolean))].forEach(s=>{ const o=document.createElement('option'); o.value=s; dl.appendChild(o); });
};
const _se12=saveEdit;
saveEdit=async function(){
  const id=editing && editing.id;
  const name=document.getElementById('edSaga').value.trim(), n=parseInt(document.getElementById('edSagaN').value)||null, tot=parseInt(document.getElementById('edSagaT').value)||null;
  await _se12();
  const loc=id && findBook(id); if(!loc) return;
  if(name){ loc.b.series={name, n, total:tot};
    allBooks().forEach(x=>{ if(x.series && x.series.name===name && tot) x.series.total=tot; }); }
  else delete loc.b.series;
  renderLibrary(); scheduleSave();
};

/* ---------- sagas: progreso en el Salón de estadísticas ---------- */
function renderSagas(){
  const box=document.getElementById('sagasCard'); if(!box) return;
  const map={};
  allBooks().forEach(b=>{ if(!b.series||!b.series.name) return;
    const s=map[b.series.name]=map[b.series.name]||{name:b.series.name, total:0, read:[], have:[]};
    s.total=Math.max(s.total, b.series.total||0, b.series.n||0);
    s.have.push(b);
    if(state.sections.some(sec=>sec.books.includes(b))) s.read.push(b);
  });
  const ss=Object.values(map);
  box.innerHTML='<div class="lbl" style="font-family:var(--disp); font-weight:700; font-size:14px; font-style:normal">📚 Mis sagas</div>'
    +(ss.length ? ss.map(s=>{ const tot=s.total||s.have.length, pct=Math.round(s.read.length/tot*100);
      const nums=s.have.map(b=>b.series.n).filter(Boolean).sort((a,b)=>a-b);
      const missing=[]; for(let k=1;k<=tot;k++) if(!nums.includes(k)) missing.push(k);
      return '<div style="margin-top:9px"><div style="display:flex; justify-content:space-between; font-size:13px"><b>'+esc(s.name)+'</b><span>'+s.read.length+' de '+tot+' leídos</span></div>'
        +'<div class="bar" style="height:9px; background:var(--buttercream); border:1px solid var(--gold-dark); border-radius:99px; overflow:hidden; margin:4px 0"><i style="display:block; height:100%; width:'+pct+'%; background:linear-gradient(90deg,var(--rose-quartz),var(--bridal-rose))"></i></div>'
        +(missing.length&&s.total?'<div class="lbl" style="font-size:11px">Te faltan en el salón: n.º '+missing.join(', ')+'</div>':'')+'</div>'; }).join('')
      : '<div class="lbl" style="margin-top:6px">Marca un libro como parte de una saga en ✎ Editar y aquí verás tu progreso 📚</div>');
}

/* ---------- deseos y préstamos ---------- */
function renderWishes(){
  const w=document.getElementById('wishList'); if(!w) return;
  const ws=(state.wishes||[]).slice().sort((a,b)=>(b.prio||1)-(a.prio||1) || a.at-b.at);
  w.innerHTML=ws.length?'':'<div class="lbl" style="font-style:italic">Aún no hay deseos… ¿qué libro sueñas con tener? ✨</div>';
  ws.forEach(x=>{
    const c=document.createElement('div'); c.className='diary-entry';
    c.innerHTML='<span class="ddel" title="Quitar">✕</span><div style="font-family:var(--disp); font-weight:700">'+'⭐'.repeat(x.prio||1)+' '+esc(x.t)+'</div>'
      +(x.author?'<div class="dd">'+esc(x.author)+'</div>':'')+(x.note?'<div style="font-size:12.5px; margin-top:3px">'+esc(x.note)+'</div>':'')
      +'<div class="qbtns"><button class="btn rose small" style="font-size:11px; padding:3px 10px">¡Lo conseguí! 📚</button></div>';
    c.querySelector('.ddel').onclick=()=>{ state.wishes=state.wishes.filter(y=>y!==x); renderWishes(); scheduleSave(); };
    c.querySelector('button').onclick=()=>{
      state.wishes=state.wishes.filter(y=>y!==x); state.c.wishGot=(state.c.wishGot||0)+1; scheduleSave(); checkAch();
      show('v-library'); openAdd();
      document.getElementById('nbTitle').value=x.t; document.getElementById('nbAuthor').value=x.author||''; document.getElementById('nbDesc').value=x.note||'';
      toast('«¡Un deseo cumplido! 🌠 Agrega su archivo o guárdalo así si es de papel»');
    };
    w.appendChild(c);
  });
  const l=document.getElementById('loanList'); if(!l) return;
  const ls=(state.loans||[]).slice().sort((a,b)=>(a.back?1:0)-(b.back?1:0) || String(b.date).localeCompare(String(a.date)));
  l.innerHTML=ls.length?'':'<div class="lbl" style="font-style:italic">Ningún préstamo anotado 🤝</div>';
  ls.forEach(x=>{
    const days=Math.floor((Date.now()-isoToDate(x.date))/864e5);
    const c=document.createElement('div'); c.className='diary-entry'+(!x.back&&days>30?' late':'');
    c.innerHTML='<span class="ddel" title="Quitar">✕</span><div style="font-family:var(--disp); font-weight:700">'+(x.dir==='in'?'📥 ':'📤 ')+esc(x.t)+'</div>'
      +'<div class="dd">'+(x.dir==='in'?'Me lo prestó ':'Se lo presté a ')+'<b>'+esc(x.who)+'</b> el '+niceDate(x.date)+(x.back?' · devuelto el '+niceDate(x.back)+' ✓':' · hace '+days+' día(s)'+(days>30?' ⏰':''))+'</div>'
      +(x.back?'':'<div class="qbtns"><button class="btn small" style="font-size:11px; padding:3px 10px">Devuelto ✓</button></div>');
    c.querySelector('.ddel').onclick=()=>{ state.loans=state.loans.filter(y=>y!==x); renderWishes(); scheduleSave(); };
    const b=c.querySelector('button'); if(b) b.onclick=()=>{ x.back=fmtDay(new Date()); renderWishes(); scheduleSave(); toast('«¡De vuelta a casa! 🏠📚»'); };
    l.appendChild(c);
  });
  const dl=document.getElementById('loanBooks');
  if(dl){ dl.innerHTML=''; allBooks().forEach(b=>{ const o=document.createElement('option'); o.value=b.t; dl.appendChild(o); }); }
}
function addWish(){
  const t=document.getElementById('wsT').value.trim(); if(!t){ toast('«¿Cómo se llama ese libro soñado? ✨»'); return; }
  (state.wishes=state.wishes||[]).push({t, author:document.getElementById('wsA').value.trim(), note:document.getElementById('wsN').value.trim(),
    prio:parseInt(document.getElementById('wsP').value)||1, at:Date.now()});
  ['wsT','wsA','wsN'].forEach(i=>document.getElementById(i).value='');
  renderWishes(); scheduleSave(); checkAch(); toast('«Deseo guardado en el cofre ✨ el universo ya está avisado 🌠»');
}
function addLoan(){
  const t=document.getElementById('lnT').value.trim(), who=document.getElementById('lnW').value.trim();
  if(!t||!who){ toast('«Necesito el libro y la persona 🤝»'); return; }
  (state.loans=state.loans||[]).push({t, who, dir:document.getElementById('lnD').value, date:document.getElementById('lnF').value||fmtDay(new Date())});
  ['lnT','lnW'].forEach(i=>document.getElementById(i).value='');
  renderWishes(); scheduleSave(); toast('«Préstamo anotado 📒 yo vigilo que vuelva 👀»');
}
/* el libro recuerda los préstamos que se alargan */
chatter.push(()=>{ const l=(state.loans||[]).find(x=>!x.back && x.dir!=='in' && (Date.now()-isoToDate(x.date))/864e5>30);
  return l ? '«Psst… <b>'+esc(l.t)+'</b> lleva más de un mes con '+esc(l.who)+'. ¿Le escribimos con cariño? 📚👀»' : '«¿Tienes algún libro soñado? Anótalo en Deseos 🎁 y te aviso cuando lo consigas ✨»'; });
chatter.push(()=>{ const p=state.floor.find(b=>b.status==='pausa' && (Date.now()-isoToDate(b.statusDate))/864e5>20);
  return p ? '«<b>'+esc(p.t)+'</b> sigue en el rincón de pausa… ¿lo retomamos un ratito? ⏸️📖»' : '«Recuerda: dejar un libro no es fracasar, es elegir mejor tu próxima historia 🕊️»'; });
