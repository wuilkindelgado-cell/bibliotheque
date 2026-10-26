/* v1.3: estadísticas avanzadas — meses, horas, días, autores, estantes y datos del lector */

/* desde esta versión se anota a qué hora se lee cada página nueva */
const _lprS=logPageRead;
logPageRead=function(num){
  const before=seenPages.size; _lprS(num);
  if(seenPages.size>before){ const h=new Date().getHours(); state.hourLog=state.hourLog||{}; state.hourLog[h]=(state.hourLog[h]||0)+1; }
};

/* barras verticales de una sola serie: valores en tinta, tooltip al pasar el mouse */
function vbars(vals, labels, unit, opts){
  opts=opts||{};
  const mx=Math.max(1, ...vals);
  return '<div class="vbars'+(opts.dense?' dense':'')+'">'+vals.map((v,i)=>
    '<div class="vb" data-tip="'+esc(labels[i]+': '+v+' '+unit)+'"><span class="vv">'+(v&&!opts.dense?v:'')+'</span><i style="height:'+Math.max(v?4:1, Math.round(v/mx*100))+'%"></i><span class="vl">'+esc(opts.short?opts.short[i]:labels[i])+'</span></div>').join('')+'</div>';
}
function hbars(rows, unit){
  if(!rows.length) return '<div class="lbl" style="font-style:italic">Aún no hay datos suficientes 🌱</div>';
  const mx=Math.max(1, ...rows.map(r=>r[1]));
  return rows.map(([k,v])=>'<div class="hbar" data-tip="'+esc(k+': '+v+' '+unit)+'"><span class="hl">'+esc(k)+'</span><span class="ht"><i style="width:'+Math.round(v/mx*100)+'%"></i></span><span class="hv">'+v+'</span></div>').join('');
}
function tile(big, lbl, sub){ return '<div class="stat-card adv-tile"><div class="big">'+big+'</div><div class="lbl">'+lbl+'</div>'+(sub?'<div class="lbl" style="font-size:11px; margin-top:2px">'+sub+'</div>':'')+'</div>'; }

