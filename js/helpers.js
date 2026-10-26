/* v20: utilidades compartidas */

/* formato del libro según el archivo: 'pdf', 'epub' o null */
function bookFormat(f){
  const n=(f && f.name || '').toLowerCase();
  if(f.type==='application/pdf' || n.endsWith('.pdf')) return 'pdf';
  if(f.type==='application/epub+zip' || n.endsWith('.epub')) return 'epub';
  if(n.endsWith('.cbz') || f.type==='application/vnd.comicbook+zip') return 'cbz';
  return null;
}
/* audiolibros: mp3, m4b, m4a, ogg, opus, wav, aac, flac */
function mediaFormat(f){
  const n=(f && f.name || '').toLowerCase();
  if(/^audio\//.test(f.type||'') || /\.(mp3|m4b|m4a|ogg|oga|opus|wav|aac|flac)$/.test(n)) return 'audio';
  return null;
}
/* "el_principito-saint_exupery.pdf" → "El principito saint exupery" */
function titleFromFile(name){
  const t=String(name||'').replace(/\.[^.]+$/,'').replace(/[_\-.]+/g,' ').replace(/\s+/g,' ').trim();
  return t ? t.charAt(0).toUpperCase()+t.slice(1) : '';
}
/* "2026-10-24" → "24 de octubre de 2026" */
function niceDate(iso, withYear){
  const p=String(iso||'').split('-').map(Number);
  if(p.length<3 || !p[0]) return String(iso||'');
  const d=new Date(p[0], p[1]-1, p[2]);
  const o={day:'numeric', month:'long'}; if(withYear!==false) o.year='numeric';
  return d.toLocaleDateString('es-PE', o);
}
function isoToDate(iso){ const p=String(iso).split('-').map(Number); return new Date(p[0], p[1]-1, p[2]); }

/* portada incrustada en un EPUB (como Blob), o null */
async function epubCover(file){
  try{
    if(!window.JSZip) return null;
    const zip=await JSZip.loadAsync(await file.arrayBuffer());
    const cont=await zip.file('META-INF/container.xml')?.async('string'); if(!cont) return null;
    const opfPath=(cont.match(/full-path="([^"]+)"/)||[])[1]; if(!opfPath) return null;
    const opf=await zip.file(opfPath)?.async('string'); if(!opf) return null;
    const base=opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/')+1) : '';
    const doc=new DOMParser().parseFromString(opf, 'application/xml');
    const items=[...doc.getElementsByTagName('item')];
    let it=items.find(i=>(i.getAttribute('properties')||'').includes('cover-image'));
    if(!it){
      const meta=[...doc.getElementsByTagName('meta')].find(m=>m.getAttribute('name')==='cover');
      const cid=meta && meta.getAttribute('content');
      it=items.find(i=>i.getAttribute('id')===cid) || items.find(i=>/cover/i.test(i.getAttribute('id')||'') && /image/.test(i.getAttribute('media-type')||''));
    }
    if(!it) return null;
    const href=decodeURIComponent(it.getAttribute('href'));
    const f=zip.file(base+href) || zip.file(href); if(!f) return null;
    return new Blob([await f.async('arraybuffer')], {type:it.getAttribute('media-type')||'image/jpeg'});
  }catch(e){ return null; }
}

/* juegos de caritas para calificar (Configuración → Caritas) */
const FACE_SETS={
  clasicas:['😴','😐','🙂','😄','🤩'],
  gatitos:['😾','😿','🐱','😸','😻'],
  flores:['🥀','🌱','🌼','🌷','🌹'],
  corazones:['💔','🤍','💛','💗','💖'],
  estrellas:['☁️','⭐','🌟','💫','✨']
};
function faceSet(){ return FACE_SETS[(typeof settings!=='undefined' && settings.faceSet)] || FACE_SETS.clasicas; }
/* traduce una calificación guardada (1..5) al juego de caritas actual */
function faceOf(n){ return faceSet()[(n||4)-1]; }

/* diálogo para pedir un texto (Electron no permite prompt()); devuelve null si se cancela */
function askText(title, msg, opts){
  opts=opts||{};
  return new Promise(res=>{
    const ov=document.createElement('div'); ov.className='ficha-overlay show'; ov.style.zIndex=95;
    ov.innerHTML='<div class="frame-card" style="width:100%; max-width:360px; text-align:center">'
      +'<div class="ask-t" style="font-family:var(--disp); font-weight:700; font-size:18px"></div>'
      +'<div class="lbl" style="font-size:12.5px; margin:6px 0 10px; white-space:pre-line"></div>'
      +'<input type="'+(opts.password?'password':'text')+'" style="text-align:center">'
      +'<div style="display:flex; gap:8px; justify-content:center; margin-top:12px">'
      +'<button class="btn small">Cancelar</button><button class="btn rose small">Aceptar</button></div></div>';
    ov.querySelector('.ask-t').textContent=title;
    ov.querySelector('.lbl').textContent=msg||'';
    const inp=ov.querySelector('input'); if(opts.value) inp.value=opts.value;
    const [cb, ob]=ov.querySelectorAll('button');
    const done=v=>{ ov.remove(); res(v); };
    cb.onclick=()=>done(null); ob.onclick=()=>done(inp.value);
    inp.onkeydown=e=>{ if(e.key==='Enter') done(inp.value); if(e.key==='Escape') done(null); };
    document.querySelector('.win').appendChild(ov);
    setTimeout(()=>inp.focus(), 30);
  });
}
