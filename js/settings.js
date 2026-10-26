/* Cerradura, protector, perfiles, configuración, respaldo y toast */
/* ===== v6: cerradura con llave dorada ===== */
let pin=null;
function lockApp(){
  const ov=document.getElementById('lockOv');
  const first=(pin===null);
  document.getElementById('lockMsg').textContent = first
    ? 'Crea tu PIN de 4 dígitos 🗝️' : 'Salón bajo llave — ingresa tu PIN';
  document.getElementById('lockCancel').style.display = first ? 'inline-block' : 'none';
  document.getElementById('pinIn').value='';
  ov.classList.add('show');
  document.getElementById('pinIn').focus();
}
function pinSubmit(){
  const v=document.getElementById('pinIn').value.trim();
  if(!/^\d{4}$/.test(v)){ toast('«Deben ser 4 numeritos 🥺»'); document.getElementById('pinIn').value=''; return; }
  if(pin===null){
    pin=v; document.getElementById('lockOv').classList.remove('show');
    state.c.lock=1; checkAch(); scheduleSave();
    toast('«PIN guardado. Ahora el 🗝️ pondrá tu salón bajo llave»');
  } else if(v===pin){
    document.getElementById('lockOv').classList.remove('show');
    toast('«Bienvenida de vuelta a tu salón 💗»');
  } else { toast('«Ese no es… intenta de nuevo 🙈»'); document.getElementById('pinIn').value=''; }
}

/* ===== v6: protector de pantalla ===== */
let saverInt=null, idleT=null;
function openSaver(){
  const o=document.getElementById('saverOv'); o.style.display='flex';
  const tick=()=>{ const d=new Date();
    document.getElementById('svClock').textContent=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); };
  tick(); saverInt=setInterval(tick,10000);
  document.getElementById('svQ').textContent='« '+dailyQuotes[Math.floor(Math.random()*dailyQuotes.length)]+' »';
}
function closeSaver(){ document.getElementById('saverOv').style.display='none'; clearInterval(saverInt); }
function startIdle(){
  const reset=()=>{ clearTimeout(idleT);
    if(document.getElementById('saverOv').style.display!=='flex') idleT=setTimeout(openSaver, 120000); };
  ['pointerdown','pointermove','keydown'].forEach(ev=>window.addEventListener(ev, reset));
  reset();
}

/* ===== v6: perfiles múltiples ===== */
let profiles={}, currentProfile='p1';
function switchProfile(){
  profiles[currentProfile]=JSON.stringify(state);
  currentProfile = currentProfile==='p1' ? 'p2' : 'p1';
  if(profiles[currentProfile]){
    Object.assign(state, JSON.parse(profiles[currentProfile]));
  } else {
    Object.assign(state, {name:'Invitada', fav:'Cuaderno en blanco',
      sections:[{name:'Mis inicios', decor:'🌷', books:[]}],
      floor:[], readingIdx:null, quotes:[], diary:[], readDays:[]});
  }
  document.querySelectorAll('.buddy-name').forEach(e=>e.textContent=state.fav);
  document.getElementById('sideCap').textContent='soy '+state.fav+' ✨';
  document.getElementById('profChip').textContent='👤 '+state.name;
  renderLibrary(); renderQuotes(); renderDiary();
  toast(`«Perfil de <b>${state.name}</b> activo 👤 cada quien tiene su propio salón»`);
}

