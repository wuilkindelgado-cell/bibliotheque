/* v1.7: abrir el libro como un libro real — sale del suelo, crece, la tapa se abre en 3D y aparece el lector;
   al volver a la biblioteca, la tapa se cierra y el libro regresa a su lugar */

function bookOpenOn(){ return settings.bookAnim!==false && !matchMedia('(prefers-reduced-motion: reduce)').matches; }
function coverHTML(b){
  const u=b && b.id && urlMap[b.id+'_cover'];
  return u ? '<img src="'+u+'" alt="">' : '<div class="bo-plain" style="background:linear-gradient(150deg,'+(b&&b.c||'#C27A8C')+',#6b5646)"><span>'+esc(b?b.t:'')+'</span></div>';
}
function bookOverlay(b, r){
  const L=document.createElement('div'); L.className='bo-layer';
  const bk=document.createElement('div'); bk.className='bo-book';
  bk.style.cssText='left:'+r.left+'px; top:'+r.top+'px; width:'+r.width+'px; height:'+r.height+'px';
  bk.innerHTML='<div class="bo-pages"><div class="bo-paper"></div></div>'
    +'<div class="bo-cover"><div class="bo-front">'+coverHTML(b)+'</div><div class="bo-inside"></div></div>'
    +'<div class="bo-spine" style="background:'+(b&&b.c||'#C27A8C')+'"></div>';
  L.appendChild(bk); document.querySelector('.win').appendChild(L);
  return {L, bk, cover:bk.querySelector('.bo-cover')};
}
function centerRect(){
  const w=document.querySelector('.win').getBoundingClientRect();
  const H=Math.min(w.height*.66, 520), W=H*.7;
  return {left:w.left+w.width/2-W/2+60, top:w.top+w.height/2-H/2, width:W, height:H};
}
function moveTo(el, r, ms){ return new Promise(res=>{ el.style.transition='left '+ms+'ms cubic-bezier(.3,.7,.3,1), top '+ms+'ms cubic-bezier(.3,.7,.3,1), width '+ms+'ms cubic-bezier(.3,.7,.3,1), height '+ms+'ms cubic-bezier(.3,.7,.3,1), transform '+ms+'ms';
  requestAnimationFrame(()=>{ el.style.left=r.left+'px'; el.style.top=r.top+'px'; el.style.width=r.width+'px'; el.style.height=r.height+'px'; }); setTimeout(res, ms+20); }); }
function rotateCover(cv, deg, ms){ return new Promise(res=>{ cv.style.transition='transform '+ms+'ms cubic-bezier(.45,.05,.3,1)'; requestAnimationFrame(()=>{ cv.style.transform='rotateY('+deg+'deg)'; }); setTimeout(res, ms+20); }); }
function fadeOut(L, ms){ L.style.transition='opacity '+ms+'ms'; L.style.opacity=0; setTimeout(()=>L.remove(), ms+30); }

let boBusy=false;
const _orfBO=openReaderFor;
openReaderFor=async function(i){
  const b=state.floor[i];
  const el=b && document.querySelector('#floorBooks .fbook[data-id="'+b.id+'"]');
  if(!bookOpenOn() || boBusy || !el || !document.getElementById('v-library').classList.contains('active')) return _orfBO(i);
  boBusy=true;
  const o=bookOverlay(b, el.getBoundingClientRect());
  el.style.visibility='hidden';
  try{
    if(typeof paperSound==='function') setTimeout(paperSound, 520);
    await moveTo(o.bk, centerRect(), 520);
    const opening=_orfBO(i);                 // el lector se prepara detrás mientras la tapa se abre
    await rotateCover(o.cover, -168, 760);
    await opening;
    fadeOut(o.L, 320);
  }catch(e){ o.L.remove(); }
  el.style.visibility='';
  boBusy=false;
};
/* al salir del lector: la tapa se cierra y el libro vuela de vuelta al suelo (o a su estante) */
const _shBO=show;
show=function(id){
  const leaving=document.getElementById('v-reader').classList.contains('active') && id==='v-library' && curBook;
  const b=curBook;
  const r=_shBO(id);
  if(leaving && bookOpenOn() && !boBusy){
    requestAnimationFrame(async ()=>{
      const target=document.querySelector('#floorBooks .fbook[data-id="'+b.id+'"], .spine[data-id="'+b.id+'"]');
      if(!target) return;
      boBusy=true;
      const o=bookOverlay(b, centerRect());
      o.cover.style.transform='rotateY(-168deg)';
      target.style.visibility='hidden';
      try{
        await rotateCover(o.cover, 0, 620);
        if(typeof paperSound==='function') paperSound();
        await moveTo(o.bk, target.getBoundingClientRect(), 520);
      }catch(e){}
      target.style.visibility=''; o.L.remove(); boBusy=false;
    });
  }
  return r;
};
function setBookAnim(v){ settings.bookAnim=!!v; scheduleSave(); }
