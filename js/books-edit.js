/* v20: editar y eliminar libros (con papelera de 30 días) */
const SPINE_COLORS=['#7C8B5E','#8FA8BD','#C48A90','#B08BA5','#A98F6B','#7E8FB0','#B04A56','#C9A227','#6E6478','#5E8C7E','#D9A0A8','#8A6F4A'];
const TRASH_DAYS=30;

/* ubica un libro por su id, esté en el suelo o en un estante */
function findBook(id){
  let i=state.floor.findIndex(b=>b.id===id);
  if(i>-1) return {b:state.floor[i], where:'floor', i};
  for(let si=0; si<state.sections.length; si++){
    const bi=state.sections[si].books.findIndex(b=>b.id===id);
    if(bi>-1) return {b:state.sections[si].books[bi], where:'shelf', si, bi};
  }
  return null;
}
/* todo libro necesita id para poder editarse (los muy antiguos podrían no tenerlo) */
function ensureBookIds(){
  [...state.floor, ...state.sections.flatMap(s=>s.books)].forEach(b=>{
    if(!b.id) b.id=Date.now().toString(36)+Math.floor(Math.random()*99999);
  });
}

let editing=null, edFiles={};
function openEdit(id){
  const loc=findBook(id); if(!loc) return;
  closeFicha();
  editing={id, loc}; edFiles={};
  const b=loc.b;
  document.getElementById('edWhere').textContent = loc.where==='floor'
    ? (b.done?'En el suelo · terminado, listo para su estante':'En el suelo · por leer')
    : 'En el estante “'+state.sections[loc.si].name+'”';
  document.getElementById('edTitle').value=b.t||'';
  document.getElementById('edAuthor').value=b.author||'';
  document.getElementById('edDesc').value=b.expect||b.desc||'';
  document.getElementById('edDescLbl').textContent='Descripción / tu expectativa';
  // colores del lomo
  const cs=document.getElementById('edColors'); cs.innerHTML='';
  SPINE_COLORS.forEach(c=>{
    const s=document.createElement('button'); s.className='ed-col'+(b.c===c?' sel':''); s.style.background=c; s.title=c;
    s.onclick=()=>{ cs.querySelectorAll('.ed-col').forEach(x=>x.classList.remove('sel')); s.classList.add('sel'); edFiles.c=c; };
    cs.appendChild(s);
  });
  edPreview('cover', b.id && urlMap[b.id+'_cover']);
  edPreview('floor', b.id && urlMap[b.id+'_floor']);
  const fb=document.getElementById('edFileBtn');
  fb.textContent=b.hasPdf?('Reemplazar '+(b.fmt==='epub'?'EPUB':'PDF')+'… (ahora tiene uno)'):'Añadir PDF / EPUB…';
  fb.style.borderColor='';
  // datos de estante (solo libros terminados en el estante)
  const sr=document.getElementById('edShelfRow');
  sr.style.display = loc.where==='shelf' ? 'block' : 'none';
  if(loc.where==='shelf'){
    const sel=document.getElementById('edShelf'); sel.innerHTML='';
    state.sections.forEach((s,k)=>{ const o=document.createElement('option'); o.value=k; o.textContent=s.name; if(k===loc.si) o.selected=true; sel.appendChild(o); });
    const fc=document.getElementById('edFaces'); fc.innerHTML='';
    faceSet().forEach((f,k)=>{ const x=document.createElement('button'); x.textContent=f; if((b.faces||0)===k+1) x.classList.add('sel');
      x.onclick=()=>pickFace(x); fc.appendChild(x); });
    document.getElementById('edReview').value=b.review||'';
  }
  document.getElementById('editOv').classList.add('show');
  setTimeout(()=>document.getElementById('edTitle').focus(), 60);
}
function closeEdit(){ document.getElementById('editOv').classList.remove('show'); editing=null; edFiles={}; }
function edPreview(kind, url){
  const pv=document.getElementById(kind==='cover'?'edPvCover':'edPvFloor');
  if(url){ pv.classList.add('ok'); pv.innerHTML=''; pv.style.backgroundImage='url('+url+')'; }
  else { pv.classList.remove('ok'); pv.style.backgroundImage='';
    pv.innerHTML = kind==='cover' ? 'Portada<br>🖼️ toca para cambiar' : 'Libro en el suelo<br>🛋️ toca para cambiar'; }
}
function edPickImg(inp, kind){
  const f=inp.files[0]; if(!f) return;
  edFiles[kind]=f; edPreview(kind, URL.createObjectURL(f)); inp.value='';
}
function edClearImg(kind){ edFiles[kind]=null; edPreview(kind, null); }
function edPickFile(inp){
  const f=inp.files[0]; if(!f) return;
  const fmt=bookFormat(f);
  if(!fmt){ toast('«Ese archivo no es PDF ni EPUB 🥺»'); inp.value=''; return; }
  edFiles.file=f;
  const b=document.getElementById('edFileBtn');
  b.textContent='✓ '+f.name.slice(0,34)+(f.name.length>34?'…':''); b.style.borderColor='var(--sage)';
  inp.value='';
}
async function saveEdit(){
  if(!editing) return;
  const loc=findBook(editing.id); if(!loc){ closeEdit(); return; }
  const b=loc.b, oldT=b.t;
  const t=document.getElementById('edTitle').value.trim();
  if(!t){ toast('«Todo libro merece un nombre 🥺»'); return; }
  b.t=t;
  b.author=document.getElementById('edAuthor').value.trim()||undefined;
  const d=document.getElementById('edDesc').value.trim();
  if(b.expect!==undefined) b.expect=d; else b.desc=d;
  if(edFiles.c) b.c=edFiles.c;
  for(const kind of ['cover','floor']){
    if(!(kind in edFiles)) continue;
    const key=b.id+'_'+kind, flag=kind==='cover'?'hasCover':'hasFloor';
    if(urlMap[key]){ URL.revokeObjectURL(urlMap[key]); delete urlMap[key]; }
    if(window.bibFS) await bibFS.deleteById(b.id, [kind==='cover'?'portadas':'suelo']);
    if(edFiles[kind]){
      await idbPut('files','f_'+key, edFiles[kind]);
      urlMap[key]=URL.createObjectURL(edFiles[kind]); b[flag]=true;
      fsMirror((kind==='cover'?'portadas/':'suelo/')+fsSafe(t)+'_'+b.id+'.png', edFiles[kind]);
    } else { await idbDel('files','f_'+key); b[flag]=false; }
  }
  if(edFiles.file){
    const fmt=bookFormat(edFiles.file);
    await idbPut('files','f_'+b.id+'_pdf', edFiles.file);
    if(window.bibFS) await bibFS.deleteById(b.id, ['pdfs','libros']);
    fsMirror((fmt==='epub'?'libros/':'pdfs/')+fsSafe(t)+'_'+b.id+'.'+fmt, edFiles.file);
    b.hasPdf=true; b.fmt=fmt; b.page=1; b.loc=null; b.pagesN=undefined; b.hls={}; b.posits={};
    if(bsCacheId===b.id){ bsCache=null; bsCacheId=null; }
  }
  if(loc.where==='shelf'){
    const sel=document.querySelector('#edFaces .sel');
    if(sel) b.faces=faceSet().indexOf(sel.textContent)+1;
    const rv=document.getElementById('edReview').value.trim();
    b.review=rv||undefined;
    const ti=parseInt(document.getElementById('edShelf').value);
    if(!isNaN(ti) && ti!==loc.si){
      state.sections[loc.si].books.splice(loc.bi,1);
      state.sections[ti].books.push(b);
    }
  }
  // las citas guardadas siguen a su libro aunque cambie de nombre
  if(oldT!==t) state.quotes.forEach(q=>{ if(q.bid===b.id || (!q.bid && q.bk===oldT)) q.bk=t; });
  if(curBook && curBook.id===b.id) document.getElementById('readerTitle').textContent=t;
  state.c.edits=(state.c.edits||0)+1;
  closeEdit(); renderLibrary(); renderQuotes(); scheduleSave(); checkAch();
  toast('«¡Listo! <b>'+t+'</b> luce renovado ✨»');
}

