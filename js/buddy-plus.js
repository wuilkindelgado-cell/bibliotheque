/* v20: el asistente conversa — trivia, primeras frases, ánimo, recuerdos, retos, frases y efemérides */

/* ---------- contenido ---------- */
const BOOK_QUOTES=[
  ['Lo esencial es invisible a los ojos.','Antoine de Saint-Exupéry, El Principito'],
  ['Eres responsable para siempre de lo que has domesticado.','Antoine de Saint-Exupéry, El Principito'],
  ['En un lugar de la Mancha, de cuyo nombre no quiero acordarme…','Miguel de Cervantes, Don Quijote'],
  ['Siempre imaginé que el Paraíso sería algún tipo de biblioteca.','Jorge Luis Borges'],
  ['Que otros se jacten de las páginas que han escrito; a mí me enorgullecen las que he leído.','Jorge Luis Borges, Un lector'],
  ['Hay golpes en la vida, tan fuertes… ¡Yo no sé!','César Vallejo, Los heraldos negros'],
  ['Hay, hermanos, muchísimo que hacer.','César Vallejo'],
  ['Puedo escribir los versos más tristes esta noche.','Pablo Neruda, Poema 20'],
  ['Es tan corto el amor, y es tan largo el olvido.','Pablo Neruda, Poema 20'],
  ['No todos los que vagan están perdidos.','J. R. R. Tolkien, El Señor de los Anillos'],
  ['Todas las familias felices se parecen; cada familia infeliz lo es a su manera.','León Tolstói, Ana Karénina'],
  ['Andábamos sin buscarnos, pero sabiendo que andábamos para encontrarnos.','Julio Cortázar, Rayuela'],
  ['Vine a Comala porque me dijeron que acá vivía mi padre, un tal Pedro Páramo.','Juan Rulfo, Pedro Páramo'],
  ['Caminante, no hay camino, se hace camino al andar.','Antonio Machado'],
  ['La vida no es la que uno vivió, sino la que uno recuerda y cómo la recuerda para contarla.','Gabriel García Márquez, Vivir para contarla'],
  ['Un libro debe ser el hacha que rompa el mar helado que llevamos dentro.','Franz Kafka, carta a Oskar Pollak'],
  ['Los libros son espejos: solo se ve en ellos lo que uno ya lleva dentro.','Carlos Ruiz Zafón, La sombra del viento'],
  ['Cada libro, cada tomo que ves, tiene alma.','Carlos Ruiz Zafón, La sombra del viento'],
  ['De lo que sea que estén hechas nuestras almas, la suya y la mía son iguales.','Emily Brontë, Cumbres borrascosas'],
  ['No tengo miedo de las tormentas, porque estoy aprendiendo a navegar mi barco.','Louisa May Alcott, Mujercitas'],
  ['No vale la pena dejarse llevar por los sueños y olvidarse de vivir.','J. K. Rowling, Harry Potter y la piedra filosofal'],
  ['No puedo volver al ayer, porque entonces era una persona diferente.','Lewis Carroll, Alicia en el País de las Maravillas'],
  ['Qué maravilloso es que nadie necesite esperar ni un solo momento para empezar a mejorar el mundo.','Ana Frank'],
  ['¿Qué es poesía?, dices mientras clavas en mi pupila tu pupila azul. ¡Poesía… eres tú!','Gustavo Adolfo Bécquer, Rima XXI'],
  ['Fue el mejor de los tiempos, fue el peor de los tiempos.','Charles Dickens, Historia de dos ciudades'],
  ['Llamadme Ismael.','Herman Melville, Moby Dick'],
  ['Todo pasa y todo queda, pero lo nuestro es pasar.','Antonio Machado'],
  ['Leer es soñar de la mano ajena.','Fernando Pessoa, Libro del desasosiego'],
  ['Yo soy yo y mi circunstancia.','José Ortega y Gasset'],
  ['Hombres necios que acusáis a la mujer sin razón…','Sor Juana Inés de la Cruz'],
  ['Las cosas tienen vida propia; todo es cuestión de despertarles el ánima.','Gabriel García Márquez, Cien años de soledad'],
  ['La lectura es una amistad.','Marcel Proust, Sobre la lectura']
];

