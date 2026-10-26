/* Versión iPhone (PWA): ajustes que van después de todos los módulos y antes de boot.js */

/* ---------- menú lateral deslizable ---------- */
function sideOpen(on){ document.querySelector('.win').classList.toggle('side-open', on); }
(function(){
  const tb=document.querySelector('.titlebar'), win=document.querySelector('.win');
  const b=document.createElement('button'); b.className='chip menu-btn'; b.textContent='☰'; b.title='Menú';
  b.onclick=()=>sideOpen(!win.classList.contains('side-open')); tb.insertBefore(b, tb.firstChild);
  const bd=document.createElement('div'); bd.className='side-backdrop'; bd.onclick=()=>sideOpen(false); win.appendChild(bd);
  /* deslizar desde el borde izquierdo abre el menú; hacia la izquierda lo cierra */
  let x0=null, y0=0;
  win.addEventListener('touchstart', e=>{ const t=e.touches[0]; x0=t.clientX; y0=t.clientY; }, {passive:true});
  win.addEventListener('touchend', e=>{ if(x0==null) return; const t=e.changedTouches[0], dx=t.clientX-x0, dy=Math.abs(t.clientY-y0);
    if(dy<60){ if(x0<24 && dx>70 && !document.querySelector('#v-reader.active, #v-audio.active')) sideOpen(true); else if(win.classList.contains('side-open') && dx<-70) sideOpen(false); } x0=null; }, {passive:true});
})();
/* ---------- mantener presionado = clic derecho (editar libro, quitar adorno, borrar pestañita…) ---------- */
(function(){
  let tm=null, p0=null, fired=false, eat=false;
  document.addEventListener('pointerdown', e=>{
    if(e.pointerType==='mouse') return;
    fired=false; p0={x:e.clientX, y:e.clientY, t:e.target}; clearTimeout(tm);
    tm=setTimeout(()=>{ if(!p0) return; fired=true; if(navigator.vibrate) navigator.vibrate(15);
      const o={bubbles:true, cancelable:true, clientX:p0.x, clientY:p0.y};
      const handled=!p0.t.dispatchEvent(new MouseEvent('contextmenu', Object.assign({button:2}, o)));
      /* en un subrayado, mantener presionado = el doble clic de la PC (quitarlo) */
      if(!handled && p0.t.closest && p0.t.closest('mark')) p0.t.dispatchEvent(new MouseEvent('dblclick', o)); }, 550);
  }, true);
  document.addEventListener('pointermove', e=>{ if(p0 && Math.hypot(e.clientX-p0.x, e.clientY-p0.y)>10){ clearTimeout(tm); p0=null; } }, true);
  ['pointerup','pointercancel'].forEach(t=>document.addEventListener(t, e=>{ clearTimeout(tm); p0=null;
    /* tras la pulsación larga, que el dedo al soltar no abra también el libro */
    if(fired && t==='pointerup'){ fired=false; eat=true; setTimeout(()=>eat=false, 500); e.stopImmediatePropagation(); window.dispatchEvent(new PointerEvent('pointercancel')); } }, true));
  document.addEventListener('click', e=>{ if(eat){ e.preventDefault(); e.stopPropagation(); eat=false; } }, true);
})();
document.getElementById('toast').addEventListener('click', e=>e.currentTarget.classList.remove('show'));
const _showW=show;
show=function(id){ sideOpen(false); return _showW.apply(this, arguments); };

