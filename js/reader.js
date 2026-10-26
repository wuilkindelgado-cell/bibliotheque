/* Lector PDF */
/* ---------- Lector PDF real (PDF.js) ---------- */
let pdfDoc=null, curPage=1, curBook=null, renderTok=0, zoom=1;
function setZoom(z){
  zoom=Math.min(2.4, Math.max(.6, Math.round(z*100)/100));
  document.getElementById('zoomPct').textContent=Math.round(zoom*100)+'%';
  if(curBook){ curBook.zoom=zoom; scheduleSave(); }
  if(pdfDoc) renderSpread();
}
function zoomIn(){ setZoom(zoom+.15); }
function zoomOut(){ setZoom(zoom-.15); }
function gotoPage(v){
  if(!pdfDoc) return;
  let p=parseInt(v); if(isNaN(p)) return;
  p=Math.min(pdfDoc.numPages, Math.max(1,p));
  if(doublePage && p%2===0 && p>1) p--;
  curPage=p; renderSpread();
  document.getElementById('pgJump').value='';
}
function toggleBookmark(){
  if(!pdfDoc || !curBook){ toast('«Abre un libro con PDF para dejar tu marcador 🔖»'); return; }
  if(curBook.bookmark===curPage){
    delete curBook.bookmark;
    toast('«Marcador retirado 🔖 vuela libre»');
  } else {
    curBook.bookmark=curPage;
    toast('«Listón dorado en la página '+curPage+' 🔖 toca el chip de arriba para volver aquí»');
  }
  updateBmChip(); scheduleSave();
}
function jumpBookmark(){ if(curBook && curBook.bookmark) gotoPage(curBook.bookmark); }
function rotBook(){
  if(!pdfDoc || !curBook){ toast('«Abre un libro con PDF para girarlo 🔄»'); return; }
  curBook.rot=((curBook.rot||0)+90)%360;
  scheduleSave(); renderSpread();
  toast('«Página girada '+curBook.rot+'° 🔄 (ideal para escaneos de lado)»');
}
function defineSel(){
  const sel=window.getSelection();
  let w=(sel && !sel.isCollapsed) ? sel.toString().trim() : '';
  w=(w.split(/\s+/)[0]||'').replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g,'');
  if(!w){ toast('«Selecciona una palabra de la página y toca 📚 Definir»'); return; }
  window.open('https://dle.rae.es/'+encodeURIComponent(w.toLowerCase()), '_blank');
  toast('«Buscando <b>'+w+'</b> en el diccionario de la RAE 📚 (se abre en tu navegador)»');
}
function updateBmChip(){
  const c=document.getElementById('bmChip');
  if(curBook && curBook.bookmark){ c.classList.add('on'); c.textContent='🔖 '+curBook.bookmark; }
  else c.classList.remove('on');
}

/* v15: seguir leyendo */
function resumeReading(){
  const id=state.lastReadId;
  const i=state.floor.findIndex(b=>b.id===id && !b.done);
  if(i>-1) openReaderFor(i);
  else{
    const j=state.floor.findIndex(b=>!b.done);
    if(j>-1) openReaderFor(j);
    else toast('«No hay lecturas pendientes… ¡agrega un tesoro nuevo! 📚»');
  }
}
function updateResumeBtn(){
  const btn=document.getElementById('resumeBtn'); if(!btn) return;
  const b=state.floor.find(x=>x.id===state.lastReadId && !x.done) || state.floor.find(x=>!x.done && x.hasPdf);
  if(b){ btn.classList.add('on'); btn.textContent='▶ Seguir: '+b.t.slice(0,16)+(b.t.length>16?'…':''); }
  else btn.classList.remove('on');
}

/* v15: modo inmersivo */
function toggleZen(btn){
  const on=document.querySelector('.app').classList.toggle('zen');
  if(btn) btn.textContent=on?'🏛️ Salir':'⛶ Inmersivo';
  if(pdfDoc) renderSpread();
  toast(on?'«Solo tú y el libro… el mundo puede esperar ⛶✨»':'«De vuelta al salón 🏛️»');
}

/* v15: meta diaria de páginas */
function updateDayChip(){
  const c=document.getElementById('dayChip'); if(!c) return;
  const today=state.pageLog[fmtDay(new Date())]||0;
  const g=settings.pagesGoal||10;
  c.textContent=(today>=g?'💮':'🌸')+' hoy '+today+'/'+g;
  c.classList.toggle('done', today>=g);
}

/* v15: filtro cálido */
function setWarm(v){
  settings.warm=parseInt(v)||0;
  document.documentElement.style.setProperty('--warm', settings.warm);
  scheduleSave();
}