const TRIVIA=[
  {q:'¿Quién escribió «Cien años de soledad»?', o:['Mario Vargas Llosa','Gabriel García Márquez','Julio Cortázar','Isabel Allende'], a:1, x:'Gabo la publicó en 1967 y nació el pueblo de Macondo 🦋'},
  {q:'¿En qué país nació César Vallejo?', o:['Chile','Perú','Ecuador','Bolivia'], a:1, x:'Nació en Santiago de Chuco, La Libertad, en 1892 🇵🇪'},
  {q:'¿Cómo se llama el caballo de Don Quijote?', o:['Babieca','Rocinante','Bucéfalo','Clavileño'], a:1, x:'Rocinante: «rocín antes», un caballo flaquito pero digno 🐴'},
  {q:'¿Quién escribió «Orgullo y prejuicio»?', o:['Charlotte Brontë','Jane Austen','Virginia Woolf','Mary Shelley'], a:1, x:'Jane Austen, en 1813: Lizzy y Darcy para siempre 💌'},
  {q:'¿Qué escritor peruano ganó el Nobel de Literatura en 2010?', o:['Ciro Alegría','José María Arguedas','Mario Vargas Llosa','Alfredo Bryce'], a:2, x:'Mario Vargas Llosa, nacido en Arequipa en 1936 🏅'},
  {q:'¿En qué ciudad vive Sherlock Holmes?', o:['París','Londres','Edimburgo','Dublín'], a:1, x:'En el 221B de Baker Street, Londres 🔍'},
  {q:'¿Cuál es el nombre del colegio de magia de Harry Potter?', o:['Beauxbatons','Durmstrang','Hogwarts','Ilvermorny'], a:2, x:'Hogwarts, con sus escaleras que cambian de lugar ✨'},
  {q:'¿Quién escribió «Los ríos profundos»?', o:['José María Arguedas','Ciro Alegría','Manuel Scorza','Julio Ramón Ribeyro'], a:0, x:'Arguedas, en 1958: el Perú andino contado desde el corazón 🏔️'},
  {q:'¿Qué animal es Moby Dick?', o:['Un tiburón','Un calamar gigante','Una ballena blanca','Una orca'], a:2, x:'Una ballena (cachalote) blanca que obsesiona al capitán Ahab 🐋'},
  {q:'¿Quién escribió «Rayuela»?', o:['Julio Cortázar','Jorge Luis Borges','Ernesto Sabato','Adolfo Bioy Casares'], a:0, x:'Cortázar, en 1963; se puede leer en más de un orden 🎯'},
  {q:'¿Cómo se llama la ciudad imaginaria de «Cien años de soledad»?', o:['Comala','Macondo','Santa María','Yoknapatawpha'], a:1, x:'Macondo; Comala es de Pedro Páramo 😉'},
  {q:'¿Qué autora creó a Hércules Poirot?', o:['Agatha Christie','Dorothy L. Sayers','P. D. James','Patricia Highsmith'], a:0, x:'Agatha Christie, la reina del misterio 🕵️'},
  {q:'¿Quién escribió «Mujercitas»?', o:['Louisa May Alcott','Harriet Beecher Stowe','Jane Austen','Emily Dickinson'], a:0, x:'Louisa May Alcott, en 1868 🌸'},
  {q:'¿Quién escribió «Tradiciones peruanas»?', o:['Abraham Valdelomar','Ricardo Palma','Manuel González Prada','José Santos Chocano'], a:1, x:'Ricardo Palma, que también rescató la Biblioteca Nacional tras la guerra 📚'},
  {q:'¿En qué idioma escribió originalmente Franz Kafka?', o:['Checo','Alemán','Polaco','Húngaro'], a:1, x:'En alemán, aunque vivió en Praga 🪲'},
  {q:'¿Quién escribió «El túnel»?', o:['Ernesto Sabato','Juan Carlos Onetti','Mario Benedetti','Horacio Quiroga'], a:0, x:'Ernesto Sabato, en 1948 🌑'},
  {q:'¿Qué poeta chilena fue la primera persona latinoamericana en ganar el Nobel de Literatura?', o:['Gabriela Mistral','Isabel Allende','Violeta Parra','María Luisa Bombal'], a:0, x:'Gabriela Mistral, en 1945 ✨'},
  {q:'¿Quién escribió «Frankenstein»?', o:['Bram Stoker','Mary Shelley','Edgar Allan Poe','Robert L. Stevenson'], a:1, x:'Mary Shelley, que empezó a escribirla con 18 años ⚡'},
  {q:'¿Cómo se llama el hobbit protagonista de «El hobbit»?', o:['Frodo','Sam','Bilbo','Pippin'], a:2, x:'Bilbo Bolsón; Frodo es su sobrino 💍'},
  {q:'¿Qué escribió el Inca Garcilaso de la Vega?', o:['Comentarios reales','La Araucana','Crónica del Perú','Nueva corónica'], a:0, x:'Los Comentarios reales de los Incas (1609) 🏛️'},
  {q:'¿Quién es el autor de «La ciudad y los perros»?', o:['Mario Vargas Llosa','Alfredo Bryce Echenique','Julio Ramón Ribeyro','Manuel Scorza'], a:0, x:'Vargas Llosa, ambientada en el colegio militar Leoncio Prado 🎖️'},
  {q:'¿Qué novela empieza con «Llamadme Ismael»?', o:['La isla del tesoro','Moby Dick','Robinson Crusoe','El viejo y el mar'], a:1, x:'Moby Dick, de Herman Melville 🌊'},
  {q:'¿Quién escribió «Crimen y castigo»?', o:['Tolstói','Chéjov','Dostoievski','Gógol'], a:2, x:'Fiódor Dostoievski, en 1866 🪓'},
  {q:'¿Quién escribió «La casa de los espíritus»?', o:['Laura Esquivel','Isabel Allende','Ángeles Mastretta','Elena Poniatowska'], a:1, x:'Isabel Allende, en 1982 🏡'},
  {q:'¿Quién escribió «Como agua para chocolate»?', o:['Laura Esquivel','Elena Garro','Rosario Castellanos','Isabel Allende'], a:0, x:'Laura Esquivel: cada capítulo empieza con una receta 🍫'},
  {q:'¿Qué personaje dice «Ser o no ser, esa es la cuestión»?', o:['Macbeth','Hamlet','Otelo','Romeo'], a:1, x:'Hamlet, príncipe de Dinamarca 💀'},
  {q:'¿Qué autor creó a Mafalda?', o:['Quino','Fontanarrosa','Liniers','Caloi'], a:0, x:'Quino, el dibujante argentino Joaquín Salvador Lavado 🥄'},
  {q:'¿Cuál de estos NO es un libro de J. R. R. Tolkien?', o:['El Silmarillion','El hobbit','Las crónicas de Narnia','Los hijos de Húrin'], a:2, x:'Narnia es de C. S. Lewis, gran amigo de Tolkien 🦁'}
];