/* ---------- Despacho: los códigos se abren en Safari (siempre la versión vigente del SPIJ) ---------- */
openCode=function(k, artNum){
  lawCode=codeOf(k);
  const url=SPIJ_NORMA+lawCode.id;
  window.open(url, '_blank');
  lawTab('visor');
  document.getElementById('lawViewTitle').textContent=lawCode.e+' '+lawCode.n;
  document.getElementById('lawWebMsg').innerHTML='';
  document.getElementById('lawWebHost').innerHTML='<div class="web-code">'
    +'<p>El <b>'+esc(lawCode.n)+'</b> se abrió en Safari, directo desde el SPIJ oficial'+(artNum?' (busca el <b>art. '+esc(artNum)+'</b> con <i>Buscar en la página</i>)':'')+'.</p>'
    +'<button class="btn rose" id="wcOpen">📖 Abrir otra vez el '+esc(lawCode.ab)+'</button>'
    +'<div class="adv-h" style="margin-top:16px">💾 Guardar un artículo</div>'
    +'<p class="lbl">En Safari mantén presionado el texto del artículo → <b>Copiar</b>. Vuelve aquí, pégalo y guárdalo: quedará en «Mis artículos» aunque no haya internet.</p>'
    +'<div style="display:flex; gap:8px; align-items:center; margin:8px 0"><input type="text" id="wcNum" placeholder="Art. n.°" value="'+esc(artNum||'')+'" style="width:110px">'
    +'<button class="chip" id="wcPaste">📋 Pegar</button></div>'
    +'<textarea id="wcText" rows="7" placeholder="Artículo 106.- El que mata a otro…"></textarea>'
    +'<button class="btn rose" id="wcSave" style="margin-top:8px">💾 Guardar artículo</button></div>';
  document.getElementById('wcOpen').onclick=()=>window.open(url, '_blank');
  document.getElementById('wcPaste').onclick=async()=>{ try{ document.getElementById('wcText').value=await navigator.clipboard.readText(); }catch(e){ toast('«Mantén presionado el cuadro de texto y elige Pegar 📋»'); } };
  document.getElementById('wcSave').onclick=()=>{
    let t=document.getElementById('wcText').value.trim();
    if(t.length<10){ toast('«Pega primero el texto del artículo ✍️»'); return; }
    t=t.split(/\n\s*(?:CONCORDANCIAS|PROCESOS CONSTITUCIONALES|JURISPRUDENCIA|DOCTRINA|PRECEDENTE)/i)[0].replace(/\n{3,}/g,'\n\n').trim();
    const num=document.getElementById('wcNum').value.trim().replace(/^art(\.|ículo)?\s*/i,'') || ((t.match(/Art[íi]culo\s+([\d\-A-Za-z]+)/)||[])[1]||'');
    const L=law(), ex=L.articles.find(a=>a.code===lawCode.k && a.num===num && num);
    if(ex){ ex.text=t; ex.at=Date.now(); }
    else L.articles.unshift({id:lawId(), code:lawCode.k, num, text:t, note:'', at:Date.now(), d:fmtDay(new Date()), fav:false});
    scheduleSave(); state.c.lawsave=(state.c.lawsave||0)+1; checkAch();
    document.getElementById('wcText').value=''; document.getElementById('wcNum').value='';
    toast('«Guardado: '+esc(lawCode.ab)+' art. '+esc(num||'—')+' ⚖️ en «Mis artículos»»');
  };
  state.c.lawcode=1; checkAch(); scheduleSave();
};

/* ---------- escritos a PDF: la hoja de impresión del iPhone permite guardarlo como PDF ---------- */
exportPdf=async function(){
  if(!lawDoc) return; docChanged(); lawDoc.html=document.getElementById('lawEditor').innerHTML;
  let f=document.getElementById('printFrame');
  if(!f){ f=document.createElement('iframe'); f.id='printFrame'; f.style.cssText='position:fixed; width:0; height:0; border:0; right:0; bottom:0'; document.querySelector('.win').appendChild(f); }
  f.srcdoc=docHtmlForPrint(lawDoc).replace('<head>','<head><title>'+esc(lawDoc.title)+'</title>');
  f.onload=()=>{ try{ f.contentWindow.focus(); f.contentWindow.print(); }catch(e){ toast('«No pude abrir la impresión 🥺»'); } };
  toast('«En la hoja de impresión: Compartir → Guardar en Archivos para tenerlo en PDF 📄»');
};

