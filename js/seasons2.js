/* v1.5: estaciones y eventos mejorados — más fechas, mensajes que rotan, el salón cambia de aspecto y premios de temporada */

/* telas exclusivas de temporada (se ganan en los eventos) */
Object.assign(FABRICS, {
  navidad:  {n:'Terciopelo navideño',  bg:'radial-gradient(circle at 30% 25%,#C2414F,#7E1E2B 70%)'},
  otono:    {n:'Seda ámbar de otoño',  bg:'linear-gradient(160deg,#E8B36A,#B9763A)'},
  primavera:{n:'Organza de primavera', bg:'var(--damask-rose), linear-gradient(160deg,#FCE3EA,#F3B7C6)', size:'60px 80px, auto', ink:true},
  verano:   {n:'Lino de verano',       bg:'linear-gradient(160deg,#BFE3F0,#7FC0DA)'},
  invierno: {n:'Lana de garúa',        bg:'linear-gradient(160deg,#D7DCE3,#A7B1BE)', ink:true},
  morado:   {n:'Seda morada de octubre', bg:'linear-gradient(160deg,#9B6FB3,#5E3A78)'},
  patrias:  {n:'Rojo y blanco',        bg:'repeating-linear-gradient(90deg,#D22F3A 0 12px,#FFFFFF 12px 24px)', ink:true},
  amor:     {n:'Satén de enamorados',  bg:'linear-gradient(160deg,#F7A8BC,#D9536F)'}
});
['navidad','otono','primavera','verano','invierno','morado','patrias','amor'].forEach(k=>DRESS_EXTRA.fabric.push([k, 9999]));

