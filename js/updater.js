/* v1.3: actualizaciones automáticas — revisa, avisa, descarga (verificando la huella) e instala sola */
const UPD={busy:false, last:null};
function updStatus(t){ const s=document.getElementById('updStatus'); if(s) s.innerHTML=t; }
async function checkUpdates(manual){
  if(!window.bibFS || !bibFS.checkUpdate || UPD.busy) return;
  if(!manual && settings.autoUpdate===false) return;
  UPD.busy=true; if(manual) updStatus('Buscando… ⏳');
  const r=await bibFS.checkUpdate(); UPD.busy=false; UPD.last=Date.now();
  if(!r.ok){ if(manual) updStatus(r.status==='sin-conexion'?'Sin internet por ahora 📡 lo intento más tarde':'No pude revisar ahora ('+esc(String(r.status))+')'); return; }
  if(!r.update){ if(manual){ updStatus('✨ Tienes la versión más nueva ('+esc(r.current)+')'); toast('«¡Tu salón está al día! ✨»'); } return; }
  updStatus('🎁 ¡Hay una versión nueva: '+esc(r.version)+'!');
  if(!manual && settings.skipVersion===r.version) return;
  showUpdateOffer(r);
}
function showUpdateOffer(r){
  let ov=document.getElementById('updOv');
  if(!ov){ ov=document.createElement('div'); ov.id='updOv'; ov.className='ficha-overlay'; ov.style.zIndex=97; document.querySelector('.win').appendChild(ov); }
  const notes=esc(r.notes||'').replace(/^#+\s*/gm,'').replace(/\n/g,'<br>');
  ov.innerHTML='<div class="frame-card" style="width:100%; max-width:470px; text-align:center">'
    +'<div style="font-size:36px">🎁</div>'
    +'<div style="font-family:var(--disp); font-weight:700; font-size:21px">¡Llegó una versión nueva del salón!</div>'
    +'<div class="lbl" style="font-size:12.5px; margin:2px 0 10px">Tienes la '+esc(r.current)+' · nueva: <b>'+esc(r.version)+'</b>'+(r.size?' · '+(r.size/1048576).toFixed(0)+' MB':'')+'</div>'
    +(notes?'<div class="desc upd-notes">'+notes+'</div>':'')
    +'<div class="lbl" style="font-size:12px; margin-top:8px">Tus libros, notas, diario y recuerdos se quedan intactos 💗 La app se cerrará un momentito y volverá a abrirse sola.</div>'
    +'<div class="gbar" id="updBar" style="display:none; margin-top:10px"><i style="width:0"></i></div>'
    +'<div id="updMsg" class="lbl" style="font-size:12px; min-height:16px"></div>'
    +'<div id="updBtns" style="display:flex; gap:8px; justify-content:center; margin-top:10px; flex-wrap:wrap">'
    +'<button class="btn small" onclick="updLater(\''+esc(r.version)+'\')">Más tarde</button>'
    +'<button class="btn rose small" onclick="updInstall()">Actualizar ahora ✨</button></div></div>';
  ov.classList.add('show');
}
function updLater(v){ document.getElementById('updOv').classList.remove('show'); settings.skipVersion=v; scheduleSave();
  toast('«Te lo recordaré la próxima vez desde ⚙️ Configuración → Actualizaciones 🎁»'); }
async function updInstall(){
  const bar=document.getElementById('updBar'), msg=document.getElementById('updMsg');
  document.getElementById('updBtns').style.display='none'; bar.style.display='block';
  msg.textContent='Descargando… verificaré que el archivo sea auténtico antes de instalarlo 🔒';
  saveState();
  const r=await bibFS.downloadUpdate();
  if(!r.ok){
    msg.textContent=r.status==='huella-distinta'?'⚠️ El archivo descargado no coincide con su huella: por seguridad NO lo instalé.':'No pude descargar la actualización ('+r.status+'). Inténtalo más tarde 🌙';
    document.getElementById('updBtns').style.display='flex'; return;
  }
  bar.querySelector('i').style.width='100%';
  msg.textContent='✓ Verificado. Instalando… la app se volverá a abrir sola en unos segundos ✨';
  saveState();
  setTimeout(()=>bibFS.installUpdate(), 900);
}
if(window.bibFS && bibFS.onUpdateProgress) bibFS.onUpdateProgress(p=>{ const i=document.querySelector('#updBar i'); if(i) i.style.width=p+'%'; });
function setAutoUpdate(v){ settings.autoUpdate=!!v; scheduleSave(); toast(v?'«Revisaré solita si hay versiones nuevas 🔄»':'«Ya no buscaré actualizaciones sola; usa «Buscar ahora» 🔄»'); }
async function initUpdates(){
  const info=window.bibFS && bibFS.info ? await bibFS.info() : null;
  const v=document.getElementById('updVer'); if(v && info) v.textContent=info.version;
  const c=document.getElementById('setAutoUpd'); if(c) c.checked=settings.autoUpdate!==false;
  if(info && info.dev) return; // en pruebas no se busca solo
  setTimeout(()=>checkUpdates(false), 45000);
  setInterval(()=>checkUpdates(false), 6*3600e3);
}
