/* Versión iPhone (PWA): reemplaza lo justo del puente de Electron. Se carga antes que todo lo demás. */
(function(){
  const isIOS=/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  const MIME={pdf:'application/pdf', png:'image/png', json:'application/json', zip:'application/zip', txt:'text/plain',
    docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
  /* en el iPhone, «guardar como» = la hoja de compartir (Guardar en Archivos, WhatsApp, Mail…); si no se puede, descarga normal */
  async function saveAs(name, buf, kind){
    const ext=String(kind || String(name).split('.').pop() || '').toLowerCase();
    const file=new File([buf], name, {type:MIME[ext] || 'application/octet-stream'});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      try{ await navigator.share({files:[file]}); return name; }
      catch(e){ if(e && e.name==='AbortError') return null; }
    }
    const a=document.createElement('a'); a.href=URL.createObjectURL(file); a.download=name;
    document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 8000);
    return name;
  }
  window.bibFS={web:true, saveAs, deleteById:async()=>true, htmlToPdf:async()=>null};
  window.bibWeb={isIOS, standalone:(window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone===true};
  document.documentElement.classList.add('pwa');
  if(isIOS) document.documentElement.classList.add('ios');
})();
