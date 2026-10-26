/* v1.6: pasar de página como en un libro de verdad — la hoja se levanta y gira en 3D sobre el lomo,
   con sombras que cambian; con el dedo, la hoja sigue al dedo y vuelve si la sueltas antes de la mitad */

const FLIP_MS=720;
let flipBusy=false;
function flipOn(){ return settings.pageFlip!==false && !matchMedia('(prefers-reduced-motion: reduce)').matches; }
function visiblePages(){ return [...document.querySelectorAll('#spread .pdf-page')].filter(p=>p.offsetParent!==null && p.childElementCount); }

/* copia exacta de una página (también el dibujo de sus lienzos) en una capa fija sobre la pantalla */
function snapPage(el){
  const r=el.getBoundingClientRect();
  const c=el.cloneNode(true);
  const src=el.querySelectorAll('canvas'), dst=c.querySelectorAll('canvas');
  dst.forEach((cv,i)=>{ cv.width=src[i].width; cv.height=src[i].height; cv.getContext('2d').drawImage(src[i],0,0); });
  c.removeAttribute('id'); c.classList.add('flip-face-page');
  c.querySelectorAll('.textLayer,.posit .pdel,.posit .pdrag').forEach(x=>x.remove());
  c.style.cssText+=';position:absolute; inset:0; width:'+r.width+'px; height:'+r.height+'px; margin:0; box-sizing:border-box; transform:none; animation:none';
  return {node:c, r};
}
function layer(){ let l=document.getElementById('flipLayer'); if(!l){ l=document.createElement('div'); l.id='flipLayer'; document.querySelector('.win').appendChild(l); } return l; }
function fixedBox(r, cls){ const d=document.createElement('div'); d.className=cls; d.style.cssText='position:fixed; left:'+r.left+'px; top:'+r.top+'px; width:'+r.width+'px; height:'+r.height+'px'; return d; }

/* sonido de papel: un susurro breve de ruido filtrado */
function paperSound(){
  if(settings.pageSound===false) return;
  try{ ensureAC(); const t=ac.currentTime, n=ac.sampleRate*.32, b=ac.createBuffer(1,n,ac.sampleRate), d=b.getChannelData(0);
    for(let i=0;i<n;i++){ const e=Math.sin(Math.PI*i/n); d[i]=(Math.random()*2-1)*e*e*(.6+.4*Math.sin(i/90)); }
    const s=ac.createBufferSource(); s.buffer=b; const f=ac.createBiquadFilter(); f.type='bandpass'; f.frequency.value=2600; f.Q.value=.7;
    const g=ac.createGain(); g.gain.value=.05*masterVol*2; s.connect(f); f.connect(g); g.connect(ac.destination); s.start(t); }catch(e){}
}

/* espera a que la página nueva quede dibujada */
function waitRendered(ms){ return new Promise(res=>{ let done=false; const f=()=>{ if(done) return; done=true; window.removeEventListener('bib-rendered', f); res(); };
  window.addEventListener('bib-rendered', f); setTimeout(f, ms||1800); }); }

