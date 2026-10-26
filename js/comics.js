/* v1.2: cómics y mangas en CBZ (un .zip de imágenes) */
let comic=null; // {zip, pages:[nombres], urls:Map}

const natCmp=(a,b)=>a.localeCompare(b, undefined, {numeric:true, sensitivity:'base'});
async function cbzPages(zip){
  return Object.keys(zip.files).filter(n=>!zip.files[n].dir && /\.(jpe?g|png|webp|gif|avif)$/i.test(n) && !/(^|\/)(__MACOSX|\.)/.test(n)).sort(natCmp);
}
async function cbzCover(file){
  try{ const zip=await JSZip.loadAsync(await file.arrayBuffer()); const p=(await cbzPages(zip))[0]; if(!p) return null;
    return new Blob([await zip.file(p).async('arraybuffer')], {type:/\.png$/i.test(p)?'image/png':'image/jpeg'}); }catch(e){ return null; }
}
function isComicOpen(){ return !!(comic && curBook && curBook.fmt==='cbz'); }
function closeComic(){
  if(comic) comic.urls.forEach(u=>URL.revokeObjectURL(u));
  comic=null;
  document.getElementById('v-reader').classList.remove('comic-mode');
  const mb=document.getElementById('mangaBtn'); if(mb) mb.style.display='none';
}
async function comicUrl(i){
  if(!comic || i<1 || i>comic.pages.length) return null;
  if(comic.urls.has(i)) return comic.urls.get(i);
  const name=comic.pages[i-1];
  const buf=await comic.zip.file(name).async('arraybuffer');
  const u=URL.createObjectURL(new Blob([buf], {type:/\.png$/i.test(name)?'image/png':/\.webp$/i.test(name)?'image/webp':'image/jpeg'}));
  comic.urls.set(i, u);
  if(comic.urls.size>14){ const k=[...comic.urls.keys()].find(x=>Math.abs(x-curPage)>6); if(k){ URL.revokeObjectURL(comic.urls.get(k)); comic.urls.delete(k); } }
  return u;
}
async function openComic(b){
  const A=document.getElementById('pgA');
  try{
    const bl=await idbGet('files','f_'+b.id+'_pdf'); if(!bl){ showNoPdf(b); return; }
    const zip=await JSZip.loadAsync(await bl.arrayBuffer());
    const pages=await cbzPages(zip);
    if(!pages.length){ A.innerHTML='<div style="padding:36px; text-align:center; font-style:italic">Este CBZ no tiene imágenes 🥺</div>'; return; }
    comic={zip, pages, urls:new Map()};
    document.getElementById('v-reader').classList.add('comic-mode');
    const mb=document.getElementById('mangaBtn'); if(mb){ mb.style.display='inline-block'; mb.classList.toggle('activeTool', !!b.rtl); }
    b.pagesN=pages.length; zoom=b.zoom||1; document.getElementById('zoomPct').textContent=Math.round(zoom*100)+'%';
    curPage=Math.min(Math.max(1,b.page||1), pages.length);
    state.c.comic=1; checkAch();
    await renderComic();
    toast('«'+pages.length+' páginas de viñetas 🎨 pasa con ◀ ▶, las flechas o deslizando'+(b.rtl?' (modo manga ←)':'')+'»');
  }catch(e){ A.innerHTML='<div style="padding:36px; text-align:center; font-style:italic">No pude abrir este cómic 🥺</div>'; }
}
async function renderComic(){
  if(!isComicOpen()) return;
  const N=comic.pages.length, A=document.getElementById('pgA'), B=document.getElementById('pgB');
  const second=(doublePage && curPage+1<=N && curPage>1) ? curPage+1 : null; // la portada va sola
  document.getElementById('spread').classList.toggle('single', !second);
  const sc=document.getElementById('readerPages');
  const maxH=(sc.clientHeight-50)*zoom, maxW=(second?(sc.clientWidth-60)/2:sc.clientWidth-60)*zoom;
  const put=async(cont, n)=>{ cont.innerHTML=''; cont.dataset.pg=n; cont.classList.add('comic-page');
    const img=new Image(); img.src=await comicUrl(n); img.alt='página '+n;
    img.style.maxHeight=maxH+'px'; img.style.maxWidth=maxW+'px'; cont.appendChild(img); try{ await img.decode(); }catch(e){} logPageRead(n); };
  const [left, right]=curBook.rtl && second ? [B, A] : [A, B];
  await put(left, curPage);
  if(second) await put(right, second); else B.innerHTML='';
  const last=second||curPage;
  document.getElementById('pgInd').textContent='pág. '+curPage+(second?'–'+second:'')+' / '+N+' · '+Math.round(last/N*100)+'%';
  document.getElementById('sealWrap').style.display=last>=N?'block':'none';
  curBook.page=curPage; scheduleSave(); updateBmChip();
  for(let k=1;k<=3;k++) comicUrl(last+k); // precarga
  window.dispatchEvent(new Event('bib-rendered'));
}
function toggleManga(){
  if(!isComicOpen()) return;
  curBook.rtl=!curBook.rtl; scheduleSave();
  document.getElementById('mangaBtn').classList.toggle('activeTool', curBook.rtl);
  renderComic();
  toast(curBook.rtl?'«Modo manga 🇯🇵 se lee de derecha a izquierda: ← avanza»':'«Modo cómic occidental: → avanza 📖»');
}