const FIRST_LINES=[
  {l:'«Muchos años después, frente al pelotón de fusilamiento, el coronel Aureliano Buendía había de recordar aquella tarde remota…»', o:['Cien años de soledad','Pedro Páramo','La casa de los espíritus'], a:0},
  {l:'«En un lugar de la Mancha, de cuyo nombre no quiero acordarme…»', o:['El Lazarillo de Tormes','Don Quijote de la Mancha','La Celestina'], a:1},
  {l:'«Vine a Comala porque me dijeron que acá vivía mi padre…»', o:['El llano en llamas','Pedro Páramo','Aura'], a:1},
  {l:'«Llamadme Ismael.»', o:['Moby Dick','La isla del tesoro','Veinte mil leguas de viaje submarino'], a:0},
  {l:'«Es una verdad universalmente reconocida que un hombre soltero, poseedor de una gran fortuna, necesita una esposa.»', o:['Emma','Orgullo y prejuicio','Jane Eyre'], a:1},
  {l:'«Todas las familias felices se parecen; cada familia infeliz lo es a su manera.»', o:['Guerra y paz','Ana Karénina','Los hermanos Karamázov'], a:1},
  {l:'«Cuando Gregorio Samsa se despertó una mañana después de un sueño intranquilo, se encontró sobre su cama convertido en un monstruoso insecto.»', o:['El proceso','La metamorfosis','El castillo'], a:1},
  {l:'«En un agujero en el suelo vivía un hobbit.»', o:['El hobbit','La comunidad del anillo','El Silmarillion'], a:0},
  {l:'«Fue el mejor de los tiempos, fue el peor de los tiempos…»', o:['Oliver Twist','Grandes esperanzas','Historia de dos ciudades'], a:2},
  {l:'«Era un día luminoso y frío de abril y los relojes daban las trece.»', o:['1984','Un mundo feliz','Fahrenheit 451'], a:0},
  {l:'«Era un placer quemar.»', o:['Fahrenheit 451','1984','Crónicas marcianas'], a:0},
  {l:'«¿Encontraría a la Maga?»', o:['Rayuela','Bestiario','62 Modelo para armar'], a:0},
  {l:'«Cuando yo tenía seis años vi una vez una lámina magnífica en un libro sobre la selva virgen…»', o:['El Principito','Alicia en el País de las Maravillas','Peter Pan'], a:0},
  {l:'«Todos los niños, excepto uno, crecen.»', o:['Peter Pan','Mary Poppins','El jardín secreto'], a:0}
];

