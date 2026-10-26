/* v1.7: el libro-asistente cobra vida — parpadea, pasea por la alfombra, se duerme de noche y salta de alegría */

/* paseante: una copia del asistente que camina por la alfombra del salón */
function initWalker(){
  const fl=document.querySelector('#v-library .floor'); if(!fl || document.getElementById('walker')) return;
  const w=document.createElement('div'); w.id='walker'; w.title='¡Hola! Tócame para conversar 💗';
  const src=document.querySelector('.side-buddy .book-buddy');
  w.innerHTML='<div class="walker-body">'+(src?src.outerHTML:'')+'</div><div class="walker-zzz">z<b>z</b><i>Z</i></div><div class="walker-heart">💗</div>';
  w.onclick=()=>{ w.classList.add('wave'); setTimeout(()=>w.classList.remove('wave'), 1200); buddyChat(); };
  fl.appendChild(w);
  applyOutfit();
  walkLoop();
}
let walkT=null;
function walkLoop(){
  const w=document.getElementById('walker'), fl=document.querySelector('#v-library .floor'); if(!w||!fl) return;
  clearTimeout(walkT);
  const sleeping=document.querySelector('.win').classList.contains('buddy-sleep');
  if(!sleeping && document.getElementById('v-library').classList.contains('active')){
    const max=fl.clientWidth-260, cur=parseFloat(w.style.left)||140;
    const to=Math.max(120, Math.min(max, cur+(Math.random()<.5?-1:1)*(80+Math.random()*260)));
    const ms=Math.abs(to-cur)*22;
    w.classList.toggle('flip', to<cur); w.classList.add('walking');
    w.style.transition='left '+ms+'ms linear'; w.style.left=to+'px';
    walkT=setTimeout(()=>{ w.classList.remove('walking');
      if(Math.random()<.35){ w.classList.add('wave'); setTimeout(()=>w.classList.remove('wave'), 1400); }
      walkT=setTimeout(walkLoop, 2500+Math.random()*6000); }, ms);
  } else walkT=setTimeout(walkLoop, 8000);
}
/* sueño: de 11 p. m. a 6 a. m., o tras 4 minutos sin tocar nada */
let lastAct=Date.now();
['pointerdown','keydown','wheel'].forEach(ev=>window.addEventListener(ev, ()=>{ lastAct=Date.now(); wakeBuddy(); }, {passive:true}));
function sleepTick(){
  const h=new Date().getHours(), night=(h>=23||h<6), idle=Date.now()-lastAct>240000;
  const reading=document.getElementById('v-reader').classList.contains('active');
  document.querySelector('.win').classList.toggle('buddy-sleep', (night||idle) && !reading);
}
function wakeBuddy(){ const w=document.querySelector('.win'); if(w.classList.contains('buddy-sleep')){ w.classList.remove('buddy-sleep'); } }
/* saltitos de alegría con logros, metas, cartas y celebraciones */
function buddyJump(){
  document.querySelectorAll('.book-buddy').forEach(b=>{ b.classList.remove('jump'); void b.offsetWidth; b.classList.add('jump'); setTimeout(()=>b.classList.remove('jump'), 1300); });
  const h=document.querySelector('#walker .walker-heart'); if(h){ h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop'); }
}
const _bsA=buddySay;
buddySay=function(html, hold){ if(/🏆|🏅|💌|🎉|🎁|¡Meta|creció/.test(String(html))) buddyJump(); return _bsA(html, hold); };
const _scA=showCeleb; showCeleb=function(s){ buddyJump(); return _scA(s); };
/* al tocar al asistente de la barra lateral, saluda */
document.addEventListener('pointerdown', e=>{ const sb=e.target.closest && e.target.closest('.side-buddy .book-buddy'); if(sb){ sb.classList.add('jump'); setTimeout(()=>sb.classList.remove('jump'), 900); } });
function initBuddyAnim(){ initWalker(); sleepTick(); setInterval(sleepTick, 30000); }