/* ===== v7: Configuración ===== */
const settings={goal:24, year:'2026', lang:'es', theme:'versalles', pagesGoal:10, warm:0, remindAt:null};
const L={
  es:{ 'v-library':'🏛️ Biblioteca','v-stats':'📜 Salón de estadísticas','v-achievements':'🏆 Vitrina de logros',
       'v-quotes':'✒️ Citas favoritas','v-diary':'📔 Diario del corazón','v-welcome':'🚪 Ver bienvenida','v-settings':'⚙️ Configuración',
       nb:'📚 Nuevo libro', imp:'📄 Importar PDFs…', snd:'🎶 Sonidos del salón', goal:'🎯 Meta',
       motto:'« La lecture est une amitié » — vista de tu salón', of:'de', books:'libros… ¡vas bien!' },
  en:{ 'v-library':'🏛️ Library','v-stats':'📜 Statistics parlor','v-achievements':'🏆 Achievements','v-quotes':'✒️ Favorite quotes',
       'v-diary':'📔 Heart diary','v-welcome':'🚪 See welcome','v-settings':'⚙️ Settings',
       nb:'📚 New book', imp:'📄 Import PDFs…', snd:'🎶 Parlor sounds', goal:'🎯 Goal',
       motto:'« Reading is friendship » — your parlor', of:'of', books:'books… keep going!' },
  fr:{ 'v-library':'🏛️ Bibliothèque','v-stats':'📜 Salon de statistiques','v-achievements':'🏆 Vitrine des succès','v-quotes':'✒️ Citations',
       'v-diary':'📔 Journal du cœur','v-welcome':'🚪 Voir l’accueil','v-settings':'⚙️ Réglages',
       nb:'📚 Nouveau livre', imp:'📄 Importer des PDF…', snd:'🎶 Sons du salon', goal:'🎯 Objectif',
       motto:'« La lecture est une amitié » — votre salon', of:'sur', books:'livres… bravo !' }
};
function setLang(l){
  settings.lang=l;
  const t=L[l];
  document.querySelectorAll('.navi button').forEach(b=>{ if(t[b.dataset.v]) b.textContent=t[b.dataset.v]; });
  document.getElementById('nbBtn').textContent=t.nb;
  document.getElementById('sndTitle').textContent=t.snd;
  document.getElementById('libMotto').textContent=t.motto;
  updateGoal();
  toast(l==='es' ? '«¡Seguimos en español! 🇵🇪»' : l==='en' ? '“English it is, darling! 🇬🇧”' : '« En français, très chic ! 🇫🇷 »');
}
function updateGoal(){
  const read=state.sections.reduce((a,s)=>a+s.books.length,0);
  const t=L[settings.lang];
  document.getElementById('gTitle').textContent=t.goal+' '+settings.year;
  document.getElementById('gBar').style.width=Math.min(100, Math.round(read/settings.goal*100))+'%';
  document.getElementById('gTxt').textContent=read+' '+t.of+' '+settings.goal+' '+t.books;
  const gs=document.getElementById('gStreak');
  if(gs && typeof streakCount==='function') gs.textContent='🔥 racha: '+streakCount()+' día(s)';
}
function setTheme(name, btn){
  document.querySelectorAll('.themeb').forEach(b=>b.classList.remove('sel'));
  btn.classList.add('sel');
  const r=document.documentElement.style;
  if(name==='versalles'){ r.setProperty('--rose-quartz','#F4CBCC'); r.setProperty('--bridal-rose','#C48A90'); r.setProperty('--whispy-blue','#BFD3E2'); }
  if(name==='pompadour'){ r.setProperty('--rose-quartz','#F6B8C4'); r.setProperty('--bridal-rose','#B06478'); r.setProperty('--whispy-blue','#E3C8D8'); }
  if(name==='trianon'){ r.setProperty('--rose-quartz','#CFE0EC'); r.setProperty('--bridal-rose','#7E9BB5'); r.setProperty('--whispy-blue','#A9C4D8'); }
  toast('«Nuevo vestido para el salón 🎨✨»');
}
function exportBackup(){
  const blob=new Blob([JSON.stringify(collectSave(), null, 2)], {type:'application/json'});
  const a=document.createElement('a'); a.download='bibliotheque_respaldo.json';
  a.href=URL.createObjectURL(blob); a.click();
  toast('«Respaldo exportado 📦 guárdalo en un lugar seguro»');
}
function importBackup(inp){
  const f=inp.files[0]; if(!f) return;
  const rd=new FileReader();
  rd.onload=()=>{ try{
      const d=JSON.parse(rd.result);
      applySave(d);
      document.querySelectorAll('.buddy-name').forEach(e=>e.textContent=state.fav);
      document.getElementById('profChip').textContent='👤 '+state.name;
      renderLibrary(); renderQuotes(); renderDiary(); updateGoal();
      renderStats(); renderAchievements(); renderCalendar(); saveState();
      toast('«¡Tu salón regresó intacto del respaldo! 📂💗»');
    }catch(e){ toast('«Ese archivo no parece un respaldo del salón 🥺»'); } };
  rd.readAsText(f); inp.value='';
}
function wipeAll(){
  if(!confirm('¿Borrar TODA tu biblioteca, citas y diario? Esta acción no se puede deshacer.')) return;
  Object.assign(state, {name:'Lector(a)', fav:'Mi libro',
    sections:[{name:'Mis inicios', decor:'🌷', books:[]}],
    floor:[], readingIdx:null, quotes:[], diary:[], readDays:[],
    pageLog:{}, timeMin:0, c:{}, ach:{}, celeb:{}});
  pin=null; claimed={}; bonusUnlocks=new Set(); unlockedCount=0; lastMilestone=0; dressed=false; urlMap={};
  try{ if(db){ db.transaction('files','readwrite').objectStore('files').clear(); } }catch(e){}
  renderLibrary(); renderQuotes(); renderDiary(); renderCalendar(); updateGoal();
  renderStats(); renderAchievements(); saveState();
  toast('«El salón quedó como nuevo… empecemos otra historia 🕊️»');
}

let toastTimer;
function toast(html){
  const t=document.getElementById('toast'); t.innerHTML=html; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'), 4200);
}

