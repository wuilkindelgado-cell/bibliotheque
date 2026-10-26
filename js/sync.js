/* v1.10: Mi cuenta en la nube — el salón vive en un repositorio PRIVADO de GitHub y se sincroniza entre la PC y el iPhone.
   Repositorio:  salon.json (todo el salón) · archivos.json (tipo de cada archivo) · archivos/<clave> (PDF, EPUB, portadas, fotos…)
   En el dispositivo (IndexedDB «kv»): sync_cfg {repo, token} · sync_base (lo que había en la nube en la última sincronización)
   · sync_dirty / sync_dead (archivos guardados o borrados desde entonces). */

const GH_API='https://api.github.com';
const SYNC_OWNER='wuilkindelgado-cell';
const SYNC_MAX=45*1048576;                                   /* libros más pesados se quedan solo en el dispositivo */
const SYNC_LOCAL_ONLY=['weather','autoBaks'];                 /* cosas de cada dispositivo que no viajan */
const SYNC={loaded:null, cfg:null, base:null, dirty:new Set(), dead:new Set(), busy:null, again:false, last:0, err:'', tooBig:new Set(), localT:0};

/* ---------- comparación y mezcla de tres vías (lo de la nube + lo de aquí, respecto a la última vez) ---------- */
const sjs=x=>JSON.stringify(x===undefined?null:x);
const same=(a,b)=>sjs(a)===sjs(b);
const isObj=x=>x!==null && typeof x==='object' && !Array.isArray(x);
function arrKey(...arrs){
  for(const k of ['id','name']){
    if(arrs.every(a=>!Array.isArray(a) || a.every(x=>isObj(x) && x[k]!=null && x[k]!=='') && new Set(a.map(x=>x[k])).size===a.length)) return k;
  }
  return null;
}
function mergeArr(b, l, r, ln){
  b=Array.isArray(b)?b:[];
  const k=arrKey(b, l, r);
  const kf=k ? (x=>x[k]) : sjs;                               /* sin id: cada elemento se reconoce por su contenido */
  const B=new Map(b.map(x=>[kf(x),x])), Lm=new Map(l.map(x=>[kf(x),x])), Rm=new Map(r.map(x=>[kf(x),x]));
  /* el orden lo manda quien lo cambió */
  const prim=same(b.map(kf), l.map(kf)) ? r : l, sec=prim===r ? l : r;
  const order=prim.map(kf);
  sec.forEach((x,i)=>{ const id=kf(x); if(!order.includes(id)){ const prev=i>0?kf(sec[i-1]):null, at=prev!=null?order.indexOf(prev):-1; order.splice(at+1, 0, id); } });
  const out=[];
  for(const id of order){
    const inL=Lm.has(id), inR=Rm.has(id), inB=B.has(id);
    if(inL && inR) out.push(k ? merge3(B.get(id), Lm.get(id), Rm.get(id), ln) : Lm.get(id));
    else if(inL){ if(!(inB && same(B.get(id), Lm.get(id)))) out.push(Lm.get(id)); }     /* si estaba y no cambió aquí, la otra parte lo borró */
    else if(inR){ if(!(inB && same(B.get(id), Rm.get(id)))) out.push(Rm.get(id)); }
  }
  return out;
}
function merge3(b, l, r, ln){
  if(same(l, r)) return l;
  if(same(b, l)) return r;
  if(same(b, r)) return l;
  if(isObj(l) && isObj(r)){
    const out={}, bo=isObj(b)?b:{};
    for(const k of new Set([...Object.keys(l), ...Object.keys(r)])){
      if(!(k in l)){ if(!(k in bo && same(bo[k], r[k]))) out[k]=r[k]; continue; }
      if(!(k in r)){ if(!(k in bo && same(bo[k], l[k]))) out[k]=l[k]; continue; }
      out[k]=merge3(bo[k], l[k], r[k], ln);
    }
    return out;
  }
  if(Array.isArray(l) && Array.isArray(r)) return mergeArr(b, l, r, ln);
  if(typeof l==='number' && typeof r==='number') return Math.max(l, r);   /* contadores, páginas, minutos: gana el mayor */
  return ln ? l : r;
}