const MOODS={
  feliz:{e:'😄', t:'¡Qué lindo! Para un día feliz te va algo luminoso: una comedia romántica, aventuras o un clásico de Austen 💛'},
  triste:{e:'😢', t:'Ven, te abrazo con mis tapitas 🤗 Hoy toca algo que cure: poesía suave, una historia de amistad o una relectura de esas que se sienten como casa.'},
  cansada:{e:'😴', t:'Cuerpito cansado = lectura corta 🍵 Cuentos de Ribeyro, un poemario o 10 paginitas con mantita. Sin presión.'},
  aventurera:{e:'🗺️', t:'¡Vámonos de viaje! Fantasía, misterio o una novela de aventuras de las que no se sueltan 🧭'},
  romantica:{e:'🥰', t:'Mood romántico activado 💌 Algo con suspiros: Jane Austen, Neruda o una historia de amor de esas que duelen bonito.'},
  pensativa:{e:'🤔', t:'Día filosófico 🦢 Ensayo, novela de ideas o poesía de Vallejo: de esas lecturas que te dejan mirando el techo.'},
  ansiosa:{e:'😟', t:'Respira conmigo: 4 segundos dentro, 4 fuera 🌬️ Una lectura conocida y sencilla calma la mente. Prueba 6 minutos y me cuentas.'}
};

const DAILY_CHALLENGES=[
  'Lee 10 páginas sin mirar el celular ni una vez 📵',
  'Subraya la frase más bonita que encuentres hoy 🖍️',
  'Lee en voz alta un párrafo, como si fuera una obra de teatro 🎭',
  'Deja un posit con lo que sentiste en una escena 🗒️',
  'Lee en un lugar distinto de la casa: la ventana, el patio, la cama de lado 🪟',
  'Busca una palabra que no conozcas y mírala en la RAE 📚',
  'Escribe en el diario cómo te imaginas al personaje principal 📔',
  'Lee con los sonidos del salón encendidos: chimenea o lluvia 🔥🌧️',
  'Termina un capítulo completo antes de dormir 🌙',
  'Recomiéndale a alguien un libro que te haya marcado 💌',
  'Haz una tarjeta de cita y compártela 💌',
  'Lee 15 minutos en modo enfoque con tu bebida favorita 🍵',
  'Relee el primer párrafo de tu libro favorito y nota qué sientes ahora 💗',
  'Escoge al azar el próximo libro con mi ayuda 🎲',
  'Lee a la luz del modo noche, como en Versalles 🕯️'
];

