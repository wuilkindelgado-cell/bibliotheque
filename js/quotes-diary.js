/* Citas y diario del corazón */
/* ===== v6: citas exportables como tarjeta PNG ===== */
function renderQuotes(){
  const g=document.getElementById('quotesGrid'); if(!g) return;
  g.innerHTML='';
  if(!state.quotes.length){
    g.innerHTML='<div class="stat-card"><div class="lbl">Subraya algo en el lector y aparecerá aquí ✒️</div></div>'; return;
  }
  state.quotes.forEach((q,i)=>{
    const names={'hl-gold':'oro','hl-rose':'rosa','hl-blue':'azul','hl-sage':'salvia'};
    const c=document.createElement('div'); c.className='stat-card'; c.style.borderColor='var(--bridal-rose)';
    const src2=q.bk?` · <span style="font-style:italic">${q.bk}${q.pg?(' pág. '+q.pg):''}</span>`:'';
    c.innerHTML=`<div style="font-family:var(--disp); font-style:italic; font-size:15px; line-height:1.5">« ${q.q} »</div>
      <div class="lbl" style="margin-top:6px">🖍️ ${names[q.color]||'oro'}${src2}</div>
      <div class="qbtns">
        <button class="btn small" style="font-size:11px; padding:3px 10px" onclick="copyQuote(${i})">Copiar 📋</button>
        <button class="btn small" style="font-size:11px; padding:3px 10px" onclick="exportQuote(${i})">Tarjeta 💌</button>
        <button class="btn small" style="font-size:11px; padding:3px 10px; border-color:var(--wax)" onclick="delQuote(${i})">Quitar ✕</button>
      </div>`;
    g.appendChild(c);
  });
}
function delQuote(i){
  if(!confirm('¿Quitar esta cita de tu colección?')) return;
  state.quotes.splice(i,1);
  renderQuotes(); scheduleSave();
  toast('«Cita retirada de la colección 🕊️»');
}
function copyQuote(i){
  const q=state.quotes[i]; if(!q) return;
  const t='« '+q.q+' »'+(q.bk?(' — '+q.bk+(q.pg?', pág. '+q.pg:'')):'');
  try{ navigator.clipboard.writeText(t); toast('«Cita copiada al portapapeles 📋✨»'); }
  catch(e){ toast('«No pude copiar 🥺 selecciónala y usa Ctrl+C»'); }
}
function exportQuote(i){
  const q=state.quotes[i];
  const cv=document.createElement('canvas'); cv.width=900; cv.height=560;
  const x=cv.getContext('2d');
  x.fillStyle='#F3EADB'; x.fillRect(0,0,900,560);
  x.strokeStyle='#C9A227'; x.lineWidth=6; x.strokeRect(18,18,864,524);
  x.lineWidth=2; x.strokeRect(34,34,832,492);
  x.textAlign='center';
  x.fillStyle='#C48A90'; x.font='38px serif'; x.fillText('❦',450,92);
  x.fillStyle='#5A463E'; x.font='italic 600 30px "Cormorant Garamond", Georgia, serif';
  const words=('« '+q.q+' »').split(' ');
  const lines=[]; let line='';
  words.forEach(w=>{ const t=line?line+' '+w:w;
    if(x.measureText(t).width>680){ lines.push(line); line=w; } else line=t; });
  lines.push(line);
  let y=290-(lines.length-1)*22;
  lines.forEach(l=>{ x.fillText(l,450,y); y+=44; });
  x.font='20px "Cormorant Garamond", Georgia, serif'; x.fillStyle='#9A7A1B';
  x.fillText('— Bibliothèque Enchantée de '+state.name+' —',450,486);
  const a=document.createElement('a'); a.download='cita_'+(i+1)+'.png';
  a.href=cv.toDataURL('image/png'); a.click();
  state.c.qx=(state.c.qx||0)+1; checkAch(); scheduleSave();
  toast('«Tarjeta guardada como PNG 💌 lista para compartir»');
}

/* ===== v6: diario del corazón ===== */
let dPhotoFile=null;
function pickDPhoto(inp){
  const f=inp.files[0]; if(!f) return;
  dPhotoFile=f;
  document.getElementById('dphImg').src=URL.createObjectURL(f);
  document.getElementById('dphv').classList.add('on');
  inp.value='';
}
function clearDPhoto(){
  dPhotoFile=null;
  document.getElementById('dphv').classList.remove('on');
  document.getElementById('dphImg').src='';
}
async function addDiary(){
  const t=document.getElementById('dTxt').value.trim();
  const sel=document.querySelector('#dFaces .sel');
  if(!t && !sel && !dPhotoFile){ toast('«Cuéntame aunque sea con una carita o una foto 🥺»'); return; }
  /* v20: puede ser una página de hoy o de un día pasado elegido en el calendario */
  const dd=diaryDate ? isoToDate(diaryDate) : new Date();
  const entry={
    d:dd.toLocaleDateString('es-PE',{day:'numeric', month:'long', year:'numeric'}),
    f:sel?sel.textContent:'💗', t:t||'(solo un sentimiento)', iso:fmtDay(dd)
  };
  if(diaryDate) state.c.calday=1;
  diaryDate=null;
  const lb=document.querySelector('#v-diary .stat-card .lbl'); if(lb) lb.textContent='Nueva entrada de hoy';
  if(dPhotoFile){
    const pid=Date.now().toString(36)+Math.floor(Math.random()*999);
    await idbPut('files','d_'+pid, dPhotoFile);
    urlMap['d_'+pid]=URL.createObjectURL(dPhotoFile);
    fsMirror('diario/foto_'+pid+'.png', dPhotoFile);
    entry.pid=pid;
    clearDPhoto();
  }
  state.diary.unshift(entry);
  state.diary.sort((a,b)=>String(diaryIso(b)||'').localeCompare(String(diaryIso(a)||'')));
  document.getElementById('dTxt').value='';
  if(sel) sel.classList.remove('sel');
  renderDiary(); state.c.diary=(state.c.diary||0)+1; checkAch(); scheduleSave();
  toast('«Guardado en tu diario del corazón 📔»');
}
function delDiary(i){
  const e=state.diary[i]; if(!e) return;
  if(!confirm('¿Quitar esta página de tu diario?')) return;
  if(e.pid){ idbDel('files','d_'+e.pid); delete urlMap['d_'+e.pid]; }
  state.diary.splice(i,1);
  renderDiary(); scheduleSave();
  toast('«Página retirada del diario con cuidado 🕊️»');
}
function renderDiary(){
  const l=document.getElementById('diaryList'); if(!l) return;
  l.innerHTML = state.diary.length ? '' :
    '<div class="diary-entry"><div class="dd">Tu diario espera su primera página… 🕊️</div></div>';
  state.diary.forEach((e,i)=>{
    const c=document.createElement('div'); c.className='diary-entry';
    const img=(e.pid && urlMap['d_'+e.pid]) ? `<img class="dimg" src="${urlMap['d_'+e.pid]}" alt="foto del diario">` : '';
    c.innerHTML=`<span class="ddel" title="Eliminar esta entrada" onclick="delDiary(${i})">✕</span>
      <div class="dd">${e.d} · ${e.f}</div>
      <div style="font-family:var(--hand); font-size:17px; margin-top:3px">${e.t}</div>${img}`;
    l.appendChild(c);
  });
}

