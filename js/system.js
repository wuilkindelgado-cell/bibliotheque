/* v1.2: bandeja de Windows, recordatorio con la app cerrada, PIN al abrir y guardado ordenado al salir */

async function syncTray(){
  if(!window.bibFS || !bibFS.trayCfg) return;
  const cfg=await bibFS.trayCfg({remindAt:settings.remindAt||null, tray:!!settings.tray, login:!!settings.login});
  const t=document.getElementById('setTray'), l=document.getElementById('setLogin');
  if(t) t.checked=!!cfg.tray;
  if(l){ l.checked=!!cfg.login; l.disabled=!cfg.tray; }
}
function setTrayOpt(k, v){
  settings[k]=!!v;
  if(k==='tray' && !v) settings.login=false;
  if(k==='tray' && v && !settings.remindAt) toast('«¡Listo! Ahora elige arriba la hora del recordatorio 🔔»');
  else if(k==='tray') toast(v?'«Al cerrar la ventana me quedaré junto al reloj de Windows 🕰️💗»':'«Al cerrar la ventana, el salón se cerrará del todo 🕊️»');
  if(k==='login') toast(v?'«Despertaré contigo cuando enciendas la PC (escondidita) ☀️»':'«Ya no abriré con Windows 🌙»');
  scheduleSave(); syncTray();
}
function setPinOnStart(v){
  if(v && pin===null){
    toast('«Primero crea tu PIN de 4 dígitos 🗝️»');
    document.getElementById('setPinStart').checked=false;
    lockApp(); return;
  }
  settings.pinOnStart=!!v; scheduleSave();
  toast(v?'«Desde ahora pediré tu PIN cada vez que abras el salón 🗝️»':'«El salón abrirá sin PIN 🗝️»');
}
/* al abrir: si está activado, el salón empieza bajo llave */
function lockOnStart(){
  const c=document.getElementById('setPinStart'); if(c) c.checked=!!settings.pinOnStart;
  if(settings.pinOnStart && pin!==null) lockApp();
}
/* el recordatorio también se informa al proceso principal */
const _setRem=setReminder;
setReminder=function(v){ const r=_setRem(v); syncTray(); return r; };
/* el proceso principal pide guardar antes de cerrar (instalador o «Salir por completo») */
if(window.bibWin && bibWin.onFlush) bibWin.onFlush(()=>{ try{ saveState(); }catch(e){} });
