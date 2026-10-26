/* v20: lector — gestos táctiles, índice con pestañas y PDF anotado */

/* ---------- pasar página deslizando el dedo (pantallas táctiles) o con el panel táctil ---------- */
function swipeHint(dir){
  let h=document.getElementById('swipeHint'+dir);
  if(!h){ h=document.createElement('div'); h.id='swipeHint'+dir; h.className='swipe-hint '+(dir<0?'l':'r');
    h.textContent=dir<0?'◀':'▶'; document.getElementById('v-reader').appendChild(h); }
  h.classList.add('show'); setTimeout(()=>h.classList.remove('show'), 260);
}
function turnBy(dir){ swipeHint(dir); dir>0 ? nextPage() : prevPage(); }
/* ¿se puede deslizar sin pelear con el scroll horizontal de una página ampliada? */
function canSwipe(sc, dir){
  if(sc.scrollWidth<=sc.clientWidth+2) return true;
  return dir>0 ? sc.scrollLeft+sc.clientWidth>=sc.scrollWidth-2 : sc.scrollLeft<=2;
}
function initSwipe(){
  const sc=document.getElementById('readerPages');
  let st=null;
  sc.addEventListener('pointerdown', e=>{
    if(e.pointerType!=='touch' && e.pointerType!=='pen') return;
    if(e.target.closest('.posit')) return;
    st={x:e.clientX, y:e.clientY, t:Date.now()};
  });
  sc.addEventListener('pointerup', e=>{
    if(!st) return;
    const dx=e.clientX-st.x, dy=e.clientY-st.y, dt=Date.now()-st.t; st=null;
    if(dt>800 || Math.abs(dx)<55 || Math.abs(dx)<Math.abs(dy)*1.4) return;
    if(window.getSelection && !window.getSelection().isCollapsed) return; // estaba seleccionando texto
    const dir=dx<0?1:-1;
    if(canSwipe(sc, dir)) turnBy(dir);
  });
  sc.addEventListener('pointercancel', ()=>{ st=null; });
  /* panel táctil: deslizar con dos dedos hacia los lados */
  let acc=0, lock=0;
  sc.addEventListener('wheel', e=>{
    if(e.ctrlKey) return;
    if(Math.abs(e.deltaX)<=Math.abs(e.deltaY)*1.2){ acc=0; return; }
    if(Date.now()<lock) return;
    acc+=e.deltaX;
    if(Math.abs(acc)>110){
      const dir=acc>0?1:-1; acc=0;
      if(canSwipe(sc, dir)){ lock=Date.now()+650; turnBy(dir); }
    }
  }, {passive:true});
}

