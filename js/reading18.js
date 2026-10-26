/* v1.8: lectura accesible, regla de lectura, cuento antes de dormir, pestañitas y dibujar a mano */

/* ---------- lectura accesible ---------- */
const ACC_FONTS={'':'(la del libro)', 'Atkinson Hyperlegible':'Atkinson (muy legible)', 'OpenDyslexic':'OpenDyslexic (dislexia)', 'Verdana':'Verdana'};
function applyAccess(){
  const a=settings.access||{};
  const w=document.querySelector('.win');
  w.classList.toggle('acc-on', !!(a.font||a.spacing));
  document.documentElement.style.setProperty('--acc-font', a.font?'"'+a.font+'", Verdana, sans-serif':'inherit');
  document.documentElement.style.setProperty('--acc-ls', a.spacing?'.06em':'normal');
  document.documentElement.style.setProperty('--acc-ws', a.spacing?'.18em':'normal');
  document.documentElement.style.setProperty('--acc-lh', a.spacing?'2.1':'1.75');
  w.classList.toggle('acc-ruler', !!a.ruler);
  w.classList.toggle('acc-cream', !!a.cream);
  if(a.font && typeof reflowOn!=='undefined' && reflowOn===false && pdfDoc && document.getElementById('v-reader').classList.contains('active')) {/* la letra accesible se aplica en Texto cómodo */}
  if(typeof epubR!=='undefined' && epubR){ try{ epubR.themes.default({'body':{'font-family':(a.font?'"'+a.font+'", Verdana, sans-serif':'Lora, Georgia, serif')+' !important','letter-spacing':(a.spacing?'.06em':'normal')+' !important','word-spacing':(a.spacing?'.18em':'normal')+' !important','line-height':(a.spacing?'2.1':'1.65')+' !important'}}); }catch(e){} }
}
function setAccess(k, v){
  settings.access=Object.assign({}, settings.access, {[k]:v}); scheduleSave(); applyAccess();
  if(k==='font' && v && pdfDoc && typeof reflowOn!=='undefined' && !reflowOn) toast('«En los PDF, la letra accesible se ve en 📝 Texto cómodo ✨»');
  if(typeof reflowOn!=='undefined' && reflowOn && pdfDoc) renderSpread();
}
/* regla de lectura: una franja que sigue al mouse o al dedo y oscurece suavemente el resto */
function initRuler(){
  const sc=document.getElementById('readerPages'); if(!sc || document.getElementById('readRuler')) return;
  const r=document.createElement('div'); r.id='readRuler'; document.getElementById('v-reader').appendChild(r);
  const move=y=>{ const top=document.getElementById('v-reader').getBoundingClientRect().top; r.style.setProperty('--ry', (y-top)+'px'); };
  sc.addEventListener('pointermove', e=>move(e.clientY), {passive:true});
  sc.addEventListener('pointerdown', e=>move(e.clientY), {passive:true});
}

/* ---------- cuento antes de dormir (desactivado por defecto) ---------- */
let bedtime=null;
function startBedtime(){
  if(!settings.bedtime){ toast('«Activa el cuento antes de dormir en ⚙️ Configuración 🌙»'); return; }
  if(bedtime){ stopBedtime(); return; }
  const mins=parseInt(settings.bedtimeMins)||20;
  const w=document.querySelector('.win'); w.classList.add('bedtime'); w.style.setProperty('--dim', 0);
  if(!w.classList.contains('night')) toggleNight();
  // música suave: el clavecín del salón muy bajito
  const cb=document.getElementById('amb-clave'); if(cb && !amb.clave) toggleAmb('clave', cb);
  const prevVol=masterVol; setVolume(25);
  const t0=Date.now(), total=mins*60000;
  if(typeof ttsState!=='undefined' && !ttsState.on && pdfDoc) ttsToggle(document.getElementById('ttsBtn'));
  bedtime={prevVol, iv:setInterval(()=>{
    const p=Math.min(1,(Date.now()-t0)/total);
    w.style.setProperty('--dim', (p*.55).toFixed(3));                 // la pantalla se va oscureciendo
    setVolume(Math.round(25*(1-p*.85)));                                // y la música baja
    const lb=document.getElementById('bedBtn'); if(lb) lb.textContent='🌙 '+Math.max(0,Math.ceil((total-(Date.now()-t0))/60000))+' min';
    if(p>=1) stopBedtime(true);
  }, 5000)};
  const lb=document.getElementById('bedBtn'); if(lb){ lb.classList.add('activeTool'); lb.textContent='🌙 '+mins+' min'; }
  toast('«Cuento antes de dormir 🌙 te leeré '+mins+' minutos, bajando la luz y la música poquito a poco… dulces sueños 💤»');
}
function stopBedtime(asleep){
  if(!bedtime) return;
  clearInterval(bedtime.iv);
  const w=document.querySelector('.win'); w.classList.remove('bedtime'); w.style.setProperty('--dim', 0);
  if(typeof ttsState!=='undefined' && ttsState.on) ttsStop();
  if(amb.clave){ const cb=document.getElementById('amb-clave'); toggleAmb('clave', cb); }
  setVolume(Math.round(bedtime.prevVol*100));
  const lb=document.getElementById('bedBtn'); if(lb){ lb.classList.remove('activeTool'); lb.textContent='🌙 Cuento'; }
  bedtime=null;
  if(asleep){ document.querySelector('.win').classList.add('buddy-sleep'); toast('«Shhh… se acabó el cuento. Buenas noches, '+esc(state.name)+' 🌙💤»'); }
}

