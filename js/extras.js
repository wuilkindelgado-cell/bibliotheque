/* v20: logros nuevos, temas Jardín y Medianoche, juegos de caritas */

ACH.push(
 {id:'edit',     e:'✎',  nm:'Restauradora', st:'Edita los datos de un libro', chk:()=>(state.c.edits||0)>=1},
 {id:'fullbak',  e:'📦', nm:'Previsora', st:'Guarda un respaldo completo', chk:()=>(state.c.fullbak||0)>=1},
 {id:'annpdf',   e:'📤', nm:'Copista real', st:'Exporta un PDF con tus anotaciones', chk:()=>(state.c.annpdf||0)>=1},
 {id:'epub',     e:'📱', nm:'Lectora moderna', st:'Lee un libro en EPUB', chk:()=>!!state.c.epub},
 {id:'trivia5',  e:'🧠', nm:'Erudita', st:'Acierta 5 preguntas de trivia', chk:()=>(state.c.triviaOk||0)>=5},
 {id:'trivia25', e:'🎓', nm:'Académica de la lengua', st:'Acierta 25 preguntas de trivia', chk:()=>(state.c.triviaOk||0)>=25},
 {id:'lines3',   e:'📜', nm:'Oído de lectora', st:'Reconoce 3 primeras frases famosas', chk:()=>(state.c.lines||0)>=3},
 {id:'chal5',    e:'🎯', nm:'Retadora', st:'Cumple 5 retos del día', chk:()=>(state.c.challenges||0)>=5},
 {id:'letter1',  e:'💌', nm:'Correspondencia secreta', st:'Abre tu primera carta secreta', chk:()=>(state.c.letters||0)>=1},
 {id:'letter5',  e:'🗝️', nm:'Cofre de cartas', st:'Abre 5 cartas secretas', chk:()=>(state.c.letters||0)>=5},
 {id:'wrapped',  e:'✨', nm:'Mirada al pasado', st:'Mira tu año lector', chk:()=>!!state.c.wrapped},
 {id:'calday',   e:'🗓️', nm:'Viajera del tiempo', st:'Escribe en el diario sobre un día pasado', chk:()=>!!state.c.calday},
 {id:'mood',     e:'🎭', nm:'Corazón abierto', st:'Cuéntale a tu libro cómo te sientes', chk:()=>!!state.c.mood},
 {id:'p1000',    e:'📃', nm:'Mil páginas', st:'Lee 1 000 páginas', chk:()=>Object.values(state.pageLog||{}).reduce((a,n)=>a+n,0)>=1000},
 {id:'p5000',    e:'🌌', nm:'Cinco mil páginas', st:'Lee 5 000 páginas', chk:()=>Object.values(state.pageLog||{}).reduce((a,n)=>a+n,0)>=5000},
 {id:'rq30',     e:'🌋', nm:'Llama eterna', st:'Lee 30 días seguidos', chk:()=>streakCount()>=30},
 {id:'b60',      e:'🏯', nm:'Gran biblioteca', st:'60 libros leídos', chk:()=>booksRead()>=60},
 {id:'b100',     e:'📖', nm:'Leyenda del salón', st:'100 libros leídos', chk:()=>booksRead()>=100},
 {id:'faces',    e:'😻', nm:'Caritas nuevas', st:'Cambia tus caritas de calificación', chk:()=>!!state.c.faces}
);

/* ---------- temas ---------- */
const _setTheme=setTheme;
setTheme=function(name, btn){
  const w=document.querySelector('.win');
  w.classList.remove('theme-jardin','theme-medianoche');
  const r=document.documentElement.style;
  if(name==='jardin'){
    document.querySelectorAll('.themeb').forEach(b=>b.classList.remove('sel')); if(btn) btn.classList.add('sel');
    r.setProperty('--rose-quartz','#D9E4C8'); r.setProperty('--bridal-rose','#7C8B5E'); r.setProperty('--whispy-blue','#C8DCC8');
    w.classList.add('theme-jardin'); settings.theme=name; scheduleSave();
    toast('«El salón florece como el Jardín del Trianon 🌿»'); return;
  }
  if(name==='medianoche'){
    document.querySelectorAll('.themeb').forEach(b=>b.classList.remove('sel')); if(btn) btn.classList.add('sel');
    r.setProperty('--rose-quartz','#D9C3E0'); r.setProperty('--bridal-rose','#8E6A86'); r.setProperty('--whispy-blue','#A9A3C8');
    w.classList.add('theme-medianoche'); settings.theme=name; scheduleSave();
    toast('«Medianoche en la biblioteca… las velas son tuyas 🌙»'); return;
  }
  return _setTheme(name, btn);
};
applyThemeByName=function(n){
  const order={versalles:0, pompadour:1, trianon:2, jardin:3, medianoche:4};
  const b=document.querySelectorAll('.themeb')[order[n]??0];
  if(b && n && n!=='versalles') setTheme(n,b);
};

/* ---------- juegos de caritas ---------- */
function renderFaceButtons(){
  const fc=document.getElementById('cFaces'); if(!fc) return;
  fc.innerHTML='';
  faceSet().forEach(f=>{ const b=document.createElement('button'); b.textContent=f; b.onclick=()=>pickFace(b); fc.appendChild(b); });
}
function setFaceSet(v){
  settings.faceSet=v; state.c.faces=1; checkAch(); scheduleSave();
  renderFaceButtons(); renderStats(); renderLibrary();
  toast('«¡Caritas nuevas! '+faceSet().join(' ')+'»');
}
