/* v1.2: álbum de recuerdos — un scrapbook por mes con fotos del diario, libros terminados, cartas y citas */

function albumMonths(){
  const m=new Map();
  const add=(iso, kind, item)=>{ if(!iso) return; const k=String(iso).slice(0,7);
    if(!m.has(k)) m.set(k, {photos:[], books:[], letters:[], quotes:[], diary:0}); m.get(k)[kind].push(item); };
  (state.diary||[]).forEach(e=>{ const iso=diaryIso(e); if(iso){ const k=iso.slice(0,7); if(!m.has(k)) m.set(k,{photos:[],books:[],letters:[],quotes:[],diary:0}); m.get(k).diary++; }
    if(e.pid && urlMap['d_'+e.pid]) add(iso, 'photos', e); });
  state.sections.flatMap(s=>s.books).forEach(b=>add(b.doneDate, 'books', b));
  (state.letters||[]).forEach(l=>{ if(l.openedAt) add(fmtDay(new Date(l.openedAt)), 'letters', l); });
  (state.quotes||[]).forEach(q=>add(q.d, 'quotes', q));
  return [...m.entries()].sort((a,b)=>b[0].localeCompare(a[0]));
}
function renderAlbum(){
  const box=document.getElementById('albumPages'); if(!box) return;
  const months=albumMonths();
  box.innerHTML='';
  if(!months.length){
    box.innerHTML='<div class="stat-card" style="text-align:center"><div style="font-size:34px">📸</div><div style="font-family:var(--hand); font-size:19px">Tu álbum se llenará solito con las fotos de tu diario, los libros que termines y las cartas que abras 💗<br>Empieza agregando una foto en el Diario del corazón 📔</div></div>';
    return;
  }
  months.forEach(([k, d])=>{
    const t=isoToDate(k+'-01').toLocaleDateString('es-PE',{month:'long', year:'numeric'});
    const pg=document.createElement('div'); pg.className='album-page';
    let h='<div class="album-h">'+t.charAt(0).toUpperCase()+t.slice(1)+'</div>'
      +'<div class="album-sub">'+[d.photos.length?d.photos.length+' foto(s)':'', d.books.length?d.books.length+' libro(s) terminado(s)':'', d.diary?d.diary+' página(s) de diario':'', d.letters.length?d.letters.length+' carta(s) abierta(s)':''].filter(Boolean).join(' · ')+'</div>'
      +'<div class="album-board">';
    d.photos.forEach((e,i)=>{
      const rot=((i*37)%9)-4;
      h+='<figure class="polaroid" style="transform:rotate('+rot+'deg)" data-pid="'+e.pid+'"><span class="tape"></span><img src="'+urlMap['d_'+e.pid]+'" alt="foto del diario">'
        +'<figcaption>'+esc((e.t||'').slice(0,60))+(e.t&&e.t.length>60?'…':'')+'<br><small>'+esc(niceDate(diaryIso(e),false))+' '+esc(e.f||'')+'</small></figcaption></figure>';
    });
    d.books.forEach((b,i)=>{
      const u=urlMap[b.id+'_cover'];
      h+='<div class="album-book" style="transform:rotate('+(((i*53)%7)-3)+'deg)" title="'+esc(b.t)+'">'
        +(u?'<img src="'+u+'">':'<div class="nb" style="background:linear-gradient(150deg,'+b.c+',#6b5646)">'+esc(b.t)+'</div>')
        +'<span class="ribbon">🏆 '+esc(niceDate(b.doneDate,false))+' '+faceOf(b.faces)+'</span></div>';
    });
    d.letters.forEach(l=>{ h+='<div class="album-letter" title="Carta abierta el '+esc(niceDate(fmtDay(new Date(l.openedAt))))+'">💌<span>'+esc(l.title)+'</span></div>'; });
    if(d.quotes.length){ const q=d.quotes[Math.floor(Math.random()*d.quotes.length)];
      h+='<div class="album-quote">« '+esc(q.q.slice(0,150))+' »'+(q.bk?'<small>— '+esc(q.bk)+'</small>':'')+'</div>'; }
    h+='</div>';
    pg.innerHTML=h;
    pg.querySelectorAll('.polaroid').forEach(f=>f.onclick=()=>albumZoom(f.dataset.pid));
    box.appendChild(pg);
  });
  state.c.album=1; checkAch(); scheduleSave();
}
function albumZoom(pid){
  const e=(state.diary||[]).find(x=>String(x.pid)===String(pid)); if(!e) return;
  let ov=document.getElementById('albumOv');
  if(!ov){ ov=document.createElement('div'); ov.id='albumOv'; ov.className='ficha-overlay'; ov.style.zIndex=72;
    ov.onclick=()=>ov.classList.remove('show'); document.querySelector('.win').appendChild(ov); }
  ov.innerHTML='<figure class="polaroid big"><span class="tape"></span><img src="'+urlMap['d_'+e.pid]+'"><figcaption>'+esc(e.t)+'<br><small>'+esc(niceDate(diaryIso(e)))+' '+esc(e.f||'')+'</small></figcaption></figure>';
  ov.classList.add('show');
}