/* ---------- lo que viaja a la nube ---------- */
function syncSnapshot(){
  const s=JSON.parse(JSON.stringify(collectSave()));
  delete s.profiles; delete s.currentProfile; delete s._t;
  SYNC_LOCAL_ONLY.forEach(k=>{ if(s.state) delete s.state[k]; });
  return s;
}
function hasSalon(s){ return !!(s && s.state && (s.state.name && s.state.name!=='Lector(a)' || (s.state.floor||[]).length || (s.state.sections||[]).some(x=>x.books.length))); }
function bookCount(s){ return s && s.state ? (s.state.floor||[]).length+(s.state.sections||[]).reduce((a,x)=>a+x.books.length,0) : 0; }
const _syCollect=collectSave; collectSave=function(){ const d=_syCollect(); d._t=SYNC.localT; return d; };
const _sySave=saveState; saveState=function(){ if(SYNC.adopting) return; return _sySave.apply(this, arguments); };
const _sySched=scheduleSave; scheduleSave=function(){ SYNC.localT=Date.now(); return _sySched.apply(this, arguments); };

/* ---------- los archivos: se anota qué cambió aquí; lo que falta se baja de la nube al abrirlo ---------- */
const _syPut=idbPut, _syDel=idbDel, _syGet=idbGet;
idbPut=function(st, k, v){ if(st==='files'){ SYNC.dirty.add(k); SYNC.dead.delete(k); syncPersistMarks(); } return _syPut(st, k, v); };
idbDel=function(st, k){ if(st==='files'){ SYNC.dead.add(k); SYNC.dirty.delete(k); syncPersistMarks(); } return _syDel(st, k); };
idbGet=async function(st, k){
  const r=await _syGet(st, k);
  if(r!=null || st!=='files') return r;
  await syncLoad();
  if(!SYNC.cfg || !SYNC.base || !SYNC.base.files[k] || SYNC.dead.has(k)) return r;
  return await syncFetchFile(k);
};
let marksT=null;
function syncPersistMarks(){ clearTimeout(marksT); marksT=setTimeout(()=>{ _syPut('kv','sync_dirty',[...SYNC.dirty]); _syPut('kv','sync_dead',[...SYNC.dead]); }, 400); }
const fetching={};
function syncFetchFile(k){
  if(fetching[k]) return fetching[k];
  const f=SYNC.base.files[k], big=f.size>1500000;
  if(big) toast('«Bajando de tu nube… ☁️⏳ ('+(f.size/1048576).toFixed(1)+' MB)»');
  fetching[k]=gh('/repos/'+SYNC.cfg.repo+'/git/blobs/'+f.sha, {accept:'application/vnd.github.raw+json', raw:true})
    .then(r=>r.arrayBuffer()).then(async buf=>{ const bl=new Blob([buf], {type:f.type||''}); await _syPut('files', k, bl); if(big) toast('«¡Listo! ☁️✨»'); return bl; })
    .catch(e=>{ if(big) toast('«No pude bajarlo de tu nube (¿sin internet?) 📡»'); return null; })
    .finally(()=>{ delete fetching[k]; });
  return fetching[k];
}

