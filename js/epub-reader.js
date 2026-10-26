/* v20: lector EPUB (epub.js) integrado con las herramientas del lector */
let epubBook=null, epubR=null, epubSel=null, epubLocReady=false;

function isEpubOpen(){ return !!(epubR && curBook && curBook.fmt==='epub'); }
function closeEpub(){
  try{ if(epubR) epubR.destroy(); }catch(e){}
  try{ if(epubBook) epubBook.destroy(); }catch(e){}
  epubR=null; epubBook=null; epubSel=null; epubLocReady=false;
  document.getElementById('v-reader').classList.remove('epub-mode');
  const h=document.getElementById('epubHost'); if(h) h.remove();
}
function epubTheme(){
  if(!epubR) return;
  const night=document.querySelector('.win').classList.contains('night');
  const warm=settings.warm||0;
  epubR.themes.default({
    'body':{'font-family':'Lora, Georgia, "Times New Roman", serif !important', 'color':'#5A463E !important',
      'background':(night?'#F0E3C4':'#FFFDF6')+' !important', 'line-height':'1.65 !important',
      'filter':'sepia('+(night?22+warm*.6:warm)+'%)', 'padding':'0 6px !important'},
    'p':{'text-align':'justify'},
    '::selection':{'background':'rgba(196,138,144,.45)'}
  });
  epubR.themes.fontSize(Math.round((zoom||1)*100)+'%');
}
async function openEpub(b){
  const A=document.getElementById('pgA');
  const rv=document.getElementById('v-reader'); rv.classList.add('epub-mode');
  state.c.epub=1;
  try{
    const bl=await idbGet('files','f_'+b.id+'_pdf');
    if(!bl){ rv.classList.remove('epub-mode'); showNoPdf(b); return; }
    if(!window.ePub){ throw new Error('motor EPUB no disponible'); }
    const host=document.createElement('div'); host.id='epubHost'; host.className='epub-host';
    document.getElementById('readerPages').insertBefore(host, document.getElementById('sealWrap'));
    epubBook=ePub(await bl.arrayBuffer());
    epubR=epubBook.renderTo(host, {width:'100%', height:'100%', flow:'paginated', spread:doublePage?'auto':'none', allowScriptedContent:false});
    zoom=b.zoom||1; document.getElementById('zoomPct').textContent=Math.round(zoom*100)+'%';
    epubTheme();
    epubR.on('relocated', epubRelocated);
    epubR.on('selected', (cfi, contents)=>{ epubSel={cfi, contents}; });
    epubR.on('keyup', e=>{ if(e.key==='ArrowRight') nextPage(); if(e.key==='ArrowLeft') prevPage(); });
    let ts=null;
    epubR.on('touchstart', e=>{ const t=e.changedTouches[0]; ts={x:t.screenX, y:t.screenY, t:Date.now()}; });
    epubR.on('touchend', e=>{ if(!ts) return; const t=e.changedTouches[0];
      const dx=t.screenX-ts.x, dy=t.screenY-ts.y, dt=Date.now()-ts.t; ts=null;
      if(dt<800 && Math.abs(dx)>55 && Math.abs(dx)>Math.abs(dy)*1.4) turnBy(dx<0?1:-1); });
    epubR.hooks.content.register(c=>{ try{ c.window.addEventListener('wheel', e=>{
      if(Math.abs(e.deltaX)>Math.abs(e.deltaY)*1.2 && Math.abs(e.deltaX)>25){ const n=Date.now(); if(n>(c._lk||0)){ c._lk=n+650; turnBy(e.deltaX>0?1:-1); } } }, {passive:true}); }catch(e){} });
    await epubR.display(b.loc || undefined);
    A.innerHTML='';
    (b.ehls||[]).forEach(h=>epubMark(h));
    updateBmChip();
    toast('«Abriendo tu EPUB 📖 pasa de página con ◀ ▶, las flechas o deslizando el dedo»');
    /* las "páginas" de un EPUB se calculan una sola vez y se guardan */
    const meta=await epubBook.loaded.metadata.catch(()=>null);
    if(meta && !b.author && meta.creator){ b.author=meta.creator; scheduleSave(); }
    if(b.epubLocs){ epubBook.locations.load(b.epubLocs); epubLocReady=true; }
    else { await epubBook.locations.generate(1200); b.epubLocs=epubBook.locations.save(); epubLocReady=true; scheduleSave(); }
    if(epubR && epubR.location) epubRelocated(epubR.location);
  }catch(e){
    console.error(e);
    rv.classList.remove('epub-mode');
    A.innerHTML='<div style="padding:36px 20px; text-align:center; font-style:italic">No pude abrir este EPUB 🥺<br><span style="font-size:12px">'+esc(e.message||'')+'</span></div>';
  }
}
function epubRelocated(loc){
  if(!loc || !loc.start || !curBook) return;
  curBook.loc=loc.start.cfi;
  let pg=null, N=null;
  if(epubLocReady){
    pg=epubBook.locations.locationFromCfi(loc.start.cfi)+1;
    N=epubBook.locations.length()||null;
    curBook.page=pg; if(N) curBook.pagesN=N;
    logPageRead(pg);
  }
  const pct=loc.start.percentage!=null ? Math.round(loc.start.percentage*100) : (pg&&N?Math.round(pg/N*100):0);
  document.getElementById('pgInd').textContent=(pg?'pág. '+pg+(N?' / '+N:''):'—')+' · '+pct+'%';
  document.getElementById('sealWrap').style.display = loc.atEnd ? 'block' : 'none';
  updateBmChip(); scheduleSave();
  window.dispatchEvent(new Event('bib-rendered'));
}
function epubMark(h){
  try{
    epubR.annotations.highlight(h.cfi, {}, ()=>{
      if(!confirm('¿Quitar este subrayado?')) return;
      epubR.annotations.remove(h.cfi, 'highlight');
      const ix=(curBook.ehls||[]).indexOf(h); if(ix>-1) curBook.ehls.splice(ix,1); scheduleSave();
    }, 'epub-hl', {'fill':HL_HEX[h.c]||'#E3C55C', 'fill-opacity':'0.45', 'mix-blend-mode':'multiply'});
  }catch(e){}
}
function epubPage(){ return curBook && curBook.page ? curBook.page : null; }