/* ---------- índice con pestañas: capítulos · subrayados · posits ---------- */
let idxTab='toc';
const HL_HEX={'hl-gold':'#E3C55C','hl-rose':'#F4CBCC','hl-blue':'#BFD3E2','hl-sage':'#9BA97C'};
async function openIndex(tab){
  if(tab) idxTab=tab;
  const ov=document.getElementById('indexOv');
  const list=document.getElementById('indexList');
  let tabs=document.getElementById('idxTabs');
  if(!tabs){
    tabs=document.createElement('div'); tabs.id='idxTabs'; tabs.className='tabs';
    list.parentNode.insertBefore(tabs, list);
    list.style.maxHeight='52vh';
    ov.querySelector('.frame-card').style.maxWidth='460px';
  }
  tabs.innerHTML='';
  [['toc','📖 Capítulos'],['hl','🖍️ Subrayados'],['pos','🗒️ Posits']].forEach(([k,n])=>{
    const b=document.createElement('button'); b.textContent=n; if(k===idxTab) b.classList.add('on');
    b.onclick=()=>openIndex(k); tabs.appendChild(b);
  });
  if(curBook && curBook.fmt!=='epub' && pdfDoc){
    const ex=document.createElement('button'); ex.textContent='📤 PDF anotado'; ex.title='Guarda una copia del PDF con tus subrayados y posits';
    ex.onclick=exportAnnotatedPdf; tabs.appendChild(ex);
  }
  list.innerHTML='';
  ov.classList.add('show');
  const empty=t=>{ list.innerHTML='<div style="font-style:italic; font-size:13px; color:var(--ink-soft); text-align:center; padding:10px">'+t+'</div>'; };
  const item=(pg, html, onclick, cls)=>{
    const b=document.createElement('button'); b.className='idx-item'+(cls?' '+cls:'');
    b.innerHTML=(pg!=null?'<span class="pg">pág. '+pg+'</span>':'')+'<span>'+html+'</span>';
    b.onclick=()=>{ ov.classList.remove('show'); onclick(); };
    list.appendChild(b);
  };
  if(!curBook){ empty('Abre un libro primero 📖'); return; }
  if(curBook.fmt==='epub'){ epubIndex(idxTab, list, item, empty); return; }
  if(idxTab==='toc'){
    if(!pdfDoc){ empty('Este libro no tiene PDF 📖'); return; }
    list.innerHTML='<div style="font-style:italic; font-size:12.5px; text-align:center">Leyendo el índice… ⏳</div>';
    let outline=null; try{ outline=await pdfDoc.getOutline(); }catch(e){}
    list.innerHTML='';
    if(!outline || !outline.length){ empty('Este PDF no trae índice de capítulos 🥺<br>Usa «ir a…» arriba o la búsqueda 🔎'); return; }
    const walk=async(nodes, lvl)=>{
      for(const n of nodes){
        let pg=null;
        try{
          let dest=n.dest; if(typeof dest==='string') dest=await pdfDoc.getDestination(dest);
          if(Array.isArray(dest) && dest[0]) pg=(typeof dest[0]==='object') ? (await pdfDoc.getPageIndex(dest[0]))+1 : dest[0]+1;
        }catch(e){}
        item(pg, esc(n.title||'—'), ()=>{ if(pg) gotoPage(pg); }, lvl?'lvl'+Math.min(lvl,2):'');
        if(n.items && n.items.length && lvl<2) await walk(n.items, lvl+1);
      }
    };
    await walk(outline, 0);
    return;
  }
  if(idxTab==='hl'){
    const rows=[];
    Object.keys(curBook.hls||{}).forEach(pg=>(curBook.hls[pg]||[]).forEach(r=>rows.push({pg:+pg, r})));
    rows.sort((a,b)=>a.pg-b.pg);
    if(!rows.length){ empty('Aún no hay subrayados en este libro ✍️<br>Selecciona texto y toca 🖍️ Subrayar'); return; }
    rows.forEach(({pg,r})=>item(pg, '<span class="idx-dot" style="display:inline-block; background:'+(HL_HEX[r.c]||'#E3C55C')+'"></span> '+esc(r.q||'(sin texto)'), ()=>gotoPage(pg)));
    return;
  }
  const rows=[];
  Object.keys(curBook.posits||{}).forEach(pg=>(curBook.posits[pg]||[]).forEach(p=>rows.push({pg:+pg, p})));
  rows.sort((a,b)=>a.pg-b.pg);
  if(!rows.length){ empty('Aún no hay posits en este libro 🗒️'); return; }
  rows.forEach(({pg,p})=>item(pg, '🗒️ '+esc(p.t||'(notita vacía)'), ()=>gotoPage(pg)));
}