/* ---------- GitHub ---------- */
async function gh(path, o={}){
  const h={Authorization:'Bearer '+SYNC.cfg.token, Accept:o.accept||'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28'};
  if(o.body) h['Content-Type']='application/json';
  const r=await fetch(GH_API+path, {method:o.method||'GET', headers:h, body:o.body?JSON.stringify(o.body):undefined, cache:'no-store'});
  if(!r.ok){ const e=new Error('GitHub '+r.status); e.status=r.status; try{ e.info=await r.json(); }catch(_){} throw e; }
  return o.raw ? r : (r.status===204 ? null : r.json());
}
function blobB64(bl){ return new Promise((res, rej)=>{ const fr=new FileReader(); fr.onload=()=>res(String(fr.result).split(',')[1]||''); fr.onerror=rej; fr.readAsDataURL(bl); }); }
function syncBranch(){ return (SYNC.cfg && SYNC.cfg.branch) || 'main'; }
async function ghText(sha){ return (await gh('/repos/'+SYNC.cfg.repo+'/git/blobs/'+sha, {accept:'application/vnd.github.raw+json', raw:true})).text(); }
/* lo que hay ahora en la nube */
async function ghRemote(){
  const R='/repos/'+SYNC.cfg.repo;
  let head;
  try{ head=(await gh(R+'/git/ref/heads/'+syncBranch())).object.sha; }
  catch(e){
    if(e.status!==409 && e.status!==404) throw e;            /* repositorio vacío: se le da un primer archivo */
    await gh(R+'/contents/LEEME.md', {method:'PUT', body:{message:'Salón creado', content:btoa('Salon de Bibliotheque Enchantee (sincronizado por la app).\n')}});
    head=(await gh(R+'/git/ref/heads/'+syncBranch())).object.sha;
  }
  if(SYNC.base && SYNC.base.repo===SYNC.cfg.repo && SYNC.base.commit===head) return {head, tree:null, salon:SYNC.base.salon, files:SYNC.base.files};
  const tree=(await gh(R+'/git/commits/'+head)).tree.sha;
  const t=await gh(R+'/git/trees/'+tree+'?recursive=1');
  const byPath={}; t.tree.forEach(x=>{ if(x.type==='blob') byPath[x.path]=x; });
  const salon=byPath['salon.json'] ? JSON.parse(await ghText(byPath['salon.json'].sha)) : null;
  const types=byPath['archivos.json'] ? JSON.parse(await ghText(byPath['archivos.json'].sha)) : {};
  const files={};
  Object.values(byPath).forEach(x=>{ if(x.path.startsWith('archivos/')){ const k=x.path.slice(9); files[k]={sha:x.sha, size:x.size, type:types[k]||''}; } });
  return {head, tree, salon, files};
}