/* v15: recordatorio de lectura */
function setReminder(v){
  settings.remindAt=v||null;
  scheduleSave();
  if(v){
    if('Notification' in window && Notification.permission==='default') Notification.requestPermission();
    toast('«Te llamaré a leer todos los días a las '+v+' 🔔📖»');
  } else {
    const t=document.getElementById('setRemind'); if(t) t.value='';
    toast('«Recordatorio apagado 🔕»');
  }
}
function checkReminder(){
  if(!settings.remindAt) return;
  const now=new Date();
  const hm=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  const key='r'+fmtDay(now);
  if(hm===settings.remindAt && !state.celeb[key]){
    state.celeb[key]=1; scheduleSave();
    const read=(state.pageLog[fmtDay(now)]||0);
    const msg=read>0
      ? '¡Hora de leer! 🔔 Hoy ya llevas '+read+' paginita(s)… ¿seguimos un ratito más? 📖'
      : '¡Hora de leer! 🔔 Tu libro te extraña… aunque sean '+(settings.pagesGoal||10)+' paginitas 🥺📖';
    buddySay(msg, 12000);
    try{
      if('Notification' in window && Notification.permission==='granted')
        new Notification('Bibliothèque Enchantée 🎀', {body:'¡Hora de leer! Tu salón te espera 📖✨'});
    }catch(e){}
  }
}

