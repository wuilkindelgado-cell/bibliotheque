/* Vestidor, desbloqueos, charla, datos curiosos, burbuja, tutorial, eventos y puerta */
/* ===== v8: Vestidor completo con desbloqueos por lectura ===== */
const outfit={head:'🎀', eyes:'', neck:'', hand:''};
const CATALOG={
  head:[{e:'🎀',req:0},{e:'🌹',req:1},{e:'🌷',req:5},{e:'👑',req:10},{e:'👒',req:15},{e:'🎩',req:20},{e:'🦋',req:30},{e:'🍂',req:40},{e:'⭐',req:50},{e:'❄',req:60},{e:'🌙',req:75},{e:'🌸',req:90},{e:'📖',req:100}],
  eyes:[{e:'',req:0},{e:'💖',req:3},{e:'👓',req:12},{e:'🧿',req:25},{e:'🕶️',req:45},{e:'🌟',req:70}],
  neck:[{e:'',req:0},{e:'🌼',req:4},{e:'🧣',req:14},{e:'📿',req:28},{e:'🌺',req:48},{e:'🔔',req:65},{e:'💎',req:85}],
  hand:[{e:'',req:0},{e:'📕',req:1},{e:'🌹',req:6},{e:'☕',req:12},{e:'🍰',req:18},{e:'📜',req:24},{e:'✨',req:35},{e:'🕯️',req:45},{e:'🖼️',req:55},{e:'🎨',req:80}]
};
const SLOTN={head:'Cabecita', eyes:'Carita', neck:'Cuellito', hand:'Manita'};
let bonusUnlocks=new Set(), dressed=false, unlockedCount=0;
function booksRead(){ return state.sections.reduce((a,s)=>a+s.books.length,0); }
function isUnlocked(it){ return booksRead()>=it.req || bonusUnlocks.has(it.e); }
function applyOutfit(){
  document.querySelectorAll('.book-buddy').forEach(b=>{
    const bow=b.querySelector('.bow'); if(bow) bow.textContent=outfit.head;
    ['eyes','neck','hand'].forEach(sl=>{
      let s=b.querySelector('.acc-'+sl);
      if(!s){ s=document.createElement('span'); s.className='acc acc-'+sl; b.appendChild(s); }
      s.textContent=outfit[sl];
    });
  });
}
function openDress(){ closeBuddy(); renderDress(); document.getElementById('dressOv').classList.add('show'); }
function closeDress(){ document.getElementById('dressOv').classList.remove('show'); }
function renderDress(){
  const box=document.getElementById('dressSlots'); box.innerHTML='';
  const lvl=booksRead();
  document.getElementById('dressLvl').textContent='Nivel de lectura: '+lvl+' 📚 — cada libro terminado desbloquea más';
  Object.keys(CATALOG).forEach(slot=>{
    const row=document.createElement('div');
    row.innerHTML='<div style="font-family:var(--disp); font-weight:700; font-size:13.5px; margin:8px 0 4px">🌹 '+SLOTN[slot]+'</div>';
    const opts=document.createElement('div'); opts.style.cssText='display:flex; gap:6px; flex-wrap:wrap';
    CATALOG[slot].forEach(it=>{
      const b=document.createElement('button'); b.className='dressb'+(outfit[slot]===it.e?' sel':'');
      if(isUnlocked(it)){
        b.textContent=it.e||'∅'; b.title=it.e?'':'sin accesorio';
        b.onclick=()=>{ outfit[slot]=it.e; applyOutfit(); renderDress(); scheduleSave();
          if(!dressed){ dressed=true; state.c.dress=1; checkAch(); toast('«¿Qué tal me queda? ✨»'); }
          else toast('«¡Divino! '+(it.e||'al natural')+' me queda precioso 💗»'); };
      } else {
        b.classList.add('lk'); b.textContent='🔒'; b.title='Se desbloquea con '+it.req+' libros leídos';
        b.onclick=()=>toast('«Termina '+(it.req-lvl)+' libro(s) más y '+it.e+' será mío 😉📚»');
      }
      opts.appendChild(b);
    });
    row.appendChild(opts); box.appendChild(row);
  });
}

/* ===== v8: desbloqueos por nivel de lectura ===== */
let lastMilestone=0;
function checkUnlocks(){
  const lvl=booksRead();
  if(lvl<=lastMilestone){ lastMilestone=Math.max(lastMilestone,lvl); return; }
  const news=[];
  Object.keys(CATALOG).forEach(sl=>CATALOG[sl].forEach(it=>{
    if(it.e && it.req>lastMilestone && it.req<=lvl) news.push(it.e);
  }));
  if(news.length){
    unlockedCount+=news.length;
    buddySay('🎁 ¡Nivel de lectura <b>'+lvl+'</b>! Desbloqueaste: <span style="font-size:17px">'+news.join(' ')+'</span><br>¡Mírame en el Vestidor! 👗', 9000);
  }
  if(lvl>=100){ document.querySelector('.win').classList.add('garland');
    buddySay('🌸👑 <b>CIEN LIBROS.</b> Las guirnaldas son tuyas para siempre. Eres leyenda de este salón ✨', 12000); }
  lastMilestone=Math.max(lastMilestone, lvl);
}