const SWEET=[
  n=>'«'+n+', cada vez que abres un libro el salón entero se ilumina 🕯️💗»',
  n=>'«Leer contigo es mi parte favorita del día. Bueno… es mi único día, pero igual 🥹»',
  n=>'«Tu forma de subrayar me dice que tienes un corazón enorme 🖍️💗»',
  n=>'«No importa cuántas páginas leas hoy: ya eres la mejor lectora de este salón 👑»',
  n=>'«Si fueras un libro, serías de esos que se releen toda la vida 📖✨»',
  n=>'«Alguien construyó este salón entero solo para ti. Eso dice mucho de lo especial que eres 🏰💗»',
  n=>'«Descansar también es parte de la historia. Hoy te mereces un capítulo tranquilo ☕»',
  n=>'«'+n+', tus ojos leyendo son mi paisaje favorito 🌷»',
  n=>'«Eres valiente, curiosa y dulce. Tres cualidades de protagonista 🦋»',
  n=>'«Gracias por quedarte conmigo. Un libro sin lectora es solo papel 📜💗»'
];

/* ---------- motor de la conversación ---------- */
let chatBusy=false;
function chatOpen(){
  closeBuddy();
  state.c.chat=(state.c.chat||0)+1; checkAch(); scheduleSave();
  document.getElementById('chatLog').innerHTML='';
  document.getElementById('chatOv').classList.add('show');
  updateChatScore();
  botSay(chatGreeting(), chatMenu);
}
function closeChat(){ document.getElementById('chatOv').classList.remove('show'); }
function updateChatScore(){
  const t=state.c.triviaOk||0, n=state.c.triviaN||0;
  document.getElementById('chatScore').textContent = n ? ('Trivia: '+t+' de '+n+' aciertos 🧠') : 'Elige de qué quieres hablar 💬';
}
function chatPush(cls, html){
  const log=document.getElementById('chatLog');
  const m=document.createElement('div'); m.className='msg '+cls; m.innerHTML=html;
  log.appendChild(m); log.scrollTop=log.scrollHeight;
  return m;
}
function botSay(html, then){
  chatBusy=true; setOpts([]);
  const typing=chatPush('bot typing','escribiendo…');
  setTimeout(()=>{ typing.classList.remove('typing'); typing.innerHTML=html;
    const log=document.getElementById('chatLog'); log.scrollTop=log.scrollHeight;
    chatBusy=false; if(then) then(); }, Math.min(1400, 450+String(html).length*6));
}
function meSay(t){ chatPush('me', esc(t)); }
function setOpts(list){
  const box=document.getElementById('chatOpts'); box.innerHTML='';
  list.forEach(o=>{ const b=document.createElement('button'); b.innerHTML=o.t; if(o.wide) b.className='wide';
    b.onclick=()=>{ if(chatBusy) return; if(o.me!==false) meSay(o.label||b.textContent); o.go(b); }; box.appendChild(b); });
}
function back(){ return {t:'↩️ Otra cosa', wide:true, go:()=>botSay(pick(['¿De qué más hablamos? 💬','¡Me encanta conversar contigo! ¿Qué más? 🎀','Soy todo tapitas para escucharte 📖']), chatMenu)}; }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }

