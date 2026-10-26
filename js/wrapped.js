/* v20: «Tu año lector» — resumen por año, mes o de todo el tiempo, exportable como imagen */

function wrapPeriods(){
  const ys=new Set();
  Object.keys(state.pageLog||{}).forEach(k=>ys.add(k.slice(0,4)));
  allBooks().forEach(b=>{ if(b.doneDate) ys.add(String(b.doneDate).slice(0,4)); });
  ys.add(String(new Date().getFullYear()));
  const out=[];
  [...ys].sort().reverse().forEach(y=>{
    out.push({k:y, n:'Año '+y});
    for(let m=12;m>=1;m--){
      const mk=y+'-'+String(m).padStart(2,'0');
      const has=Object.keys(state.pageLog||{}).some(k=>k.startsWith(mk)) || allBooks().some(b=>String(b.doneDate||'').startsWith(mk));
      if(has){ const t=new Date(+y, m-1, 1).toLocaleDateString('es-PE',{month:'long'}); out.push({k:mk, n:'   '+t.charAt(0).toUpperCase()+t.slice(1)+' '+y}); }
    }
  });
  out.push({k:'', n:'Todo el tiempo'});
  return out;
}
function wrapData(p){
  const inP=d=>d && String(d).startsWith(p);
  const books=state.sections.flatMap(s=>s.books.map(b=>Object.assign({sec:s.name}, b))).filter(b=>p===''||inP(b.doneDate));
  books.sort((a,b)=>String(a.doneDate||'').localeCompare(String(b.doneDate||'')));
  const days=Object.keys(state.pageLog||{}).filter(k=>p===''||k.startsWith(p));
  const pages=days.reduce((a,k)=>a+(state.pageLog[k]||0),0);
  const readDays=(state.readDays||[]).filter(k=>p===''||k.startsWith(p)).sort();
  let best=0, run=0, prev=null;
  readDays.forEach(k=>{ const d=isoToDate(k); run=(prev && (d-prev)===864e5)?run+1:1; best=Math.max(best,run); prev=d; });
  const wd=[0,0,0,0,0,0,0]; days.forEach(k=>{ wd[isoToDate(k).getDay()]+=state.pageLog[k]||0; });
  const wdi=wd.indexOf(Math.max(...wd));
  const mon={}; days.forEach(k=>{ const m=k.slice(0,7); mon[m]=(mon[m]||0)+(state.pageLog[k]||0); });
  const bestMon=Object.entries(mon).sort((a,b)=>b[1]-a[1])[0];
  const fav=books.slice().sort((a,b)=>(b.faces||0)-(a.faces||0) || String(b.doneDate).localeCompare(String(a.doneDate)))[0];
  const secs={}; books.forEach(b=>secs[b.sec]=(secs[b.sec]||0)+1);
  const topSec=Object.entries(secs).sort((a,b)=>b[1]-a[1])[0];
  const quotes=(state.quotes||[]).filter(q=>p===''||inP(q.d));
  const diary=(state.diary||[]).filter(e=>p===''||inP(diaryIso(e)));
  const mins=books.reduce((a,b)=>a+(b.mins||0),0);
  return {books, pages, readDays:readDays.length, best, wd:wdi, wdPages:wd[wdi], bestMon, fav, topSec, quotes, diary, mins};
}
const WD=['domingos','lunes','martes','miércoles','jueves','viernes','sábados'];
function renderWrapped(){
  const sel=document.getElementById('wrapPeriod');
  if(!sel.options.length || sel.dataset.stamp!==fmtDay(new Date())){
    const cur=sel.value;
    sel.innerHTML=''; wrapPeriods().forEach(o=>{ const e=document.createElement('option'); e.value=o.k; e.textContent=o.n; sel.appendChild(e); });
    sel.value=cur||String(new Date().getFullYear()); sel.dataset.stamp=fmtDay(new Date());
  }
  const p=sel.value, d=wrapData(p);
  state.c.wrapped=1; checkAch(); scheduleSave();
  const per=p===''?'en todo este tiempo':p.length===4?'en '+p:'este mes';
  const cards=[];
  const C=(cls, k, v, s, big)=>cards.push('<div class="wcard '+cls+'" style="animation-delay:'+(cards.length*.08)+'s"><div class="wk">'+k+'</div>'+(v!=null?'<div class="wv">'+v+'</div>':'')+(big?'<div class="wbig">'+big+'</div>':'')+(s?'<div class="ws">'+s+'</div>':'')+'</div>');
  C('wc1','Libros terminados', d.books.length, d.books.length?'¡'+(d.books.length===1?'Un libro entero':d.books.length+' historias')+' '+per+'! 📚':'El estante te espera '+per+' 🌱');
  C('wc2','Páginas leídas', d.pages.toLocaleString('es-PE'), d.pages?'Eso es como '+Math.max(1,Math.round(d.pages/300))+' novela(s) de 300 páginas 📖':'Cada página cuenta ✨');
  C('wc3','Días leyendo', d.readDays, d.best?'Tu mejor racha: '+d.best+' día(s) seguidos 🔥':'');
  if(d.wdPages) C('wc4','Tu día favorito para leer', null, 'Ahí ocurre la magia ✨', 'Los '+WD[d.wd]);
  if(d.bestMon){ const t=isoToDate(d.bestMon[0]+'-01').toLocaleDateString('es-PE',{month:'long', year:'numeric'}); C('wc5','Tu mes más lector', null, d.bestMon[1]+' páginas en un solo mes 🌙', t.charAt(0).toUpperCase()+t.slice(1)); }
  if(d.fav) C('wc6','Tu libro favorito', null, (d.fav.faces?faceOf(d.fav.faces)+' ':'')+(d.fav.favPart?'«'+esc(d.fav.favPart.slice(0,90))+'»':'¡Lo amaste!'), esc(d.fav.t));
  if(d.topSec) C('wc2','Tu estante estrella', null, d.topSec[1]+' libro(s) ahí 🏛️', esc(d.topSec[0]));
  if(d.books.length>1) C('wc3','Del primero al último', null, 'Empezaste con «'+esc(d.books[0].t)+'» y llegaste a «'+esc(d.books[d.books.length-1].t)+'» 🗺️');
  if(d.mins) C('wc4','Tiempo con tus libros terminados', d.mins<60?d.mins+' min':Math.floor(d.mins/60)+' h', 'Tiempo bien invertido ⏳');
  if(d.quotes.length){ const q=d.quotes[Math.floor(Math.random()*d.quotes.length)]; C('wc5','Una de tus '+d.quotes.length+' citas', null, q.bk?'— '+esc(q.bk):'', '«'+esc(q.q.slice(0,140))+'»'); }
  if(d.diary.length) C('wc6','Diario del corazón', d.diary.length, 'páginas escritas con el corazón 📔');
  C('wc1','Un mensaje de '+esc(state.fav), null, '', d.books.length||d.pages
    ? '«'+state.name+', estoy tan orgulloso de ti. Gracias por llevarme contigo en cada página 💗»'
    : '«'+state.name+', lo mejor está por leerse. Aquí estaré, en la primera página 💗»');
  document.getElementById('wrapCards').innerHTML=cards.join('');
}
/* tarjeta-imagen para guardar o compartir */
async function exportWrapped(){
  const p=document.getElementById('wrapPeriod').value, d=wrapData(p);
  const W=1080, H=1350, cv=document.createElement('canvas'); cv.width=W; cv.height=H;
  const x=cv.getContext('2d');
  const g=x.createLinearGradient(0,0,W,H); g.addColorStop(0,'#F4CBCC'); g.addColorStop(.5,'#F3EADB'); g.addColorStop(1,'#BFD3E2');
  x.fillStyle=g; x.fillRect(0,0,W,H);
  x.strokeStyle='#C9A227'; x.lineWidth=10; x.strokeRect(30,30,W-60,H-60); x.lineWidth=3; x.strokeRect(52,52,W-104,H-104);
  await document.fonts.ready;
  x.textAlign='center'; x.fillStyle='#C48A90'; x.font='700 40px "Cormorant Garamond", serif';
  x.fillText('BIBLIOTHÈQUE ENCHANTÉE', W/2, 140);
  x.fillStyle='#5A463E'; x.font='italic 600 68px "Cormorant Garamond", serif';
  const tt=p===''?'Todo mi tiempo lector':p.length===4?'Mi año lector '+p:isoToDate(p+'-01').toLocaleDateString('es-PE',{month:'long', year:'numeric'});
  x.fillText(tt.charAt(0).toUpperCase()+tt.slice(1), W/2, 230);
  const stat=(y, big, lbl)=>{ x.fillStyle='#B06478'; x.font='700 96px "Cormorant Garamond", serif'; x.fillText(String(big), W/2, y);
    x.fillStyle='#5A463E'; x.font='500 34px Lora, serif'; x.fillText(lbl, W/2, y+50); };
  stat(400, d.books.length, 'libros terminados');
  stat(570, d.pages.toLocaleString('es-PE'), 'páginas leídas');
  stat(740, d.readDays, 'días con lectura · mejor racha '+d.best);
  x.fillStyle='#5A463E'; x.font='600 38px "Cormorant Garamond", serif';
  if(d.fav){ x.fillText('Favorito: '+d.fav.t.slice(0,34), W/2, 880); }
  if(d.topSec){ x.font='500 32px Lora, serif'; x.fillText('Estante estrella: '+d.topSec[0], W/2, 940); }
  x.font='600 40px Caveat, cursive'; x.fillStyle='#9A7A1B';
  x.fillText('— la biblioteca de '+state.name+' 🌹', W/2, H-150);
  const blob=await new Promise(r=>cv.toBlob(r,'image/png'));
  const name='mi_anio_lector_'+(p||'todo')+'.png';
  if(window.bibFS && bibFS.saveAs){ const r=await bibFS.saveAs(name, await blob.arrayBuffer(), 'png'); if(r) toast('«Tu año lector quedó guardado 💌»'); }
  else { const a=document.createElement('a'); a.download=name; a.href=URL.createObjectURL(blob); a.click(); }
}
