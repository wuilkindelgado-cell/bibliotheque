/* v1.2: audiolibros — se guardan en Documentos\Bibliotheque Enchantee\audiolibros y se escuchan dentro del salón */
const AB={audio:null, book:null, sleepT:null, sleepEnd:false, tick:null, minAcc:0};

function fmtT(s){ s=Math.max(0, Math.floor(s||0)); const h=Math.floor(s/3600), m=Math.floor(s%3600/60), x=s%60;
  return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0'); }
function abTotal(b){ return (b.tracks||[]).reduce((a,t)=>a+(t.dur||0),0); }
function abElapsed(b){ const p=b.pos||{t:0,s:0}; return (b.tracks||[]).slice(0,p.t).reduce((a,t)=>a+(t.dur||0),0)+(p.s||0); }

/* ---------- importar ---------- */
async function importAudiobook(files){
  if(!window.bibFS || !bibFS.importAudio || !bibFS.pathOf){ toast('«Los audiolibros funcionan en la app de escritorio 🎧»'); return false; }
  files=[...files].sort((a,b)=>natCmp(a.name,b.name));
  const paths=files.map(f=>bibFS.pathOf(f)).filter(Boolean);
  if(!paths.length){ toast('«No pude leer esos audios 🥺»'); return false; }
  const id=Date.now().toString(36)+Math.floor(Math.random()*99999);
  toast('«Copiando tu audiolibro al salón… 🎧⏳ (puede tardar si es grande)»');
  const tracks=await bibFS.importAudio(id, paths);
  if(!tracks || !tracks.length){ toast('«No pude guardar el audiolibro 🥺»'); return false; }
  let t=titleFromFile(files[0].name).replace(/^\d+[\s._-]*/,'').replace(/\s*(cap(itulo|ítulo)?|parte|track|pista|cd|disco)?\s*\d+\s*$/i,'').trim()||'Audiolibro';
  const bk={id, t, c:'#8E6A86', desc:'', expect:'', done:false, reread:false, justFell:true, hasPdf:true, hasCover:false, hasFloor:false,
    fmt:'audio', tracks:tracks.map(x=>({file:x.file, name:x.name.replace(/\.[^.]+$/,''), dur:0})), pos:{t:0,s:0}, notes:[], page:1,
    posits:{}, hls:{}, startedDate:null, addedDate:fmtDay(new Date())};
  state.floor.push(bk); renderLibrary(); scheduleSave();
  abMeasure(bk);
  state.c.audio=1; checkAch();
  return true;
}
/* mide la duración de cada pista en segundo plano */
async function abMeasure(b){
  for(const tr of b.tracks){
    if(tr.dur) continue;
    const url=await bibFS.fileUrl(tr.file); if(!url) continue;
    tr.dur=await new Promise(res=>{ const a=new Audio(); a.preload='metadata';
      a.onloadedmetadata=()=>res(isFinite(a.duration)?a.duration:0); a.onerror=()=>res(0); a.src=url; setTimeout(()=>res(0), 15000); });
  }
  b.pagesN=Math.max(1, Math.round(abTotal(b)/120)); // 1 «página» ≈ 2 minutos de escucha
  scheduleSave(); if(AB.book===b) abRender();
}

/* ---------- reproductor ---------- */
async function openAudio(i){
  const b=state.floor[i]; if(!b) return;
  state.readingIdx=i; state.lastReadId=b.id; curBook=b; pdfDoc=null; scheduleSave();
  if(!b.startedDate){ b.startedDate=fmtDay(new Date()); }
  show('v-audio');
  if(AB.book!==b) await abLoad(b, false);
  abRender();
  if(b.tracks.some(t=>!t.dur)) abMeasure(b);
}
async function abLoad(b, play){
  if(!AB.audio){
    AB.audio=new Audio();
    AB.audio.addEventListener('timeupdate', abOnTime);
    AB.audio.addEventListener('ended', abOnEnded);
    AB.audio.addEventListener('play', ()=>{ abUi(); markReadToday(); });
    AB.audio.addEventListener('pause', abUi);
  }
  AB.book=b;
  const p=b.pos||{t:0,s:0};
  const url=await bibFS.fileUrl(b.tracks[p.t].file);
  if(!url){ toast('«No encuentro este audio en Documentos\\Bibliotheque Enchantee\\audiolibros 🥺»'); return; }
  AB.audio.src=url; AB.audio.playbackRate=b.rate||1;
  AB.audio.currentTime=p.s||0;
  if(play) AB.audio.play().catch(()=>{});
}
function abOnTime(){
  const b=AB.book; if(!b) return;
  b.pos={t:b.pos.t, s:AB.audio.currentTime};
  const now=Date.now();
  if(!AB.last) AB.last=now;
  if(!AB.audio.paused){ AB.minAcc+=(now-AB.last)/1000; }
  AB.last=now;
  if(AB.minAcc>=60){ AB.minAcc-=60; b.mins=(b.mins||0)+1; state.audioMin=(state.audioMin||0)+1;
    if((state.audioMin%2)===0){ const d=fmtDay(new Date()); state.pageLog[d]=(state.pageLog[d]||0)+1; updateDayChip(); }
    scheduleSave(); checkAch(); }
  if(document.getElementById('v-audio').classList.contains('active')) abProgressUi(); else abMini();
}
async function abOnEnded(){
  const b=AB.book; if(!b) return;
  if(AB.sleepEnd){ AB.sleepEnd=false; abSleep(0); toast('«Fin del capítulo… dulces sueños 🌙»'); b.pos={t:Math.min(b.pos.t+1, b.tracks.length-1), s:0}; scheduleSave(); return; }
  if(b.pos.t<b.tracks.length-1){ b.pos={t:b.pos.t+1, s:0}; await abLoad(b, true); abRender(); }
  else { b.pos.s=b.tracks[b.pos.t].dur||AB.audio.duration||0; scheduleSave(); abRender();
    toast('«¡Terminaste de escuchar <b>'+esc(b.t)+'</b>! Sella tu lectura 🎀»'); }
}
function abToggle(){ if(!AB.audio||!AB.book) return; AB.audio.paused?AB.audio.play().catch(()=>{}):AB.audio.pause(); }
function abSkip(sec){ if(!AB.audio) return; AB.audio.currentTime=Math.max(0, Math.min((AB.audio.duration||1e9)-1, AB.audio.currentTime+sec)); }
async function abTrack(k){ const b=AB.book; if(!b) return; const t=Math.max(0, Math.min(b.tracks.length-1, k)); b.pos={t, s:0}; await abLoad(b, true); abRender(); }
function abRate(v){ const b=AB.book; if(!b) return; b.rate=parseFloat(v)||1; AB.audio.playbackRate=b.rate; scheduleSave(); }
function abSeek(pct){
  const b=AB.book; if(!b) return; const tot=abTotal(b); if(!tot) return;
  let target=tot*pct, k=0; while(k<b.tracks.length-1 && target>(b.tracks[k].dur||0)){ target-=b.tracks[k].dur||0; k++; }
  if(k!==b.pos.t){ b.pos={t:k, s:target}; abLoad(b, !AB.audio.paused).then(abRender); } else AB.audio.currentTime=target;
}
function abSleep(min){
  clearTimeout(AB.sleepT); AB.sleepT=null; AB.sleepEnd=false;
  const s=document.getElementById('abSleep');
  if(min==='fin'){ AB.sleepEnd=true; toast('«Me detendré al final de este capítulo 🌙»'); }
  else if(min>0){ AB.sleepT=setTimeout(()=>{ AB.audio.pause(); AB.sleepT=null; if(s) s.value='0'; toast('«Se apagó el temporizador… que descanses 🌙💤»'); }, min*60000);
    toast('«Me apago en '+min+' minutos 🌙»'); }
  if(s && !min) s.value='0';
}
function abAddNote(){
  const b=AB.book; if(!b) return;
  const inp=document.getElementById('abNote'); const t=inp.value.trim();
  if(!t){ toast('«Escribe tu notita primero ✍️»'); return; }
  (b.notes=b.notes||[]).push({t, at:abElapsed(b), tr:b.pos.t, s:AB.audio.currentTime, d:fmtDay(new Date())});
  inp.value=''; scheduleSave(); abNotesUi(); state.c.posits=(state.c.posits||0)+1; checkAch();
  toast('«Nota guardada en '+fmtT(AB.audio.currentTime)+' 🗒️»');
}
async function abGoNote(i){ const b=AB.book, n=b.notes[i]; if(!n) return; if(n.tr!==b.pos.t){ b.pos={t:n.tr, s:n.s}; await abLoad(b, true); } else AB.audio.currentTime=n.s; abRender(); }

/* ---------- interfaz ---------- */
function abRender(){
  const b=AB.book; if(!b) return;
  const u=urlMap[b.id+'_cover'];
  document.getElementById('abCover').style.background=u?'url('+u+') center/cover':'linear-gradient(150deg,'+b.c+',#4B4351)';
  document.getElementById('abCover').innerHTML=u?'':'<span>🎧</span>';
  document.getElementById('abTitle').textContent=b.t;
  document.getElementById('abAuthor').textContent=b.author||'';
  document.getElementById('abRateSel').value=String(b.rate||1);
  const tl=document.getElementById('abTracks'); tl.innerHTML='';
  b.tracks.forEach((t,k)=>{ const e=document.createElement('button'); e.className='idx-item'+(k===b.pos.t?' on':'');
    e.innerHTML='<span class="pg">'+(k===b.pos.t?'▶':(k+1))+'</span><span style="flex:1">'+esc(t.name)+'</span><span class="pg" style="text-align:right">'+(t.dur?fmtT(t.dur):'')+'</span>';
    e.onclick=()=>abTrack(k); tl.appendChild(e); });
  abNotesUi(); abProgressUi(); abUi();
}
function abNotesUi(){
  const b=AB.book, l=document.getElementById('abNotes'); if(!l||!b) return; l.innerHTML='';
  (b.notes||[]).forEach((n,i)=>{ const e=document.createElement('button'); e.className='idx-item';
    e.innerHTML='<span class="pg">'+fmtT(n.at)+'</span><span style="flex:1">'+esc(n.t)+'</span>'; e.onclick=()=>abGoNote(i); l.appendChild(e); });
  if(!(b.notes||[]).length) l.innerHTML='<div class="lbl" style="font-style:italic; font-size:12px">Tus notas con la hora exacta aparecerán aquí 🗒️</div>';
}
function abProgressUi(){
  const b=AB.book; if(!b) return;
  const tot=abTotal(b), el=abElapsed(b);
  const pct=tot?el/tot:0;
  document.getElementById('abBar').style.width=(pct*100).toFixed(2)+'%';
  document.getElementById('abTime').textContent=fmtT(el)+' / '+(tot?fmtT(tot):'…');
  document.getElementById('abLeft').textContent=tot?'faltan ~'+fmtDur((tot-el)/(b.rate||1))+' a tu velocidad':'';
  document.getElementById('abTrackLbl').textContent='Pista '+(b.pos.t+1)+' de '+b.tracks.length+' · '+fmtT(AB.audio?AB.audio.currentTime:0);
  b.page=Math.max(1, Math.round(el/120));
  const end=tot && el>=tot-3;
  document.getElementById('abSeal').style.display=end?'block':'none';
}
function abUi(){
  const p=AB.audio && !AB.audio.paused;
  const bt=document.getElementById('abPlay'); if(bt) bt.textContent=p?'⏸':'▶';
  abMini();
}
function abMini(){
  const m=document.getElementById('abMini'); if(!m) return;
  const on=AB.book && AB.audio && !AB.audio.paused && !document.getElementById('v-audio').classList.contains('active');
  m.classList.toggle('show', !!on);
  if(on){ document.getElementById('abMiniT').textContent=AB.book.t; }
}
function abSeekClick(ev){ const r=ev.currentTarget.getBoundingClientRect(); abSeek((ev.clientX-r.left)/r.width); }

/* ---------- enganches ---------- */
const _orfA=openReaderFor;
openReaderFor=async function(i){ const b=state.floor[i]; if(b && b.fmt==='audio') return openAudio(i); return _orfA(i); };
const _shA=show; show=function(id){ const r=_shA(id); abMini(); return r; };
/* al borrar un audiolibro para siempre, también se va su carpeta */
const _ptA=purgeTrash;
purgeTrash=async function(i){ const e=(state.trash||[])[i]; const id=e && e.b && e.b.fmt==='audio' && e.b.id; const r=await _ptA(i);
  if(id && window.bibFS && bibFS.deleteDir) bibFS.deleteDir('audiolibros/'+id); return r; };
/* el formulario de «Nuevo libro» también acepta audios */
const _pickA=pickPdf;
pickPdf=function(inp, btnId){
  const f=inp.files && inp.files[0];
  if(f && mediaFormat(f)==='audio'){ const fs=[...inp.files]; inp.value=''; closeAdd(); importFiles(fs); return; }
  return _pickA(inp, btnId);
};
