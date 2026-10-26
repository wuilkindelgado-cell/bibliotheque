/* v1.4: retrato en marco rococó, tarjeta de reseña, marcapáginas coleccionables y modo noche automático */

/* ---------- su retrato, colgado en el salón ---------- */
let portraitURL=null;
async function loadPortrait(){
  const bl=await idbGet('files','portrait');
  if(portraitURL) URL.revokeObjectURL(portraitURL);
  portraitURL=bl?URL.createObjectURL(bl):null;
  renderPortrait();
}
function renderPortrait(){
  const fr=document.querySelector('#v-library .fresco'); if(!fr) return;
  let el=document.getElementById('portrait');
  if(!el){ el=document.createElement('button'); el.id='portrait'; el.onclick=openPortrait; fr.appendChild(el); }
  el.title=portraitURL?'Retrato de '+state.name+' · toca para cambiarlo':'Cuelga aquí tu retrato 🖼️';
  el.innerHTML=portraitURL?'<img src="'+portraitURL+'" alt="retrato">':'<span>🖼️<br>tu retrato</span>';
  fr.classList.toggle('has-portrait', true);
}
function openPortrait(){ document.getElementById('portraitFile').click(); }
async function setPortrait(inp){
  const f=inp.files[0]; inp.value=''; if(!f) return;
  /* se recorta en óvalo 3:4 y se guarda liviano */
  const img=await createImageBitmap(f);
  const W=360, H=480, cv=document.createElement('canvas'); cv.width=W; cv.height=H;
  const s=Math.max(W/img.width, H/img.height), x=cv.getContext('2d');
  x.drawImage(img, (W-img.width*s)/2, (H-img.height*s)/2, img.width*s, img.height*s);
  const bl=await new Promise(r=>cv.toBlob(r,'image/jpeg',.9));
  await idbPut('files','portrait', bl); fsMirror('retrato.jpg', bl);
  await loadPortrait(); state.c.portrait=1; checkAch(); scheduleSave();
  toast('«¡Qué retrato tan precioso! Ya cuelga en tu salón 🖼️👑»');
}

/* ---------- tarjeta de reseña para compartir ---------- */
async function reviewCard(){
  const {si,bi}=ficha; if(si==null) return;
  const b=state.sections[si].books[bi];
  const blob=await reviewCardBlob(b);
  const name='resena_'+fsSafe(b.t)+'.png';
  state.c.rcard=1; checkAch(); scheduleSave();
  if(window.bibFS && bibFS.saveAs){ const p=await bibFS.saveAs(name, await blob.arrayBuffer(), 'png'); if(p) toast('«Tarjeta de reseña guardada 💌 ¡lista para compartir!»'); }
  else { const a=document.createElement('a'); a.download=name; a.href=URL.createObjectURL(blob); a.click(); }
}
async function reviewCardBlob(b){
  const W=1080, H=1350, cv=document.createElement('canvas'); cv.width=W; cv.height=H;
  const x=cv.getContext('2d');
  await document.fonts.ready;
  const g=x.createLinearGradient(0,0,W,H); g.addColorStop(0,'#FBEFF0'); g.addColorStop(.55,'#F7ECDD'); g.addColorStop(1,'#E3EEF4');
  x.fillStyle=g; x.fillRect(0,0,W,H);
  const gold=x.createLinearGradient(0,0,W,0); ['#9A782C','#F0DA9C','#C9A04A','#FBEBC0','#A9833A'].forEach((c,i,a)=>gold.addColorStop(i/(a.length-1),c));
  x.strokeStyle=gold; x.lineWidth=14; x.strokeRect(30,30,W-60,H-60); x.lineWidth=3; x.strokeRect(58,58,W-116,H-116);
  x.textAlign='center';
  x.fillStyle='#8A6A28'; x.font='64px "Pinyon Script", cursive'; x.fillText('Bibliothèque Enchantée', W/2, 150);
  // portada
  const u=urlMap[b.id+'_cover'];
  let y=200;
  if(u){ const im=await new Promise(r=>{ const i=new Image(); i.onload=()=>r(i); i.onerror=()=>r(null); i.src=u; });
    if(im){ const ch=420, cw=im.width/im.height*ch; x.save(); x.shadowColor='rgba(78,57,52,.35)'; x.shadowBlur=24; x.shadowOffsetY=10;
      x.drawImage(im, W/2-cw/2, y, cw, ch); x.restore(); x.strokeStyle=gold; x.lineWidth=6; x.strokeRect(W/2-cw/2, y, cw, ch); y+=ch+30; } }
  const wrap=(t, font, color, maxW, lh, maxLines)=>{ x.font=font; x.fillStyle=color; const words=String(t).split(' '); let line='', n=0;
    for(const w of words){ const tt=line?line+' '+w:w; if(x.measureText(tt).width>maxW && line){ x.fillText(line, W/2, y); y+=lh; line=w; if(++n>=maxLines-1){ line+='…'; break; } } else line=tt; }
    if(line){ x.fillText(line, W/2, y); y+=lh; } };
  y+=40; wrap(b.t, '700 54px "Cormorant Garamond", serif', '#4E3934', 860, 60, 2);
  if(b.author) wrap(b.author, 'italic 500 34px "Cormorant Garamond", serif', '#866C64', 860, 44, 1);
  y+=10; x.font='64px "Segoe UI Emoji", sans-serif'; x.fillText(faceOf(b.faces).repeat(1), W/2, y+50); y+=100;
  const rv=b.review||b.desc; if(rv){ wrap('« '+rv+' »', '500 36px Caveat, cursive', '#4E3934', 860, 46, 5); y+=10; }
  if(b.favPart) wrap('Mi parte favorita: '+b.favPart, 'italic 30px Lora, serif', '#866C64', 860, 40, 3);
  x.font='500 28px Lora, serif'; x.fillStyle='#9A782C';
  x.fillText('Leído por '+state.name+(b.doneDate?' · '+niceDate(b.doneDate):''), W/2, H-110);
  return await new Promise(r=>cv.toBlob(r,'image/png'));
}

