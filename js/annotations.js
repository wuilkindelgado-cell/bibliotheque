/* Subrayados, posits, búsqueda en página, índice y voz */
/* ===== v16: subrayados persistentes por libro y página ===== */
function tlNodes(tl){
  const w=document.createTreeWalker(tl, NodeFilter.SHOW_TEXT);
  const out=[]; let n; while(n=w.nextNode()) out.push(n);
  return out;
}
function tlOffsets(tl, range){
  /* v20: también funciona si la selección empieza o termina en un elemento (doble/triple clic) */
  const nodes=tlNodes(tl);
  let pos=0, a=-1, b=-1;
  for(const node of nodes){
    const len=node.nodeValue.length;
    let hit=false; try{ hit=range.intersectsNode(node); }catch(e){}
    if(hit && len){
      const s=node===range.startContainer ? range.startOffset : 0;
      const e=node===range.endContainer ? range.endOffset : len;
      if(e>s){ if(a<0) a=pos+s; b=pos+e; }
    }
    pos+=len;
  }
  if(a<0||b<0||b<=a) return null;
  return {a,b};
}
function wrapOffsets(tl, rec){
  const nodes=tlNodes(tl);
  let pos=0; const marks=[];
  for(const node of nodes){
    const len=node.nodeValue.length, s0=pos, e0=pos+len; pos=e0;
    if(e0<=rec.a || s0>=rec.b) continue;
    const s=Math.max(0, rec.a-s0), e=Math.min(len, rec.b-s0);
    if(e<=s) continue;
    try{
      const r=document.createRange(); r.setStart(node,s); r.setEnd(node,e);
      const mk=document.createElement('mark'); mk.className=rec.c;
      r.surroundContents(mk); marks.push(mk);
    }catch(err){}
  }
  marks.forEach(mk=>{
    mk.title='doble clic para quitar este subrayado';
    mk.ondblclick=ev=>{
      ev.stopPropagation();
      marks.forEach(m2=>{ if(m2.parentNode) m2.replaceWith(...m2.childNodes); });
      if(curBook && curBook.hls){
        for(const pg in curBook.hls){
          const ix=curBook.hls[pg].indexOf(rec);
          if(ix>-1){ curBook.hls[pg].splice(ix,1); break; }
        }
        scheduleSave();
      }
      toast('«Subrayado retirado de la página 🧽 (la cita sigue en tu colección, bórrala allí si quieres)»');
    };
  });
  return marks.length>0;
}
function applyHighlights(tl, num){
  if(!curBook || !curBook.hls) return;
  (curBook.hls[num]||[]).forEach(rec=>wrapOffsets(tl, rec));
}
/* ===== v6: subrayado funcional ===== */
const hlCycle=['hl-gold','hl-rose','hl-blue','hl-sage'];
let hlColor='hl-gold';
function cycleColor(){
  const sw=document.getElementById('swatch');
  sw.classList.remove(hlColor);
  hlColor=hlCycle[(hlCycle.indexOf(hlColor)+1)%hlCycle.length];
  sw.classList.add(hlColor);
}
function doHighlight(){
  const sel=window.getSelection();
  if(!sel.rangeCount || sel.isCollapsed){
    const hasText=[...document.querySelectorAll('#spread .textLayer')].some(t=>t.textContent.trim().length>10);
    toast(hasText
      ? '«Primero selecciona un fragmento del texto con el mouse ✍️ (arrastra sobre las letras de la página)»'
      : '«Este PDF es escaneado (fotos de páginas)… sus letras no se pueden seleccionar 🥺 ¡pero puedes dejar posits 🗒️ y marcadores 🔖!»');
    return;
  }
  const range=sel.getRangeAt(0);
  const anc=range.commonAncestorContainer;
  const ancEl=anc.nodeType===1?anc:anc.parentElement;
  const tl=ancEl && ancEl.closest ? ancEl.closest('.textLayer') : null;
  if(!tl || !document.getElementById('spread').contains(tl)){
    toast('«Selecciona texto dentro de las páginas del libro 😉»'); return;
  }
  const off=tlOffsets(tl, range);
  if(!off){ toast('«No pude atrapar esa selección… intenta de nuevo despacito ✍️»'); return; }
  const txt=sel.toString().replace(/\s+/g,' ').trim();
  const cont=tl.closest('.pdf-page');
  const num=cont && cont.dataset.pg ? cont.dataset.pg : null;
  const rec={a:off.a, b:off.b, c:hlColor, q:txt.slice(0,300), d:fmtDay(new Date())};
  if(curBook && num){
    curBook.hls=curBook.hls||{};
    (curBook.hls[num]=curBook.hls[num]||[]).push(rec);
  }
  sel.removeAllRanges();
  wrapOffsets(tl, rec);
  if(txt){ state.quotes.push({q:rec.q, color:hlColor, bk:curBook?curBook.t:'', bid:curBook?curBook.id:null, pg:num, d:fmtDay(new Date())}); renderQuotes();
    state.c.hl=(state.c.hl||0)+1; checkAch(); }
  scheduleSave();
  toast('«Subrayado guardado en la página '+(num||'')+' ✒️ quedará ahí siempre (doble clic sobre él para quitarlo)»');
}

