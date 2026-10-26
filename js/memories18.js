/* v1.8: planificador de lecturas, respaldo automático semanal y «Nuestro libro del año» imprimible */

/* ---------- planificador ---------- */
function planMonths(){ const out=[], d=new Date(); for(let i=0;i<6;i++){ const x=new Date(d.getFullYear(), d.getMonth()+i, 1); out.push(x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')); } return out; }
function monthName(k){ const t=isoToDate(k+'-01').toLocaleDateString('es-PE',{month:'long', year:'numeric'}); return t.charAt(0).toUpperCase()+t.slice(1); }
function renderPlanner(){
  const box=document.getElementById('plannerBox'); if(!box) return;
  state.plan=state.plan||{};
  const pend=state.floor.filter(b=>!b.done && !b.status);
  const planned=new Set(Object.values(state.plan).flat());
  box.innerHTML='<div class="plan-grid">'+planMonths().map(k=>{
    const ids=(state.plan[k]||[]).filter(id=>findBook(id));
    const items=ids.map(id=>{ const b=findBook(id).b, done=state.sections.some(s=>s.books.includes(b));
      return '<div class="plan-it'+(done?' done':'')+'" data-id="'+id+'" data-k="'+k+'"><span>'+(done?'✅':'📖')+' '+esc(b.t)+'</span><b title="Quitar del plan">✕</b></div>'; }).join('');
    const opts=pend.filter(b=>!planned.has(b.id)).map(b=>'<option value="'+b.id+'">'+esc(b.t)+'</option>').join('');
    return '<div class="plan-month"><div class="plan-h">'+monthName(k)+' <span class="lbl">'+ids.length+' libro(s)</span></div>'+(items||'<div class="lbl" style="font-style:italic">Nada planeado aún 🌱</div>')
      +(opts?'<select data-k="'+k+'" class="plan-add"><option value="">＋ Planear un libro…</option>'+opts+'</select>':'')+'</div>';
  }).join('')+'</div>';
  box.querySelectorAll('.plan-add').forEach(s=>s.onchange=()=>{ if(!s.value) return; (state.plan[s.dataset.k]=state.plan[s.dataset.k]||[]).push(s.value); scheduleSave(); renderPlanner(); state.c.plan=1; checkAch(); });
  box.querySelectorAll('.plan-it b').forEach(x=>x.onclick=()=>{ const it=x.parentNode; state.plan[it.dataset.k]=(state.plan[it.dataset.k]||[]).filter(i=>i!==it.dataset.id); scheduleSave(); renderPlanner(); });
}
/* recordatorio amable del plan del mes (una vez por semana) */
function planNudge(){
  const k=fmtDay(new Date()).slice(0,7), key='plan'+k+'-'+Math.floor(new Date().getDate()/7);
  if(state.celeb[key]) return;
  const ids=((state.plan||{})[k]||[]).filter(id=>{ const l=findBook(id); return l && !state.sections.some(s=>s.books.includes(l.b)); });
  if(!ids.length) return;
  state.celeb[key]=1; scheduleSave();
  setTimeout(()=>buddySay('📅 Este mes planeaste leer: <b>'+ids.map(id=>esc(findBook(id).b.t)).join('</b>, <b>')+'</b>. ¡Vamos que se puede! 💪📚', 10000), 42000);
}

/* ---------- respaldo automático semanal (guarda los últimos 4) ---------- */
async function weeklyBackup(force){
  if(!window.bibFS || !bibFS.saveFile || !window.JSZip) return;
  if(settings.weeklyBackup===false && !force) return;
  const last=state.lastAutoBak||0;
  if(!force && Date.now()-last < 7*864e5) return;
  try{
    const {name, buf}=await buildFullBackup();
    const fname='semanal/'+name.replace('.zip','_auto.zip');
    await bibFS.saveFile('respaldos/'+fname, buf);
    state.lastAutoBak=Date.now();
    state.autoBaks=(state.autoBaks||[]).concat(fname).slice(-8);
    while(state.autoBaks.length>4){ const old=state.autoBaks.shift(); if(bibFS.deleteDir) await bibFS.deleteDir('respaldos/'+old); }
    scheduleSave();
    if(force) toast('«Respaldo guardado en Documentos\\Bibliotheque Enchantee\\respaldos\\semanal 📦💗»');
  }catch(e){ if(force) toast('«No pude hacer el respaldo ahora 🥺»'); }
}

/* ---------- «Nuestro libro del año» (PDF para imprimir) ---------- */
async function yearBook(year){
  const bytes=await yearBookBytes(year); if(!bytes) return;
  year=String(year||new Date().getFullYear());
  state.c.yearbook=1; checkAch(); scheduleSave();
  const name='Nuestro_libro_'+year+'.pdf';
  if(window.bibFS && bibFS.saveAs){ const p=await bibFS.saveAs(name, bytes.buffer, 'pdf'); if(p) toast('«¡Tu libro del año está listo para imprimir! 📖💗»'); }
  else { const a=document.createElement('a'); a.download=name; a.href=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})); a.click(); }
}
async function yearBookBytes(year){
  year=String(year||new Date().getFullYear());
  if(!window.PDFLib){ toast('«No encuentro el motor de PDF 🥺»'); return; }
  toast('«Encuadernando tu libro del año '+year+'… 📖✨ (unos segundos)»');
  const doc=await PDFLib.PDFDocument.create(); doc.registerFontkit && 0;
  /* las páginas se dibujan en un lienzo con las fuentes del salón y se insertan como imagen (así salen las tildes y la caligrafía) */
  const W=1240, H=1754; // A4 a 150 ppp
  const page=async draw=>{ const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d');
    x.fillStyle='#FDF8F1'; x.fillRect(0,0,W,H); frame(x); await draw(x);
    const png=await doc.embedJpg(await (await new Promise(r=>cv.toBlob(r,'image/jpeg',.92))).arrayBuffer());
    const p=doc.addPage([595.28, 841.89]); p.drawImage(png, {x:0, y:0, width:595.28, height:841.89}); };
  const gold='#B08A3A', rose='#C27A8C', ink='#4E3934';
  const frame=x=>{ x.strokeStyle=gold; x.lineWidth=10; x.strokeRect(50,50,W-100,H-100); x.lineWidth=2.5; x.strokeRect(74,74,W-148,H-148); };
  const wrap=(x, t, X, Y, maxW, lh, font, color, maxLines)=>{ x.font=font; x.fillStyle=color; const words=String(t||'').split(/\s+/); let line='', n=0;
    for(const w of words){ const tt=line?line+' '+w:w; if(x.measureText(tt).width>maxW && line){ x.fillText(line,X,Y); Y+=lh; line=w; if(maxLines && ++n>=maxLines-1){ line+='…'; break; } } else line=tt; }
    if(line){ x.fillText(line,X,Y); Y+=lh; } return Y; };
  const img=src=>new Promise(r=>{ if(!src) return r(null); const i=new Image(); i.onload=()=>r(i); i.onerror=()=>r(null); i.src=src; });
  await document.fonts.ready;
  const inY=d=>String(d||'').startsWith(year);
  const books=state.sections.flatMap(s=>s.books).filter(b=>inY(b.doneDate)).sort((a,b)=>String(a.doneDate).localeCompare(String(b.doneDate)));
  const diary=(state.diary||[]).filter(e=>inY(diaryIso(e))).sort((a,b)=>String(diaryIso(a)).localeCompare(String(diaryIso(b))));
  const quotes=(state.quotes||[]).filter(q=>!q.d || inY(q.d));
  const letters=(state.letters||[]).filter(l=>l.openedAt && inY(fmtDay(new Date(l.openedAt))));
  const pages=Object.keys(state.pageLog||{}).filter(inY).reduce((a,k)=>a+state.pageLog[k],0);
  // portada
  await page(async x=>{ x.textAlign='center';
    x.fillStyle=rose; x.font='130px "Pinyon Script", cursive'; x.fillText('Nuestro libro', W/2, 560);
    x.fillStyle=gold; x.font='700 120px "Cormorant Garamond", serif'; x.fillText(year, W/2, 720);
    x.fillStyle=ink; x.font='italic 40px "Cormorant Garamond", serif'; x.fillText('Bibliothèque Enchantée de '+state.name, W/2, 820);
    x.font='34px Lora, serif'; x.fillText(books.length+' libros · '+pages.toLocaleString('es-PE')+' páginas · '+diary.length+' páginas de diario', W/2, 900);
    x.font='60px "Pinyon Script", cursive'; x.fillStyle=rose; x.fillText('Con amor, de '+HIM+' para '+HER(), W/2, 1400); });
  // libros del año (4 por página)
  for(let i=0;i<books.length;i+=4){ const grp=books.slice(i,i+4);
    await page(async x=>{ x.textAlign='left'; x.fillStyle=rose; x.font='80px "Pinyon Script", cursive'; x.fillText(i?'Mis libros (cont.)':'Los libros de mi año', 130, 210);
      let y=300;
      for(const b of grp){ const c=await img(urlMap[b.id+'_cover']);
        if(c){ const h=280, w=c.width/c.height*h; x.drawImage(c, 130, y, Math.min(w,200), h); x.strokeStyle=gold; x.lineWidth=3; x.strokeRect(130,y,Math.min(w,200),h); }
        else { x.fillStyle=b.c||'#C27A8C'; x.fillRect(130,y,190,280); }
        let ty=wrap(x, b.t, 370, y+50, 720, 54, '700 46px "Cormorant Garamond", serif', ink, 2);
        x.font='30px Lora, serif'; x.fillStyle='#866C64'; x.fillText((b.author?b.author+' · ':'')+'terminado el '+niceDate(b.doneDate)+'  '+faceOf(b.faces), 370, ty+4); ty+=50;
        if(b.review) ty=wrap(x, '« '+b.review+' »', 370, ty, 720, 42, '36px Caveat, cursive', ink, 3);
        if(b.favPart) wrap(x, 'Parte favorita: '+b.favPart, 370, ty, 720, 36, 'italic 28px Lora, serif', '#866C64', 2);
        y+=340; } }); }
  // diario con fotos (3 por página)
  for(let i=0;i<diary.length;i+=3){ const grp=diary.slice(i,i+3);
    await page(async x=>{ x.textAlign='left'; x.fillStyle=rose; x.font='80px "Pinyon Script", cursive'; x.fillText('Diario del corazón', 130, 210); let y=290;
      for(const e of grp){ const p=e.pid && await img(urlMap['d_'+e.pid]);
        x.font='italic 30px Lora, serif'; x.fillStyle='#866C64'; x.fillText(niceDate(diaryIso(e))+'  '+(e.f||''), 130, y); y+=20;
        if(p){ const h=300, w=Math.min(500, p.width/p.height*h); x.fillStyle='#fff'; x.fillRect(122,y,w+16,h+16); x.drawImage(p,130,y+8,w,h);
          wrap(x, e.t, 680, y+60, 430, 46, '40px Caveat, cursive', ink, 6); y+=h+70; }
        else y=wrap(x, e.t, 130, y+40, 980, 48, '42px Caveat, cursive', ink, 4)+50; } }); }
  // citas (8 por página)
  for(let i=0;i<quotes.length;i+=8){ const grp=quotes.slice(i,i+8);
    await page(async x=>{ x.textAlign='center'; x.fillStyle=rose; x.font='80px "Pinyon Script", cursive'; x.fillText('Frases que subrayé', W/2, 210); let y=320;
      for(const q of grp){ y=wrap(x, '« '+q.q+' »', W/2, y, 960, 44, 'italic 36px "Cormorant Garamond", serif', ink, 3); x.font='26px Lora, serif'; x.fillStyle='#866C64'; x.fillText(q.bk?'— '+q.bk:'', W/2, y); y+=70; } }); }
  // cartas abiertas
  for(const l of letters){ await page(async x=>{ x.textAlign='left'; x.fillStyle=rose; x.font='70px "Pinyon Script", cursive'; x.fillText(l.title, 130, 220);
    wrap(x, l.body, 130, 330, 980, 54, '44px Caveat, cursive', ink, 22); x.textAlign='right'; x.font='60px "Pinyon Script", cursive'; x.fillStyle=rose; x.fillText('— '+(l.from||'Yeri'), W-140, H-200); }); }
  // cierre
  await page(async x=>{ x.textAlign='center'; x.fillStyle=rose; x.font='96px "Pinyon Script", cursive'; x.fillText('Fin del '+year+'…', W/2, 760);
    x.fillStyle=ink; x.font='italic 44px "Cormorant Garamond", serif'; x.fillText('…y el comienzo de muchas historias más 💗', W/2, 860); });
  return await doc.save();
}
ACH.push({id:'yearbook', e:'📕', nm:'Encuadernadora', st:'Crea vuestro libro del año', chk:()=>!!state.c.yearbook},
         {id:'plan', e:'📅', nm:'Lectora con plan', st:'Planea un libro en el planificador', chk:()=>!!state.c.plan});