/* ===== v8: mensajes espontáneos del libro ===== */
const chatter=[
  ()=>'«'+state.name+', una página más y te dejo descansar… mentira, dos 😌🌹»',
  ()=>{ const p=state.floor.filter(b=>!b.done).length;
    return p ? '«Hay '+p+' librito(s) en el suelo soñando con su estante 🥺»'
             : '«¡El suelo está limpio! ¿Agregamos un tesoro nuevo? 📚✨»'; },
  ()=> new Date().getHours()>=21 ? '«Ya es de noche… ¿leemos a la luz de las velas? 🕯️🌙»'
                                 : '«¿Sabías que hueles a historia por leer? Es un cumplido 🌹»',
  ()=>'«Llevas '+booksRead()+' libros en el estante. Versalles estaría celoso 👑»',
  ()=>'«Si me pones el sombrero 🎩 prometo leer con acento elegante»',
  ()=>'«Psst… revisa los Eventos del salón, preparé algo para hoy 🎪💗»',
  ()=>'«Si pudiera oler, juraría que este salón huele a vainilla y papel antiguo 🍦📜»',
  ()=>'«Hoy me siento particularmente elegante… debe ser el polvo de oro de los estantes ✨»',
  ()=>'«¿Sabes qué combina con tu lectura de hoy? Una mantita y cero prisa 🧸»',
  ()=>'«El calendario dice que hoy es un día perfecto para leer. Bueno… eso dice TODOS los días 😌»',
  ()=>'«A veces espío tus subrayados… tienes un gusto exquisito, lo digo en serio 🖍️»',
  ()=>'«Mi sueño: que llegues a 100 libros y me pongas el 📖 legendario del Vestidor»',
  ()=>'«Un pajarito (yo) me contó que tu racha podría crecer hoy 🔥👀»',
  ()=>'«Versalles tenía 2 000 habitaciones, pero ninguna biblioteca como la tuya 🏰»'
];
/* ===== v13: datos curiosos del mundo de los libros (sin repetirse) ===== */
const FACTS=[
'El Quijote de Cervantes es considerado la primera novela moderna… ¡y la más traducida después de la Biblia! 📜',
'Gabriel García Márquez escribió Cien años de soledad mientras empeñaba hasta la licuadora: vendió más de 50 millones de copias 🦋',
'Jane Austen publicó Orgullo y prejuicio de forma anónima: la portada solo decía «por una dama» 🖋️',
'El Principito está traducido a más de 500 idiomas y dialectos… incluido el quechua: «Quyllur llaqtayuq wawamanta» 🌟',
'Agatha Christie es la novelista más vendida de la historia: unos 2 mil millones de libros 🕵️',
'Tolkien escribió «En un agujero en el suelo vivía un hobbit» en un examen en blanco que estaba corrigiendo 🧙',
'Frankenstein nació de una apuesta entre amigos una noche de tormenta: Mary Shelley tenía solo 18 años ⚡',
'Victor Hugo escribió Los miserables… y su editor le respondió a una consulta con «!». La carta más corta de la historia ❗',
'Drácula de Bram Stoker está escrito solo con cartas, diarios y recortes de periódico 🦇',
'El olor a libro viejo tiene nombre: «biblichor», una mezcla de vainilla y almendra por la descomposición del papel 📖',
'En Islandia existe el «Jólabókaflóð»: regalarse libros en Nochebuena y leer toda la noche con chocolate caliente 🎄',
'La biblioteca de Alejandría llegó a tener unos 700 000 rollos… y prestaba con garantía: se quedaban el original y devolvían la copia 🏛️',
'Roald Dahl escribía en una silla con una tabla, lápices amarillos y chocolate cerca. Siempre 🍫',
'Cien años de soledad casi se llama «La casa». Menos mal que Gabo lo pensó dos veces 🏠',
'El libro más caro jamás vendido es el Códice Leicester de Da Vinci: Bill Gates pagó 30,8 millones de dólares 💰',
'«Serendipia» —encontrar algo maravilloso sin buscarlo— viene de un cuento persa: Los tres príncipes de Serendip ✨',
'Los astronautas del Apolo llevaron microfilms con pasajes de libros… por si acaso 🚀',
'Fahrenheit 451 es la temperatura a la que arde el papel. Bradbury lo escribió en una máquina alquilada por horas 🔥',
'En japonés existe «tsundoku»: comprar libros y dejar que se acumulen sin leerlos. ¿Te suena? 👀',
'Pablo Neruda tenía tres casas llenas de tesoros y caracolas; escribía siempre con tinta verde: el color de la esperanza 🌿',
'Alicia en el País de las Maravillas nació en un paseo en bote, improvisada para tres niñas 🐇',
'Sherlock Holmes jamás dice «Elemental, mi querido Watson» en los libros originales 🔍',
'Cervantes y Shakespeare murieron en abril de 1616… pero no el mismo día: usaban calendarios distintos 🗓️',
'El best-seller instantáneo más antiguo es la Epopeya de Gilgamesh: 4 000 años y sigue en catálogo 🏺',
'La primera novela de la historia la escribió una mujer: Murasaki Shikibu, La historia de Genji, hace mil años 👘',
'Louisa May Alcott escribió Mujercitas en solo 10 semanas… y no quería escribirla 💌',
'Charles Dickens cobraba por entregas: la gente esperaba en los puertos gritando «¿murió la pequeña Nell?» ⚓',
'El récord de velocidad: A la sombra del granado de Tariq Ali se tradujo, imprimió y vendió en menos de 48 horas 🏃',
'Borges fue director de la Biblioteca Nacional argentina… cuando ya estaba ciego. «El paraíso como una biblioteca», decía 🌹',
'Harry Potter fue rechazado por 12 editoriales; la hija de 8 años del editor número 13 pidió leer más ✨',
'Matilda de Roald Dahl leyó todos los libros de la biblioteca infantil a los 4 años. Meta noble 📚',
'Los monjes medievales dibujaban caracoles peleando con caballeros en los márgenes. Nadie sabe bien por qué 🐌',
'El punto y coma más famoso: Orwell lo eliminó por completo en Subir a por aire; luego se arrepintió ✒️',
'Julio Verne describió el submarino, el viaje a la Luna y el periódico digital… en el siglo XIX 🌊',
'La Rayuela de Cortázar se puede leer en dos órdenes distintos… o en el que tú inventes 🎲',
'Un ejemplar de Aves de América de Audubon mide más de un metro de alto: el libro-gigante más caro del mundo 🦅',
'Emily Dickinson escribió casi 1 800 poemas… y publicó menos de 10 en vida, todos anónimos 🕊️',
'El Hobbit se publicó gracias al hijo de 10 años del editor, que cobró un chelín por su reseña favorable 💍',
'Isabel Allende empieza todos sus libros un 8 de enero, el día que comenzó La casa de los espíritus 🏚️',
'«Bookworm» es literal: existen insectos que perforan túneles en los libros antiguos 🐛',
'La palabra escrita más antigua de América está en Perú: los quipus podrían contar historias, no solo números 🪢',
'Vargas Llosa escribió La ciudad y los perros a los 26 años; la quemaron en el patio del colegio Leoncio Prado 🐕',
'César Vallejo publicó Trilce en 1922… y vendió tan poco que regalaba ejemplares. Hoy es leyenda 🖤',
'El realismo mágico nació en América Latina: lo extraordinario contado como si fuera lo más normal del mundo 🌺',
'Don Quijote tiene la primera «fan fiction» de la historia: un tal Avellaneda publicó una segunda parte falsa 🎭',
'Las bibliotecas de Mongolia viajaban en camello; en Colombia, el «Biblioburro» reparte libros en dos burritos 🐫',
'Stephen King tiró Carrie a la basura; su esposa Tabitha la rescató del tacho. Primera novela vendida 🗑️',
'Neruda ganó el Nobel; Borges nunca. Los premios no leen tan bien como nosotros 🏅',
'En la Edad Media los libros se encadenaban a los estantes: eran más valiosos que joyas ⛓️',
'Clarice Lispector escribía con la máquina sobre las rodillas y sus hijos jugando alrededor 🌊',
'Tolstói aprendió a andar en bicicleta a los 67 años, entre Guerra y paz y sus cuentos. Nunca es tarde 🚲',
'La primera imprenta de América del Sur se instaló en Lima en 1584 🇵🇪',
'Saramago escribía dos páginas por día. Ni una más. Así levantó Ensayo sobre la ceguera 👁️',
'Los hermanos Grimm no escribieron para niños: recopilaban folclore. Las versiones dulces vinieron después 🍎',
'«Utopía» significa literalmente «ningún lugar»: Tomás Moro inventó la palabra y el género 🏝️',
'El primer audiolibro apareció en 1932, pensado para veteranos que perdieron la vista en la guerra 🎧',
'Ray Bradbury nunca manejó un auto ni usó computadora… y escribió el futuro 🪐',
'Simone de Beauvoir y Sartre se leían TODO antes de publicar. El mejor club de lectura de dos ☕',
'Mafalda odia la sopa desde 1964 y sigue teniendo razón en casi todo 🥄',
'Un estudio de la U. de Sussex: leer 6 minutos reduce el estrés hasta 68 %. Mejor que el té… casi ☕',
'Leer ficción aumenta la empatía: literalmente entrenas ponerte en zapatos ajenos 👟',
'Las personas que leen antes de dormir concilian el sueño más rápido que las que miran pantallas 🌙',
'Tu cerebro activa las mismas zonas al leer «canela» que al olerla. Los libros huelen por dentro 🍂',
'Releer no es repetir: cada relectura encuentra un libro distinto, porque tú ya no eres la misma 💫',
'Miguel de Cervantes fue esclavo en Argel 5 años e intentó escapar 4 veces antes de escribir el Quijote ⛓️',
'Sor Juana Inés de la Cruz aprendió a leer a los 3 años a escondidas… y llegó a tener 4 000 libros 👑',
'J.K. Rowling escribía en cafeterías porque pasear al bebé en el coche lo dormía ☕',
'Kafka pidió que quemaran TODOS sus manuscritos al morir. Su amigo Max Brod desobedeció… por suerte 🔥',
'La Odisea se transmitió de memoria durante siglos antes de escribirse: los aedos eran bibliotecas humanas 🎭',
'Un «incunable» es un libro impreso antes de 1501: quedan unos 500 000 en el mundo 🏺',
'Agatha Christie desapareció 11 días en 1926 y jamás explicó dónde estuvo. Su mejor misterio 🚗',
'Pedro Páramo de Juan Rulfo influyó tanto en García Márquez que podía recitarlo de memoria 🌵',
'Ray Bradbury escribió Fahrenheit 451 en 9 días, con monedas, en una máquina alquilada de la biblioteca 🪙',
'El ajedrez de «A través del espejo» es una partida real que puede jugarse movimiento a movimiento ♟️',
'Julio Verne discutió tanto el final de 20 000 leguas con su editor que el Nautilus tiene dos destinos posibles 🐙',
'A Mario Vargas Llosa la llamada del Nobel lo despertó a las 5 a.m. en Nueva York, en 2010 ☎️',
'Ribeyro escribía sus «Prosas apátridas» en servilletas y sobres: la literatura cabe en cualquier papel ✉️',
'El haiku perfecto tiene 17 sílabas… y Borges decía que toda su obra buscaba caber en una 🍃',
'María Moliner escribió SOLA un diccionario entero del español, ficha por ficha, en su casa 📇',
'Los «cadáveres exquisitos» surrealistas: escribir entre varios sin ver lo del otro. ¡Juega con tus amigas! 🎲',
'Rayuela tiene un capítulo (el 34) que se lee salteando líneas: dos textos trenzados en uno 🧬',
'El Aleph de Borges cabe en 3 centímetros… y contiene el universo entero 🌌',
'Neruda compró su casa de Isla Negra por sus vistas al mar… sin saber nadar 🌊',
'El primer libro impreso con tipos móviles en Europa fue la Biblia de Gutenberg: 180 copias, 1455 🖨️',
'Existen «bibliotecas humanas» donde en vez de libros… prestas personas que te cuentan su historia 🫂',
'El libro más pequeño del mundo mide 0,07 mm: se lee con microscopio electrónico 🔬',
'Tolstói reescribió Guerra y paz 7 veces. Su esposa Sofía lo copió a mano TODAS las veces ✍️',
'Un lector promedio lee 200-250 palabras por minuto; con práctica se puede volar mucho más 🕊️',
'Las novelas de caballería que enloquecieron al Quijote existieron de verdad: eran los bestsellers del 1500 🗡️',
'Julieta tiene 13 años en la obra de Shakespeare. Los clásicos siempre sorprenden al releerlos 🎭',
'«Best seller» nació en 1889 en un periódico de Kansas… y cambió las librerías para siempre 📈',
'Los papiros carbonizados por el Vesubio se están leyendo HOY con inteligencia artificial 🌋',
'«Los ríos profundos» de Arguedas canta al Perú andino como ningún otro libro 🏔️',
'Blanca Varela, la gran poeta limeña, fue celebrada por Octavio Paz antes que por su propio país 🌊',
'El «efecto Proust»: un olor puede desbloquear recuerdos enteros, como la magdalena de su novela ☕',
'Los vikingos valoraban tanto la poesía que componer un buen verso te hacía famoso por siglos ⚔️',
'Frankenstein no es el monstruo: es el doctor. La criatura nunca recibe nombre 🧟',
'El Principito fue escrito en Nueva York por un piloto en guerra que extrañaba Francia ✈️',
'Moby Dick fue un fracaso en vida de Melville: vendió unas 3 000 copias en 40 años 🐋',
'Orwell eligió «1984» invirtiendo las cifras del año en que terminó el libro: 1948 🕰️',
'Los manuscritos del mar Muerto pasaron 2 000 años en vasijas… los halló un pastor buscando una cabra 🐐',
'Cortázar medía 1,93 m y decía escribir «desde arriba», mirando el mundo con ternura 🐈',
'Gabriela Mistral fue la primera persona de Latinoamérica en ganar el Nobel de Literatura, en 1945 🏅',
'Cervantes terminó el Quijote a los 68 años: nunca es tarde para tu obra maestra 🖋️',
'Simone Weil leía la Ilíada en griego… mientras trabajaba en una fábrica de autos ⚙️',
'Los «marginalia»: Coleridge se hizo famoso por sus notas al margen. ¡Tus posits son tradición literaria! 🗒️',
'Umberto Eco tenía 50 000 libros: «los no leídos valen más — son lo que aún puedo aprender» 🏛️',
'La ciencia lo confirma: leer novelas ejercita la memoria y cuida el cerebro a largo plazo 🧠',
'Leer antes de dormir ayuda a conciliar el sueño mejor que mirar pantallas 🌙',
'Según un estudio de Yale, las personas lectoras viven en promedio casi 2 años más 💗',
'A los 20 minutos de lectura continua, tu cerebro entra en su estado más creativo: el «flow» lector 🌀',
'Escribir a mano lo que lees fija el recuerdo mucho más que solo subrayarlo ✍️',
'Los audiolibros activan las mismas zonas cerebrales que leer con los ojos: contar historias es humano 🎧',
'Un capítulo tranquilo reduce el estrés más que muchas otras pausas cortas 😌',
'30 minutos de lectura profunda sin celular equivalen a un spa para la mente 🧖',
'Los clubes de lectura los impulsaron mujeres del siglo XVII cuando les negaban la universidad 💪',
'Tu vocabulario crece ~1 000 palabras al año con solo 20 minutos diarios de lectura 📈',
'El papel de los libros antiguos era de trapos de tela: por eso duran siglos más que el moderno 🧵',
'«Grimorio» viene de «gramática»: saber leer parecía magia… y sinceramente, lo sigue siendo ✨',
'Las novelas por entregas costaban un penique: así leyó a Dickens la clase obrera entera 🪙',
'Hay una novela entera sin la letra E: «La disparition», de Georges Perec 🅰️',
'El récord de lectura en voz alta continua es de 124 horas. Mejor no lo intentamos… 😴',
'Cada libro que terminas cambia físicamente tu cerebro: conexiones nuevas que antes no existían 🌱'
];
function factNew(){
  state.factsSeen=state.factsSeen||[];
  if(state.factsSeen.length>=FACTS.length) state.factsSeen=[];
  const pool=FACTS.map((_,i)=>i).filter(i=>state.factsSeen.indexOf(i)===-1);
  const i=pool[Math.floor(Math.random()*pool.length)];
  state.factsSeen.push(i); scheduleSave();
  return '📚✨ ¿Sabías que…? '+FACTS[i];
}
function bookFact(){
  const pool=[];
  const all=[...state.floor, ...state.sections.flatMap(s=>s.books)];
  all.forEach(b=>{
    if(b.pagesN) pool.push('«Tu <b>'+b.t+'</b> tiene '+b.pagesN+' páginas'+(b.page&&!b.done?(' y ya vas en la '+b.page+' ('+Math.round(b.page/b.pagesN*100)+'%) 📖 ¡sigue!'):' 📖')+'»');
    if(b.snips) b.snips.forEach(sn=>pool.push('«Encontré esta joya en la pág. '+sn.p+' de <b>'+b.t+'</b>: <i>“'+sn.s.slice(0,120)+'”</i> ✨»'));
    if(b.startedDate && !b.done){
      const dd=Math.max(0, Math.round((Date.now()-new Date(b.startedDate+'T12:00').getTime())/86400000));
      if(dd>=2) pool.push('«Llevas '+dd+' días con <b>'+b.t+'</b>… las buenas historias no tienen prisa 🌹»');
    }
    if(b.bookmark) pool.push('«Tu listón dorado 🔖 espera en la página '+b.bookmark+' de <b>'+b.t+'</b>»');
    if(b.mins>=30) pool.push('«Con <b>'+b.t+'</b> ya llevan '+(b.mins<60? b.mins+' minutos':Math.floor(b.mins/60)+' hora(s) y '+(b.mins%60)+' min')+' juntos ⏱️💗»');
    if(b.hls) Object.keys(b.hls).forEach(pg=>(b.hls[pg]||[]).forEach(r=>{
      if(r.q && r.q.length>25) pool.push('«Subrayaste esto en la pág. '+pg+' de <b>'+b.t+'</b>: <i>“'+r.q.slice(0,110)+'”</i> 🖍️ qué buen ojo»');
    }));
    const np=b.posits?Object.values(b.posits).reduce((a,x)=>a+(x?x.length:0),0):0;
    if(np>=3) pool.push('«Ya dejaste '+np+' notitas en <b>'+b.t+'</b> 🗒️ ese libro va a quedar precioso por dentro»');
    if(b.done && b.faces>=4) pool.push('«Recuerdo cuánto te gustó <b>'+b.t+'</b> '+faceOf(b.faces)+' … ¿y si un día lo releemos juntas? ↻»');
    if(b.hasPdf && b.pagesN && b.page && !b.done && b.pagesN-b.page<=15 && b.pagesN-b.page>0)
      pool.push('«¡Solo te faltan '+(b.pagesN-b.page)+' páginas de <b>'+b.t+'</b>! El sello 🎀 ya está calentando la cera roja…»');
  });
  if(!pool.length) return null;
  return pool[Math.floor(Math.random()*pool.length)];
}
/* ===== v14: el libro habla en burbuja, mensajes en cola (uno por uno) ===== */
let sayQ=[], sayT=null;
function placeBubble(){
  const b=document.getElementById('buddyBubble'), el=document.querySelector('.side-buddy'),
        win=document.querySelector('.win');
  if(!b||!el||!win) return;
  requestAnimationFrame(()=>{
    const r=el.getBoundingClientRect(), w=win.getBoundingClientRect(), bw=b.offsetWidth||280;
    let l=r.right-w.left+12; b.classList.remove('flip');
    if(l+bw>w.width-10){ l=r.left-w.left-bw-12; b.classList.add('flip'); }
    b.style.left=Math.max(8,l)+'px';
    b.style.top=Math.max(10, Math.min(w.height-(b.offsetHeight||120)-12, r.top-w.top-6))+'px';
  });
}
function buddySay(html, hold){
  sayQ.push({h:html, hold:hold||8000});
  if(sayQ.length>8) sayQ=sayQ.slice(-8);
  pumpSay();
}
function pumpSay(){
  if(sayT) return;
  const m=sayQ.shift(); if(!m) return;
  const b=document.getElementById('buddyBubble');
  document.getElementById('bubTxt').innerHTML=m.h;
  b.classList.add('show');
  placeBubble();
  sayT=setTimeout(()=>{
    b.classList.remove('show');
    sayT=setTimeout(()=>{ sayT=null; pumpSay(); }, 500);
  }, m.hold);
}
function bubClose(){
  document.getElementById('buddyBubble').classList.remove('show');
  clearTimeout(sayT);
  sayT=setTimeout(()=>{ sayT=null; pumpSay(); }, 250);
}
let chatterInt=null;
function startChatter(){
  chatterInt=setInterval(()=>{
    if(document.querySelector('.ficha-overlay.show')) return;
    if(document.getElementById('saverOv').style.display==='flex') return;
    /* v16: nunca durante la lectura — el libro respeta tu concentración */
    if(document.getElementById('v-reader').classList.contains('active')) return;
    if(!document.getElementById('v-library').classList.contains('active')) return;
    if(sayT || sayQ.length) return; /* no interrumpir lo que ya está contando */
    const r=Math.random();
    if(r<.45){ buddySay(factNew(), 11000); }
    else if(r<.70){ const bf=bookFact(); buddySay(bf||factNew(), 11000); }
    else { buddySay(chatter[Math.floor(Math.random()*chatter.length)](), 8000); }
  }, 45000);
}

