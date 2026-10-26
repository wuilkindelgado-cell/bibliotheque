/* v1.3: mapa literario — dónde ocurren sus historias y de dónde son sus autores */
let mapMode='todo', mapSel=null;
const countryName=a2=>{ const c=(window.WORLD&&WORLD.all||[]).find(x=>x[0]===a2); return c?c[1]:a2; };
const countryCode=name=>{ const n=String(name||'').trim().toLowerCase(); const c=(WORLD.all||[]).find(x=>x[1].toLowerCase()===n); return c?c[0]:null; };

/* libros por país según el modo */
function mapCounts(){
  const m={};
  allBooks().forEach(b=>{
    const set=new Set();
    if(mapMode!=='autores') (b.places||[]).forEach(p=>set.add(p));
    if(mapMode!=='historias' && b.authorCountry) set.add(b.authorCountry);
    set.forEach(p=>{ (m[p]=m[p]||[]).push(b); });
  });
  return m;
}
/* escala secuencial de un solo tono (rosa del salón), de claro a oscuro */
const MAP_RAMP=['#F4D9DA','#E8B1B7','#D48A95','#B86274','#8E3F55'];
function mapColor(n){ if(!n) return null; return MAP_RAMP[n>=8?4:n>=5?3:n>=3?2:n>=2?1:0]; }
function renderMap(){
  const host=document.getElementById('mapSvg'); if(!host || !window.WORLD) return;
  const counts=mapCounts();
  let s='<svg viewBox="0 0 '+WORLD.w+' '+WORLD.h+'" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mapa de países de tus libros">';
  s+='<path d="M0 0H'+WORLD.w+'V'+WORLD.h+'H0Z" class="sea"/>';
  WORLD.c.forEach(c=>{ const n=(counts[c.id]||[]).length, col=mapColor(n);
    s+='<path d="'+c.d+'" data-id="'+c.id+'" class="cty'+(n?' has':'')+(mapSel===c.id?' sel':'')+'"'+(col?' style="fill:'+col+'"':'')+'/>'; });
  WORLD.c.forEach(c=>{ const n=(counts[c.id]||[]).length; if(n) s+='<text x="'+c.c[0]+'" y="'+(c.c[1]+4)+'" class="pin">'+n+'</text>'; });
  s+='</svg>';
  host.innerHTML=s;
  const tip=document.getElementById('mapTip');
  host.querySelectorAll('.cty').forEach(p=>{
    const id=p.dataset.id, n=(counts[id]||[]).length;
    p.onmousemove=e=>{ const r=host.getBoundingClientRect();
      tip.innerHTML='<b>'+esc(countryName(id))+'</b><br>'+(n?n+' libro(s)':'aún sin libros'); tip.style.display='block';
      tip.style.left=(e.clientX-r.left+14)+'px'; tip.style.top=(e.clientY-r.top+10)+'px'; };
    p.onmouseleave=()=>{ tip.style.display='none'; };
    p.onclick=()=>{ mapSel=id; renderMap(); renderMapPanel(); };
  });
  // resumen
  const ids=Object.keys(counts);
  const onMap=new Set(WORLD.c.map(c=>c.id));
  const extra=ids.filter(i=>!onMap.has(i));
  document.getElementById('mapSum').innerHTML='<b>'+ids.length+'</b> país(es) visitados leyendo'
    +(extra.length?' · también: '+extra.map(i=>esc(countryName(i))+' ('+counts[i].length+')').join(', '):'')
    +(ids.length?'':' — marca dónde ocurre cada historia en ✎ Editar libro o aquí al lado 🌍');
  document.querySelectorAll('#mapModes button').forEach(b=>b.classList.toggle('on', b.dataset.m===mapMode));
  state.c.countries=Math.max(state.c.countries||0, ids.length); checkAch();
}
function setMapMode(m){ mapMode=m; renderMap(); renderMapPanel(); }
function renderMapPanel(){
  const p=document.getElementById('mapPanel'); if(!p) return;
  if(!mapSel){ p.innerHTML='<div class="lbl" style="font-style:italic">Toca un país del mapa para ver sus libros o asignarle uno 🌍</div>'+mapRanking(); return; }
  const counts=mapCounts(), books=counts[mapSel]||[];
  const others=allBooks().filter(b=>!books.includes(b));
  p.innerHTML='<div style="font-family:var(--disp); font-weight:700; font-size:18px">'+esc(countryName(mapSel))+'</div>'
    +(books.length?books.map(b=>'<div class="idx-item" data-id="'+b.id+'"><span class="pg">'+((b.places||[]).includes(mapSel)?'📍':'✍️')+'</span><span style="flex:1">'+esc(b.t)+(b.author?' <i style="color:var(--ink-soft)">· '+esc(b.author)+'</i>':'')+'</span><span class="unpin" title="Quitar de este país">✕</span></div>').join('')
      :'<div class="lbl" style="font-style:italic; margin:6px 0">Aún no hay libros de aquí</div>')
    +(others.length?'<div style="display:flex; gap:6px; margin-top:10px"><select id="mapAddBook" style="flex:1">'+others.map(b=>'<option value="'+b.id+'">'+esc(b.t)+'</option>').join('')+'</select>'
      +'<select id="mapAddKind" style="width:auto"><option value="p">📍 ocurre aquí</option><option value="a">✍️ autor/a de aquí</option></select></div>'
      +'<div style="text-align:right; margin-top:6px"><button class="btn rose small" onclick="mapAssign()">Agregar 🌍</button></div>':'')
    +'<div style="text-align:right; margin-top:6px"><button class="chip" onclick="mapSel=null; renderMap(); renderMapPanel()">Ver ranking</button></div>';
  p.querySelectorAll('.idx-item').forEach(r=>{
    r.querySelector('.unpin').onclick=ev=>{ ev.stopPropagation(); const b=findBook(r.dataset.id).b;
      b.places=(b.places||[]).filter(x=>x!==mapSel); if(b.authorCountry===mapSel) delete b.authorCountry; scheduleSave(); renderMap(); renderMapPanel(); };
    r.onclick=()=>openEdit(r.dataset.id);
  });
}
function mapAssign(){
  const loc=findBook(document.getElementById('mapAddBook').value); if(!loc) return;
  const k=document.getElementById('mapAddKind').value, b=loc.b;
  if(k==='p'){ b.places=b.places||[]; if(!b.places.includes(mapSel)) b.places.push(mapSel); } else b.authorCountry=mapSel;
  scheduleSave(); renderMap(); renderMapPanel();
  toast('«<b>'+esc(b.t)+'</b> ya tiene su pin en '+esc(countryName(mapSel))+' 📍»');
}
function mapRanking(){
  const c=mapCounts(); const r=Object.entries(c).sort((a,b)=>b[1].length-a[1].length).slice(0,8);
  if(!r.length) return '';
  const max=r[0][1].length;
  return '<div style="font-family:var(--disp); font-weight:700; font-size:14px; margin-top:12px">Tus países más leídos</div>'
    +r.map(([id,bs])=>'<div class="hbar"><span class="hl">'+esc(countryName(id))+'</span><span class="ht"><i style="width:'+Math.round(bs.length/max*100)+'%"></i></span><span class="hv">'+bs.length+'</span></div>').join('');
}