/* ---------- sincronizar ---------- */
async function syncLoad(){
  if(!SYNC.loaded) SYNC.loaded=(async()=>{
    while(!db) await new Promise(r=>setTimeout(r, 100));
    SYNC.cfg=await _syGet('kv','sync_cfg'); SYNC.base=await _syGet('kv','sync_base');
    (await _syGet('kv','sync_dirty')||[]).forEach(k=>SYNC.dirty.add(k));
    (await _syGet('kv','sync_dead')||[]).forEach(k=>SYNC.dead.add(k));
    const sv=await _syGet('kv','save'); SYNC.localT=(sv && sv._t) || 0;
  })();
  return SYNC.loaded;
}
function syncNow(quiet){
  if(SYNC.busy){ SYNC.again=true; return SYNC.busy; }
  SYNC.busy=(async()=>{
    await syncLoad(); if(!SYNC.cfg) return false;
    syncBadge('busy');
    try{
      for(let n=0; n<4; n++){ if(await syncOnce()) break; }      /* si la otra parte subió algo justo ahora, se vuelve a mezclar */
      SYNC.err=''; SYNC.last=Date.now(); syncBadge('ok'); return true;
    }catch(e){
      SYNC.err = e.status===401 ? 'La llave ya no sirve (¿la borraste o venció?). Vuelve a iniciar sesión.'
        : e.status===403 || e.status===404 ? 'La llave no tiene permiso de escritura sobre '+SYNC.cfg.repo+'.'
        : navigator.onLine===false || e instanceof TypeError ? 'Sin internet: lo subo cuando vuelva la conexión.' : (e.message||'error');
      syncBadge(e.status===401||e.status===403||e.status===404 ? 'err' : 'off');
      if(!quiet && (e.status===401||e.status===403||e.status===404)) toast('«☁️ '+esc(SYNC.err)+'»');
      return false;
    }finally{ renderSyncCard(); }
  })().finally(()=>{ SYNC.busy=null; if(SYNC.again){ SYNC.again=false; setTimeout(()=>syncNow(true), 500); } });
  return SYNC.busy;
}
async function syncOnce(){
  const R='/repos/'+SYNC.cfg.repo;
  const rem=await ghRemote();
  const base=SYNC.base && SYNC.base.repo===SYNC.cfg.repo ? SYNC.base : null;
  const baseFiles=base ? base.files : {};
  const S0=syncSnapshot(), dirty0=new Set(SYNC.dirty), dead0=new Set(SYNC.dead);
  /* 1) el salón */
  let merged;
  if(!rem.salon) merged=S0;
  else merged=merge3(base ? base.salon : undefined, S0, rem.salon, SYNC.localT >= (rem.salon._t||0));
  /* 2) los archivos */
  const localKeys=new Set(await idbAllKeys('files'));
  const up=[], delRemote=[], delLocal=[], files=JSON.parse(JSON.stringify(rem.files));
  for(const k of localKeys){
    if(!rem.files[k]){ if(baseFiles[k] && !dirty0.has(k)) delLocal.push(k); else up.push(k); }
    else if(dirty0.has(k)) up.push(k);
  }
  for(const k of Object.keys(rem.files)) if(!localKeys.has(k) && dead0.has(k)) delRemote.push(k);
  /* 3) subir lo nuevo en un solo «commit» */
  const entries=[];
  for(const k of up){
    const bl=await _syGet('files', k); if(!bl) continue;
    if(bl.size>SYNC_MAX){ if(!SYNC.tooBig.has(k)){ SYNC.tooBig.add(k); toast('«☁️ Un archivo pesa más de 45 MB: ese se queda solo en este dispositivo»'); } continue; }
    const sha=(await gh(R+'/git/blobs', {method:'POST', body:{content:await blobB64(bl), encoding:'base64'}})).sha;
    if(files[k] && files[k].sha===sha) continue;
    files[k]={sha, size:bl.size, type:bl.type||''}; entries.push({path:'archivos/'+k, mode:'100644', type:'blob', sha});
  }
  delRemote.forEach(k=>{ delete files[k]; entries.push({path:'archivos/'+k, mode:'100644', type:'blob', sha:null}); });
  merged._t=Math.max(SYNC.localT, (rem.salon&&rem.salon._t)||0);
  const remSalonNoT=rem.salon ? Object.assign({}, rem.salon, {_t:undefined}) : null, mergedNoT=Object.assign({}, merged, {_t:undefined});
  if(!same(remSalonNoT, mergedNoT)) entries.push({path:'salon.json', mode:'100644', type:'blob', content:JSON.stringify(merged)});
  const types={}; Object.keys(files).forEach(k=>types[k]=files[k].type);
  if(entries.length) entries.push({path:'archivos.json', mode:'100644', type:'blob', content:JSON.stringify(types)});
  let head=rem.head;
  if(entries.length){
    const baseTree=rem.tree || (await gh(R+'/git/commits/'+rem.head)).tree.sha;
    const tree=await gh(R+'/git/trees', {method:'POST', body:{base_tree:baseTree, tree:entries}});
    const who=(state.name||'Salón')+' · '+(window.bibWeb?'iPhone':'PC');
    const cm=await gh(R+'/git/commits', {method:'POST', body:{message:'Sincronización desde '+who, tree:tree.sha, parents:[rem.head]}});
    try{ await gh(R+'/git/refs/heads/'+syncBranch(), {method:'PATCH', body:{sha:cm.sha, force:false}}); }
    catch(e){ if(e.status===422) return false; throw e; }       /* la nube cambió mientras tanto: otra vuelta */
    head=cm.sha;
  }
  /* 4) traer lo de la nube a este dispositivo */
  delete merged._t;
  if(!same(merged, S0)){
    const S1=syncSnapshot(), fin=same(S1, S0) ? merged : merge3(S0, S1, merged, true);
    syncApply(fin);
  }
  for(const k of delLocal){ await _syDel('files', k); Object.keys(urlMap).forEach(u=>{ if(k==='f_'+u){ try{ URL.revokeObjectURL(urlMap[u]); }catch(e){} delete urlMap[u]; } }); }
  /* 5) recordar cómo quedó la nube */
  SYNC.base={repo:SYNC.cfg.repo, commit:head, salon:merged, files};
  await _syPut('kv','sync_base', SYNC.base);
  dirty0.forEach(k=>SYNC.dirty.delete(k)); dead0.forEach(k=>SYNC.dead.delete(k)); syncPersistMarks();
  /* portadas, fotos y retrato: se bajan ya (son livianos); los libros, cuando se abren */
  const small=Object.keys(files).filter(k=>!localKeys.has(k) && files[k].size<1500000 && !/_pdf$|^snd_|^law_orig_/.test(k));
  if(small.length){ for(const k of small) await syncFetchFile(k); await preloadFileURLs(); try{ renderLibrary(); }catch(e){} }
  return true;
}
function syncApply(s){
  SYNC.applying=true;
  try{
    applySave(s);
    document.querySelectorAll('.buddy-name').forEach(e=>e.textContent=state.fav);
    const pc=document.getElementById('profChip'); if(pc) pc.textContent='👤 '+state.name;
    ['renderLibrary','renderQuotes','renderDiary','updateGoal','renderStats','renderAchievements','renderCalendar'].forEach(f=>{ try{ if(typeof window[f]==='function') window[f](); }catch(e){} });
    try{ if(document.getElementById('v-law').classList.contains('active') && lawTabNow!=='editor' && lawTabNow!=='visor') lawTab(lawTabNow); }catch(e){}
    saveState();
  } finally { SYNC.applying=false; }
}

