/* v1.7: «Nuestra historia» — una línea del tiempo con sus fechas, cartas, libros, fotos y metas */
function historiaEvents(){
  const ev=[];
  const add=(iso, e, t, d, img, kind)=>{ if(iso) ev.push({iso, e, t, d:d||'', img:img||null, kind:kind||''}); };
  add('2023-06-13','💍','Aquí empezó todo','El 13 de junio de 2023 comenzó la historia de '+HIM+' y '+HER()+' 💗', null, 'us');
  const now=new Date(), y0=2023;
  for(let y=y0+1;y<=now.getFullYear();y++){ const iso=y+'-06-13'; if(iso<=fmtDay(now)) add(iso,'🎆',(y-y0)+(y-y0===1?' año':' años')+' juntos','Aniversario número '+(y-y0)+' 💍', null, 'us'); }
  for(let y=y0;y<=now.getFullYear();y++){
    if(y+'-05-22'<=fmtDay(now) && y+'-05-22'>='2023-06-13') add(y+'-05-22','🎂','Cumpleaños de '+HIM,'', null, 'us');
    if(y+'-08-26'<=fmtDay(now) && y+'-08-26'>='2023-06-13') add(y+'-08-26','🎂','Cumpleaños de '+HER(),'', null, 'us');
  }
  (state.ourDates||[]).forEach(x=>{ if(x.rep!=='mensual' && x.date<=fmtDay(now)) add(x.date, x.emoji||'💞', x.title, '', null, 'us'); });
  (state.letters||[]).forEach(l=>{ if(l.openedAt) add(fmtDay(new Date(l.openedAt)),'💌','Abriste la carta «'+l.title+'»','de '+(l.from||'Yeri'), null, 'letter'); });
  state.sections.flatMap(s=>s.books).forEach(b=>{ if(b.doneDate) add(b.doneDate,'🏆','Terminaste «'+b.t+'»', (b.review||'').slice(0,140)+(b.faces?' '+faceOf(b.faces):''), urlMap[b.id+'_cover']||null, 'book'); });
  (state.diary||[]).forEach(e=>{ if(e.pid && urlMap['d_'+e.pid]) add(diaryIso(e),'📸','Un recuerdo del diario', e.t, urlMap['d_'+e.pid], 'photo'); });
  (state.goals||[]).forEach(g=>{ if(g.reachedAt) add(fmtDay(new Date(g.reachedAt)),'🏅','Meta cumplida: '+g.title, g.reward&&g.reward.text?'🎟️ '+g.reward.text:'', null, 'goal'); });
  return ev.sort((a,b)=>b.iso.localeCompare(a.iso));
}
function renderHistoria(){
  const box=document.getElementById('historiaLine'); if(!box) return;
  const ev=historiaEvents();
  const days=Math.floor((isoToDate(fmtDay(new Date()))-isoToDate('2023-06-13'))/864e5);
  let h='<div class="hist-head"><div class="hist-big">'+days.toLocaleString('es-PE')+'</div><div class="lbl">días de historia juntos desde el 13 de junio de 2023 💗</div></div>';
  let year=null;
  ev.forEach((x,i)=>{
    const y=x.iso.slice(0,4);
    if(y!==year){ year=y; h+='<div class="hist-year">'+y+'</div>'; }
    h+='<div class="hist-item '+(i%2?'r':'l')+' k-'+x.kind+'"><div class="hist-dot">'+x.e+'</div><div class="hist-card">'
      +'<div class="hist-date">'+esc(niceDate(x.iso))+'</div><div class="hist-t">'+esc(x.t)+'</div>'
      +(x.d?'<div class="hist-d">'+esc(x.d)+'</div>':'')+(x.img?'<img src="'+x.img+'" alt="">':'')+'</div></div>';
  });
  box.innerHTML=h;
  state.c.historia=1; checkAch(); scheduleSave();
}
ACH.push({id:'historia', e:'💞', nm:'Nuestra historia', st:'Recorre la línea del tiempo de ustedes', chk:()=>!!state.c.historia});