/* ---------- PDF anotado: subrayados y posits dibujados sobre una copia ---------- */
function positGeom(pd, page){
  const w=page && page.querySelector('.pgwrap'); if(!w) return;
  pd.ox=w.offsetLeft; pd.oy=w.offsetTop; pd.cw=w.offsetWidth; pd.ch=w.offsetHeight;
}
/* Helvetica solo conoce el alfabeto latino básico: emojis y símbolos raros se quitan */
function pdfSafe(s){ return String(s||'').replace(/[‘’]/g,"'").replace(/[“”«»]/g,'"').replace(/[–—]/g,'-').replace(/…/g,'...').replace(/[^\x20-\x7E\xA0-\xFF\n]/g,'').trim(); }
function wrapLines(font, text, size, maxW){
  const out=[];
  String(text).split('\n').forEach(par=>{
    let line='';
    par.split(' ').forEach(w=>{ const t=line?line+' '+w:w;
      if(font.widthOfTextAtSize(t,size)>maxW && line){ out.push(line); line=w; } else line=t; });
    out.push(line);
  });
  return out;
}
async function exportAnnotatedPdf(){
  if(!curBook || !pdfDoc || !window.PDFLib){ toast('«Abre un libro en PDF para exportarlo 📤»'); return; }
  const hls=curBook.hls||{}, pos=curBook.posits||{};
  const nH=Object.values(hls).reduce((a,x)=>a+x.length,0), nP=Object.values(pos).reduce((a,x)=>a+x.filter(p=>p.t).length,0);
  if(!nH && !nP){ toast('«Este libro aún no tiene subrayados ni posits para exportar ✍️»'); return; }
  toast('«Preparando tu PDF anotado… 📤⏳»');
  try{
    const out=await buildAnnotatedPdf();
    const name=fsSafe(curBook.t)+'_anotado.pdf';
    state.c.annpdf=(state.c.annpdf||0)+1; checkAch(); scheduleSave();
    if(window.bibFS && bibFS.saveAs){
      const p=await bibFS.saveAs(name, out.buffer, 'pdf');
      toast(p?'«¡PDF anotado guardado! 📤 Tus subrayados y posits van con él 💗»':'«Exportación cancelada 🕊️»');
    } else {
      const a=document.createElement('a'); a.download=name; a.href=URL.createObjectURL(new Blob([out],{type:'application/pdf'})); a.click();
    }
  }catch(e){ console.error(e); toast('«No pude preparar el PDF anotado 🥺 ('+(e.message||e)+')»'); }
}
async function buildAnnotatedPdf(){
  const hls=curBook.hls||{}, pos=curBook.posits||{};
  {
    const bl=await idbGet('files','f_'+curBook.id+'_pdf');
    const doc=await PDFLib.PDFDocument.load(await bl.arrayBuffer(), {ignoreEncryption:true});
    const font=await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    const bold=await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    const pages=doc.getPages();
    const rgb=PDFLib.rgb;
    const COL={'hl-gold':rgb(.89,.77,.36),'hl-rose':rgb(.96,.6,.65),'hl-blue':rgb(.55,.72,.86),'hl-sage':rgb(.61,.66,.49)};
    /* subrayados: las posiciones del texto se toman de PDF.js y se traducen a rectángulos */
    for(const pg of Object.keys(hls)){
      const recs=hls[pg]; if(!recs.length) continue;
      const pp=pages[pg-1]; if(!pp) continue;
      const tc=await (await pdfDoc.getPage(+pg)).getTextContent();
      const items=tc.items.filter(it=>typeof it.str==='string' && it.str.length>0);
      for(const r of recs){
        let pos0=0;
        for(const it of items){
          const L=it.str.length, s0=pos0, e0=pos0+L; pos0=e0;
          if(e0<=r.a || s0>=r.b) continue;
          const s=Math.max(0,r.a-s0), e=Math.min(L,r.b-s0);
          const [a,b,c,d,x,y]=it.transform;
          const h=Math.hypot(c,d)||Math.abs(d)||10;
          const W=it.width||0;
          pp.drawRectangle({x:x+W*s/L, y:y-h*.22, width:Math.max(1,W*(e-s)/L), height:h*1.12,
            color:COL[r.c]||COL['hl-gold'], opacity:.38});
        }
      }
    }
    /* posits: notitas amarillas en su lugar de la página */
    const yellow=rgb(.99,.95,.72), edge=rgb(.85,.76,.37), ink=rgb(.35,.27,.24);
    for(const pg of Object.keys(pos)){
      const pp=pages[pg-1]; if(!pp) continue;
      const {width:PW, height:PH}=pp.getSize();
      for(const p of pos[pg]){
        const txt=pdfSafe(p.t); if(!txt) continue;
        const cw=p.cw||PW, ch=p.ch||PH;
        const fx=Math.max(0, Math.min(1, ((p.x||0)-(p.ox||14))/cw)), fy=Math.max(0, Math.min(1, ((p.y||0)-(p.oy||14))/ch));
        const size=Math.max(6, PW/70), boxW=Math.min(PW*.3, 170);
        const lines=wrapLines(font, txt, size, boxW-10).slice(0,12);
        const boxH=lines.length*size*1.25+10;
        const bx=Math.min(PW-boxW-4, fx*PW), by=Math.max(4, PH-fy*PH-boxH);
        pp.drawRectangle({x:bx, y:by, width:boxW, height:boxH, color:yellow, borderColor:edge, borderWidth:.8, opacity:.95});
        lines.forEach((ln,k)=>pp.drawText(ln, {x:bx+5, y:by+boxH-5-size*(k+1)*1.2+size*.2, size, font, color:ink}));
      }
    }
    /* anexo final: todas las notas y subrayados ordenados por página */
    const add=()=>doc.addPage([595, 842]);
    let pgA=add(), y=800;
    const line=(t, f, sz, col)=>{
      wrapLines(f, t, sz, 515).forEach(l=>{ if(y<50){ pgA=add(); y=800; } pgA.drawText(l,{x:40,y,size:sz,font:f,color:col||ink}); y-=sz*1.45; });
    };
    line(pdfSafe('Mis anotaciones - '+curBook.t), bold, 16); y-=6;
    line(pdfSafe('Bibliotheque Enchantee de '+state.name+' - '+niceDate(fmtDay(new Date()))), font, 9, rgb(.6,.48,.11)); y-=10;
    const all=[];
    Object.keys(hls).forEach(pg=>hls[pg].forEach(r=>all.push({pg:+pg, k:'Subrayado', t:r.q})));
    Object.keys(pos).forEach(pg=>pos[pg].forEach(p=>p.t && all.push({pg:+pg, k:'Posit', t:p.t})));
    all.sort((a,b)=>a.pg-b.pg).forEach(n=>{ line('Pag. '+n.pg+' - '+n.k, bold, 10); line(pdfSafe(n.t)||'-', font, 10); y-=6; });
    return await doc.save();
  }
}