/* ===== v8: tutorial guiado por el propio libro ===== */
const TUT=[
  {t:'¡{n}! Soy {f} y este es TU salón 🏛️ Aquí arriba viven los estantes: crea todos los que quieras con el recuadro ➕.', sel:'#wall'},
  {t:'Y este es el suelo 🌸 Los libros nuevos caen aquí… solo suben al estante cuando los TERMINAS. ¡Arrástralos con el mouse!', sel:'.floor'},
  {t:'Con este botón agregas libros 📚 con su título, descripción, PDF, portada e imagen para el suelo. ¡Todo en un solo lugar!', sel:'#nbBtn'},
  {t:'¡Y este de aquí soy yo! 🎀 Tócame cuando quieras: recomiendo lecturas, cuento frases, cuido tu enfoque… ¡y puedes vestirme! 👗', sel:'.side-buddy'},
  {t:'Sonidos REALES de chimenea, tormenta y clavecín 🎶 (y con ➕ agregas los tuyos, faltaba más).', sel:'#sndTitle'},
  {t:'Tu meta del año vive aquí 🎯 tócala para configurarla. Y escucha bien: mientras más leas, más accesorios, temas y sorpresas desbloqueas 🎁 ¡A leer se ha dicho, {n}!', sel:'#gTitle'}
];
let tutStep=0;
function startTutorial(){ tutStep=0; show('v-library'); showTutStep(); }
function showTutStep(){
  document.querySelectorAll('.tut-glow').forEach(e=>e.classList.remove('tut-glow'));
  if(tutStep>=TUT.length){
    document.getElementById('tutOv').classList.remove('show');
    state.c.tut=1; checkAch(); scheduleSave();
    toast('«¡Tutorial completo! 🎓 El salón es todo tuyo, '+state.name+' 💗»');
    return;
  }
  const s=TUT[tutStep];
  document.getElementById('tutTxt').textContent=s.t.replaceAll('{n}',state.name).replaceAll('{f}',state.fav);
  document.getElementById('tutDots').textContent='🌸'.repeat(tutStep+1)+' · '.repeat(TUT.length-tutStep-1);
  const el=document.querySelector(s.sel);
  if(el) el.classList.add('tut-glow');
  positionTut(el);
}
function positionTut(el){
  const card=document.getElementById('tutOv');
  card.classList.add('show');
  const winEl=document.querySelector('.win');
  requestAnimationFrame(()=>{
    const win=winEl.getBoundingClientRect();
    const cw=card.offsetWidth, ch=card.offsetHeight;
    let l=win.width-cw-14, t=win.height-ch-14;
    if(el){
      const r=el.getBoundingClientRect();
      if(r.right-win.left+cw+22 < win.width){ l=r.right-win.left+14; t=r.top-win.top; }          // a la derecha
      else if(r.left-win.left-cw-14 > 0){ l=r.left-win.left-cw-14; t=r.top-win.top; }            // a la izquierda
      else if(r.bottom-win.top+ch+14 < win.height){ l=r.left-win.left; t=r.bottom-win.top+12; }  // debajo
      else { l=r.left-win.left; t=r.top-win.top-ch-12; }                                          // arriba
      l=Math.max(10, Math.min(win.width-cw-10, l));
      t=Math.max(10, Math.min(win.height-ch-10, t));
    }
    card.style.left=l+'px'; card.style.top=t+'px';
  });
}
function tutNext(){ tutStep++; showTutStep(); }
function tutSkip(){ tutStep=TUT.length; showTutStep(); }

