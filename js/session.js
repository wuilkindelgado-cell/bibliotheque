/* v1.7: resumen de cada sesión de lectura y libros parecidos */

let sess=null;
const _orfSe=openReaderFor;
openReaderFor=async function(i){ const b=state.floor[i]; if(b) sess={id:b.id, t:b.t, t0:Date.now(), pages:0, from:b.page||1}; return _orfSe(i); };
const _lprSe=logPageRead;
logPageRead=function(num){ const before=seenPages.size; _lprSe(num); if(sess && seenPages.size>before) sess.pages++; };
const _shSe=show;
show=function(id){
  const wasReading=document.getElementById('v-reader').classList.contains('active')||document.getElementById('v-audio').classList.contains('active');
  const r=_shSe(id);
  if(wasReading && id!=='v-reader' && id!=='v-audio' && sess) setTimeout(finishSession, (typeof bookOpenOn==='function' && bookOpenOn() && id==='v-library')?1350:0); // tras cerrarse el libro
  return r;
};
function finishSession(){
  const s=sess; sess=null;
  const mins=Math.round((Date.now()-s.t0)/60000);
  if(s.pages<1 && mins<2) return;
  (state.sessions=state.sessions||[]).push({id:s.id, d:fmtDay(new Date()), p:s.pages, m:mins});
  if(state.sessions.length>800) state.sessions=state.sessions.slice(-800);
  scheduleSave();
  const loc=findBook(s.id), b=loc&&loc.b;
  const left=b&&b.pagesN?Math.max(0,b.pagesN-(b.page||1)):null;
  const spp=b&&b.spp||state.speed&&state.speed.spp;
  let ov=document.getElementById('sessOv');
  if(!ov){ ov=document.createElement('div'); ov.id='sessOv'; ov.className='ficha-overlay'; ov.style.zIndex=60; ov.onclick=e=>{ if(e.target===ov) ov.classList.remove('show'); }; document.querySelector('.win').appendChild(ov); }
  const sims=b?similarBooks(b, 2):[];
  ov.innerHTML='<div class="frame-card" style="width:100%; max-width:380px; text-align:center">'
    +'<div style="font-size:30px">📖✨</div><div style="font-family:var(--disp); font-weight:700; font-size:19px">¡Linda sesión de lectura!</div>'
    +'<div class="sess-stats"><div><b>'+s.pages+'</b><span>página'+(s.pages===1?'':'s')+'</span></div><div><b>'+mins+'</b><span>minuto'+(mins===1?'':'s')+'</span></div>'
    +(left!=null?'<div><b>'+left+'</b><span>por leer'+(spp&&left?' (~'+fmtDur(left*spp)+')':'')+'</span></div>':'')+'</div>'
    +'<div class="lbl" style="font-style:italic">de «'+esc(s.t)+'»</div>'
    +(sims.length?'<div class="sess-sim"><b>📚 Si te está gustando, en tu suelo también te esperan:</b>'+sims.map(x=>'<div>• '+esc(x.b.t)+' <span class="lbl">('+esc(x.why)+')</span></div>').join('')+'</div>':'')
    +'<div style="display:flex; gap:8px; justify-content:center; margin-top:12px; flex-wrap:wrap"><button class="btn small" onclick="document.getElementById(\'sessOv\').classList.remove(\'show\')">Cerrar</button>'
    +'<button class="btn rose small" id="sessDiary">Guardar en el diario 📔</button></div></div>';
  ov.querySelector('#sessDiary').onclick=()=>{
    state.diary.unshift({d:new Date().toLocaleDateString('es-PE',{day:'numeric', month:'long', year:'numeric'}), f:'📖', iso:fmtDay(new Date()),
      t:'Hoy leí '+s.pages+' página'+(s.pages===1?'':'s')+' de «'+s.t+'» en '+mins+' minuto'+(mins===1?'':'s')+' 🌸'});
    scheduleSave(); ov.classList.remove('show'); toast('«Guardado en tu diario del corazón 📔💗»');
  };
  ov.classList.add('show');
}

/* libros parecidos: autor, saga, país, estante de origen y palabras del título */
function similarBooks(b, n){
  const words=t=>new Set(String(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').split(/[^a-zñ]+/).filter(w=>w.length>3));
  const bw=words(b.t);
  const secOf=x=>{ const s=state.sections.find(s=>s.books.includes(x)); return s&&s.name; };
  const bsec=secOf(b);
  return state.floor.filter(x=>x!==b && x.id!==b.id && !x.done && !x.status && String(x.t).toLowerCase()!==String(b.t).toLowerCase()).map(x=>{
    let sc=0, why=[];
    if(b.author && x.author && b.author.toLowerCase()===x.author.toLowerCase()){ sc+=4; why.push('mismo autor'); }
    if(b.series && x.series && b.series.name===x.series.name){ sc+=5; why.push('misma saga'); }
    const pl=(b.places||[]).filter(p=>(x.places||[]).includes(p)); if(pl.length){ sc+=2; why.push('ocurre en '+countryName(pl[0])); }
    if(b.authorCountry && b.authorCountry===x.authorCountry){ sc+=1.5; why.push('autor de '+countryName(b.authorCountry)); }
    const xw=words(x.t); let c=0; bw.forEach(w=>{ if(xw.has(w)) c++; }); if(c){ sc+=c; why.push('título parecido'); }
    if(b.fmt && b.fmt===x.fmt && sc>0) sc+=.3;
    if(bsec && x.expect && x.expect.toLowerCase().includes(bsec.toLowerCase())){ sc+=1; why.push('va con «'+bsec+'»'); }
    return {b:x, sc, why:why.join(', ')};
  }).filter(r=>r.sc>0).sort((a,b)=>b.sc-a.sc).slice(0,n||3);
}
/* al terminar un libro, el asistente sugiere el siguiente */
const _cdSe=ceremonyDone;
ceremonyDone=function(...a){
  const b=state.floor[state.readingIdx];
  const r=_cdSe(...a);
  if(b){ const s=similarBooks(b,1)[0]; if(s) setTimeout(()=>buddySay('📚 Ya que terminaste <b>'+esc(b.t)+'</b>… ¿qué tal <b>'+esc(s.b.t)+'</b>? ('+esc(s.why)+') ✨', 10000), 6000); }
  return r;
};
/* y en la ficha de cada libro terminado */
const _ofSe=openFicha;
openFicha=function(si,bi){
  _ofSe(si,bi);
  const b=state.sections[si].books[bi], s=similarBooks(b,3);
  const d=document.getElementById('fDesc');
  if(d && s.length) d.innerHTML+='<div class="fx"><b>📚 Parecidos en tu suelo</b><br>'+s.map(x=>esc(x.b.t)+' <i style="color:var(--ink-soft)">('+esc(x.why)+')</i>').join('<br>')+'</div>';
};