/* ---------- la versión del iPhone se actualiza sola (service worker) ---------- */
if('serviceWorker' in navigator && location.protocol==='https:'){
  navigator.serviceWorker.register('sw.js').then(reg=>{
    reg.addEventListener('updatefound', ()=>{ const w=reg.installing; if(!w) return;
      w.addEventListener('statechange', ()=>{ if(w.state==='installed' && navigator.serviceWorker.controller)
        setTimeout(()=>buddySay('✨ Hay una versión nueva del salón. <b>Cierra y vuelve a abrir</b> la app para estrenarla 💗', 12000), 4000); }); });
  }).catch(()=>{});
}
/* pedir al iPhone que no borre los datos por falta de espacio */
if(navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(()=>{});

/* ---------- en pantalla táctil, las ayudas hablan de dedos, no de mouse ni teclado ---------- */
const TOUCH=matchMedia('(hover: none), (pointer: coarse)').matches || navigator.maxTouchPoints>0;
function touchText(s){
  if(!TOUCH || typeof s!=='string') return s;
  return s.replace(/rueda del mouse (para cambiar tamaño|= tamaño)/g, (m,a)=>'pellizca con dos dedos '+(a[0]==='='?'= tamaño':'para cambiar el tamaño'))
    .replace(/[Cc]lic derecho/g, m=>m[0]==='C'?'Mantener presionado':'mantener presionado')
    .replace(/doble clic sobre él/g, 'mantenlo presionado').replace(/doble clic/g, 'mantener presionado')
    .replace(/el dedo, el lápiz o el mouse/g, 'el dedo o el lápiz').replace(/con el mouse/g, 'con el dedo').replace(/ o el mouse/g, '')
    .replace(/ o las flechas del teclado/g, ' o deslizando el dedo').replace(/, las flechas o deslizando/g, ' o deslizando')
    .replace(/usa Ctrl\+C/g, 'mantén presionado → Copiar')
    .replace(/arrastra sobre las letras de la página/g, 'mantén presionada una palabra y estira la selección');
}
if(TOUCH){
  const _toastT=toast; toast=function(h){ return _toastT(touchText(h)); };
  const _saidT=buddySay; buddySay=function(h, ms){ return _saidT(touchText(h), ms); };
  TUT.forEach(s=>s.t=touchText(s.t));
  const _tdmT=toggleDecorMode; toggleDecorMode=function(){ const r=_tdmT.apply(this, arguments);
    const l=document.querySelector('#decorPalette .dp-head .lbl'); if(l) l.textContent=touchText(l.textContent); return r; };
}

/* ---------- tutorial en el celular: lo que vive en el menú se muestra con el menú abierto,
              y la tarjeta se pone arriba o abajo según dónde esté lo que señala ---------- */
const _posTutW=positionTut;
positionTut=function(el){
  if(innerWidth>820) return _posTutW(el);
  const card=document.getElementById('tutOv'), inSide=!!(el && el.closest('.sidebar'));
  sideOpen(inSide);
  card.classList.add('show');
  setTimeout(()=>{
    if(el && el.scrollIntoView && !inSide) el.scrollIntoView({block:'nearest'});
    const r=el ? el.getBoundingClientRect() : null, tb=document.querySelector('.titlebar').getBoundingClientRect();
    const low=r && (r.top+r.height/2) > innerHeight*0.55;
    card.style.left='10px';
    card.style.top=(low ? tb.bottom+8 : innerHeight-card.offsetHeight-12)+'px';
  }, inSide ? 320 : 30);
};
const _stsW=showTutStep;
showTutStep=function(){ const r=_stsW.apply(this, arguments); if(tutStep>=TUT.length) sideOpen(false); return r; };

/* ---------- decorar con los dedos: pellizcar para cambiar el tamaño de un adorno ---------- */
(function(){
  let pin=null;
  document.addEventListener('touchstart', e=>{
    if(!decorMode || e.touches.length!==2) return;
    const [a,b]=e.touches, it=(a.target.closest && a.target.closest('.decor-item')) || (b.target.closest && b.target.closest('.decor-item'));
    if(!it) return;
    const i=[...it.parentNode.querySelectorAll('.decor-item')].indexOf(it), d=(state.decor||[])[i]; if(!d) return;
    pin={it, d, s0:d.s||70, d0:Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY)};
  }, {passive:true});
  document.addEventListener('touchmove', e=>{
    if(!pin || e.touches.length!==2) return;
    e.preventDefault();
    const [a,b]=e.touches, k=Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY)/pin.d0;
    pin.d.s=Math.max(28, Math.min(260, pin.s0*k)); pin.it.style.width=pin.d.s+'px';
  }, {passive:false});
  document.addEventListener('touchend', ()=>{ if(pin){ pin=null; scheduleSave(); } }, {passive:true});
})();
