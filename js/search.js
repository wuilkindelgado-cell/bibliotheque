/* v1.3: buscador global — libros, subrayados, citas, posits, notas de audio, diario, cartas, deseos y préstamos */
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
function snippet(text, q){
  const t=String(text||''), i=norm(t).indexOf(q); if(i<0) return esc(t.slice(0,110));
  const a=Math.max(0,i-45), b=Math.min(t.length, i+q.length+65);
  return (a?'…':'')+esc(t.slice(a,i))+'<b>'+esc(t.slice(i,i+q.length))+'</b>'+esc(t.slice(i+q.length,b))+(b<t.length?'…':'');
}
function openGlobalSearch(){
  let ov=document.getElementById('gsOv');
  if(!ov){
    ov=document.createElement('div'); ov.id='gsOv'; ov.className='ficha-overlay'; ov.style.zIndex=85; ov.style.alignItems='flex-start';
    ov.innerHTML='<div class="frame-card gs-card"><div style="display:flex; gap:8px; align-items:center">'
      +'<span style="font-size:20px">🔍</span><input type="text" id="gsQ" placeholder="Busca en todo tu salón: libros, subrayados, notas, diario, cartas…" autocomplete="off">'
      +'<button class="chip" onclick="document.getElementById(\'gsOv\').classList.remove(\'show\')">✕</button></div>'
      +'<div class="lbl" style="font-size:11px; font-style:italic; margin-top:4px">Atajo: Ctrl + K · sin importar tildes ni mayúsculas</div>'
      +'<div id="gsRes" class="gs-res"></div></div>';
    ov.onclick=e=>{ if(e.target===ov) ov.classList.remove('show'); };
    document.querySelector('.win').appendChild(ov);
    let t=null; document.getElementById('gsQ').oninput=()=>{ clearTimeout(t); t=setTimeout(runGlobalSearch, 150); };
    document.getElementById('gsQ').onkeydown=e=>{ if(e.key==='Escape') ov.classList.remove('show'); if(e.key==='Enter'){ const f=document.querySelector('#gsRes .gs-item'); if(f) f.click(); } };
  }
  ov.classList.add('show');
  const q=document.getElementById('gsQ'); q.select(); setTimeout(()=>q.focus(), 30);
  runGlobalSearch();
}
function runGlobalSearch(){
  const raw=document.getElementById('gsQ').value.trim(), q=norm(raw), res=document.getElementById('gsRes');
  if(q.length<2){ res.innerHTML='<div class="lbl" style="font-style:italic; padding:10px">Escribe al menos dos letras ✒️</div>'; return; }
  const groups={};
  const add=(g, icon, title, text, go)=>{ (groups[g]=groups[g]||[]).push({icon, title, text, go}); };
  const hit=(...xs)=>xs.some(x=>norm(x).includes(q));
  state.floor.forEach((b,i)=>{
    if(hit(b.t, b.author, b.desc, b.expect, b.series&&b.series.name)) add('Libros', b.status?'⏸':'📖', b.t, snippet([b.author, b.desc||b.expect].filter(Boolean).join(' · ')||'en el suelo, por leer', q), ()=>openReaderFor(i));
  });
  state.sections.forEach((s,si)=>s.books.forEach((b,bi)=>{
    if(hit(b.t, b.author, b.desc, b.review, b.favPart, b.expect, b.series&&b.series.name)) add('Libros', '🏛️', b.t, snippet([b.author, b.review||b.desc, b.favPart].filter(Boolean).join(' · ')||'en «'+s.name+'»', q), ()=>{ show('v-library'); openFicha(si,bi); });
  }));
  const floorIdx=b=>state.floor.indexOf(b);
  allBooks().forEach(b=>{
    const goPage=pg=>()=>{ const i=floorIdx(b); if(i>-1){ openReaderFor(i).then(()=>setTimeout(()=>gotoPage(pg), 600)); } else show('v-quotes'); };
    Object.keys(b.hls||{}).forEach(pg=>(b.hls[pg]||[]).forEach(r=>{ if(hit(r.q)) add('Subrayados', '🖍️', b.t+' · pág. '+pg, snippet(r.q,q), goPage(+pg)); }));
    (b.ehls||[]).forEach(h=>{ if(hit(h.q)) add('Subrayados', '🖍️', b.t+(h.pg?' · pág. '+h.pg:''), snippet(h.q,q), ()=>{ const i=floorIdx(b); if(i>-1) openReaderFor(i).then(()=>setTimeout(()=>epubR&&epubR.display(h.cfi), 900)); else show('v-quotes'); }); });
    Object.keys(b.posits||{}).forEach(pg=>(b.posits[pg]||[]).forEach(p=>{ if(hit(p.t)) add('Posits', '🗒️', b.t+' · pág. '+pg, snippet(p.t,q), goPage(+pg)); }));
    (b.notes||[]).forEach((n,k)=>{ if(hit(n.t)) add('Notas de audiolibro', '🎧', b.t+' · '+fmtT(n.at), snippet(n.t,q), ()=>{ const i=floorIdx(b); if(i>-1) openAudio(i).then(()=>abGoNote(k)); }); });
  });
  (state.quotes||[]).forEach(x=>{ if(hit(x.q, x.bk)) add('Citas', '✒️', x.bk||'Cita', snippet(x.q,q), ()=>show('v-quotes')); });
  (state.diary||[]).forEach(e=>{ if(hit(e.t)) { const iso=diaryIso(e); add('Diario', '📔', e.d, snippet(e.t,q), ()=>{ show('v-calendar'); if(iso) calSelect(iso); }); } });
  (state.letters||[]).forEach(l=>{ if(l.openedAt && hit(l.title, l.body)) add('Cartas', '💌', l.title, snippet(l.body,q), ()=>{ show('v-letters'); readLetter(l.id); }); });
  (state.goals||[]).forEach(g=>{ if(hit(g.title, g.reward&&g.reward.text)) add('Metas', '🏅', g.title, snippet((g.reward&&(g.reward.show||g.reachedAt)&&g.reward.text)||g.title,q), ()=>show('v-goals')); });
  (state.wishes||[]).forEach(w=>{ if(hit(w.t, w.author, w.note)) add('Deseos y préstamos', '🌠', w.t, snippet([w.author,w.note].filter(Boolean).join(' · '),q), ()=>show('v-wishes')); });
  (state.loans||[]).forEach(l=>{ if(hit(l.t, l.who)) add('Deseos y préstamos', '🤝', l.t, snippet((l.dir==='in'?'me lo prestó ':'se lo presté a ')+l.who,q), ()=>show('v-wishes')); });
  const order=['Libros','Subrayados','Citas','Posits','Notas de audiolibro','Diario','Cartas','Metas','Deseos y préstamos'];
  const total=Object.values(groups).reduce((a,g)=>a+g.length,0);
  if(!total){ res.innerHTML='<div class="lbl" style="font-style:italic; padding:10px">Nada con «'+esc(raw)+'» en tu salón 🕊️</div>'; return; }
  res.innerHTML='<div class="lbl" style="font-size:11.5px; margin:6px 0">'+total+' resultado(s)</div>';
  order.forEach(g=>{ if(!groups[g]) return;
    const h=document.createElement('div'); h.className='gs-h'; h.textContent=g+' ('+groups[g].length+')'; res.appendChild(h);
    groups[g].slice(0,25).forEach(it=>{ const b=document.createElement('button'); b.className='gs-item';
      b.innerHTML='<span class="gi">'+it.icon+'</span><span><span class="gt">'+esc(it.title)+'</span><br><span class="gx">'+it.text+'</span></span>';
      b.onclick=()=>{ document.getElementById('gsOv').classList.remove('show'); it.go(); }; res.appendChild(b); });
  });
  state.c.search=1; checkAch();
}
window.addEventListener('keydown', e=>{ if((e.ctrlKey||e.metaKey) && (e.key==='k'||e.key==='K')){ e.preventDefault(); openGlobalSearch(); } });
ACH.push({id:'search', e:'🔎', nm:'Detective del salón', st:'Usa el buscador global', chk:()=>!!state.c.search});