function renderAdvStats(){
  const box=document.getElementById('advStats'); if(!box) return;
  const shelf=state.sections.flatMap(s=>s.books.map(b=>Object.assign({sec:s.name}, b)));
  // últimos 12 meses
  const months=[], mLbl=[], mShort=[], pages=[], books=[];
  for(let i=11;i>=0;i--){ const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()-i);
    const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); months.push(k);
    const t=d.toLocaleDateString('es-PE',{month:'long', year:'numeric'}); mLbl.push(t.charAt(0).toUpperCase()+t.slice(1));
    mShort.push(d.toLocaleDateString('es-PE',{month:'short'}).replace('.',''));
    pages.push(Object.keys(state.pageLog||{}).filter(x=>x.startsWith(k)).reduce((a,x)=>a+state.pageLog[x],0));
    books.push(shelf.filter(b=>String(b.doneDate||'').startsWith(k)).length); }
  // horas y días
  const hl=state.hourLog||{}, hours=[...Array(24)].map((_,h)=>hl[h]||0);
  const hLbl=[...Array(24)].map((_,h)=>h+':00 – '+h+':59'), hShort=[...Array(24)].map((_,h)=>h%3===0?String(h):'');
  const wd=[0,0,0,0,0,0,0]; Object.keys(state.pageLog||{}).forEach(k=>{ wd[(isoToDate(k).getDay()+6)%7]+=state.pageLog[k]; });
  const wdL=['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];
  // autores y estantes
  const au={}; shelf.forEach(b=>{ if(b.author) au[b.author]=(au[b.author]||0)+1; });
  const secs=state.sections.map(s=>[s.name, s.books.length]).filter(r=>r[1]).sort((a,b)=>b[1]-a[1]).slice(0,6);
  // datos del lector
  const withN=shelf.filter(b=>b.pagesN && b.fmt!=='audio');
  const avg=withN.length?Math.round(withN.reduce((a,b)=>a+b.pagesN,0)/withN.length):0;
  const longest=withN.slice().sort((a,b)=>b.pagesN-a.pagesN)[0], shortest=withN.slice().sort((a,b)=>a.pagesN-b.pagesN)[0];
  const faces=shelf.map(b=>b.faces).filter(Boolean), favg=faces.length?(faces.reduce((a,b)=>a+b,0)/faces.length):0;
  const spp=(state.speed&&state.speed.spp)||0;
  const fm={}; allBooks().forEach(b=>{ const k={pdf:'PDF',epub:'EPUB',cbz:'Cómics',audio:'Audiolibros'}[b.fmt||(b.hasPdf?'pdf':'')]||'En papel'; fm[k]=(fm[k]||0)+1; });
  const hrs=Math.round((state.audioMin||0)/6)/10;
  const bestH=hours.indexOf(Math.max(...hours));
  box.innerHTML=
    '<div class="adv-tiles">'
      +tile(avg||'—','páginas por libro (promedio)', longest?'📏 el más largo: '+esc(longest.t)+' ('+longest.pagesN+')':'')
      +tile(favg?faceOf(Math.round(favg)):'—','calificación promedio', faces.length?favg.toFixed(1)+' de 5 en '+faces.length+' libro(s)':'')
      +tile(spp?Math.round(3600/spp):'—','páginas por hora (tu ritmo)', spp?'≈ '+Math.round(spp)+' s por página':'se calcula mientras lees')
      +tile(hours.some(Boolean)?bestH+':00':'—','tu hora favorita para leer', hours.some(Boolean)?(bestH<6?'¡búho de madrugada! 🦉':bestH<12?'lectora mañanera ☀️':bestH<19?'lectora de tarde ☕':'lectora de velas 🕯️'):'se anota desde esta versión')
      +tile(hrs?hrs+' h':'—','escuchando audiolibros', shortest?'📐 el más corto leído: '+esc(shortest.t)+' ('+shortest.pagesN+')':'')
    +'</div>'
    +'<div class="stat-card wide"><div class="adv-h">📃 Páginas por mes · últimos 12 meses</div>'+vbars(pages, mLbl, 'páginas', {short:mShort})+'</div>'
    +'<div class="stat-card wide"><div class="adv-h">📚 Libros terminados por mes · últimos 12 meses</div>'+vbars(books, mLbl, 'libro(s)', {short:mShort})+'</div>'
    +'<div class="stat-card"><div class="adv-h">🕰️ ¿A qué hora lees? <span class="lbl" style="font-weight:400">(páginas nuevas por hora)</span></div>'+vbars(hours, hLbl, 'páginas', {short:hShort, dense:true})+'</div>'
    +'<div class="stat-card"><div class="adv-h">📅 ¿Qué día lees más?</div>'+vbars(wd, wdL, 'páginas', {short:['L','M','X','J','V','S','D']})+'</div>'
    +'<div class="stat-card"><div class="adv-h">✍️ Tus autores más leídos</div>'+hbars(Object.entries(au).sort((a,b)=>b[1]-a[1]).slice(0,6), 'libro(s)')+'</div>'
    +'<div class="stat-card"><div class="adv-h">🏛️ Tus estantes favoritos</div>'+hbars(secs, 'libro(s)')+'</div>'
    +'<div class="stat-card wide"><div class="adv-h">📦 Tu salón por formato</div>'+hbars(Object.entries(fm).sort((a,b)=>b[1]-a[1]), 'libro(s)')+'</div>';
}
/* tooltip compartido para todas las barras */
function initStatTip(){
  const tip=document.createElement('div'); tip.className='stat-tip'; document.querySelector('.win').appendChild(tip);
  document.addEventListener('mousemove', e=>{
    const t=e.target.closest && e.target.closest('[data-tip]');
    if(!t){ tip.style.display='none'; return; }
    const w=document.querySelector('.win').getBoundingClientRect();
    tip.textContent=t.dataset.tip; tip.style.display='block';
    tip.style.left=Math.min(w.width-200, e.clientX-w.left+12)+'px'; tip.style.top=(e.clientY-w.top+14)+'px';
  });
}