/* prepara la hoja: dir 1 = adelante, -1 = atrás. Devuelve un control con set(p), finish(), cancel() */
async function prepareFlip(dir, navigate, undo){
  const epub=typeof isEpubOpen==='function' && isEpubOpen();
  const oldPages=epub?[]:visiblePages();
  const double=!epub && oldPages.length===2;
  const oldSnaps=oldPages.map(snapPage);
  const L=layer(); L.innerHTML='';
  const before=curPage, beforeLoc=curBook && curBook.loc;
  // mientras se dibuja lo nuevo, la página vieja sigue a la vista
  const hold=oldSnaps.map(s=>{ const b=fixedBox(s.r,'flip-hold'); b.appendChild(s.node.cloneNode(true)); copyCanvases(s.node, b); L.appendChild(b); return b; });
  const wait=waitRendered(epub?900:1800);
  navigate();
  if(!epub && curPage===before){ L.innerHTML=''; return null; } // inicio o fin del libro
  await wait;
  if(epub && curBook && curBook.loc===beforeLoc){ L.innerHTML=''; return null; }
  const newPages=epub?[]:visiblePages();
  const newSnaps=newPages.map(snapPage);
  hold.forEach(h=>h.remove());

  /* geometría de la hoja según el modo */
  let leafRect, origin, a0, a1, front, back, under=[];
  const paperBack=r=>{ const p=document.createElement('div'); p.className='flip-paper'; return p; };
  if(epub){
    const host=document.getElementById('epubHost').getBoundingClientRect();
    const half={left:host.left+(dir>0?host.width/2:0), top:host.top, width:host.width/2, height:host.height};
    leafRect=half; origin=dir>0?'left':'right'; a0=0; a1=dir>0?-180:180;
    front=paperBack(); back=paperBack();
  } else if(double && newSnaps.length===2){
    if(dir>0){ // la hoja derecha vieja se levanta y aterriza a la izquierda mostrando la nueva página izquierda
      leafRect=oldSnaps[1].r; origin='left'; a0=0; a1=-180; front=oldSnaps[1].node; back=newSnaps[0].node;
      under.push(withNode(oldSnaps[0])); // la izquierda vieja queda hasta que la hoja la cubre
    } else {
      leafRect=oldSnaps[0].r; origin='right'; a0=0; a1=180; front=oldSnaps[0].node; back=newSnaps[1].node;
      under.push(withNode(oldSnaps[1]));
    }
  } else {
    const o=oldSnaps[0], n=newSnaps[0]||o;
    if(dir>0){ leafRect=o.r; origin='left'; a0=0; a1=-180; front=o.node; back=paperBack(); }
    else { leafRect=n.r; origin='left'; a0=-180; a1=0; front=n.node; back=paperBack(); under.push(withNode(o)); }
  }
  under.forEach(u=>L.appendChild(u));
  const stage=fixedBox(leafRect,'flip-stage');
  const leaf=document.createElement('div'); leaf.className='flip-leaf'; leaf.style.transformOrigin=origin+' center';
  const fF=document.createElement('div'); fF.className='flip-face front'; fF.appendChild(front);
  const fB=document.createElement('div'); fB.className='flip-face back'; fB.appendChild(back);
  // el reverso se coloca espejado para que su contenido se lea derecho al aterrizar
  if(back.style){ back.style.left=0; back.style.top=0; }
  const shF=document.createElement('div'); shF.className='flip-shade'; fF.appendChild(shF);
  const shB=document.createElement('div'); shB.className='flip-shade'; fB.appendChild(shB);
  leaf.appendChild(fF); leaf.appendChild(fB); stage.appendChild(leaf);
  const cast=document.createElement('div'); cast.className='flip-cast'; stage.appendChild(cast);
  const edge=document.createElement('div'); edge.className='flip-edge'; leaf.appendChild(edge); // filo dorado de la hoja
  L.appendChild(stage);
  if(origin==='right') stage.classList.add('from-right');

  const set=p=>{
    p=Math.max(0, Math.min(1, p));
    const ang=a0+(a1-a0)*p, lift=Math.sin(Math.abs(ang)/180*Math.PI);
    /* la hoja se curva un poquito al levantarse (como el papel de verdad) */
    leaf.style.transform='rotateY('+ang+'deg) skewY('+((origin==='left'?-1:1)*Math.sign(ang||1)*lift*2.2).toFixed(2)+'deg) scaleX('+(1-lift*.04).toFixed(3)+')';
    /* cara visible según el ángulo: no depende de cómo Windows dibuje las capas 3D */
    const showBack=Math.abs(ang)>90;
    fF.style.visibility=showBack?'hidden':'visible'; fB.style.visibility=showBack?'visible':'hidden';
    edge.style.opacity=(lift*.9).toFixed(3);
    shF.style.opacity=(lift*.55).toFixed(3); shB.style.opacity=(lift*.55).toFixed(3);
    cast.style.opacity=(lift*.6).toFixed(3);
  };
  set(0);
  const cleanup=()=>{ L.innerHTML=''; };
  const animateTo=(to, ms)=>new Promise(res=>{
    const from=Number(leaf.dataset.p||0), t0=performance.now();
    const step=now=>{ const k=Math.min(1,(now-t0)/ms), e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2, p=from+(to-from)*e;
      leaf.dataset.p=p; set(p); if(k<1) requestAnimationFrame(step); else res(); };
    requestAnimationFrame(step);
  });
  return {
    set:p=>{ leaf.dataset.p=p; set(p); },
    finish:async ms=>{ paperSound(); await animateTo(1, ms||FLIP_MS); cleanup(); },
    cancel:async ()=>{ await animateTo(0, 300); const w=waitRendered(1200); undo(); await w; cleanup(); }
  };
}
function copyCanvases(srcNode, dstWrap){
  const s=srcNode.querySelectorAll('canvas'), d=dstWrap.querySelectorAll('canvas');
  d.forEach((cv,i)=>{ if(s[i]){ cv.width=s[i].width; cv.height=s[i].height; cv.getContext('2d').drawImage(s[i],0,0); } });
}
function withNode(snap){ const b=fixedBox(snap.r,'flip-hold'); const n=snap.node.cloneNode(true); b.appendChild(n); copyCanvases(snap.node, b); return b; }