/* ---------- campos de país en «Editar libro» ---------- */
function placeChips(){
  const box=document.getElementById('edPlaces'); if(!box || !editing) return;
  const b=findBook(editing.id).b;
  box.innerHTML=(edPlaces||[]).map(p=>'<span class="chip pchip">📍 '+esc(countryName(p))+' <b data-p="'+p+'">✕</b></span>').join('');
  box.querySelectorAll('b').forEach(x=>x.onclick=()=>{ edPlaces=edPlaces.filter(y=>y!==x.dataset.p); placeChips(); });
}
let edPlaces=[];
function addPlace(inp){
  const code=countryCode(inp.value); if(!code){ if(inp.value.trim()) toast('«No encuentro ese país… elígelo de la lista 🌍»'); return; }
  if(!edPlaces.includes(code)) edPlaces.push(code);
  inp.value=''; placeChips();
}
const _oeM=openEdit;
openEdit=function(id){
  _oeM(id);
  const loc=findBook(id); if(!loc) return;
  const dl=document.getElementById('countryList');
  if(dl && !dl.options.length) dl.innerHTML=(WORLD.all||[]).map(c=>'<option value="'+esc(c[1])+'">').join('');
  edPlaces=[...(loc.b.places||[])]; placeChips();
  document.getElementById('edAuthorCountry').value=loc.b.authorCountry?countryName(loc.b.authorCountry):'';
};
const _seM=saveEdit;
saveEdit=async function(){
  const id=editing && editing.id;
  const pending=document.getElementById('edPlaceIn'); if(pending && pending.value.trim()) addPlace(pending);
  const places=[...edPlaces], ac=countryCode(document.getElementById('edAuthorCountry').value);
  await _seM();
  const loc=id && findBook(id); if(!loc) return;
  if(places.length) loc.b.places=places; else delete loc.b.places;
  if(ac) loc.b.authorCountry=ac; else delete loc.b.authorCountry;
  scheduleSave();
};
ACH.push(
 {id:'map5',  e:'🧭', nm:'Trotamundos', st:'Lee historias de 5 países distintos', chk:()=>(state.c.countries||0)>=5},
 {id:'map15', e:'🌍', nm:'La vuelta al mundo', st:'Lee historias de 15 países', chk:()=>(state.c.countries||0)>=15}
);
