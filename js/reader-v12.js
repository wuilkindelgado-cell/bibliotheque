/* v1.2: lectura — páginas precargadas, modo texto cómodo, tiempo restante y lectura en voz alta continua */

/* ---------- ancho de página (compartido con el dibujo y la precarga) ---------- */
function pageAvailW(){
  const sc=document.getElementById('readerPages');
  return (doublePage
    ? Math.max(200, Math.min(440, (sc.clientWidth-90)/2))
    : Math.max(260, Math.min(640, sc.clientWidth-70))) * zoom;
}

/* ---------- páginas dibujadas por adelantado ---------- */
const pageCache=new Map(); // clave → canvas
function pageKey(num, w, h, R){ return (curBook&&curBook.id)+'|'+num+'|'+w+'x'+h+'|'+R; }
function pageCacheGet(num, w, h, R){ return pageCache.get(pageKey(num, w, h, R)) || null; }
let prefetchTok=0;
async function prefetchPages(){
  if(!pdfDoc || reflowOn) return;
  const my=++prefetchTok, doc=pdfDoc;
  const st=doublePage?2:1, N=doc.numPages;
  const want=[]; for(let k=1;k<=st*2;k++) want.push(curPage+st-1+k); // la próxima vista (y la siguiente)
  want.push(curPage-1);
  for(const n of want){
    if(n<1 || n>N || my!==prefetchTok || doc!==pdfDoc) continue;
    try{
      const page=await doc.getPage(n);
      const R=((page.rotate||0)+(curBook&&curBook.rot||0))%360;
      const vp=page.getViewport({scale:pageAvailW()/page.getViewport({scale:1, rotation:R}).width, rotation:R});
      const dpr=Math.min(window.devicePixelRatio||1, 2);
      const w=Math.floor(vp.width*dpr), h=Math.floor(vp.height*dpr), key=pageKey(n, w, h, R);
      if(pageCache.has(key)) continue;
      const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
      await page.render({canvasContext:cv.getContext('2d'), viewport:vp, transform:dpr!==1?[dpr,0,0,dpr,0,0]:undefined}).promise;
      page.getTextContent().catch(()=>{}); // también deja lista la capa de texto
      pageCache.set(key, cv);
      while(pageCache.size>8) pageCache.delete(pageCache.keys().next().value);
    }catch(e){}
  }
}