/* ---------- pasar de página con animación (botones, flechas, deslizar rápido) ---------- */
const _npF=nextPage, _ppF=prevPage;
const rtlComic=()=>typeof isComicOpen==='function' && isComicOpen() && curBook.rtl;
async function flipTurn(dir){
  const nav=dir>0?_npF:_ppF, undo=dir>0?_ppF:_npF, vdir=rtlComic()?-dir:dir;
  if(!flipOn() || flipBusy || !document.getElementById('v-reader').classList.contains('active')) return nav();
  flipBusy=true;
  try{ const f=await prepareFlip(vdir, nav, undo); if(f) await f.finish(); }
  catch(e){ console.error(e); const l=document.getElementById('flipLayer'); if(l) l.innerHTML=''; }
  flipBusy=false;
}
nextPage=function(){ return flipTurn(1); };
prevPage=function(){ return flipTurn(-1); };

/* ---------- con el dedo: la hoja sigue al dedo ---------- */
let swallowSwipe=false;
const _tbF=turnBy; turnBy=function(dir){ if(swallowSwipe){ swallowSwipe=false; return; } return _tbF(dir); };
function initFlipDrag(){
  const sc=document.getElementById('readerPages');
  let st=null, flip=null, pending=null, lastP=0, dirNow=0;
  sc.addEventListener('pointerdown', e=>{
    if((e.pointerType!=='touch' && e.pointerType!=='pen') || e.target.closest('.posit') || !flipOn() || flipBusy) return;
    st={x:e.clientX, y:e.clientY, t:Date.now()}; flip=null; pending=null; lastP=0;
  });
  sc.addEventListener('pointermove', e=>{
    if(!st) return;
    const dx=e.clientX-st.x, dy=e.clientY-st.y;
    if(!flip && !pending){
      if(Math.abs(dx)<16 || Math.abs(dx)<Math.abs(dy)*1.3) return;
      const vdir=dx<0?1:-1;
      dirNow=rtlComic()?-vdir:vdir;
      if(!canSwipe(sc, dx<0?1:-1)){ st=null; return; }
      flipBusy=true; swallowSwipe=true; // el gesto de deslizar simple ya no actúa: manda la hoja
      const nav=dirNow>0?_npF:_ppF, undo=dirNow>0?_ppF:_npF;
      pending=prepareFlip(vdir, nav, undo).then(f=>{ flip=f; if(!f){ flipBusy=false; st=null; } else f.set(lastP); });
    }
    const w=(document.getElementById('spread').getBoundingClientRect().width||600)*.8;
    lastP=Math.min(1, Math.abs(dx)/w);
    if(flip) flip.set(lastP);
  });
  const end=async e=>{
    if(!st) return;
    const s=st; st=null;
    if(!pending) return;
    setTimeout(()=>{ swallowSwipe=false; }, 400);
    await pending;
    if(!flip){ flipBusy=false; return; }
    const fast=(Date.now()-s.t)<350 && Math.abs(e.clientX-s.x)>50;
    if(lastP>.33 || fast) await flip.finish(Math.max(260, FLIP_MS*(1-lastP)));
    else await flip.cancel();
    flip=null; pending=null; flipBusy=false;
  };
  sc.addEventListener('pointerup', end);
  sc.addEventListener('pointercancel', end);
}
function setPageFlip(v){ settings.pageFlip=!!v; scheduleSave(); toast(v?'«Las hojas pasarán como en un libro de verdad 📖✨»':'«Paso de página instantáneo ⚡»'); }
function setPageSound(v){ settings.pageSound=!!v; scheduleSave(); if(v) paperSound(); }
