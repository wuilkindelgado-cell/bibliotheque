/* Temporadas, calendario y rachas */
/* ===== v9: temporadas automáticas según el calendario (rotan todo el año) ===== */
/* ===== v11: calendario peruano — estaciones del hemisferio sur + fiestas del año ===== */
function nthWeekdayDay(y, monthIdx, weekday, n){ // weekday: 0=Dom … 5=Vie; devuelve el día del mes
  const d=new Date(y, monthIdx, 1); let c=0;
  while(true){ if(d.getDay()===weekday){ c++; if(c===n) return d.getDate(); } d.setDate(d.getDate()+1); }
}
function currentSeason(){
  const dt=new Date(), y=dt.getFullYear(), m=dt.getMonth()+1, d=dt.getDate();
  const polloDay=nthWeekdayDay(y, 6, 0, 3);   // 3er domingo de julio
  const lomoDay=nthWeekdayDay(y, 8, 5, 2);    // 2do viernes de septiembre

  /* — DÍAS ÚNICOS — */
  if(m===4 && d===23) return {id:'libro', special:true, name:'DÍA INTERNACIONAL DEL LIBRO', cop:'📖',
    parts:['📚','📖','✨','💛','👑'],
    msg:'🎉📖 ¡¡HOY ES EL DÍA MÁS IMPORTANTE DEL AÑO: EL DÍA DEL LIBRO!! Celebramos a todos mis hermanos… ¡y a MÍ! El salón entero brilla de oro.'};
  if(m===5 && d===1) return {id:'trabajo', name:'Día del Trabajo', cop:'🛠️', parts:['🎈','⭐','🛠️'],
    msg:'Feriado del 1 de mayo 🛠️ descanso merecido… ¡perfecto para leer todo el día!'};
  if(m===6 && d===28) return {id:'ceviche', name:'Día del Ceviche', cop:'🍋', parts:['🍋','🐟','🌶️'],
    msg:'¡Hoy es Día del Ceviche! 🍋🐟 Se lee con cevichito y su cancha, faltaba más.'};
  if(m===7 && d===polloDay) return {id:'pollo', name:'Día del Pollo a la Brasa', cop:'🍗', parts:['🍗','🍟','⭐'],
    msg:'¡Tercer domingo de julio: Día del Pollo a la Brasa! 🍗 Capítulo y mordisco, mordisco y capítulo.'};
  if(m===8 && d===30) return {id:'santarosa', name:'Santa Rosa de Lima', cop:'🌹', parts:['🌹','🕊️','✨'],
    msg:'30 de agosto: Santa Rosa de Lima 🌹 la patrona también amaba los libros.'};
  if(m===9 && d===lomoDay) return {id:'lomo', name:'Día del Lomo Saltado', cop:'🥘', parts:['🥘','🍅','🍟'],
    msg:'¡Segundo viernes de septiembre: Día del Lomo Saltado! 🥘 Que el juguito no toque las páginas jaja.'};

  /* — RANGOS FESTIVOS (prioridad sobre la estación) — */
  if((m===12 && d>=15) || (m===1 && d<=6))
    return {id:'navidad', name:'Navidad y Año Nuevo', cop:'🎄', parts:['❄','✦','🌟'],
      msg:'¡Temporada navideña! 🎄 En estas fechas se come PANETÓN, no torta jaja 🍞✨ y se lee junto al arbolito.'};
  if(m===1 && d>=20)
    return {id:'marinera', name:'Enero, mes de la Marinera (Trujillo)', cop:'💃', parts:['💃','🤍','✨'],
      msg:'¡Trujillo baila! 💃 Mes de la Marinera: pañuelo en alto y libro en la otra mano.'};
  if(m===2 && d<=14)
    return {id:'valentin', name:'San Valentín', cop:'💘', parts:['💗','💞','🌹'],
      msg:'Hay amor en el aire del salón 💘 (yo también cuento como tu valentín, ¿no? 🥺)'};
  if((m===2 && d>=15) || (m===3 && d<=15))
    return {id:'carnaval', name:'Carnavales', cop:'🎭', parts:['🎊','💦','🎭'],
      msg:'¡Carnavales! 🎊💦 Cuidado con los globitos de agua… mis páginas son delicadas.'};
  if((m===3 && d>=16) || (m===4 && d<=15))
    return {id:'ssanta', name:'Semana Santa', cop:'🕊️', parts:['🕊️','🕯️','✝️'],
      msg:'Días de Semana Santa 🕊️ el salón se recoge en calma, perfecta para lecturas profundas.'};
  if(m===7 && d>=26 && d<=29)
    return {id:'patrias', name:'Fiestas Patrias', cop:'🎈', parts:['🔴','⚪','🎈'],
      msg:'¡Felices Fiestas Patrias! 🇵🇪🎉 El salón se viste de rojo y blanco.'};
  if((m===7 && d>=10) || (m===8 && d<=5))
    return {id:'schuco', name:'Fiesta patronal de Santiago de Chuco', cop:'🎆', parts:['🎆','🎇','✨'],
      msg:'¡Fiesta en Santiago de Chuco! 🎆 (10 de julio al 5 de agosto) La sierra liberteña celebra… y nosotros leemos de fiesta.'};
  if(m===9 && d>=25)
    return {id:'festprimavera', name:'Festival de la Primavera (Trujillo)', cop:'👑', parts:['🌸','👑','🌼'],
      msg:'¡Festival de la Primavera trujillano! 🌸👑 Reinas, carros alegóricos… y estantes floridos.'};
  if(m===10 && d>=30)
    return {id:'brujitas', name:'Noche de brujitas', cop:'🎃', parts:['🦇','🎃','🕯️'],
      msg:'Buuu… 🎃 noche de brujitas: toca lectura de misterio a la luz de las velas.'};
  if(m===10)
    return {id:'morado', name:'Mes Morado — Señor de los Milagros', cop:'💜', parts:['💜','🟣','🕯️'],
      msg:'Octubre, Mes Morado 💜 el salón se tiñe de fe y turrón de Doña Pepa.'};

  /* — ESTACIONES DEL HEMISFERIO SUR (Perú) — */
  const v=m*100+d;
  if(v>=1221 || v<=320)
    return {id:'verano', name:'Verano peruano', cop:'☀️', parts:['☀️','🍦','🌊'],
      msg:'Verano ☀️ calorcito de enero-marzo: se lee con raspadilla en mano 🍧'};
  if(v<=620)
    return {id:'otono', name:'Otoño dorado', cop:'🍂', parts:['🍂','🍁','✦'],
      msg:'Otoño 🍂 caen las hojitas doradas sobre los estantes.'};
  if(v<=922)
    return {id:'invierno', name:'Invierno de garúa', cop:'☂️', parts:['☁️','💧','🌫️'],
      msg:'Invierno limeño ☂️ garúa afuera, mantita y libro adentro… la estación perfecta del lector.'};
  return {id:'primavera', name:'Primavera rococó', cop:'🌷', parts:['🌷','🌸','💮'],
    msg:'Primavera 🌷 el salón florece de septiembre a diciembre.'};
}
let seasonNow=null, burstTimer=null;
function applySeason(){
  const s=currentSeason(); seasonNow=s;
  document.documentElement.style.setProperty('--cop', '"'+s.cop+'"');
  const btn=document.getElementById('seasonBtn');
  if(btn){ btn.textContent=s.cop; btn.title='Lluvia de temporada: '+s.name+' (5 s)'; }
  if(s.special){
    document.querySelector('.win').classList.add('grandday');
    bonusUnlocks.add('📖');
    seasonBurst(9000, 24);
    setTimeout(()=>toast('«'+s.msg+'»'), 3800);
    setTimeout(()=>toast('«🎁 Por el Día del Libro te regalo el accesorio exclusivo 📖 — ¡solo se consigue HOY! Está en el Vestidor 👗👑»'), 9000);
  } else {
    seasonBurst();
    setTimeout(()=>toast('«'+s.msg+' · Tema: <b>'+s.name+'</b> 🗓️ (toca el '+s.cop+' de arriba para la lluvia de 5 s)»'), 4200);
  }
}
function seasonBurst(dur, count){
  dur=dur||5000; count=count||13;
  const s=seasonNow||currentSeason();
  const layer=document.getElementById('snowLayer');
  clearTimeout(burstTimer);
  layer.innerHTML=''; layer.style.opacity=1;
  for(let i=0;i<count;i++){
    const p=document.createElement('i'); p.textContent=s.parts[i%s.parts.length];
    p.style.left=(Math.random()*100)+'%';
    p.style.animationDuration=(4+Math.random()*3)+'s';
    p.style.animationDelay=(Math.random()*1.5)+'s';
    p.style.fontSize=(9+Math.random()*8)+'px';
    layer.appendChild(p);
  }
  burstTimer=setTimeout(()=>{
    layer.style.opacity=0;
    setTimeout(()=>{ layer.innerHTML=''; }, 950);
  }, dur);
}