/* ===== v8: eventos del salón (los organiza el libro) ===== */
let claimed={};
function getEvents(){
  const d=new Date(), ev=[];
  const themes={
    1:['📖 Lunes de novela','Coloca una novela en su estante y llévate una rosa dorada.','🌹'],
    2:['✒️ Martes de citas','Subraya una frase que te toque el corazón.','👓'],
    3:['☕ Miércoles de té','Completa un modo enfoque de 25 minutos junto a tu taza.','☕'],
    4:['📜 Jueves de pergamino','Escribe una entrada en tu Diario del corazón.','📜'],
    5:['🎻 Viernes de clavecín','Lee con la música del salón encendida.','🔔'],
    6:['🦋 Sábado de mariposas','Relee un capítulo de un viejo amor literario.','🦋'],
    0:['👑 Domingo real','Descansa como la realeza… o adelanta tu meta.','👑']};
  const t=themes[d.getDay()];
  ev.push({id:'dow'+d.getDay()+'-'+fmtDay(d), name:t[0], desc:t[1], reward:t[2]});
  const day13=d.getDate(), mo13=d.getMonth()+1;
  if(mo13===6 && day13===13)
    ev.unshift({id:'anniv'+d.getFullYear(), name:'💍 ¡SU ANIVERSARIO!', desc:'13 de junio, como aquel de 2023 en que todo empezó. Yeri y tú… hoy se celebra A LO GRANDE 🎆✨', reward:'💍'});
  else if(day13===13)
    ev.unshift({id:'mes'+mo13+'-'+d.getFullYear(), name:'💗 Mesaniversario', desc:'Un 13 más juntos desde 2023… el salón huele a rosas. Yeri anda más enamorado que nunca, yo lo sé todo 👀💗', reward:'💗'});
  if(mo13===5 && day13===22)
    ev.unshift({id:'ybday'+d.getFullYear(), name:'🎂💙 Cumpleaños de Yeri', desc:'¡Hoy cumple años el que construyó este salón para ti! Un abracito extra no le caería mal 💙', reward:'💙'});
  if(mo13===8 && day13===26)
    ev.unshift({id:'bday'+d.getFullYear(), name:'🎂 ¡Tu cumpleaños!', desc:'¡El salón entero te canta! Yeri lleva semanas planeando este día 🎈', reward:'🎂'});
  /* v17: fechas señaladas del año */
  const dateSpecials={
    '1-1':['🌅 Año nuevo lector','Estrena el año: abre cualquier libro, aunque sea 5 minutitos.','⭐'],
    '1-6':['👑 Día de Reyes','Regálate a ti misma un libro nuevo al suelo del salón.','👑'],
    '2-14':['💘 San Valentín literario','Subraya la frase más romántica que encuentres hoy.','💘'],
    '3-8':['🌸 Día de la Mujer','Lee unas páginas de una autora que admires.','🌸'],
    '3-21':['🌷 Día de la Poesía','Un poema en voz alta (el botón 🔊 sabe hacerlo).','🌷'],
    '4-23':['🏵️ ¡DÍA MUNDIAL DEL LIBRO!','El día sagrado del salón: lee, subraya, celebra. Hoy todo cuenta doble en el corazón.','🏵️'],
    '5-10':['💐 Día de la Madre (PE)','Una lectura tranquila para el alma… o para compartir.','💐'],
    '7-28':['🎉 ¡Fiestas Patrias!','Celebra al Perú leyendo a Vallejo, Arguedas, Ribeyro o Vargas Llosa.','🎉'],
    '10-31':['🕸️ Velada de sustos','Esta noche toca lectura de misterio a la luz de una velita.','🕸️'],
    '11-1':['🕯️ Día de recogimiento','Una lectura serena y una taza bien caliente.','🕯️'],
    '12-24':['🎄 Jólabókaflóð','Como en Islandia: libro nuevo + chocolate caliente esta Nochebuena.','🎄'],
    '12-31':['🎆 Cierre de capítulo','Última página del año: cuéntale al diario qué libro te marcó.','🎆']
  };
  const dsp=dateSpecials[mo13+'-'+day13];
  if(dsp) ev.unshift({id:'ds'+mo13+'-'+day13+'-'+d.getFullYear(), name:dsp[0], desc:dsp[1], reward:dsp[2]});
  /* v17: reto semanal rotativo */
  const wkPool=[
    ['🏛️ Semana de orden','Reacomoda tus estantes: mueve al menos un lomo a un mejor lugar.','🖼️'],
    ['✍️ Semana escriba','Deja 3 posits nuevos en tu lectura actual.','✍️'],
    ['🎯 Semana constante','Cumple tu meta de páginas 4 días de esta semana.','🔥'],
    ['💌 Semana de cartas','Exporta una cita como tarjeta y compártela con alguien querido.','💌'],
    ['🌙 Semana nocturna','Una noche de esta semana, lee en modo noche a la luz de velas.','🌙'],
    ['🔎 Semana detective','Usa la búsqueda de todo el libro para reencontrar una frase amada.','🔎'],
    ['☕ Semana de té','Dos sesiones de enfoque acompañadas de tu bebida favorita.','☕'],
    ['📔 Semana de diario','Cuéntale al diario cómo te hizo sentir tu lectura… con foto.','📔'],
    ['🎧 Semana de voz','Deja que te lea en voz alta una página entera.','🔊'],
    ['↻ Semana nostálgica','Visita la ficha de un libro terminado y recuérdalo con cariño.','🌹'],
    ['🎨 Semana de estilo','Estrena un accesorio nuevo del Vestidor.','🎨'],
    ['🕰️ Semana madrugadora','Lee unas páginas antes de las 9 a.m. al menos un día.','🕰️']
  ];
  const wk=Math.floor((d-new Date(d.getFullYear(),0,1))/604800000);
  const wp=wkPool[wk%wkPool.length];
  ev.push({id:'wk'+d.getFullYear()+'-'+wk, name:wp[0]+' · reto semanal', desc:wp[1], reward:wp[2]});
  const h=d.getHours();
  if(h<10) ev.push({id:'mor-'+fmtDay(d), name:'☕ Café y capítulos', desc:'La mañana pinta perfecta para 10 paginitas con tu café.', reward:'☕'});
  if(h>=16 && h<19) ev.push({id:'tea-'+fmtDay(d), name:'☕ Té de las cinco', desc:'La hora dorada del salón: 30 minutos de lectura con tacita en mano.', reward:'🖼️'});
  if(h>=21) ev.push({id:'noc-'+fmtDay(d), name:'🌙 Velada nocturna', desc:'Cierra el día entre páginas y velas encendidas.', reward:'🕯️'});
  if(d.getDate()%7===0) ev.push({id:'bal-'+fmtDay(d), name:'🎭 Baile de máscaras', desc:'¡Evento especial! Viste a tu libro de gala y presume tu estante.', reward:'🌸'});
  return ev;
}
function openEvents(){
  closeBuddy();
  const list=document.getElementById('evList'); list.innerHTML='';
  getEvents().forEach(e=>{
    const done=claimed[e.id];
    const c=document.createElement('div'); c.className='diary-entry';
    c.innerHTML='<div style="font-family:var(--disp); font-weight:700">'+e.name+'</div>'+
      '<div style="font-size:12.5px; margin:3px 0 6px">'+e.desc+'</div>'+
      '<button class="btn rose small" '+(done?'disabled style="opacity:.5"':'')+'>'+
      (done?'Reclamado 💗':'Reclamar '+e.reward+' 🎁')+'</button>';
    c.querySelector('button').onclick=()=>{
      if(claimed[e.id]) return;
      claimed[e.id]=1; bonusUnlocks.add(e.reward); unlockedCount++;
      state.c.events=(state.c.events||0)+1; checkAch(); scheduleSave();
      toast('«🎁 ¡'+e.reward+' desbloqueado por el evento! Ya te espera en el Vestidor · Logro: 🎪 Invitada de honor»');
      openEvents();
    };
    list.appendChild(c);
  });
  document.getElementById('eventsOv').classList.add('show');
}
function announceEvents(){
  setTimeout(()=>{
    const e=getEvents()[0];
    toast('«🎪 Evento de hoy: <b>'+e.name+'</b> — tócame y entra a “Eventos del salón” para reclamarlo ✨»');
  }, 9500);
}