/* ---------- marcapáginas coleccionables ---------- */
const BOOKMARKS=[
  {id:'cinta',   n:'Cinta de raso rosa',     bg:'linear-gradient(180deg,#F3C9CF,#C27A8C)', e:'🎀'},
  {id:'sevres',  n:'Porcelana de Sèvres',    bg:'linear-gradient(180deg,#D6E8F3,#6E9FC4)', e:'🌸'},
  {id:'oro',     n:'Filigrana de oro',       bg:'linear-gradient(180deg,#F0DA9C,#9A782C)', e:'⚜'},
  {id:'menta',   n:'Macaron de pistacho',    bg:'linear-gradient(180deg,#E3EBCF,#94A879)', e:'🍃'},
  {id:'lavanda', n:'Lavanda de Provenza',    bg:'linear-gradient(180deg,#E8DDF2,#A68BC8)', e:'💜'},
  {id:'rosas',   n:'Ramillete de rosas',     bg:'repeating-linear-gradient(180deg,#FBEFF0 0 10px,#F3C9CF 10px 20px)', e:'🌹'},
  {id:'noche',   n:'Noche estrellada',       bg:'linear-gradient(180deg,#4D4766,#2E2A40)', e:'⭐'},
  {id:'mariposa',n:'Alas de mariposa',       bg:'linear-gradient(180deg,#BCD8E8,#F3C9CF)', e:'🦋'},
  {id:'cereza',  n:'Cerezo en flor',         bg:'linear-gradient(180deg,#FFF0F3,#E7A3B1)', e:'🌸'},
  {id:'luna',    n:'Media luna de plata',    bg:'linear-gradient(180deg,#F2F2F6,#B9B8C8)', e:'🌙'},
  {id:'corona',  n:'Corona de María Antonieta', bg:'linear-gradient(180deg,#F6E3A8,#C9A04A)', e:'👑'},
  {id:'cisne',   n:'Lago de los cisnes',     bg:'linear-gradient(180deg,#E3F1F6,#8FB3D0)', e:'🦢'}
];
function bmOwned(){ state.bookmarks=state.bookmarks||['cinta']; return state.bookmarks; }
function bmCurrent(){ return BOOKMARKS.find(x=>x.id===(settings.bookmark||'cinta'))||BOOKMARKS[0]; }
function grantBookmark(reason){
  const own=bmOwned(), left=BOOKMARKS.filter(x=>!own.includes(x.id));
  if(!left.length) return;
  const nb=left[Math.floor(Math.random()*left.length)];
  own.push(nb.id); scheduleSave(); checkAch();
  setTimeout(()=>buddySay('🔖 ¡Nuevo marcapáginas para tu colección!<br><b>'+nb.e+' '+nb.n+'</b><br><span style="font-size:12px">'+reason+' · elígelo en la Vitrina de logros</span>', 10000), 3500);
}
function renderBookmarks(){
  const g=document.getElementById('medalsGrid'); if(!g) return;
  let box=document.getElementById('bmCollection');
  if(!box){ box=document.createElement('div'); box.id='bmCollection'; box.className='stat-card bm-collection'; g.parentNode.insertBefore(box, g); }
  const own=bmOwned(), cur=bmCurrent().id;
  box.innerHTML='<div class="adv-h">🔖 Colección de marcapáginas · '+own.length+' de '+BOOKMARKS.length+' <span class="lbl" style="font-weight:400">(ganas uno con cada libro que terminas)</span></div>'
    +'<div class="bm-row">'+BOOKMARKS.map(b=>{ const has=own.includes(b.id);
      return '<button class="bm'+(has?'':' lk')+(b.id===cur?' sel':'')+'" data-id="'+b.id+'" title="'+esc(has?b.n:'Aún por descubrir')+'" style="'+(has?'background:'+b.bg:'')+'"><span>'+(has?b.e:'?')+'</span></button>'; }).join('')+'</div>';
  box.querySelectorAll('.bm').forEach(x=>x.onclick=()=>{ if(x.classList.contains('lk')){ toast('«Termina más libros para descubrir este marcapáginas 📚🔖»'); return; }
    settings.bookmark=x.dataset.id; scheduleSave(); renderBookmarks(); updateBmChip(); toast('«Tu marcapáginas ahora es '+bmCurrent().e+' '+bmCurrent().n+' 🔖»'); });
}
/* el marcapáginas elegido se ve en el lector */
const _ubF=updateBmChip;
updateBmChip=function(){ _ubF(); const c=document.getElementById('bmChip'); const b=bmCurrent(); if(c){ c.style.background=b.bg; c.style.color=/noche/.test(b.id)?'#fff':''; c.dataset.e=b.e; } };
/* un marcapáginas nuevo con cada libro terminado */
const _cdF=ceremonyDone;
ceremonyDone=function(...a){ const r=_cdF(...a); grantBookmark('Por terminar un libro'); return r; };