/* ---------- enganches con el lector ---------- */
const _orfC=openReaderFor;
openReaderFor=async function(i){
  closeComic();
  const b=state.floor[i];
  if(!(b && b.fmt==='cbz' && b.hasPdf && b.id)) return _orfC(i);
  if(typeof closeEpub==='function') closeEpub();
  state.readingIdx=i; curBook=b; pdfDoc=null; state.lastReadId=b.id; scheduleSave();
  document.getElementById('readerTitle').textContent=b.t;
  show('v-reader');
  document.getElementById('sealWrap').style.display='none';
  document.getElementById('pgA').innerHTML='<div style="padding:36px 20px; text-align:center; font-style:italic">Abriendo el cómic… 🎨</div>';
  document.getElementById('pgB').innerHTML='';
  if(!b.startedDate){ b.startedDate=fmtDay(new Date()); scheduleSave(); }
  return openComic(b);
};
const step=()=>doublePage?2:1;
const _npC=nextPage; nextPage=function(){
  if(!isComicOpen()) return _npC();
  const N=comic.pages.length, s=(doublePage && curPage===1)?1:step();
  if(curPage+s<=N){ curPage+=s; renderComic(); } else if(curPage<N){ curPage=N; renderComic(); }
};
const _ppC=prevPage; prevPage=function(){
  if(!isComicOpen()) return _ppC();
  const s=(doublePage && curPage<=3)?Math.max(1,curPage-1):step();
  if(curPage-s>=1){ curPage-=s; renderComic(); } else if(curPage>1){ curPage=1; renderComic(); }
};
/* en modo manga, las flechas y el dedo van al revés */
const _tbC=turnBy; turnBy=function(dir){ if(isComicOpen() && curBook.rtl) dir=-dir; return _tbC(dir); };
window.addEventListener('keydown', e=>{
  if(!isComicOpen() || !curBook.rtl || !document.getElementById('v-reader').classList.contains('active')) return;
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){ e.stopImmediatePropagation(); e.key==='ArrowLeft'?nextPage():prevPage(); }
}, true);
const _gpC=gotoPage; gotoPage=function(v){
  if(!isComicOpen()) return _gpC(v);
  const p=parseInt(v); if(isNaN(p)) return;
  curPage=Math.min(comic.pages.length, Math.max(1,p)); renderComic(); document.getElementById('pgJump').value='';
};
const _szC=setZoom; setZoom=function(z){
  if(!isComicOpen()) return _szC(z);
  zoom=Math.min(2.4, Math.max(.6, Math.round(z*100)/100));
  document.getElementById('zoomPct').textContent=Math.round(zoom*100)+'%'; curBook.zoom=zoom; scheduleSave(); renderComic();
};
const _tpC=togglePages; togglePages=function(){ const r=_tpC(); if(isComicOpen()) renderComic(); return r; };
const _tbmC=toggleBookmark; toggleBookmark=function(){
  if(!isComicOpen()) return _tbmC();
  if(curBook.bookmark===curPage){ delete curBook.bookmark; toast('«Marcador retirado 🔖»'); } else { curBook.bookmark=curPage; toast('«Marcador en la página '+curPage+' 🔖»'); }
  updateBmChip(); scheduleSave();
};
const _jbC=jumpBookmark; jumpBookmark=function(){ if(isComicOpen()){ if(curBook.bookmark) gotoPage(curBook.bookmark); return; } return _jbC(); };
['doHighlight','placePosit','readerSearch','openBookSearch','rotBook','defineSel','toggleReflow'].forEach(fn=>{
  const orig=window[fn];
  window[fn]=function(...a){ if(isComicOpen()){ toast('«En los cómics manda la imagen 🎨 esta herramienta es para libros de texto»'); return; } return orig.apply(this,a); };
});
const _ttsC=ttsToggle; ttsToggle=function(btn){ if(isComicOpen()){ toast('«Las viñetas se disfrutan con los ojos 👀🎨»'); return; } return _ttsC(btn); };
/* índice del cómic: miniaturas de todas las páginas */
const _oiC=openIndex; openIndex=async function(tab){
  if(!isComicOpen()){ document.getElementById('indexList').classList.remove('thumbs'); return _oiC(tab); }
  const ov=document.getElementById('indexOv'), list=document.getElementById('indexList');
  const tabs=document.getElementById('idxTabs'); if(tabs) tabs.innerHTML='<button class="on">🖼️ Páginas</button>';
  list.innerHTML=''; list.classList.add('thumbs'); ov.classList.add('show');
  for(let i=1;i<=comic.pages.length;i++){
    const b=document.createElement('button'); b.className='thumb'+(i===curPage?' on':'');
    b.innerHTML='<img loading="lazy"><span>'+i+'</span>';
    b.onclick=()=>{ ov.classList.remove('show'); list.classList.remove('thumbs'); gotoPage(i); };
    list.appendChild(b);
    comicUrl(i).then(u=>{ b.querySelector('img').src=u; });
    if(i%12===0) await new Promise(r=>setTimeout(r,0));
  }
};
const _shC=show; show=function(id){ if(id!=='v-reader'){ const l=document.getElementById('indexList'); if(l) l.classList.remove('thumbs'); } return _shC(id); };