function chatGreeting(){
  const h=new Date().getHours(), n=state.name;
  const g=h<6?'¿Despierta a esta hora, '+n+'? 🌙 Yo tampoco puedo dormir sin ti':
          h<12?'¡Buenos días, '+n+'! ☀️ ¿Ya desayunaste algo rico?':
          h<19?'¡Buenas tardes, '+n+'! ☕ Hora perfecta para un té y unas páginas':
               '¡Buenas noches, '+n+'! 🕯️ El salón está calientito';
  const cur=state.floor.find(b=>b.id===state.lastReadId && !b.done);
  const extra=cur && cur.pagesN ? '<br>Por cierto, vas en la página '+(cur.page||1)+' de <b>'+esc(cur.t)+'</b> ('+Math.round((cur.page||1)/cur.pagesN*100)+'%) 📖' : '';
  return g+extra+'<br>¿De qué quieres hablar?';
}
function chatMenu(){
  const opts=[
    {t:'💭 Mi lectura actual', go:chatReading},
    {t:'🧠 Trivia literaria', go:chatTrivia},
    {t:'📜 ¿De qué libro es esta frase?', go:chatFirstLine},
    {t:'🎭 Recomiéndame según mi ánimo', go:chatMood},
    {t:'🔮 ¿Te acuerdas…?', go:chatMemory},
    {t:'📅 Un día como hoy', go:chatEfemeride},
    {t:'📚 Un dato curioso', go:()=>botSay(factNew(), ()=>setOpts([{t:'📚 ¡Otro!', go:()=>botSay(factNew(), ()=>setOpts([{t:'📚 ¡Otro más!', go:()=>botSay(factNew(), chatMenu)}, back()]))}, back()]))},
    {t:'✒️ Una frase célebre', go:()=>{ const q=pick(BOOK_QUOTES); botSay('«'+esc(q[0])+'»<br><i style="font-size:12px">— '+esc(q[1])+'</i>', ()=>setOpts([{t:'✒️ Otra frase', go:()=>{ const q2=pick(BOOK_QUOTES); botSay('«'+esc(q2[0])+'»<br><i style="font-size:12px">— '+esc(q2[1])+'</i>', chatMenu); }}, back()])); }},
    {t:'🎯 Reto de hoy', go:chatChallenge},
    {t:'💗 Dime algo bonito', go:()=>botSay(pick(SWEET)(state.name), chatMenu)},
    {t:'👋 Hasta luego', wide:true, go:()=>botSay(pick(['¡Aquí te espero! 🎀','Vuelve pronto, te guardo la página 🔖','Un besito de tinta 💋📖']), ()=>setTimeout(closeChat, 1200))}
  ];
  setOpts(opts);
}
function chatReading(){
  const cur=state.floor.find(b=>b.id===state.lastReadId && !b.done) || state.floor.find(b=>!b.done && b.page>1);
  if(!cur){ botSay('Aún no empiezas ningún libro del suelo 🥺 ¿Te ayudo a elegir uno? 🎲', ()=>setOpts([{t:'🎲 ¡Elige tú!', go:()=>{ const p=state.floor.filter(b=>!b.done); botSay(p.length?'El destino dice… <b>'+esc(pick(p).t)+'</b> ✨ ¡Confía en mí!':'El suelo está vacío… ¡agrega un libro nuevo! 📚', chatMenu); }}, back()])); return; }
  const pct=cur.pagesN?Math.round((cur.page||1)/cur.pagesN*100):null;
  const left=cur.pagesN?cur.pagesN-(cur.page||1):null;
  let t='Estás leyendo <b>'+esc(cur.t)+'</b>'+(pct!=null?' y vas en el '+pct+'% 📖':' 📖');
  if(left!=null && left<=15) t+='<br>¡Solo te faltan '+left+' páginas! El sello 🎀 ya está calentando la cera…';
  else if(pct!=null && pct>=50) t+='<br>¡Ya pasaste la mitad! A partir de aquí las historias corren solitas 🏃‍♀️';
  if(cur.expect) t+='<br>Antes de empezar dijiste que esperabas: <i>«'+esc(cur.expect.slice(0,120))+'»</i>';
  t+='<br>¿Cómo lo sientes?';
  botSay(t, ()=>setOpts([
    {t:'😍 ¡Me encanta!', go:()=>botSay(pick(['¡Lo sabía! Se te nota en los subrayados 🖍️💗','¡Ese brillo en tus ojos! Sigue, sigue 🥹','Cuando un libro atrapa así, hay que dejarse llevar ✨']), chatMenu)},
    {t:'🐢 Está lento…', go:()=>botSay('Pasa en las mejores familias ☕ Truco: lee 10 páginas más; si no engancha, está bien darle una pausa y volver después. Los libros saben esperar 💗', chatMenu)},
    {t:'😵 Me confunde', go:()=>botSay('¡Normal! Prueba el 📑 Índice para ubicarte, o anota en un posit quién es quién 🗒️ Releer un párrafo no es retroceder, es entender mejor 💡', chatMenu)},
    {t:'😭 Me hizo llorar', go:()=>botSay('Ay, ven 🤗 Llorar con un libro es señal de un corazón que siente bonito. ¿Me lo cuentas en el diario? 📔', ()=>setOpts([{t:'📔 Ir al diario', go:()=>{ closeChat(); show('v-diary'); }}, back()]))},
    back()
  ]));
}
function chatTrivia(){
  const q=pick(TRIVIA);
  botSay('🧠 '+esc(q.q), ()=>setOpts(q.o.map((o,i)=>({t:esc(o), go:btn=>{
    state.c.triviaN=(state.c.triviaN||0)+1;
    const ok=i===q.a; if(ok) state.c.triviaOk=(state.c.triviaOk||0)+1;
    btn.classList.add(ok?'ok':'bad'); checkAch(); scheduleSave(); updateChatScore();
    botSay((ok?pick(['¡Correcto! 🎉','¡Bravo, genia! 👑','¡Exacto! 🧠✨']):'Casi… era <b>'+esc(q.o[q.a])+'</b> 😉')+'<br>'+esc(q.x),
      ()=>setOpts([{t:'🧠 Otra pregunta', go:chatTrivia}, back()]));
  }}))));
}
function chatFirstLine(){
  const f=pick(FIRST_LINES);
  botSay('📜 '+esc(f.l)+'<br>¿De qué libro es?', ()=>setOpts(f.o.map((o,i)=>({t:esc(o), go:btn=>{
    const ok=i===f.a; btn.classList.add(ok?'ok':'bad');
    state.c.lines=(state.c.lines||0)+(ok?1:0); checkAch(); scheduleSave();
    botSay(ok?'¡Sí! Es <b>'+esc(f.o[f.a])+'</b> 🎉 Tienes oído de lectora':'Era <b>'+esc(f.o[f.a])+'</b> 📖 ¡Ahora ya no se te olvida!', ()=>setOpts([{t:'📜 Otra frase', go:chatFirstLine}, back()]));
  }}))));
}
function chatMood(){
  botSay('¿Cómo te sientes hoy? 💗', ()=>setOpts(Object.keys(MOODS).map(k=>({t:MOODS[k].e+' '+k.charAt(0).toUpperCase()+k.slice(1), go:()=>{
    const pend=state.floor.filter(b=>!b.done);
    const sug=pend.length?'<br>De tu suelo, yo elegiría… <b>'+esc(pick(pend).t)+'</b> 🎲':'';
    state.c.mood=1; checkAch(); scheduleSave();
    botSay(MOODS[k].t+sug, chatMenu);
  }})).concat([back()])));
}
function chatMemory(){
  const pool=[];
  state.sections.flatMap(s=>s.books).forEach(b=>{
    if(b.favPart) pool.push('¿Te acuerdas de <b>'+esc(b.t)+'</b>? Dijiste que tu parte favorita fue: <i>«'+esc(b.favPart.slice(0,160))+'»</i> 🥹');
    if(b.review) pool.push('Sobre <b>'+esc(b.t)+'</b> escribiste: <i>«'+esc(b.review.slice(0,160))+'»</i> '+faceOf(b.faces));
    if(b.doneDate) pool.push('El '+niceDate(b.doneDate)+' terminaste <b>'+esc(b.t)+'</b> '+faceOf(b.faces)+' ¡Qué día tan bonito!');
  });
  (state.quotes||[]).forEach(q=>pool.push('Una vez subrayaste esto'+(q.bk?' en <b>'+esc(q.bk)+'</b>':'')+':<br><i>«'+esc(q.q.slice(0,180))+'»</i> ✒️'));
  (state.diary||[]).forEach(e=>{ if(e.t && e.t!=='(solo un sentimiento)') pool.push('En tu diario, el '+esc(e.d)+', escribiste: <i>«'+esc(e.t.slice(0,160))+'»</i> '+esc(e.f||'💗')); });
  botSay(pool.length?pick(pool):'Aún estamos creando recuerdos juntas 🌱 Cuando termines libros, subrayes y escribas en el diario, yo te los recordaré 💗',
    ()=>setOpts([{t:'🔮 Otro recuerdo', go:chatMemory}, back()]));
}
function chatChallenge(){
  const d=new Date(); const i=(d.getFullYear()*372+d.getMonth()*31+d.getDate())%DAILY_CHALLENGES.length;
  const key='ch'+fmtDay(d), done=!!state.celeb[key];
  botSay('🎯 Reto de hoy:<br><b>'+DAILY_CHALLENGES[i]+'</b>'+(done?'<br>¡Ya lo cumpliste hoy! 🏅':''),
    ()=>setOpts([done?back():{t:'✅ ¡Lo cumplí!', go:()=>{ state.celeb[key]=1; state.c.challenges=(state.c.challenges||0)+1; checkAch(); scheduleSave();
      botSay(pick(['¡Eres increíble! 🏅','¡Reto cumplido! El salón te aplaude 👏','¡Medalla de oro para ti! 🥇']), chatMenu); }}, back()]));
}
function chatEfemeride(){
  const k=String(new Date().getMonth()+1).padStart(2,'0')+'-'+String(new Date().getDate()).padStart(2,'0');
  const e=(window.EFEMERIDES||{})[k];
  botSay(e?'📅 '+esc(e):'📅 Hoy no tengo una efeméride guardada… ¡así que hoy la historia la escribes tú! ✍️', chatMenu);
}