/* ===== v9: calendario real + rachas ===== */
function fmtDay(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function seedStreak(){ /* v12: solo datos reales — sin días de demostración */ }
function markReadToday(){
  const t=fmtDay(new Date());
  if(!state.readDays.includes(t)){ state.readDays.push(t); renderCalendar(); updateGoal(); }
}
function streakCount(){
  const set=new Set(state.readDays||[]);
  const d=new Date(); let n=0;
  if(!set.has(fmtDay(d))) d.setDate(d.getDate()-1);
  while(set.has(fmtDay(d))){ n++; d.setDate(d.getDate()-1); }
  return n;
}
function greetStreak(){
  setTimeout(()=>{
    const s=streakCount(), today=(state.readDays||[]).includes(fmtDay(new Date()));
    if(today) toast('«¡Hoy ya leíste! Racha de '+s+' día(s) 🔥 eres imparable, '+state.name+' 👑»');
    else if(s>0) toast('«Llevas '+s+' día(s) de racha 🔥 ¿hoy no deseas leer? 🥺 Con 5 minutitos la salvamos, ¡yo te acompaño! 📖»');
    else toast('«Hoy aún no leemos nada… ¿me abres aunque sea una paginita? Prometo estar interesante 🥺🌹»');
  }, 2300);
}
/* (el calendario vive ahora en calendar-day.js) */

/* ===== Diccionario offline (mock) ===== */
function defWord(w,d){ toast('📖 <b>'+w+'</b>: '+d); }