/* días especiales que se suman a los de siempre */
function nthSunday(y, m, n){ return nthWeekdayDay(y, m, 0, n); }
function extraSpecial(d){
  const y=d.getFullYear(), m=d.getMonth()+1, day=d.getDate();
  const firstSatFeb=nthWeekdayDay(y, 1, 6, 1);
  if(m===5 && day===nthSunday(y,4,2)) return {id:'madre', name:'Día de la Madre', cop:'💐', parts:['💐','🌷','💗'], msgs:['Hoy es el Día de la Madre 💐 un abrazo enorme para todas las mamás… ¿le lees un poema a la tuya?','Día de la Madre 🌷 las mamás fueron nuestras primeras bibliotecas: nos contaron los primeros cuentos 📖']};
  if(m===6 && day===nthSunday(y,5,3)) return {id:'padre', name:'Día del Padre', cop:'👔', parts:['👔','⭐','📘'], msgs:['¡Feliz Día del Padre! 👔 Un buen día para recomendarle un libro a papá 📘']};
  if(m===6 && day===24) return {id:'inti', name:'Inti Raymi', cop:'☀️', parts:['☀️','🌽','✨'], msgs:['¡Inti Raymi! ☀️ La fiesta del sol en Cusco. Hoy leemos con la luz más dorada del año 🌽']};
  if(m===2 && day===firstSatFeb) return {id:'pisco', name:'Día del Pisco Sour', cop:'🍸', parts:['🍋','🍸','✨'], msgs:['Primer sábado de febrero: ¡Día del Pisco Sour! 🍸 (yo me quedo con mi tecito, gracias ☕)'.replace('☕','☕')]};
  if(m===9 && day===23) return {id:'primav23', name:'Día de la Primavera y la Juventud', cop:'🌸', parts:['🌸','🌼','🦋'], msgs:['¡Feliz Día de la Primavera! 🌸 En el Perú también es el Día de la Juventud. El salón florece contigo 🦋']};
  if(m===10 && day===31) return {id:'criolla', name:'Canción Criolla y Halloween', cop:'🎃', parts:['🎃','🎸','🕯️'], msgs:['31 de octubre: ¡Día de la Canción Criolla! 🎸 y noche de brujitas 🎃 Un vals de Chabuca y un cuento de misterio, ¿te parece?']};
  if(m===12 && (day===24||day===25)) return {id:'nochebuena', special:true, name:'Navidad', cop:'🎄', parts:['🎄','⭐','🎁','❄'], msgs:['¡Feliz Navidad! 🎄 Que hoy no falte el chocolatito caliente, el panetón y un libro bajo el árbol 🎁','Noche de paz en el salón 🌟 Gracias por un año lleno de historias juntos 🎄']};
  if((m===12 && day===31) || (m===1 && day===1)) return {id:'anionuevo', special:true, name:'Año Nuevo', cop:'🎆', parts:['🎆','✨','🥂'], msgs:['¡Feliz Año Nuevo! 🎆 Un año entero de páginas en blanco te espera… ¿qué historias leeremos? 📖✨']};
  if(m===4 && day===2) return {id:'libroinf', name:'Día del Libro Infantil', cop:'🧸', parts:['🧸','📚','🎈'], msgs:['Hoy es el Día del Libro Infantil 🧸 nació Hans Christian Andersen. ¿Qué cuento de niña te marcó? 📚']};
  if(m===11 && day===22) return {id:'musica', name:'Día de la Música', cop:'🎻', parts:['🎻','🎶','🎹'], msgs:['Santa Cecilia, Día de la Música 🎻 Enciende el clavecín del salón mientras lees 🎶']};
  return null;
}
/* mensajes extra por estación (rotan cada día) */
const SEASON_MSGS={
  verano:['Verano ☀️ se lee con raspadilla en mano 🍧','Verano en el salón: ventanas abiertas, brisa de mar y un libro ligero 🌊','Calorcito de enero a marzo ☀️ perfecto para leer bajo una sombrilla 🏖️','Hoy el sol pide una historia de aventuras ⛵'],
  otono:['Otoño 🍂 caen las hojitas doradas sobre los estantes','Tarde de otoño: té, mantita y un libro que abrigue 🍂☕','El otoño es la estación de las relecturas 🍁 ¿alguna que extrañes?','Hojas doradas afuera, páginas doradas adentro ✨🍂'],
  invierno:['Invierno de garúa ☂️ mantita y libro adentro','La garúa limeña pide una novela larga y una bebida calientita ☕','Invierno: la estación perfecta del lector 🧣','Afuera gris, adentro el salón brilla con velas 🕯️'],
  primavera:['Primavera 🌷 el salón florece de septiembre a diciembre','En primavera hasta los estantes tienen flores 🌸','Primavera: buen momento para empezar un libro nuevo 🌱','Mariposas en el jardín y poesía en el salón 🦋']
};
const _csS=currentSeason;
currentSeason=function(){
  const d=new Date(), ex=extraSpecial(d);
  if(ex){ ex.msg=ex.msgs[d.getFullYear()%ex.msgs.length]; return ex; }
  const s=_csS();
  if(s && SEASON_MSGS[s.id]){ const pool=SEASON_MSGS[s.id].concat([s.msg]); s.msg=pool[(d.getDate()+d.getMonth())%pool.length]; }
  if(d.getMonth()===11 && d.getDate()>=1 && d.getDate()<24){ s.msg=s.msg+' · 🎄 Faltan '+(24-d.getDate())+' días para Navidad'; }
  return s;
};
/* la estación viste al salón (cielo, alfombra y brillo) */
const SEASON_THEME={verano:'verano', otono:'otono', invierno:'invierno', primavera:'primavera', navidad:'navidad', nochebuena:'navidad', anionuevo:'navidad',
  morado:'morado', brujitas:'morado', criolla:'morado', valentin:'amor', patrias:'patrias', schuco:'patrias', festprimavera:'primavera', primav23:'primavera'};
const _asS=applySeason;
applySeason=function(){
  _asS();
  const w=document.querySelector('.win');
  [...w.classList].filter(c=>c.startsWith('season-')).forEach(c=>w.classList.remove(c));
  const t=SEASON_THEME[seasonNow && seasonNow.id]; if(t) w.classList.add('season-'+t);
};