/* ---------- modo noche automático ---------- */
let autoNightLast=null;
function autoNightTick(){
  if(!settings.autoNight) return;
  const h=new Date().getHours(), want=(h>=19||h<6);
  if(autoNightLast===want) return;
  autoNightLast=want;
  const w=document.querySelector('.win');
  if(w.classList.contains('night')!==want){ toggleNight(); }
}
function setAutoNight(v){ settings.autoNight=!!v; autoNightLast=null; scheduleSave(); autoNightTick();
  toast(v?'«Encenderé las velas al atardecer (7 p. m.) y las apagaré al amanecer 🕯️🌅»':'«Modo noche manual, como tú prefieras 🌙»'); }

/* ---------- novedades de actualización con formato ---------- */
function mdLite(t){ return esc(t).replace(/^#+\s*(.*)$/gm,'<b>$1</b>').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/^\s*-\s+/gm,'• ').replace(/\n/g,'<br>'); }
const _suoF=showUpdateOffer;
showUpdateOffer=function(r){ _suoF(Object.assign({}, r, {notes:''})); const n=document.querySelector('#updOv .frame-card');
  if(r.notes && n){ const d=document.createElement('div'); d.className='desc upd-notes'; d.innerHTML=mdLite(r.notes); n.insertBefore(d, n.children[3]); } };

ACH.push(
 {id:'portrait', e:'🖼️', nm:'Retrato en Versalles', st:'Cuelga tu retrato en el salón', chk:()=>!!state.c.portrait},
 {id:'rcard',    e:'💌', nm:'Crítica de salón', st:'Crea una tarjeta de reseña', chk:()=>!!state.c.rcard},
 {id:'bm6',      e:'🔖', nm:'Coleccionista de cintas', st:'Reúne 6 marcapáginas', chk:()=>bmOwned().length>=6}
);
