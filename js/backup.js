/* v20: respaldo completo (.zip con datos + libros + fotos) y recuperación desde Documentos */

function idbAllKeys(st){ return new Promise(res=>{ if(!db) return res([]); try{
  const rq=db.transaction(st).objectStore(st).getAllKeys();
  rq.onsuccess=()=>res(rq.result||[]); rq.onerror=()=>res([]); }catch(e){ res([]); } }); }

async function exportFullBackup(){
  if(!window.JSZip){ exportBackup(); return; }
  toast('«Empacando todo tu salón… 📦⏳»');
  saveState();
  const {name, buf}=await buildFullBackup();
  state.c.fullbak=(state.c.fullbak||0)+1; checkAch(); scheduleSave();
  if(window.bibFS && bibFS.saveAs){
    const p=await bibFS.saveAs(name, buf);
    toast(p ? '«Respaldo completo guardado 📦💗 ('+(buf.byteLength/1048576).toFixed(1)+' MB)»' : '«Respaldo cancelado 🕊️»');
  } else {
    const a=document.createElement('a'); a.download=name;
    a.href=URL.createObjectURL(new Blob([buf],{type:'application/zip'})); a.click();
    toast('«Respaldo completo descargado 📦»');
  }
}
async function buildFullBackup(){
  const zip=new JSZip();
  const save=JSON.parse(JSON.stringify(collectSave()));
  const manifest={app:'Bibliothèque Enchantée', kind:'respaldo-completo', created:new Date().toISOString(), files:{}};
  const keys=await idbAllKeys('files');
  for(const k of keys){
    const bl=await idbGet('files', k);
    if(!bl) continue;
    zip.file('archivos/'+k, bl);
    manifest.files[k]={type:bl.type||'', size:bl.size||0};
  }
  zip.file('salon.json', JSON.stringify(save, null, 1));
  zip.file('manifiesto.json', JSON.stringify(manifest, null, 1));
  zip.file('LEEME.txt', 'Respaldo completo de Bibliothèque Enchantée.\r\nPara restaurarlo: Configuración → Respaldo → Importar, y elige este .zip.\r\n');
  const buf=await zip.generateAsync({type:'arraybuffer', compression:'STORE'});
  return {name:'Bibliotheque_respaldo_'+fmtDay(new Date())+'.zip', buf};
}

/* importar: acepta el .zip completo o el .json antiguo */
async function importAnyBackup(inp){
  const f=inp.files[0]; inp.value=''; if(!f) return;
  if(!/\.zip$/i.test(f.name)){ importBackupFile(f); return; }
  if(!confirm('¿Restaurar este respaldo completo?\n\nReemplazará el salón actual por el del respaldo (libros, citas, diario y fotos).')) return;
  try{
    toast('«Desempacando tu salón… 📂⏳»');
    const zip=await JSZip.loadAsync(await f.arrayBuffer());
    const sj=zip.file('salon.json'); if(!sj) throw new Error('sin salon.json');
    const save=JSON.parse(await sj.async('string'));
    let man={files:{}}; const mf=zip.file('manifiesto.json');
    if(mf) man=JSON.parse(await mf.async('string'));
    const entries=Object.keys(zip.files).filter(n=>n.startsWith('archivos/') && !zip.files[n].dir);
    for(const n of entries){
      const k=n.slice('archivos/'.length);
      const buf=await zip.file(n).async('arraybuffer');
      await idbPut('files', k, new Blob([buf], {type:(man.files[k]||{}).type||''}));
    }
    applySave(save);
    await idbPut('kv','save', JSON.parse(JSON.stringify(collectSave())));
    toast('«¡Tu salón regresó intacto! 📂💗 Reabriendo…»');
    setTimeout(()=>location.reload(), 1200);
  }catch(e){ toast('«Ese archivo no parece un respaldo del salón 🥺»'); }
}
function importBackupFile(f){
  const rd=new FileReader();
  rd.onload=()=>{ try{
      applySave(JSON.parse(rd.result));
      restoreUI(); renderLibrary(); renderQuotes(); renderDiary(); updateGoal();
      renderStats(); renderAchievements(); renderCalendar(); saveState();
      toast('«¡Tu salón regresó del respaldo! 📂💗 (los PDFs se recuperan con «Recuperar desde Documentos»)»');
    }catch(e){ toast('«Ese archivo no parece un respaldo del salón 🥺»'); } };
  rd.readAsText(f);
}

/* reconstruye el salón con la copia automática que vive en Documentos\Bibliotheque Enchantee */
async function restoreFromDocuments(){
  if(!window.bibFS || !bibFS.listData){ toast('«Esto solo funciona en la app de escritorio 🖥️»'); return; }
  const list=await bibFS.listData();
  if(!list){ toast('«No encontré la carpeta del salón en Documentos 🥺»'); return; }
  const raw=await bibFS.readFile('respaldos/respaldo_autoguardado.json');
  let save=null;
  try{ if(raw) save=JSON.parse(new TextDecoder().decode(raw)); }catch(e){}
  const hasBooks=state.floor.length || state.sections.some(s=>s.books.length);
  let useSave=false;
  if(save){
    const n=(save.state.floor||[]).length+(save.state.sections||[]).reduce((a,s)=>a+s.books.length,0);
    useSave = !hasBooks ? true : confirm('Encontré un respaldo automático con '+n+' libro(s).\n\n'
      +'Aceptar → reemplazar el salón actual por ese respaldo.\nCancelar → solo recuperar los archivos (PDF, portadas, fotos) que falten.');
  }
  const st=useSave ? save.state : state;
  const books=[...(st.floor||[]), ...(st.sections||[]).flatMap(s=>s.books), ...((st.trash||[]).map(e=>e.b))];
  const types={pdf:'application/pdf', epub:'application/epub+zip', png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', webp:'image/webp'};
  const typeOf=f=>types[(f.split('.').pop()||'').toLowerCase()]||'';
  let got=0;
  const pull=async(key, dir, match)=>{
    if(await idbGet('files', key)) return;
    const f=(list[dir]||[]).find(match); if(!f) return;
    const buf=await bibFS.readFile(dir+'/'+f); if(!buf) return;
    await idbPut('files', key, new Blob([buf], {type:typeOf(f)})); got++;
  };
  for(const b of books){
    if(!b.id) continue;
    const m=f=>f.includes('_'+b.id+'.');
    if(b.hasPdf){ await pull('f_'+b.id+'_pdf', 'pdfs', m); await pull('f_'+b.id+'_pdf', 'libros', m); }
    if(b.hasCover) await pull('f_'+b.id+'_cover', 'portadas', m);
    if(b.hasFloor) await pull('f_'+b.id+'_floor', 'suelo', m);
  }
  for(const e of (st.diary||[])) if(e.pid) await pull('d_'+e.pid, 'diario', f=>f.startsWith('foto_'+e.pid+'.'));
  if(useSave){
    applySave(save);
    await idbPut('kv','save', JSON.parse(JSON.stringify(collectSave())));
    toast('«¡Salón reconstruido desde Documentos! '+got+' archivo(s) recuperado(s) 💗 Reabriendo…»');
    setTimeout(()=>location.reload(), 1400);
  } else {
    urlMap={}; await preloadFileURLs(); renderLibrary(); renderDiary();
    toast(got ? '«Recuperé '+got+' archivo(s) desde Documentos 📂💗»' : '«No faltaba nada: todo está en su lugar ✨»');
  }
}
function openDataFolder(){ if(window.bibFS && bibFS.openDataDir) bibFS.openDataDir(); }
