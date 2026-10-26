/* Persistencia (IndexedDB) y restauración de la interfaz */
/* ================================================================
   ✦ v12 — El salón cobra vida ✦
   Persistencia real (IndexedDB) · Lector PDF (PDF.js) · Estadísticas
   y logros vivos · Fechas del corazón 💗
   ================================================================ */

/* ---------- Persistencia: IndexedDB ---------- */
let db=null, memMode=false, urlMap={}, saveDirty=false;
function idbOpen(){ return new Promise(res=>{ try{
  const rq=indexedDB.open('bibliotheque_v12',1);
  rq.onupgradeneeded=()=>{ const d=rq.result;
    if(!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
    if(!d.objectStoreNames.contains('files')) d.createObjectStore('files'); };
  rq.onsuccess=()=>{ db=rq.result; res(true); };
  rq.onerror=()=>{ memMode=true; res(false); };
}catch(e){ memMode=true; res(false); } }); }
function idbPut(st,k,v){ return new Promise(res=>{ if(!db) return res(false); try{
  const tx=db.transaction(st,'readwrite'); tx.objectStore(st).put(v,k);
  tx.oncomplete=()=>res(true); tx.onerror=()=>res(false); }catch(e){ res(false); } }); }
function idbGet(st,k){ return new Promise(res=>{ if(!db) return res(null); try{
  const rq=db.transaction(st).objectStore(st).get(k);
  rq.onsuccess=()=>res(rq.result==null?null:rq.result); rq.onerror=()=>res(null); }catch(e){ res(null); } }); }
function idbDel(st,k){ return new Promise(res=>{ if(!db) return res(false); try{
  const tx=db.transaction(st,'readwrite'); tx.objectStore(st).delete(k);
  tx.oncomplete=()=>res(true); tx.onerror=()=>res(false); }catch(e){ res(false); } }); }

function collectSave(){
  return { v:12, state, settings, outfit, pin, claimed, bonus:[...bonusUnlocks],
    profiles, currentProfile, lastMilestone, unlockedCount, dressed };
}
function applySave(d){
  if(!d) return;
  if(d.state) Object.assign(state, d.state);
  if(d.settings) Object.assign(settings, d.settings);
  if(d.outfit) Object.assign(outfit, d.outfit);
  if(d.pin!==undefined && d.pin!==null) pin=d.pin;
  if(d.claimed) claimed=d.claimed;
  if(d.bonus) bonusUnlocks=new Set(d.bonus);
  if(d.profiles) profiles=d.profiles;
  if(d.currentProfile) currentProfile=d.currentProfile;
  if(typeof d.lastMilestone==='number') lastMilestone=d.lastMilestone;
  if(typeof d.unlockedCount==='number') unlockedCount=d.unlockedCount;
  if(d.dressed) dressed=true;
  state.pageLog=state.pageLog||{}; state.c=state.c||{}; state.ach=state.ach||{};
  state.celeb=state.celeb||{}; state.timeMin=state.timeMin||0;
}
function fsSafe(n){ return String(n||'').replace(/[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ _.-]/g,'').slice(0,60)||'archivo'; }
function fsMirror(rel, file){
  try{
    if(window.bibFS && file && file.arrayBuffer)
      file.arrayBuffer().then(buf=>window.bibFS.saveFile(rel, buf)).catch(()=>{});
  }catch(e){}
}
function scheduleSave(){ saveDirty=true; }
function saveState(){
  if(memMode) return;
  saveDirty=false;
  try{ idbPut('kv','save', JSON.parse(JSON.stringify(collectSave()))); }catch(e){}
  try{ if(window.bibFS) window.bibFS.saveText('respaldos/respaldo_autoguardado.json', JSON.stringify(collectSave(), null, 2)); }catch(e){}
}
async function loadState(){
  const d=await idbGet('kv','save');
  if(d) applySave(d);
  if(memMode) setTimeout(()=>toast('«⚠️ El navegador bloqueó mi memoria: hoy leo contigo, pero al cerrar olvidaré todo 🥺 (ábreme como archivo local en Chrome/Edge)»'), 4000);
}
async function preloadFileURLs(){
  const all=[...state.floor, ...state.sections.flatMap(s=>s.books)];
  for(const b of all){
    if(!b.id) continue;
    for(const kind of ['cover','floor']){
      if((kind==='cover'&&b.hasCover)||(kind==='floor'&&b.hasFloor)){
        if(urlMap[b.id+'_'+kind]) continue;
        const bl=await idbGet('files','f_'+b.id+'_'+kind);
        if(bl) urlMap[b.id+'_'+kind]=URL.createObjectURL(bl);
      }
    }
  }
  for(const e of (state.diary||[])){
    if(e.pid && !urlMap['d_'+e.pid]){
      const bl=await idbGet('files','d_'+e.pid);
      if(bl) urlMap['d_'+e.pid]=URL.createObjectURL(bl);
    }
  }
}
function applyThemeByName(n){
  const order={versalles:0, pompadour:1, trianon:2};
  const btns=document.querySelectorAll('.themeb');
  const b=btns[order[n]??0];
  if(b && n && n!=='versalles') setTheme(n,b);
}
function restoreUI(){
  document.querySelectorAll('.buddy-name').forEach(e=>e.textContent=state.fav);
  const sc=document.getElementById('sideCap');
  if(sc && state.name!=='Lector(a)') sc.textContent='soy '+state.fav+' ✨';
  const pc=document.getElementById('profChip'); if(pc) pc.textContent='👤 '+state.name;
  const g=document.getElementById('setGoal'); if(g) g.value=settings.goal;
  const y=document.getElementById('setYear'); if(y) y.value=settings.year;
  const l=document.getElementById('setLangSel'); if(l) l.value=settings.lang||'es';
  const pg=document.getElementById('setPg'); if(pg) pg.value=settings.pagesGoal||10;
  const wm=document.getElementById('setWarm'); if(wm) wm.value=settings.warm||0;
  document.documentElement.style.setProperty('--warm', settings.warm||0);
  const rm=document.getElementById('setRemind'); if(rm && settings.remindAt) rm.value=settings.remindAt;
  updateDayChip();
  applyThemeByName(settings.theme);
  if(state.name!=='Lector(a)') show('v-library');
}