/* ---------- iniciar y cerrar sesión ---------- */
function syncAsk(title, html, buttons){
  return new Promise(res=>{
    let ov=document.getElementById('syncAskOv');
    if(!ov){ ov=document.createElement('div'); ov.id='syncAskOv'; ov.className='ficha-overlay'; ov.style.zIndex=95; document.querySelector('.win').appendChild(ov); }
    ov.innerHTML='<div class="frame-card" style="max-width:460px; text-align:center"><div style="font-family:var(--disp); font-weight:700; font-size:20px; margin-bottom:8px">'+title+'</div><div style="line-height:1.5">'+html+'</div>'
      +'<div style="display:flex; flex-direction:column; gap:8px; margin-top:14px">'+buttons.map((b,i)=>'<button class="btn '+(i===0?'rose':'')+'" data-i="'+i+'">'+b+'</button>').join('')+'</div></div>';
    ov.querySelectorAll('button').forEach(b=>b.onclick=()=>{ ov.classList.remove('show'); res(+b.dataset.i); });
    ov.classList.add('show');
  });
}
async function syncLogin(){
  let repo=document.getElementById('syRepo').value.trim().replace(/^https?:\/\/github\.com\//,'').replace(/\.git$/,'').replace(/\/$/,'');
  if(repo && !repo.includes('/')) repo=SYNC_OWNER+'/'+repo;
  const token=document.getElementById('syToken').value.trim();
  if(!/^[\w.-]+\/[\w.-]+$/.test(repo) || token.length<20){ toast('«Escribe el nombre del salón y pega tu llave 🔑»'); return; }
  await syncLoad();
  const prevCfg=SYNC.cfg; SYNC.cfg={repo, token, branch:'main'};
  const msg=document.getElementById('syMsg'); msg.textContent='Comprobando la llave… ⏳';
  let rem;
  try{
    const info=await gh('/repos/'+repo);
    SYNC.cfg.branch=info.default_branch||'main';
    if(!info.private){ msg.textContent='⚠️ Ese repositorio es público: tu salón debe ir en uno privado.'; SYNC.cfg=prevCfg; return; }
    rem=await ghRemote();
  }catch(e){
    SYNC.cfg=prevCfg;
    msg.textContent = e.status===401 ? '⚠️ GitHub no reconoce esa llave.' : e.status===404 || e.status===403 ? '⚠️ No encuentro «'+repo+'» o la llave no tiene acceso a él.' : '⚠️ No pude conectarme (¿hay internet?).';
    return;
  }
  const local=syncSnapshot(), linkedElsewhere=SYNC.base && SYNC.base.repo!==repo;
  let mode='merge';
  if(!rem.salon) mode='upload';
  else if(!hasSalon(local)) mode='adopt';
  else if(linkedElsewhere){
    const i=await syncAsk('☁️ Otra cuenta', 'Este dispositivo tenía el salón de <b>'+esc(SYNC.base.repo.split('/')[1])+'</b>. ¿Qué hago?', ['Abrir el salón de <b>'+esc(repo.split('/')[1])+'</b> ('+bookCount(rem.salon)+' libros)', 'Unir los dos salones', 'Cancelar']);
    if(i===2){ SYNC.cfg=prevCfg; msg.textContent=''; return; } mode=i===0?'adopt':'merge';
  }
  else if(!SYNC.base){
    const i=await syncAsk('☁️ Dos salones', 'Este dispositivo ya tiene un salón ('+bookCount(local)+' libros) y tu cuenta también ('+bookCount(rem.salon)+' libros).', ['Unirlos: quedan todos los libros, notas y recuerdos de ambos', 'Usar solo el de la cuenta (lo de este dispositivo se descarta)', 'Cancelar']);
    if(i===2){ SYNC.cfg=prevCfg; msg.textContent=''; return; } mode=i===0?'merge':'adopt';
  }
  await _syPut('kv','sync_cfg', SYNC.cfg);
  if(mode==='adopt'){
    msg.textContent='Trayendo tu salón… ☁️';
    SYNC.adopting=true;
    const keys=await idbAllKeys('files'); for(const k of keys) await _syDel('files', k);
    const sv=JSON.parse(JSON.stringify(rem.salon)); sv.profiles=profiles; sv.currentProfile=currentProfile;
    await _syPut('kv','save', sv);
    SYNC.base={repo, commit:rem.head, salon:rem.salon, files:rem.files};
    await _syPut('kv','sync_base', SYNC.base); await _syPut('kv','sync_dirty', []); await _syPut('kv','sync_dead', []);
    toast('«¡Bienvenida de vuelta a tu salón! ☁️💗 Abriendo…»'); setTimeout(()=>location.reload(), 1200); return;
  }
  if(linkedElsewhere || mode==='upload') SYNC.base=null;         /* todo lo de aquí se sube */
  msg.textContent='Sincronizando por primera vez… ☁️ (si hay muchos libros, tarda un poquito)';
  const ok=await syncNow();
  toast(ok ? '«☁️ ¡Listo! Tu salón ya vive en tu nube y se verá igual en la PC y en el cel 💗»' : '«☁️ Sesión guardada; termino de subir todo cuando haya conexión»');
  state.c.cloud=1; checkAch(); renderSyncCard();
}
async function syncLogout(){
  const i=await syncAsk('☁️ Cerrar sesión', 'Primero guardo en la nube lo último que hiciste aquí. Tu salón se queda también en este dispositivo.', ['Cerrar sesión', 'Cancelar']);
  if(i!==0) return;
  await syncNow(true);
  SYNC.cfg=null; await _syDel('kv','sync_cfg');
  syncBadge('none'); renderSyncCard(); toast('«Sesión cerrada 🗝️ tu salón sigue aquí»');
}

/* ---------- la tarjeta «Mi cuenta» en Configuración y la nubecita de la barra ---------- */
function syncBadge(st){
  let b=document.getElementById('syncChip');
  if(!b){ const pc=document.getElementById('profChip'); if(!pc) return; b=document.createElement('button'); b.id='syncChip'; b.className='chip'; b.onclick=()=>{ show('v-settings'); setTimeout(()=>{ const c=document.getElementById('syncCard'); if(c) c.scrollIntoView({behavior:'smooth', block:'center'}); }, 200); }; pc.after(b); }
  b.style.display=st==='none'?'none':'';
  b.textContent={busy:'☁️⏳', ok:'☁️', off:'☁️💤', err:'☁️⚠️'}[st]||'☁️';
  b.title={busy:'Sincronizando…', ok:'Tu salón está al día en la nube', off:'Sin conexión: se sincroniza al volver internet', err:SYNC.err}[st]||'';
}
function syncAgo(t){ if(!t) return 'aún no'; const m=Math.round((Date.now()-t)/60000); return m<1?'hace un momento':m<60?'hace '+m+' min':'hace '+Math.round(m/60)+' h'; }
function renderSyncCard(){
  const grid=document.querySelector('#v-settings .stats-grid'); if(!grid) return;
  let c=document.getElementById('syncCard');
  if(!c){ c=document.createElement('div'); c.id='syncCard'; c.className='stat-card'; c.style.gridColumn='1 / -1'; grid.insertBefore(c, grid.firstChild); }
  if(SYNC.cfg){
    c.innerHTML='<div class="adv-h">☁️ Mi cuenta en la nube</div>'
      +'<div style="line-height:1.6">Conectada al salón <b>'+esc(SYNC.cfg.repo.split('/')[1])+'</b> (privado, en GitHub).<br>'
      +'Última sincronización: <b>'+syncAgo(SYNC.last)+'</b>'+(SYNC.err?'<br><span style="color:var(--wax)">'+esc(SYNC.err)+'</span>':'')+'</div>'
      +'<div class="lbl" style="margin:6px 0">Tus libros, progreso, diario, citas, cartas, metas y el Despacho se ven igual en la PC y en el cel. En el cel, cada libro se baja la primera vez que lo abres.</div>'
      +'<div style="display:flex; gap:8px; flex-wrap:wrap"><button class="btn rose small" onclick="syncNow().then(ok=>toast(ok?\'«☁️ Todo al día 💗»\':\'«☁️ \'+esc(SYNC.err)+\'»\'))">🔄 Sincronizar ahora</button><button class="btn small" onclick="syncLogout()">Cerrar sesión</button></div>';
  } else {
    const tokUrl='https://github.com/settings/personal-access-tokens/new?name='+encodeURIComponent('Bibliotheque '+(state.name&&state.name!=='Lector(a)'?state.name:'salon'))
      +'&description='+encodeURIComponent('Sincroniza el salón de Bibliothèque Enchantée')+'&target_name='+SYNC_OWNER+'&expires_in=none&contents=write';
    c.innerHTML='<div class="adv-h">☁️ Mi cuenta en la nube</div>'
      +'<div class="lbl" style="margin-bottom:8px">Inicia sesión con tu salón y tus libros se verán en la PC y en el cel. Todo queda en un repositorio <b>privado</b> de GitHub.</div>'
      +'<label class="fld">Mi salón</label><input type="text" id="syRepo" placeholder="bibliotheque-xiomara" autocomplete="off" autocapitalize="off">'
      +'<label class="fld" style="margin-top:6px">Mi llave</label><input type="password" id="syToken" placeholder="github_pat_…" autocomplete="off">'
      +'<div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px"><button class="btn rose small" onclick="syncLogin()">🔐 Iniciar sesión</button>'
      +'<button class="btn small" onclick="window.open(\''+tokUrl+'\',\'_blank\')">🔑 Crear mi llave en GitHub</button></div>'
      +'<div class="lbl" id="syMsg" style="margin-top:8px"></div>';
  }
}

/* ---------- cuándo se sincroniza ---------- */
(async function syncBoot(){
  await syncLoad();
  const st=()=>document.getElementById('profChip');
  while(!st()) await new Promise(r=>setTimeout(r, 200));
  renderSyncCard();
  if(!SYNC.cfg){ syncBadge('none'); return; }
  syncBadge('ok');
  setTimeout(()=>syncNow(true), 2500);
})();
setInterval(()=>{ if(SYNC.cfg && !document.hidden) syncNow(true); }, 3*60000);
document.addEventListener('visibilitychange', ()=>{ if(SYNC.cfg){ if(document.hidden){ saveState(); syncNow(true); } else if(Date.now()-SYNC.last>30000) syncNow(true); } });
window.addEventListener('online', ()=>{ if(SYNC.cfg) syncNow(true); });
ACH.push({id:'cloud', e:'☁️', nm:'Salón en las nubes', st:'Inicia sesión y sincroniza tu salón', chk:()=>!!state.c.cloud});