/* eventos del salón: Día de la Madre corregido, fechas nuevas, sus fechas, cuentas regresivas y el evento de temporada con premio */
const FABRIC_FOR_SEASON={verano:'verano', otono:'otono', invierno:'invierno', primavera:'primavera', navidad:'navidad', morado:'morado', amor:'amor', patrias:'patrias'};
const _geS=getEvents;
getEvents=function(){
  const d=new Date();
  let ev=_geS().filter(e=>!/Día de la Madre/.test(e.name)); // venía con fecha fija equivocada
  const ex=extraSpecial(d);
  if(ex) ev.unshift({id:'ex-'+ex.id+'-'+d.getFullYear(), name:ex.cop+' '+ex.name, desc:ex.msgs[0], reward:ex.cop});
  const our=specialToday(d);
  if(our) ev.unshift({id:'our-'+fmtDay(d), name:our.emoji+' '+our.title, desc:'Un día especial para ustedes: lee unas paginitas y deja una frase bonita en el diario 💗', reward:'💗'});
  const t=SEASON_THEME[(seasonNow||currentSeason()).id], fab=FABRIC_FOR_SEASON[t];
  if(fab) ev.push({id:'season-'+t+'-'+d.getFullYear(), name:'👗 Evento de temporada: '+FABRICS[fab].n, desc:'Lee 20 páginas durante esta temporada y gana una tela exclusiva para tu libro.', reward:'fabric:'+fab,
    label:'🧵 '+FABRICS[fab].n, need:()=>{ const keys=Object.keys(state.pageLog||{}).filter(k=>k>=fmtDay(new Date(d.getFullYear(), d.getMonth()-1, 1))); return keys.reduce((a,k)=>a+state.pageLog[k],0)>=20; }});
  const nx=upcomingDates(3).find(u=>u.s.grand);
  if(nx) ev.push({id:'cd-'+fmtDay(nx.d), name:'⏳ Cuenta regresiva', desc:'Faltan '+nx.k+' día(s) para '+nx.s.title.replace(/^¡|!$/g,'')+' '+nx.s.emoji, reward:null});
  if(d.getMonth()===11 && d.getDate()<24) ev.push({id:'cd-navidad', name:'🎄 Adviento lector', desc:'Faltan '+(24-d.getDate())+' días para Navidad: lee una paginita cada día como un calendario de adviento 🎁', reward:null});
  return ev;
};
openEvents=function(){
  closeBuddy();
  const list=document.getElementById('evList'); list.innerHTML='';
  getEvents().forEach(e=>{
    const done=claimed[e.id];
    const c=document.createElement('div'); c.className='diary-entry';
    const can=!e.need || e.need();
    c.innerHTML='<div style="font-family:var(--disp); font-weight:700">'+esc(e.name)+'</div>'
      +'<div style="font-size:12.5px; margin:3px 0 6px">'+esc(e.desc)+'</div>'
      +(e.reward?'<button class="btn rose small" '+(done||!can?'disabled style="opacity:.55"':'')+'>'+(done?'Reclamado 💗':!can?'Aún no… '+(e.label||e.reward):'Reclamar '+(e.label||e.reward)+' 🎁')+'</button>':'');
    const b=c.querySelector('button');
    if(b) b.onclick=()=>{
      if(claimed[e.id] || (e.need && !e.need())) return;
      claimed[e.id]=1; bonusUnlocks.add(e.reward); unlockedCount++;
      state.c.events=(state.c.events||0)+1; checkAch(); scheduleSave();
      toast('«🎁 ¡'+esc(e.label||e.reward)+' desbloqueado! Ya te espera en el Vestidor 👗»');
      openEvents();
    };
    list.appendChild(c);
  });
  document.getElementById('eventsOv').classList.add('show');
};