/* v15: búsqueda en todo el libro */
let bsCache=null, bsCacheId=null, bsBusy=false;
function openBookSearch(){
  if(!pdfDoc){ toast('«Abre un libro con PDF para buscar en él 🔎»'); return; }
  document.getElementById('bsRes').innerHTML='<div style="font-style:italic; font-size:12.5px; color:var(--ink-soft)">Escribe una palabra y presiona Buscar ✒️</div>';
  document.getElementById('searchOv').classList.add('show');
  setTimeout(()=>document.getElementById('bsQ').focus(), 60);
}
async function ensureBsCache(){
  if(bsCacheId===curBook.id && bsCache) return;
  bsCache=[]; bsCacheId=curBook.id;
  for(let p=1; p<=pdfDoc.numPages; p++){
    try{
      const tc=await pdfDoc.getPage(p).then(pg=>pg.getTextContent());
      bsCache[p]=tc.items.map(it=>it.str).join(' ').replace(/\s+/g,' ');
    }catch(e){ bsCache[p]=''; }
    if(p%25===0) document.getElementById('bsRes').innerHTML='<div style="font-style:italic; font-size:12.5px">Leyendo el libro… pág. '+p+' de '+pdfDoc.numPages+' ⏳</div>';
  }
}
async function runBookSearch(){
  if(bsBusy || !pdfDoc) return;
  const q=document.getElementById('bsQ').value.trim();
  if(q.length<2){ toast('«Dame al menos dos letritas 😉»'); return; }
  bsBusy=true;
  const res=document.getElementById('bsRes');
  res.innerHTML='<div style="font-style:italic; font-size:12.5px">Buscando en todo el libro… ⏳</div>';
  try{
    await ensureBsCache();
    const ql=q.toLowerCase(); const out=[];
    for(let p=1; p<bsCache.length; p++){
      const t=bsCache[p]||''; const tl=t.toLowerCase();
      let ix=tl.indexOf(ql), n=0;
      while(ix>-1 && n<3){
        const a=Math.max(0,ix-38), b=Math.min(t.length, ix+ql.length+52);
        out.push({p, snip:(a>0?'…':'')+t.slice(a,ix)+'⟪'+t.slice(ix,ix+ql.length)+'⟫'+t.slice(ix+ql.length,b)+(b<t.length?'…':'')});
        n++; ix=tl.indexOf(ql, ix+ql.length);
      }
      if(out.length>=60) break;
    }
    if(!out.length){ res.innerHTML='<div style="font-style:italic; font-size:12.5px">Sin coincidencias de «'+q+'» en este libro 🕊️</div>'; }
    else{
      res.innerHTML='';
      out.forEach(r=>{
        const b=document.createElement('button'); b.className='btn small';
        b.innerHTML='<b>pág. '+r.p+'</b> · '+r.snip.replace(/</g,'&lt;').replace('⟪','<b>').replace('⟫','</b>');
        b.onclick=()=>{
          document.getElementById('searchOv').classList.remove('show');
          gotoPage(r.p);
          setTimeout(()=>{ const inp=document.getElementById('rSearch');
            if(inp.style.display==='none') readerSearch();
            inp.value=q; doFind(q); }, 700);
        };
        res.appendChild(b);
      });
      const c=document.createElement('div');
      c.style.cssText='font-size:11.5px; font-style:italic; color:var(--ink-soft); text-align:center; margin-top:4px';
      c.textContent=out.length+' coincidencia(s)'+(out.length>=60?' (mostrando las primeras 60)':'');
      res.appendChild(c);
    }
  } finally { bsBusy=false; }
}
const PDFJS_WORKER = window.__pdfLocal ? 'vendor/pdf.worker.min.js' : 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const seenPages=new Set();
async function openReaderFor(i){
  const b=state.floor[i]; if(!b) return;
  state.readingIdx=i; curBook=b; pdfDoc=null;
  state.lastReadId=b.id; scheduleSave();
  if(bsCacheId!==b.id){ bsCache=null; bsCacheId=null; }
  document.getElementById('readerTitle').textContent=b.t;
  show('v-reader');
  document.getElementById('sealWrap').style.display='none';
  const A=document.getElementById('pgA'), B=document.getElementById('pgB');
  A.innerHTML='<div style="padding:36px 20px; text-align:center; font-style:italic">Abriendo el libro… 📖</div>'; B.innerHTML='';
  if(!b.startedDate){ b.startedDate=fmtDay(new Date()); scheduleSave(); }
  if(!b.hasPdf || !b.id){ showNoPdf(b); return; }
  if(!window.pdfjsLib){
    A.innerHTML='<div style="padding:36px 20px; text-align:center; font-style:italic">No pude cargar el motor de PDF 🥺<br><span style="font-size:12px">(si abriste el archivo en un navegador, se necesita internet la primera vez)</span></div>';
    return;
  }
  try{
    pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;
    const bl=await idbGet('files','f_'+b.id+'_pdf');
    if(!bl){ showNoPdf(b); return; }
    const buf=await bl.arrayBuffer();
    pdfDoc=await pdfjsLib.getDocument({data:buf}).promise;
    b.pagesN=pdfDoc.numPages;
    zoom=b.zoom||1; document.getElementById('zoomPct').textContent=Math.round(zoom*100)+'%';
    updateBmChip();
    curPage=Math.min(Math.max(1, b.page||1), pdfDoc.numPages);
    if(doublePage && curPage%2===0 && curPage>1) curPage--;
    await renderSpread();
    toast(`«${pdfDoc.numPages} páginas nos esperan 📖 pasa de página con ◀ ▶ o las flechas del teclado»`);
  }catch(e){
    A.innerHTML='<div style="padding:36px 20px; text-align:center; font-style:italic">No pude abrir este PDF 🥺</div>';
  }
}
function showNoPdf(b){
  const A=document.getElementById('pgA'), B=document.getElementById('pgB');
  document.getElementById('spread').classList.add('single');
  A.innerHTML='<div style="padding:30px 12px; text-align:center">'
    +'<div style="font-size:30px; margin-bottom:8px">📖</div>'
    +'<div style="font-family:var(--disp); font-weight:700; font-size:17px; margin-bottom:8px">'+b.t+'</div>'
    +'<div style="font-style:italic; font-size:13px; line-height:1.6">'+(b.desc||'Sin descripción')+'</div>'
    +'<div style="margin-top:18px; font-size:12.5px; color:var(--ink-soft); line-height:1.6">Este libro no tiene PDF adjunto.<br>Léelo en papel y, cuando lo termines,<br>sella tu lectura aquí abajo 🎀</div></div>';
  B.innerHTML='';
  document.getElementById('pgInd').textContent='— / —';
  document.getElementById('sealWrap').style.display='block';
}
async function renderSpread(){
  if(!pdfDoc) return;
  const tok=++renderTok;
  const N=pdfDoc.numPages;
  const A=document.getElementById('pgA'), B=document.getElementById('pgB');
  const second = (doublePage && curPage+1<=N) ? curPage+1 : null;
  document.getElementById('spread').classList.toggle('single', !second);
  await renderPdfPage(A, curPage, tok);
  if(second) await renderPdfPage(B, second, tok);
  else B.innerHTML='';
  if(tok!==renderTok) return;
  const pct=Math.round(((second||curPage))/N*100);
  document.getElementById('pgInd').textContent='pág. '+curPage+(second?'–'+second:'')+' / '+N+' · '+pct+'%';
  updateBmChip();
  const atEnd=(second||curPage)>=N;
  document.getElementById('sealWrap').style.display = atEnd ? 'block' : 'none';
  if(curBook){ curBook.page=curPage; scheduleSave(); }
}
async function renderPdfPage(cont, num, tok){
  cont.innerHTML=''; cont.dataset.pg=num;
  try{
    const page=await pdfDoc.getPage(num);
    if(tok!==renderTok) return;
    /* v1.2: modo texto cómodo — el texto del PDF con letra grande y ajustable */
    if(typeof reflowOn!=='undefined' && reflowOn){ await renderReflowPage(cont, page, num, tok); return; }
    const R=((page.rotate||0)+(curBook&&curBook.rot||0))%360;
    const raw=page.getViewport({scale:1, rotation:R});
    const scale=pageAvailW()/raw.width;
    const vp=page.getViewport({scale, rotation:R});
    const wrap=document.createElement('div'); wrap.className='pgwrap';
    const dpr=Math.min(window.devicePixelRatio||1, 2);
    const cv=document.createElement('canvas');
    cv.width=Math.floor(vp.width*dpr); cv.height=Math.floor(vp.height*dpr);
    cv.style.width=vp.width+'px'; cv.style.height=vp.height+'px';
    wrap.appendChild(cv);
    cont.appendChild(wrap);
    /* v1.2: si la página ya se dibujó por adelantado, se copia al instante */
    const pre=pageCacheGet(num, cv.width, cv.height, R);
    if(pre) cv.getContext('2d').drawImage(pre, 0, 0);
    else await page.render({canvasContext:cv.getContext('2d'), viewport:vp,
      transform: dpr!==1 ? [dpr,0,0,dpr,0,0] : undefined}).promise;
    if(tok!==renderTok) return;
    /* capa de texto invisible: permite seleccionar, subrayar, buscar y leer en voz alta */
    try{
      const tc=await page.getTextContent();
      if(tok!==renderTok) return;
      const tl=document.createElement('div'); tl.className='textLayer';
      tl.style.width=vp.width+'px'; tl.style.height=vp.height+'px';
      tl.style.setProperty('--scale-factor', String(scale));
      wrap.appendChild(tl);
      const tlTask=pdfjsLib.renderTextLayer({textContentSource:tc, textContent:tc, container:tl, viewport:vp, textDivs:[]});
      try{ if(tlTask && tlTask.promise) await tlTask.promise; }catch(e){}
      if(tok===renderTok) applyHighlights(tl, num);
      /* cosecha de frases para los datos curiosos del asistente */
      try{
        if(curBook){
          curBook.snips=curBook.snips||[];
          if(curBook.snips.length<12 && Math.random()<.65){
            const full=tc.items.map(it=>it.str).join(' ').replace(/\s+/g,' ').trim();
            const sents=full.split(/(?<=[.!?…])\s+/).filter(x=>x.length>=45 && x.length<=150);
            if(sents.length){
              const pick=sents[Math.floor(Math.random()*sents.length)];
              if(!curBook.snips.some(sn=>sn.s===pick)){ curBook.snips.push({p:num, s:pick}); scheduleSave(); }
            }
          }
        }
      }catch(e){}
    }catch(e){ /* PDF escaneado sin texto: se muestra tal cual */ }
    const pn=document.createElement('div'); pn.className='pg-num'; pn.textContent='— '+num+' —';
    cont.appendChild(pn);
    /* posits guardados de esta página */
    if(curBook && curBook.posits && curBook.posits[num])
      curBook.posits[num].forEach(pd=>spawnPosit(cont, pd));
    logPageRead(num);
  }catch(e){
    cont.innerHTML='<div style="padding:24px; font-style:italic; text-align:center">No pude dibujar la página '+num+' 🥺</div>';
  }
}
function logPageRead(num){
  if(!curBook) return;
  const key=(curBook.id||'x')+':'+num;
  if(seenPages.has(key)) return;
  seenPages.add(key);
  const day=fmtDay(new Date());
  state.pageLog[day]=(state.pageLog[day]||0)+1;
  markReadToday();
  const h=new Date().getHours();
  if(h<6) state.c.dawn=1;
  if(h<7) state.c.alba=1;
  updateDayChip();
  const g=settings.pagesGoal||10, tot=state.pageLog[day];
  const gk='g'+day;
  if(tot>=g && !state.celeb[gk]){
    state.celeb[gk]=1;
    buddySay('💮 ¡Meta del día cumplida! '+tot+' paginitas leídas hoy… tu racha florece 🌸🔥', 9000);
  }
  checkAch(); scheduleSave();
}
function nextPage(){
  if(!pdfDoc) return;
  const st=doublePage?2:1;
  if(curPage+st<=pdfDoc.numPages){ curPage+=st; renderSpread(); }
  else if(curPage<pdfDoc.numPages){ curPage=pdfDoc.numPages; renderSpread(); }
}
function prevPage(){
  if(!pdfDoc) return;
  const st=doublePage?2:1;
  if(curPage-st>=1){ curPage-=st; renderSpread(); }
  else if(curPage>1){ curPage=1; renderSpread(); }
}