/* ===== v6: sonido de puerta ===== */
function doorSound(){
  try{
    ensureAC();
    const t=ac.currentTime;
    const o=ac.createOscillator(); o.type='sawtooth';
    o.frequency.setValueAtTime(160,t); o.frequency.exponentialRampToValueAtTime(70,t+1.1);
    const f=ac.createBiquadFilter(); f.type='bandpass'; f.frequency.value=300; f.Q.value=6;
    const g=ac.createGain(); g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(.06,t+.15);
    g.gain.setValueAtTime(.05,t+.8); g.gain.exponentialRampToValueAtTime(.0001,t+1.15);
    const lfo=ac.createOscillator(); lfo.frequency.value=9;
    const lg=ac.createGain(); lg.gain.value=30; lfo.connect(lg); lg.connect(o.frequency);
    o.connect(f); f.connect(g); g.connect(ac.destination);
    o.start(t); lfo.start(t); o.stop(t+1.2); lfo.stop(t+1.2);
    const th=ac.createOscillator(); th.type='sine'; th.frequency.setValueAtTime(90,t+1.02);
    const tg=ac.createGain(); tg.gain.setValueAtTime(.14,t+1.02); tg.gain.exponentialRampToValueAtTime(.0001,t+1.35);
    th.connect(tg); tg.connect(ac.destination); th.start(t+1.02); th.stop(t+1.4);
  }catch(e){}
}