/* ---------- saludo diario con la efeméride (una vez al día) ---------- */
function greetEfemeride(){
  const d=new Date(), key='ef'+fmtDay(d);
  if(state.celeb[key]) return;
  const k=String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const e=(window.EFEMERIDES||{})[k]; if(!e) return;
  state.celeb[key]=1; scheduleSave();
  setTimeout(()=>buddySay('📅 '+esc(e), 12000), 15000);
}
/* datos curiosos extra: los del paquete + los que Yeri escriba en Documentos\Bibliotheque Enchantee\datos_curiosos.txt */
async function loadExtraFacts(){
  const seen=new Set(FACTS);
  (window.EXTRA_FACTS||[]).forEach(f=>{ if(f && !seen.has(f)){ FACTS.push(f); seen.add(f); } });
  try{
    if(window.bibFS && bibFS.readFile){
      const raw=await bibFS.readFile('datos_curiosos.txt');
      if(raw) new TextDecoder().decode(raw).split(/\r?\n/).map(s=>s.trim()).filter(s=>s && !s.startsWith('#')).forEach(f=>{ if(!seen.has(f)){ FACTS.push(f); seen.add(f); } });
      else if(bibFS.saveText) bibFS.saveText('datos_curiosos.txt',
        '# Escribe aquí tus propios datos curiosos, uno por línea.\r\n# El libro del salón los contará junto con los demás.\r\n# Las líneas que empiezan con # se ignoran.\r\n');
    }
  }catch(e){}
}
/* el antiguo «Charlemos un poquito» ahora abre la conversación */
buddyChat=chatOpen;
