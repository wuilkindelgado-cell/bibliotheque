/* Asistente: menú de funciones, búsqueda y modos */
/* ===== Asistente: menú de funciones ===== */
const buddyLines=[
  ()=>`«${state.name}, hoy huele a papel viejo y a aventura… ¿leemos? 📖»`,
  ()=>`«Tu salón se parece cada día más al Petit Trianon ✨»`,
  ()=>`«Psst… ese libro del suelo me mira con ojitos tristes 🥺»`,
  ()=>`«Un estante nuevo siempre merece un té ☕»`,
  ()=>`«¿Sabías que llevo la cuenta de todo lo que lees? Soy muy chismoso 👀»`
];
let bl=0;
function openBuddy(){ document.getElementById('buddyOv').classList.add('show'); }
function closeBuddy(){ document.getElementById('buddyOv').classList.remove('show'); }
function buddyChat(){ closeBuddy(); state.c.chat=(state.c.chat||0)+1; checkAch(); scheduleSave(); toast(buddyLines[bl++ % buddyLines.length]()); }

function buddyRecommend(){
  closeBuddy();
  const pend=state.floor.filter(b=>!b.done);
  if(!pend.length){ toast('«No hay libros esperando en el suelo… ¡agrega uno y te ayudo a elegir! 📚»'); return; }
  const b=pend[Math.floor(Math.random()*pend.length)];
  state.c.rand=1; checkAch(); scheduleSave();
  toast(`«Hoy el destino dice… <b>${b.t}</b> 🎲✨ ¡Confía en mí!»`);
}

const dailyQuotes=[
  'Cada página leída es una vela encendida',
  'Los libros esperan mejor que nadie',
  'Leer es conversar con quien ya no está',
  'Un estante lleno es un año bien vivido',
  'Las mejores historias también te leen a ti'
];
function buddyQuote(){
  closeBuddy();
  toast('✒️ «'+dailyQuotes[new Date().getDate() % dailyQuotes.length]+'»');
}

let focusInt=null, focusLeft=0;
function buddyFocus(){
  closeBuddy();
  const cap=document.getElementById('sideCap');
  if(focusInt){
    clearInterval(focusInt); focusInt=null;
    cap.textContent='soy '+state.fav+' ✨';
    toast('«Sesión de té interrumpida… ¡a la próxima! ☕»'); return;
  }
  const mins=parseInt(document.getElementById('focusMin')?.value)||25;
  focusLeft=mins*60;
  toast('«¡'+mins+' minutos de lectura sagrada! Yo cuido el reloj 🍵⏳ (vuelve a tocar el enfoque para cancelar)»');
  focusInt=setInterval(()=>{
    focusLeft--;
    cap.textContent='🍵 enfoque '+String(Math.floor(focusLeft/60)).padStart(2,'0')+':'+String(focusLeft%60).padStart(2,'0');
    if(focusLeft<=0){
      clearInterval(focusInt); focusInt=null;
      cap.textContent='soy '+state.fav+' ✨';
      state.c.focus=(state.c.focus||0)+1; checkAch(); scheduleSave();
      toast('«¡Lo lograste! '+mins+' minutos de lectura pura ✨»');
    }
  },1000);
}

function buddyFact(){
  closeBuddy();
  const done=state.sections.reduce((a,s)=>a+s.books.length,0);
  const pend=state.floor.filter(b=>!b.done).length;
  const rr=state.sections.reduce((a,s)=>a+s.books.reduce((x,b)=>x+(b.rereads||0),0),0);
  toast(`«Tu salón guarda <b>${done}</b> libros en <b>${state.sections.length}</b> estantes, ${pend} esperan en el suelo y llevas ${rr} relecturas 📚✨»`);
}

const moods=[
  ()=>`«¡Feliz como marqués en baile! Hoy ya me visitaste ${2+bl} veces 💗»`,
  ()=>`«Un poquito celoso de los libros del suelo… a mí también léeme 🥺»`,
  ()=>`«Soñando con que llegues a tu meta del año… ¡yo sé que puedes! 🦢»`
];
let md=0;
function buddyMood(){ closeBuddy(); toast(moods[md++ % moods.length]()); }

/* ===== Búsqueda / modos ===== */
function filterBooks(){
  const q=(document.getElementById('q')?.value||'').trim().toLowerCase();
  document.querySelectorAll('.spine, .fbook').forEach(el=>{
    const t=(el.title || el.querySelector('.cov')?.textContent || '').toLowerCase();
    el.classList.toggle('dimmed', q!=='' && !t.includes(q));
  });
}

let doublePage=false;
function togglePages(){
  doublePage=!doublePage;
  document.getElementById('spread').classList.toggle('single', !doublePage);
  document.getElementById('pgMode').textContent = doublePage ? '📃 Una página' : '📖 Dos páginas';
  if(pdfDoc){ if(doublePage && curPage%2===0 && curPage>1) curPage--; renderSpread(); }
  toast(doublePage ? '«Doble página, como un libro de verdad 📖»' : '«Una página a la vez, sin distracciones 📃»');
}

function toggleNight(){
  const w=document.querySelector('.win');
  w.classList.toggle('night');
  if(w.classList.contains('night')){ state.c.night=1; checkAch(); scheduleSave(); }
  toast(w.classList.contains('night')
    ? '«Shhh… hora de leer a la luz de las velas 🕯️🌙»'
    : '«¡Buenos días! Que entre el sol del Trianon ☀️»');
}