/* ---------- enganches: cada herramienta del lector sabe hablar EPUB ---------- */
const _orf=openReaderFor;
openReaderFor=async function(i){
  closeEpub();
  const b=state.floor[i];
  if(!(b && b.fmt==='epub' && b.hasPdf && b.id)) return _orf(i);
  state.readingIdx=i; curBook=b; pdfDoc=null;
  state.lastReadId=b.id; scheduleSave();
  document.getElementById('readerTitle').textContent=b.t;
  show('v-reader');
  document.getElementById('sealWrap').style.display='none';
  document.getElementById('pgA').innerHTML='<div style="padding:36px 20px; text-align:center; font-style:italic">Abriendo el libro… 📖</div>';
  document.getElementById('pgB').innerHTML='';
  if(!b.startedDate){ b.startedDate=fmtDay(new Date()); scheduleSave(); }
  return openEpub(b);
};
const _np=nextPage; nextPage=function(){ if(isEpubOpen()) return epubR.next(); return _np(); };
const _pp=prevPage; prevPage=function(){ if(isEpubOpen()) return epubR.prev(); return _pp(); };
const _gp=gotoPage; gotoPage=function(v){
  if(!isEpubOpen()) return _gp(v);
  const p=parseInt(v); if(isNaN(p) || !epubLocReady){ toast('«Aún estoy contando las páginas de este libro… un momentito ⏳»'); return; }
  const n=Math.min(epubBook.locations.length(), Math.max(1,p));
  epubR.display(epubBook.locations.cfiFromLocation(n-1));
  document.getElementById('pgJump').value='';
};
const _sz=setZoom; setZoom=function(z){
  if(!isEpubOpen()) return _sz(z);
  zoom=Math.min(2.4, Math.max(.6, Math.round(z*100)/100));
  document.getElementById('zoomPct').textContent=Math.round(zoom*100)+'%';
  curBook.zoom=zoom; scheduleSave(); epubTheme();
};
const _tp=togglePages; togglePages=function(){
  const r=_tp();
  if(isEpubOpen()){ epubR.spread(doublePage?'auto':'none'); document.getElementById('spread').classList.add('single'); }
  return r;
};
const _tn=toggleNight; toggleNight=function(){ const r=_tn(); epubTheme(); return r; };
const _sw=setWarm; setWarm=function(v){ const r=_sw(v); epubTheme(); return r; };
const _tb=toggleBookmark; toggleBookmark=function(){
  if(!isEpubOpen()) return _tb();
  if(curBook.bmCfi && curBook.bmCfi===curBook.loc){ delete curBook.bmCfi; delete curBook.bookmark; toast('«Marcador retirado 🔖 vuela libre»'); }
  else { curBook.bmCfi=curBook.loc; curBook.bookmark=epubPage()||'★'; toast('«Listón dorado aquí 🔖 toca el chip de arriba para volver»'); }
  updateBmChip(); scheduleSave();
};
const _jb=jumpBookmark; jumpBookmark=function(){ if(isEpubOpen()){ if(curBook.bmCfi) epubR.display(curBook.bmCfi); return; } return _jb(); };
const _dh=doHighlight; doHighlight=function(){
  if(!isEpubOpen()) return _dh();
  if(!epubSel || !epubSel.cfi){ toast('«Primero selecciona un fragmento del texto con el mouse ✍️»'); return; }
  let txt='';
  try{ txt=epubSel.contents.window.getSelection().toString().replace(/\s+/g,' ').trim(); }catch(e){}
  const h={cfi:epubSel.cfi, c:hlColor, q:txt.slice(0,300), d:fmtDay(new Date()), pg:epubPage()};
  (curBook.ehls=curBook.ehls||[]).push(h);
  epubMark(h);
  try{ epubSel.contents.window.getSelection().removeAllRanges(); }catch(e){}
  epubSel=null;
  if(txt){ state.quotes.push({q:h.q, color:hlColor, bk:curBook.t, bid:curBook.id, pg:h.pg, d:h.d}); renderQuotes(); state.c.hl=(state.c.hl||0)+1; checkAch(); }
  scheduleSave();
  toast('«Subrayado guardado ✒️ (tócalo para quitarlo)»');
};
const _pl=placePosit; placePosit=function(){ if(isEpubOpen()){ toast('«En los EPUB las notitas viven en tu Diario 📔 — los posits son para PDF 🗒️»'); return; } return _pl(); };
const _rb=rotBook; rotBook=function(){ if(isEpubOpen()){ toast('«Los EPUB se acomodan solos, no necesitan girarse 😉»'); return; } return _rb(); };
const _rs=readerSearch; readerSearch=function(){ if(isEpubOpen()){ openBookSearch(); return; } return _rs(); };
const _ds=defineSel; defineSel=function(){
  if(isEpubOpen() && epubSel){
    let w=''; try{ w=epubSel.contents.window.getSelection().toString().trim(); }catch(e){}
    w=(w.split(/\s+/)[0]||'').replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g,'');
    if(w){ window.open('https://dle.rae.es/'+encodeURIComponent(w.toLowerCase()), '_blank'); toast('«Buscando <b>'+w+'</b> en la RAE 📚»'); return; }
  }
  return _ds();
};
const _ob=openBookSearch; openBookSearch=function(){
  if(!isEpubOpen()) return _ob();
  document.getElementById('bsRes').innerHTML='<div style="font-style:italic; font-size:12.5px; color:var(--ink-soft)">Escribe una palabra y presiona Buscar ✒️</div>';
  document.getElementById('searchOv').classList.add('show');
  setTimeout(()=>document.getElementById('bsQ').focus(), 60);
};
const _rbs=runBookSearch; runBookSearch=async function(){
  if(!isEpubOpen()) return _rbs();
  const q=document.getElementById('bsQ').value.trim();
  if(q.length<2){ toast('«Dame al menos dos letritas 😉»'); return; }
  const res=document.getElementById('bsRes');
  res.innerHTML='<div style="font-style:italic; font-size:12.5px">Buscando en todo el libro… ⏳</div>';
  const out=[];
  for(const it of epubBook.spine.spineItems){
    try{ await it.load(epubBook.load.bind(epubBook)); out.push(...it.find(q)); }catch(e){}
    try{ it.unload(); }catch(e){}
    if(out.length>=60) break;
  }
  if(!out.length){ res.innerHTML='<div style="font-style:italic; font-size:12.5px">Sin coincidencias de «'+esc(q)+'» 🕊️</div>'; return; }
  res.innerHTML='';
  out.slice(0,60).forEach(r=>{
    const b=document.createElement('button'); b.className='btn small';
    const pg=epubLocReady?epubBook.locations.locationFromCfi(r.cfi)+1:null;
    const ex=esc(r.excerpt||'').replace(new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig'),'<b>$1</b>');
    b.innerHTML=(pg?'<b>pág. '+pg+'</b> · ':'')+ex;
    b.onclick=()=>{ document.getElementById('searchOv').classList.remove('show'); epubR.display(r.cfi); };
    res.appendChild(b);
  });
};
const _tts=ttsToggle; ttsToggle=function(btn){
  if(!isEpubOpen()) return _tts(btn);
  if(!('speechSynthesis' in window)) return _tts(btn);
  if(speaking){ return _tts(btn); }
  let txt='';
  try{ const r=epubR.getRange(epubR.location.start.cfi); const c=epubR.getContents()[0];
    const rr=c.document.createRange(); rr.setStart(r.startContainer, r.startOffset);
    const endR=epubR.getRange(epubR.location.end.cfi); rr.setEnd(endR.endContainer, endR.endOffset);
    txt=rr.toString(); }catch(e){}
  if(!txt){ try{ txt=epubR.getContents()[0].document.body.innerText; }catch(e){} }
  txt=txt.replace(/\s+/g,' ').slice(0,1500);
  const u=new SpeechSynthesisUtterance(txt); u.lang='es-ES'; u.rate=.95;
  u.onend=()=>{ speaking=false; btn.classList.remove('activeTool'); };
  speechSynthesis.speak(u); speaking=true; btn.classList.add('activeTool');
  state.c.tts=1; checkAch(); scheduleSave(); toast('«Te leo en voz alta… 🔊»');
};
const _ubc=updateBmChip; updateBmChip=function(){
  if(!isEpubOpen()) return _ubc();
  const c=document.getElementById('bmChip');
  if(curBook.bmCfi){ c.classList.add('on'); c.textContent='🔖 '+(curBook.bookmark||'★'); } else c.classList.remove('on');
};
const _shw=show; show=function(id){ _shw(id); if(id!=='v-reader' && speaking){ try{ speechSynthesis.cancel(); }catch(e){} speaking=false; } };

/* índice para EPUB: capítulos (tabla de contenidos), subrayados y aviso de posits */
function epubIndex(tab, list, item, empty){
  if(tab==='toc'){
    const toc=(epubBook && epubBook.navigation && epubBook.navigation.toc)||[];
    if(!toc.length){ empty('Este EPUB no trae índice 🥺'); return; }
    const walk=(nodes,lvl)=>nodes.forEach(n=>{ item(null, esc((n.label||'—').trim()), ()=>epubR.display(n.href), lvl?'lvl'+Math.min(lvl,2):'');
      if(n.subitems && n.subitems.length && lvl<2) walk(n.subitems, lvl+1); });
    walk(toc, 0); return;
  }
  if(tab==='hl'){
    const rows=(curBook.ehls||[]);
    if(!rows.length){ empty('Aún no hay subrayados en este libro ✍️'); return; }
    rows.forEach(h=>item(h.pg||null, '<span class="idx-dot" style="display:inline-block; background:'+(HL_HEX[h.c]||'#E3C55C')+'"></span> '+esc(h.q||'(sin texto)'), ()=>epubR.display(h.cfi)));
    return;
  }
  empty('Los posits son para los libros en PDF 🗒️<br>En EPUB, guarda tus pensamientos en el Diario 📔');
}