/* ---------- pestañitas de colores en el borde de las páginas ---------- */
const TAB_COLORS=['#F3C9CF','#BCD8E8','#E3EBCF','#F0DA9C','#DCCDEA','#C27A8C'];
function bookTabs(){ return curBook ? (curBook.tabs=curBook.tabs||[]) : []; }
function currentPageId(){
  if(typeof isEpubOpen==='function' && isEpubOpen()) return {pg:curBook.page||1, cfi:curBook.loc};
  return {pg:curPage};
}
function addTab(){
  if(!curBook){ return; }
  const id=currentPageId();
  if(bookTabs().some(t=>t.pg===id.pg)){ toast('«Esta página ya tiene su pestañita 🔖»'); return; }
  askText('🏷️ Pestañita', 'Escribe una palabra para recordar esta página (opcional):').then(txt=>{
    if(txt===null) return;
    bookTabs().push({pg:id.pg, cfi:id.cfi||null, c:TAB_COLORS[bookTabs().length%TAB_COLORS.length], t:String(txt||'').slice(0,18), d:fmtDay(new Date())});
    bookTabs().sort((a,b)=>a.pg-b.pg); scheduleSave(); renderTabs(); state.c.tabs=(state.c.tabs||0)+1; checkAch();
    toast('«Pestañita pegada en la página '+id.pg+' 🏷️ tócala para volver aquí»');
  });
}
function renderTabs(){
  const rv=document.getElementById('v-reader'); if(!rv) return;
  let box=document.getElementById('pageTabs');
  if(!box){ box=document.createElement('div'); box.id='pageTabs'; rv.appendChild(box); }
  const ts=curBook?bookTabs():[], N=(curBook&&curBook.pagesN)||(pdfDoc&&pdfDoc.numPages)||1;
  box.innerHTML=ts.map((t,i)=>'<button class="ptab" style="background:'+t.c+'; top:'+(8+Math.min(84, (t.pg/N)*84))+'%" data-i="'+i+'" title="Pág. '+t.pg+(t.t?' · '+esc(t.t):'')+' · clic derecho para quitar"><span>'+esc(t.t||String(t.pg))+'</span></button>').join('');
  box.querySelectorAll('.ptab').forEach(b=>{
    const t=ts[+b.dataset.i];
    b.onclick=()=>{ if(t.cfi && typeof isEpubOpen==='function' && isEpubOpen()) epubR.display(t.cfi); else gotoPage(t.pg); };
    b.oncontextmenu=e=>{ e.preventDefault(); curBook.tabs.splice(+b.dataset.i,1); scheduleSave(); renderTabs(); };
  });
}
window.addEventListener('bib-rendered', ()=>{ renderTabs(); if(typeof renderInk==='function') renderInk(); });
const _orfT=openReaderFor; openReaderFor=async function(i){ const r=await _orfT(i); renderTabs(); return r; };