/* ===== eliminar → papelera ===== */
function deleteEditing(){ if(editing) deleteBook(editing.id); }
function deleteBook(id){
  const loc=findBook(id); if(!loc) return;
  const b=loc.b;
  if(!confirm('¿Eliminar «'+b.t+'»?\n\nIrá a la papelera (Configuración → Papelera) y podrás recuperarlo durante '+TRASH_DAYS+' días.')) return;
  if(loc.where==='floor'){
    state.floor.splice(loc.i,1);
    if(state.readingIdx!=null){
      if(state.readingIdx===loc.i) state.readingIdx=null;
      else if(state.readingIdx>loc.i) state.readingIdx--;
    }
  } else state.sections[loc.si].books.splice(loc.bi,1);
  if(state.lastReadId===id) state.lastReadId=null;
  state.trash=state.trash||[];
  state.trash.unshift({b, from:loc.where, sec:loc.where==='shelf'?state.sections[loc.si].name:null, at:Date.now()});
  closeEdit(); closeFicha(); renderLibrary(); renderStats(); scheduleSave();
  toast('«<b>'+b.t+'</b> se fue a la papelera 🗑️ <u style="cursor:pointer" onclick="restoreTrash(0)">Deshacer</u>»');
  // el toast es clicable mientras está visible
  const t=document.getElementById('toast'); t.style.pointerEvents='auto';
  setTimeout(()=>{ t.style.pointerEvents=''; }, 4300);
}
function openTrash(){
  const l=document.getElementById('trashList'); l.innerHTML='';
  const tr=state.trash||[];
  if(!tr.length) l.innerHTML='<div class="diary-entry"><div class="dd">La papelera está vacía 🕊️</div></div>';
  tr.forEach((e,i)=>{
    const left=Math.max(0, TRASH_DAYS-Math.floor((Date.now()-e.at)/864e5));
    const c=document.createElement('div'); c.className='diary-entry';
    c.innerHTML='<div style="font-family:var(--disp); font-weight:700">'+esc(e.b.t)+'</div>'+
      '<div class="dd">'+(e.from==='shelf'?'del estante “'+esc(e.sec)+'”':'del suelo')+' · se borra en '+left+' día(s)</div>'+
      '<div class="qbtns"><button class="btn small" style="font-size:11px; padding:3px 10px">Recuperar ↺</button>'+
      '<button class="btn small" style="font-size:11px; padding:3px 10px; border-color:var(--wax)">Borrar para siempre</button></div>';
    const [rb, db2]=c.querySelectorAll('button');
    rb.onclick=()=>{ restoreTrash(i); openTrash(); };
    db2.onclick=async()=>{ if(!confirm('¿Borrar «'+e.b.t+'» para siempre? Ya no se podrá recuperar.')) return;
      await purgeTrash(i); openTrash(); };
    l.appendChild(c);
  });
  document.getElementById('trashOv').classList.add('show');
}
function restoreTrash(i){
  const tr=state.trash||[]; const e=tr[i]; if(!e) return;
  tr.splice(i,1);
  const si=e.from==='shelf' ? state.sections.findIndex(s=>s.name===e.sec) : -1;
  if(si>-1) state.sections[si].books.push(e.b);
  else { if(e.from==='shelf') e.b.done=true; state.floor.push(Object.assign(e.b,{justFell:true})); }
  renderLibrary(); renderStats(); scheduleSave();
  toast('«¡<b>'+e.b.t+'</b> volvió a casa! ↺💗»');
}
async function purgeTrash(i){
  const tr=state.trash||[]; const e=tr[i]; if(!e) return;
  tr.splice(i,1);
  const id=e.b.id;
  if(id){
    for(const k of ['pdf','cover','floor']){
      await idbDel('files','f_'+id+'_'+k);
      if(urlMap[id+'_'+k]){ URL.revokeObjectURL(urlMap[id+'_'+k]); delete urlMap[id+'_'+k]; }
    }
    if(window.bibFS) await bibFS.deleteById(id);
  }
  scheduleSave();
}
async function emptyTrash(){
  if(!(state.trash||[]).length) return;
  if(!confirm('¿Vaciar la papelera? Los libros se borrarán para siempre.')) return;
  while(state.trash.length) await purgeTrash(0);
  openTrash(); toast('«Papelera vacía 🧹»');
}
async function autoPurgeTrash(){
  const tr=state.trash||[];
  for(let i=tr.length-1;i>=0;i--) if(Date.now()-tr[i].at > TRASH_DAYS*864e5) await purgeTrash(i);
}
function editFromFicha(){
  const {si,bi}=ficha; if(si==null) return;
  const b=state.sections[si].books[bi]; if(b) openEdit(b.id);
}
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