/* ===== v9: posits de UN clic — el botón coloca la notita al instante ===== */
function placePosit(){
  const scroller=document.getElementById('readerPages');
  const pages=[...document.querySelectorAll('#spread .pdf-page')].filter(p=>p.offsetParent!==null);
  if(!pages.length){ toast('«Abre un libro primero 😉»'); return; }
  const sr=scroller.getBoundingClientRect();
  let best=pages[0], bestV=-1;
  pages.forEach(p=>{ const r=p.getBoundingClientRect();
    const v=Math.min(r.bottom,sr.bottom)-Math.max(r.top,sr.top);
    if(v>bestV){ bestV=v; best=p; } });
  const br=best.getBoundingClientRect();
  const y=Math.max(16, Math.min(best.clientHeight-70, (sr.top-br.top)+70+Math.random()*40));
  const x=Math.max(8, best.clientWidth/2-56+(Math.random()*40-20));
  addPosit(best, x, y);
}
function addPosit(page, x, y){
  x=Math.max(0, Math.min(page.clientWidth-118, x));
  y=Math.max(0, Math.min(page.clientHeight-52, y));
  const pd={x, y, t:'', d:fmtDay(new Date())}; positGeom(pd, page);
  if(curBook && page.dataset.pg){
    curBook.posits=curBook.posits||{};
    (curBook.posits[page.dataset.pg]=curBook.posits[page.dataset.pg]||[]).push(pd);
  }
  spawnPosit(page, pd, true);
  state.c.posits=(state.c.posits||0)+1; checkAch(); scheduleSave();
  toast('«¡Notita lista! ✍️ escribe encima, muévela del ✥ o bórrala con ✕»');
}
function spawnPosit(page, pd, focus){
  const p=document.createElement('div'); p.className='posit user';
  p.style.left=pd.x+'px'; p.style.top=pd.y+'px';
  const safe=(pd.t||'').replace(/</g,'&lt;');
  p.innerHTML='<span class="pdrag" title="arrastrar">✥</span><span class="pdel" title="borrar">✕</span><div class="ptxt" contenteditable="true">'+(safe||'escribe aquí…')+'</div>';
  p._pd=pd;
  page.appendChild(p);
  makePositInteractive(p, page);
  if(focus){ const tx=p.querySelector('.ptxt');
    setTimeout(()=>{ tx.focus(); const r=document.createRange(); r.selectNodeContents(tx);
      const s=window.getSelection(); s.removeAllRanges(); s.addRange(r); }, 30); }
  return p;
}
function makePositInteractive(p, page){
  const pd=p._pd||{};
  const del=p.querySelector('.pdel');
  del.onclick=ev=>{ ev.stopPropagation(); p.remove();
    if(curBook && page.dataset && page.dataset.pg && curBook.posits && curBook.posits[page.dataset.pg]){
      const a=curBook.posits[page.dataset.pg]; const ix=a.indexOf(pd); if(ix>-1) a.splice(ix,1); scheduleSave(); }
    toast('«Notita retirada 🧽»'); };
  const tx=p.querySelector('.ptxt');
  tx.addEventListener('focus', ()=>{ if(tx.textContent.trim()==='escribe aquí…') tx.textContent=''; }, {once:true});
  tx.addEventListener('blur', ()=>{ pd.t=tx.textContent.trim(); scheduleSave(); });
  tx.addEventListener('pointerdown', ev=>ev.stopPropagation());
  const h=p.querySelector('.pdrag');
  h.addEventListener('pointerdown', ev=>{
    ev.preventDefault(); ev.stopPropagation();
    const move=e2=>{
      const pr=page.getBoundingClientRect();
      p.style.right='auto'; p.style.bottom='auto';
      p.style.left=Math.max(-6, Math.min(pr.width-112, e2.clientX-pr.left-12))+'px';
      p.style.top=Math.max(0, Math.min(pr.height-44, e2.clientY-pr.top-8))+'px';
    };
    const up=()=>{ window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up);
      pd.x=parseFloat(p.style.left)||0; pd.y=parseFloat(p.style.top)||0;
      positGeom(pd, page); scheduleSave(); };
    window.addEventListener('pointermove',move); window.addEventListener('pointerup',up);
  });
}
function initPosits(){
  document.querySelectorAll('#spread .posit.user').forEach(p=>makePositInteractive(p, p.closest('.pdf-page')));
}