/* ---------- dibujar y escribir a mano sobre la página (dedo, lápiz o mouse) ---------- */
let inkMode=false, inkColor='#C27A8C', inkEraser=false;
const INK_COLORS=['#C27A8C','#3B2F2A','#5E86A8','#94A879','#C9A04A'];
function toggleInk(btn){
  if(typeof isEpubOpen==='function' && isEpubOpen()){ toast('«El dibujo a mano es para PDF y cómics ✍️»'); return; }
  inkMode=!inkMode; inkEraser=false;
  (btn||document.getElementById('inkBtn')).classList.toggle('activeTool', inkMode);
  document.getElementById('inkBar').classList.toggle('show', inkMode);
  document.getElementById('v-reader').classList.toggle('inking', inkMode);
  renderInk();
  if(inkMode){ state.c.ink=1; checkAch(); toast('«Modo pluma ✍️ escribe o dibuja sobre la página con el dedo, el lápiz o el mouse»'); }
}
function setInkColor(c){ inkColor=c; inkEraser=false; document.querySelectorAll('#inkBar .inkc').forEach(b=>b.classList.toggle('on', b.dataset.c===c)); document.getElementById('inkEr').classList.remove('on'); }
function setEraser(){ inkEraser=!inkEraser; document.getElementById('inkEr').classList.toggle('on', inkEraser); }
function inkStore(pg){ curBook.ink=curBook.ink||{}; return (curBook.ink[pg]=curBook.ink[pg]||[]); }
function drawStrokes(cv, strokes){
  const x=cv.getContext('2d'); x.clearRect(0,0,cv.width,cv.height); x.lineCap='round'; x.lineJoin='round';
  strokes.forEach(s=>{ x.strokeStyle=s.c; x.lineWidth=s.w*cv.width; x.beginPath();
    s.p.forEach((pt,i)=>{ const X=pt[0]*cv.width, Y=pt[1]*cv.height; i?x.lineTo(X,Y):x.moveTo(X,Y); }); x.stroke(); });
}
function renderInk(){
  if(!curBook) return;
  document.querySelectorAll('#spread .pdf-page').forEach(page=>{
    const pg=page.dataset.pg; if(!pg || page.offsetParent===null) return;
    const host=page.querySelector('.pgwrap') || page.querySelector('img') && page; if(!host) return;
    let cv=page.querySelector('canvas.ink');
    const ref=page.querySelector('.pgwrap canvas') || page.querySelector('img');
    if(!ref) return;
    if(!cv){ cv=document.createElement('canvas'); cv.className='ink'; (page.querySelector('.pgwrap')||page).appendChild(cv); bindInk(cv, pg); }
    const W=ref.clientWidth, H=ref.clientHeight;
    cv.style.width=W+'px'; cv.style.height=H+'px'; cv.style.left=ref.offsetLeft+'px'; cv.style.top=ref.offsetTop+'px';
    const dpr=Math.min(devicePixelRatio||1,2); if(cv.width!==Math.round(W*dpr)){ cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); }
    drawStrokes(cv, (curBook.ink||{})[pg]||[]);
  });
}
function bindInk(cv, pg){
  let cur=null;
  cv.addEventListener('pointerdown', e=>{
    if(!inkMode) return; e.preventDefault(); e.stopPropagation(); try{ cv.setPointerCapture(e.pointerId); }catch(er){}
    const r=cv.getBoundingClientRect(), p=[(e.clientX-r.left)/r.width, (e.clientY-r.top)/r.height];
    if(inkEraser){ eraseAt(cv, pg, p); cur={erase:true}; return; }
    const w=(e.pointerType==='pen' && e.pressure ? .002+e.pressure*.004 : .0035);
    cur={c:inkColor, w, p:[p]}; inkStore(pg).push(cur);
  });
  cv.addEventListener('pointermove', e=>{
    if(!cur) return; const r=cv.getBoundingClientRect(), p=[(e.clientX-r.left)/r.width, (e.clientY-r.top)/r.height];
    if(cur.erase){ eraseAt(cv, pg, p); return; }
    cur.p.push([+p[0].toFixed(4), +p[1].toFixed(4)]); drawStrokes(cv, inkStore(pg));
  });
  const end=()=>{ if(cur){ cur=null; scheduleSave(); } };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
}
function eraseAt(cv, pg, p){
  const s=inkStore(pg), before=s.length;
  for(let i=s.length-1;i>=0;i--) if(s[i].p.some(q=>Math.hypot(q[0]-p[0], q[1]-p[1])<.025)) s.splice(i,1);
  if(s.length!==before){ drawStrokes(cv, s); scheduleSave(); }
}
function undoInk(){ const pg=document.querySelector('#spread .pdf-page[data-pg]'); if(!pg) return; const s=inkStore(pg.dataset.pg); s.pop(); scheduleSave(); renderInk(); }
/* en modo pluma, deslizar dibuja (no pasa la página) */
const _tbI=turnBy; turnBy=function(d){ if(inkMode) return; return _tbI(d); };
/* el PDF anotado también lleva lo dibujado */
const _bapI=typeof buildAnnotatedPdf==='function'?buildAnnotatedPdf:null;
if(_bapI) buildAnnotatedPdf=async function(){
  const bytes=await _bapI();
  const ink=curBook.ink||{}; if(!Object.keys(ink).some(k=>ink[k].length)) return bytes;
  const doc=await PDFLib.PDFDocument.load(bytes); const pages=doc.getPages();
  const hex=h=>PDFLib.rgb(parseInt(h.slice(1,3),16)/255, parseInt(h.slice(3,5),16)/255, parseInt(h.slice(5,7),16)/255);
  Object.keys(ink).forEach(pg=>{ const pp=pages[pg-1]; if(!pp) return; const {width:W, height:H}=pp.getSize();
    ink[pg].forEach(s=>{ for(let i=1;i<s.p.length;i++){ const a=s.p[i-1], b=s.p[i];
      pp.drawLine({start:{x:a[0]*W, y:H-a[1]*H}, end:{x:b[0]*W, y:H-b[1]*H}, thickness:Math.max(.6, s.w*W), color:hex(s.c), lineCap:PDFLib.LineCapStyle.Round}); } }); });
  return await doc.save();
};
ACH.push({id:'ink', e:'✍️', nm:'Pluma de ganso', st:'Escribe a mano sobre una página', chk:()=>!!state.c.ink},
         {id:'tabs5', e:'🏷️', nm:'Lectora organizada', st:'Pega 5 pestañitas', chk:()=>(state.c.tabs||0)>=5});
function setBedtimeOpt(v){ settings.bedtime=!!v; scheduleSave(); const b=document.getElementById('bedBtn'); if(b) b.style.display=v?'':'none';
  toast(v?'«🌙 Listo: en el lector aparece el botón «Cuento» para dormirte escuchando»':'«Cuento antes de dormir desactivado 🌙»'); }