/* ---------- modo texto cómodo ---------- */
let reflowOn=false;
const REFLOW_FONTS=[['Lora','Lora, Georgia, serif'],['Cormorant','"Cormorant Garamond", Georgia, serif'],['Georgia','Georgia, serif'],['Segoe','"Segoe UI", Arial, sans-serif'],['Verdana','Verdana, Arial, sans-serif']];
function reflowFont(){ return (REFLOW_FONTS.find(f=>f[0]===settings.reflowFont)||REFLOW_FONTS[0])[1]; }
function toggleReflow(btn){
  if(!pdfDoc){ toast(isEpubOpen && isEpubOpen() ? '«Los EPUB ya son texto cómodo 😉 usa − y + para la letra»' : '«Abre un libro en PDF primero 📖»'); return; }
  reflowOn=!reflowOn;
  btn=btn||document.getElementById('reflowBtn');
  if(btn) btn.classList.toggle('activeTool', reflowOn);
  document.getElementById('reflowFont').style.display=reflowOn?'inline-block':'none';
  renderSpread();
  toast(reflowOn?'«Modo texto cómodo 📝 cambia la letra con − y + y la fuente al lado ✨ (subrayados y posits, en modo página)»':'«De vuelta a la página original 📄»');
}
function setReflowFont(v){ settings.reflowFont=v; scheduleSave(); if(reflowOn) renderSpread(); }
/* reconstruye párrafos a partir de las líneas del PDF */
function pdfParagraphs(tc){
  const lines=[]; let cur={t:'', y:null, h:0};
  tc.items.forEach(it=>{
    if(typeof it.str!=='string') return;
    if(cur.y===null){ cur.y=it.transform[5]; cur.h=Math.hypot(it.transform[2], it.transform[3])||10; }
    cur.t+=it.str;
    if(it.hasEOL){ lines.push(cur); cur={t:'', y:null, h:0}; }
  });
  if(cur.t.trim()) lines.push(cur);
  const gaps=[]; for(let i=1;i<lines.length;i++) gaps.push(Math.abs(lines[i-1].y-lines[i].y));
  const sorted=gaps.filter(g=>g>0).sort((a,b)=>a-b), typical=sorted[Math.floor(sorted.length/2)]||12;
  const maxLen=Math.max(1, ...lines.map(l=>l.t.trim().length));
  const paras=[]; let p='';
  lines.forEach((l,i)=>{
    const t=l.t.replace(/\s+/g,' ').trim(); if(!t){ if(p){ paras.push(p); p=''; } return; }
    if(p.endsWith('-') && /[a-záéíóúñ]$/i.test(p.slice(-2,-1))) p=p.slice(0,-1)+t; else p=p?p+' '+t:t;
    const gapNext=i<lines.length-1 ? Math.abs(l.y-lines[i+1].y) : 0;
    const shortEnd=t.length<maxLen*.72 && /[.!?:»"”…]$/.test(t);
    if(gapNext>typical*1.55 || shortEnd){ paras.push(p); p=''; }
  });
  if(p) paras.push(p);
  return paras;
}
async function renderReflowPage(cont, page, num, tok){
  let tc=null; try{ tc=await page.getTextContent(); }catch(e){}
  if(tok!==renderTok) return;
  cont.classList.add('reflow-page');
  const paras=tc?pdfParagraphs(tc):[];
  const d=document.createElement('div'); d.className='reflow';
  d.style.fontFamily=reflowFont();
  d.style.fontSize=Math.round(17*zoom)+'px';
  /* cada frase en su propio span: la voz la resalta con precisión */
  const sent=x=>(x.match(/[^.!?…;:]+[.!?…;:]*s*/g)||[x]).map(t=>'<span>'+esc(t)+'</span>').join('');
  d.innerHTML=paras.length ? paras.map(x=>'<p>'+sent(x)+'</p>').join('') : '<p style="text-align:center; font-style:italic">Esta página no tiene texto (es una imagen escaneada) 🖼️<br>Vuelve al modo página con 📝</p>';
  cont.appendChild(d);
  const pn=document.createElement('div'); pn.className='pg-num'; pn.textContent='— '+num+' —'; cont.appendChild(pn);
  logPageRead(num);
}
const _rs12=renderSpread;
renderSpread=async function(){
  document.querySelectorAll('#spread .pdf-page').forEach(p=>p.classList.toggle('reflow-page', reflowOn));
  const r=await _rs12();
  afterSpread();
  return r;
};

/* ---------- velocidad de lectura y tiempo restante ---------- */
let lastTurn={id:null, page:null, at:0};
const chapCache={};
async function bookChapters(){
  if(!curBook || !pdfDoc) return [];
  if(chapCache[curBook.id]) return chapCache[curBook.id];
  const pages=[];
  try{
    const ol=await pdfDoc.getOutline()||[];
    for(const n of ol){
      let dest=n.dest; if(typeof dest==='string') dest=await pdfDoc.getDestination(dest);
      if(Array.isArray(dest) && dest[0]) pages.push(typeof dest[0]==='object' ? (await pdfDoc.getPageIndex(dest[0]))+1 : dest[0]+1);
    }
  }catch(e){}
  return chapCache[curBook.id]=[...new Set(pages)].sort((a,b)=>a-b);
}
function trackSpeed(page){
  const now=Date.now();
  if(lastTurn.id===curBook.id && page>lastTurn.page){
    const per=(now-lastTurn.at)/1000/(page-lastTurn.page);
    if(per>4 && per<360){
      state.speed=state.speed||{};
      state.speed.spp=state.speed.spp ? state.speed.spp*.85+per*.15 : per;
      curBook.spp=curBook.spp ? curBook.spp*.8+per*.2 : per;
    }
  }
  lastTurn={id:curBook.id, page, at:now};
}
function fmtDur(s){
  s=Math.round(s/60);
  if(s<1) return 'menos de 1 min';
  if(s<60) return s+' min';
  const h=Math.floor(s/60), m=s%60; return h+' h'+(m?' '+m+' min':'');
}
async function updateRemaining(){
  if(!curBook || !pdfDoc) return;
  const N=pdfDoc.numPages, last=Math.min(N, curPage+(doublePage?1:0));
  trackSpeed(curPage);
  const spp=curBook.spp || (state.speed && state.speed.spp) || 75;
  const left=N-last;
  const ind=document.getElementById('pgInd');
  let t='';
  if(left>0){
    t=' · ⏳ ~'+fmtDur(left*spp);
    const ch=await bookChapters();
    const next=ch.find(p=>p>last);
    if(next && next-last<left) t+=' (cap.: ~'+fmtDur((next-last)*spp)+')';
  }
  if(!ind.textContent.includes('⏳')) ind.textContent+=t;
  ind.title=(curBook.spp||state.speed)?'Calculado con tu ritmo de lectura (~'+Math.round(spp)+' s por página)':'Estimación inicial; se ajusta a tu ritmo mientras lees';
}
function afterSpread(){ updateRemaining(); setTimeout(prefetchPages, 250); if(ttsState.on && ttsState.waiting) ttsResumeAfterTurn(); window.dispatchEvent(new Event('bib-rendered')); }

/* ---------- lectura en voz alta continua con la frase resaltada ---------- */
const ttsState={on:false, paused:false, sents:[], i:0, waiting:false, btn:null};
function ttsVoice(){
  const vs=speechSynthesis.getVoices().filter(v=>/^es/i.test(v.lang));
  if(settings.ttsVoice){ const v=vs.find(x=>x.name===settings.ttsVoice); if(v) return v; }
  return vs.find(v=>/natural|online/i.test(v.name) && /es-(MX|PE|US|419)/i.test(v.lang)) || vs.find(v=>/natural|online/i.test(v.name)) || vs.find(v=>/es-(MX|PE|US|419)/i.test(v.lang)) || vs[0] || null;
}
/* raíz legible de cada página visible: capa de texto o texto cómodo */
function readableRoots(){
  return [...document.querySelectorAll('#spread .pdf-page')].filter(p=>p.offsetParent!==null)
    .map(p=>p.querySelector('.textLayer') || p.querySelector('.reflow')).filter(Boolean);
}
function buildSentences(){
  const out=[];
  readableRoots().forEach(root=>{
    const w=document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes=[]; let n, pos=0, full='';
    while(n=w.nextNode()){ nodes.push({n, a:pos}); full+=n.nodeValue; pos+=n.nodeValue.length; }
    const re=/[^.!?…;:]+[.!?…;:]*\s*/g; let m;
    while((m=re.exec(full))){
      const txt=m[0].replace(/\s+/g,' ').trim();
      if(txt.length<2) continue;
      const a=m.index, b=m.index+m[0].length;
      const els=new Set(nodes.filter(x=>x.a<b && x.a+x.n.nodeValue.length>a).map(x=>x.n.parentElement));
      out.push({t:txt, els:[...els]});
    }
  });
  return out;
}
function ttsClearHl(){ document.querySelectorAll('.tts-hl').forEach(e=>e.classList.remove('tts-hl')); }
function ttsSpeakNext(){
  if(!ttsState.on || ttsState.paused) return;
  if(ttsState.i>=ttsState.sents.length){
    ttsClearHl();
    const N=pdfDoc?pdfDoc.numPages:0, last=curPage+(doublePage?1:0);
    if(pdfDoc && last<N){ ttsState.waiting=true; nextPage(); return; }
    ttsStop(); toast('«Fin del libro… ¡qué lectura tan bonita! 🎀»'); return;
  }
  const s=ttsState.sents[ttsState.i];
  ttsClearHl(); s.els.forEach(e=>e.classList.add('tts-hl'));
  const first=s.els[0]; if(first) first.scrollIntoView({block:'center', behavior:'smooth'});
  const u=new SpeechSynthesisUtterance(s.t);
  u.lang='es-ES'; const v=ttsVoice(); if(v){ u.voice=v; u.lang=v.lang; }
  u.rate=settings.ttsRate||1;
  u.onend=()=>{ if(!ttsState.on || ttsState.paused) return; ttsState.i++; ttsSpeakNext(); };
  u.onerror=e=>{ if(e.error==='interrupted'||e.error==='canceled') return; ttsState.i++; ttsSpeakNext(); };
  speechSynthesis.speak(u);
}
function ttsResumeAfterTurn(){
  ttsState.waiting=false;
  setTimeout(()=>{
    ttsState.sents=buildSentences(); ttsState.i=0;
    if(!ttsState.sents.length){ ttsStop(); toast('«Esta página no tiene texto para leer en voz alta 🙊»'); return; }
    ttsSpeakNext();
  }, 350);
}
function ttsStart(btn){
  ttsState.sents=buildSentences(); ttsState.i=0;
  if(!ttsState.sents.length){ toast('«Esta página no tiene texto que pueda leer (¿es un escaneo?) 🙊»'); return; }
  ttsState.on=true; ttsState.paused=false; ttsState.btn=btn; speaking=true;
  if(btn) btn.classList.add('activeTool');
  document.getElementById('ttsBar').classList.add('show');
  ttsBarUpdate();
  state.c.tts=1; checkAch(); scheduleSave();
  ttsSpeakNext();
}
function ttsStop(){
  ttsState.on=false; ttsState.paused=false; ttsState.waiting=false; speaking=false;
  try{ speechSynthesis.cancel(); }catch(e){}
  ttsClearHl();
  if(ttsState.btn) ttsState.btn.classList.remove('activeTool');
  const b=document.getElementById('ttsBar'); if(b) b.classList.remove('show');
}
function ttsPause(){
  if(!ttsState.on) return;
  ttsState.paused=!ttsState.paused;
  if(ttsState.paused) speechSynthesis.cancel(); else ttsSpeakNext();
  ttsBarUpdate();
}
function ttsRate(d){
  settings.ttsRate=Math.min(1.8, Math.max(.6, Math.round(((settings.ttsRate||1)+d)*10)/10)); scheduleSave();
  ttsBarUpdate();
  if(ttsState.on && !ttsState.paused){ speechSynthesis.cancel(); setTimeout(ttsSpeakNext, 60); }
}
function ttsSkip(d){ if(!ttsState.on) return; ttsState.i=Math.max(0, Math.min(ttsState.sents.length, ttsState.i+d)); speechSynthesis.cancel(); setTimeout(ttsSpeakNext, 60); }
function ttsBarUpdate(){
  const r=document.getElementById('ttsRateLbl'); if(r) r.textContent=(settings.ttsRate||1).toFixed(1)+'×';
  const p=document.getElementById('ttsPauseBtn'); if(p) p.textContent=ttsState.paused?'▶':'⏸';
}
/* el botón 🔊 Voz del lector usa la lectura continua en PDF (en EPUB sigue su propio camino) */
const _ttsT=ttsToggle;
ttsToggle=function(btn){
  if(isEpubOpen && isEpubOpen()) return _ttsT(btn);
  if(!('speechSynthesis' in window)) return _ttsT(btn);
  if(ttsState.on){ ttsStop(); toast('«Silencio… 🤫»'); return; }
  ttsStart(btn);
};
const _shw12=show; show=function(id){ if(id!=='v-reader' && ttsState.on) ttsStop(); return _shw12(id); };
const _orf12=openReaderFor; openReaderFor=async function(i){ if(ttsState.on) ttsStop(); pageCache.clear(); lastTurn={id:null}; return _orf12(i); };
/* en texto cómodo, subrayados y posits viven en el modo página (así quedan anclados al PDF) */
const _dh12=doHighlight; doHighlight=function(){ if(reflowOn){ toast('«Para subrayar vuelve al modo página con 📝 — así el subrayado queda anclado al PDF ✍️»'); return; } return _dh12(); };
const _pp12=placePosit; placePosit=function(){ if(reflowOn){ toast('«Los posits se pegan en el modo página 🗒️ (toca 📝 para volver)»'); return; } return _pp12(); };