/* ===== v6: búsqueda dentro del libro ===== */
function readerSearch(){
  const box=document.getElementById('rSearch');
  const on=box.style.display==='none';
  box.style.display=on?'inline-block':'none';
  if(on) box.focus(); else { box.value=''; clearFinds(); }
}
function clearFinds(){
  document.querySelectorAll('#spread mark.find').forEach(m=>m.replaceWith(document.createTextNode(m.textContent)));
  document.getElementById('spread').normalize();
}
function doFind(q){
  clearFinds();
  q=q.trim(); if(!q) return;
  const rx=new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi');
  const walker=document.createTreeWalker(document.getElementById('spread'), NodeFilter.SHOW_TEXT);
  const nodes=[]; let n; while(n=walker.nextNode()) nodes.push(n);
  let count=0;
  nodes.forEach(node=>{
    const txt=node.nodeValue; rx.lastIndex=0;
    if(!rx.test(txt)) return; rx.lastIndex=0;
    const frag=document.createDocumentFragment(); let last=0, m;
    while((m=rx.exec(txt))){
      frag.appendChild(document.createTextNode(txt.slice(last, m.index)));
      const mk=document.createElement('mark'); mk.className='find'; mk.textContent=m[0];
      frag.appendChild(mk); last=m.index+m[0].length; count++;
    }
    frag.appendChild(document.createTextNode(txt.slice(last)));
    node.parentNode.replaceChild(frag, node);
  });
  const first=document.querySelector('#spread mark.find');
  if(first) first.scrollIntoView({behavior:'smooth', block:'center'});
  toast(count ? `🔍 ${count} coincidencia(s) resaltadas en azul` : '🔍 sin coincidencias en estas páginas');
}

/* (el índice del libro vive ahora en reader-plus.js) */

/* ===== v6: lectura en voz alta ===== */
let speaking=false;
function ttsToggle(btn){
  if(!('speechSynthesis' in window)){ toast('«No encuentro voces disponibles 🙊»'); return; }
  if(speaking){ speechSynthesis.cancel(); speaking=false; btn.classList.remove('activeTool'); toast('«Silencio… 🤫»'); return; }
  const txt=document.getElementById('spread').innerText.replace(/\s+/g,' ').slice(0,800);
  const u=new SpeechSynthesisUtterance(txt); u.lang='es-ES'; u.rate=.95;
  u.onend=()=>{ speaking=false; btn.classList.remove('activeTool'); };
  speechSynthesis.speak(u); speaking=true; btn.classList.add('activeTool');
  state.c.tts=1; checkAch(); scheduleSave();
  toast('«Te leo en voz alta… 🔊»');
}

