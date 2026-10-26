/* v1.4: vestidor rococó — telas, pelucas empolvadas, lunares, encajes y una mascota que acompaña al libro */

/* telas para las tapas del libro */
const FABRICS={
  '':          {n:'Rosa original',        bg:'linear-gradient(160deg,#d998a2,#c47983)'},
  'pompadour': {n:'Rosa Pompadour',       bg:'linear-gradient(160deg,#F2A9B9,#D9798F)'},
  'sevres':    {n:'Celeste de Sèvres',    bg:'linear-gradient(160deg,#9FC6E0,#6E9FC4)'},
  'eau':       {n:'Verde agua',           bg:'linear-gradient(160deg,#B9DCCB,#86B8A2)'},
  'lavande':   {n:'Lavanda',              bg:'linear-gradient(160deg,#CDB8E3,#A68BC8)'},
  'oro':       {n:'Brocado de oro',       bg:'linear-gradient(135deg,#9A782C,#F0DA9C 30%,#C9A04A 55%,#FBEBC0 75%,#A9833A)'},
  'burdeos':   {n:'Terciopelo burdeos',   bg:'radial-gradient(circle at 30% 25%,#B25A6A,#7A2E3E 70%)'},
  'damasco':   {n:'Damasco rosa',         bg:'var(--damask-gold), linear-gradient(160deg,#E7A3B1,#C77D8E)', size:'60px 80px, auto'},
  'toile':     {n:'Toile de Jouy',        bg:'var(--damask), linear-gradient(160deg,#F4F0E6,#E3DCCB)', size:'60px 80px, auto', ink:true},
  'rayas':     {n:'Rayas de bombonera',   bg:'repeating-linear-gradient(90deg,#F7D4DB 0 7px,#FFF6F0 7px 14px)', ink:true},
  'menta':     {n:'Macaron de pistacho',  bg:'linear-gradient(160deg,#D8E7B8,#A9C27E)'},
  'noche':     {n:'Seda de medianoche',   bg:'linear-gradient(160deg,#4D4766,#2E2A40)'}
};
/* pelucas y peinados (dibujados en SVG) */
const WIG_SVG={
  pompadour:'<svg viewBox="0 0 80 46" width="80" height="46"><g fill="#FBF7F2" stroke="#D9CFC4" stroke-width="1"><circle cx="40" cy="16" r="15"/><circle cx="24" cy="24" r="11"/><circle cx="56" cy="24" r="11"/><circle cx="12" cy="34" r="8"/><circle cx="68" cy="34" r="8"/><circle cx="31" cy="9" r="8"/><circle cx="49" cy="9" r="8"/></g><path d="M18 30 q22 -14 44 0" stroke="#E7DCD0" stroke-width="2" fill="none"/></svg>',
  rizos:'<svg viewBox="0 0 80 46" width="80" height="46"><g fill="#F6EEE4" stroke="#D9CFC4" stroke-width="1"><ellipse cx="40" cy="20" rx="30" ry="12"/><circle cx="9" cy="32" r="6"/><circle cx="9" cy="42" r="5"/><circle cx="71" cy="32" r="6"/><circle cx="71" cy="42" r="5"/></g></svg>',
  rosada:'<svg viewBox="0 0 80 46" width="80" height="46"><g fill="#F8D3DA" stroke="#D9A0AC" stroke-width="1"><circle cx="40" cy="15" r="14"/><circle cx="25" cy="24" r="10"/><circle cx="55" cy="24" r="10"/><circle cx="33" cy="7" r="7"/><circle cx="47" cy="7" r="7"/></g><circle cx="40" cy="4" r="3" fill="#F0DA9C"/></svg>',
  celeste:'<svg viewBox="0 0 80 46" width="80" height="46"><g fill="#D6E8F3" stroke="#9FC0D8" stroke-width="1"><circle cx="40" cy="15" r="14"/><circle cx="25" cy="24" r="10"/><circle cx="55" cy="24" r="10"/><circle cx="14" cy="33" r="7"/><circle cx="66" cy="33" r="7"/></g></svg>',
  dorada:'<svg viewBox="0 0 80 46" width="80" height="46"><g fill="#F3DFA3" stroke="#C9A04A" stroke-width="1"><circle cx="40" cy="16" r="15"/><circle cx="24" cy="25" r="10"/><circle cx="56" cy="25" r="10"/><circle cx="12" cy="35" r="7"/><circle cx="68" cy="35" r="7"/></g></svg>',
  barco:'<svg viewBox="0 0 80 46" width="80" height="46"><g fill="#FBF7F2" stroke="#D9CFC4" stroke-width="1"><circle cx="40" cy="22" r="14"/><circle cx="26" cy="28" r="9"/><circle cx="54" cy="28" r="9"/></g><path d="M22 14 L58 14 L54 4 L26 4 Z" fill="#8FB3D0" stroke="#5E86A8"/><path d="M40 4 L40 -6" stroke="#8A6A28" stroke-width="1.5"/><path d="M40 -6 L48 -2 L40 1" fill="#F3C9CF"/></svg>'
};
const MOUCHES={'':'∅', punto:'●', corazon:'♥', estrella:'★', luna:'☾'};
const COLLAR_SVG={
  encaje:'<svg viewBox="0 0 60 14" width="60" height="14"><g fill="#FFFDF8" stroke="#D9CFC4" stroke-width=".8">'+[0,1,2,3,4,5,6,7,8,9].map(i=>'<circle cx="'+(3+i*6)+'" cy="5" r="4"/>').join('')+'</g><path d="M2 3 H58" stroke="#E7DCD0"/></svg>',
  gorguera:'<svg viewBox="0 0 60 16" width="60" height="16"><g fill="#FFFFFF" stroke="#CFC4B8" stroke-width=".8">'+[0,1,2,3,4,5,6,7].map(i=>'<ellipse cx="'+(4+i*7.4)+'" cy="8" rx="4.2" ry="7"/>').join('')+'</g></svg>',
  perlas:'<svg viewBox="0 0 60 12" width="60" height="12"><g fill="#FBF7F2" stroke="#D9CFC4" stroke-width=".6">'+[0,1,2,3,4,5,6,7,8,9,10].map(i=>'<circle cx="'+(3+i*5.4)+'" cy="'+(4+Math.sin(i/10*Math.PI)*4)+'" r="2.4"/>').join('')+'</g></svg>',
  cinta:'<svg viewBox="0 0 60 14" width="60" height="14"><rect x="4" y="4" width="52" height="5" rx="2" fill="#C27A8C"/><path d="M30 6 l-8 -5 v10 z M30 6 l8 -5 v10 z" fill="#E7A3B1" stroke="#C27A8C" stroke-width=".6"/><circle cx="30" cy="6.5" r="2.4" fill="#F0DA9C"/></svg>'
};
const PETS=['','🐩','🐈','🦜','🐇','🦢','🐿️','🦋','🐦','🐕','🐞','🦔'];

/* catálogo nuevo (el nivel de lectura desbloquea; algunos vienen de regalo desde el inicio) */
const DRESS_EXTRA={
  fabric:[['',0],['pompadour',0],['sevres',0],['eau',1],['lavande',2],['rayas',3],['menta',4],['damasco',6],['toile',8],['burdeos',12],['noche',16],['oro',25]],
  wig:[['',0],['rosada',0],['rizos',1],['celeste',3],['pompadour',5],['dorada',15],['barco',30]],
  mouche:[['',0],['punto',0],['corazon',2],['estrella',7],['luna',10]],
  collar:[['',0],['cinta',0],['encaje',2],['perlas',9],['gorguera',18]],
  pet:PETS.map((p,i)=>[p, [0,0,1,2,3,5,7,9,11,14,18,22][i]||0])
};
const DRESS_NAMES={fabric:'Tela de las tapas', wig:'Peluca empolvada', mouche:'Lunar de belleza', collar:'Encajes y collares', pet:'Mascota del salón'};
['fabric','wig','mouche','collar','pet'].forEach(k=>{ if(!(k in outfit)) outfit[k]=''; });

/* dibujar los nuevos accesorios sobre cada libro-asistente */
const _aoD=applyOutfit;
applyOutfit=function(){
  _aoD();
  document.querySelectorAll('.book-buddy').forEach(b=>{
    const f=FABRICS[outfit.fabric||'']||FABRICS[''];
    b.style.background=f.bg; b.style.backgroundSize=f.size||'';
    b.classList.toggle('light-fabric', !!f.ink);
    const put=(cls, html)=>{ let s=b.querySelector('.'+cls); if(!s){ s=document.createElement('span'); s.className='acc '+cls; b.appendChild(s); } s.innerHTML=html||''; s.style.display=html?'':'none'; };
    put('acc-wig', outfit.wig?WIG_SVG[outfit.wig]:'');
    put('acc-mouche', outfit.mouche?'<i class="mouche m-'+outfit.mouche+'">'+MOUCHES[outfit.mouche]+'</i>':'');
    put('acc-collar', outfit.collar?COLLAR_SVG[outfit.collar]:'');
    put('acc-pet', outfit.pet||'');
  });
};
function dressPreview(slot, v){
  if(slot==='fabric'){ const f=FABRICS[v]; return '<span class="swatch" style="background:'+f.bg+'; background-size:'+(f.size||'auto')+'"></span>'; }
  if(slot==='wig') return v?'<span class="wigp">'+WIG_SVG[v]+'</span>':'∅';
  if(slot==='mouche') return v?'<span style="color:#3B2F2A">'+MOUCHES[v]+'</span>':'∅';
  if(slot==='collar') return v?'<span class="wigp">'+COLLAR_SVG[v]+'</span>':'∅';
  return v||'∅';
}
function dressLabel(slot, v){
  if(slot==='fabric') return FABRICS[v].n;
  if(!v) return 'sin accesorio';
  return {wig:{pompadour:'Pouf a la Pompadour', rizos:'Rizos de corte', rosada:'Peluca rosa', celeste:'Peluca celeste', dorada:'Peluca dorada', barco:'Peinado «La Belle Poule» con barquito'},
    mouche:{punto:'Lunar clásico', corazon:'Lunar de corazón', estrella:'Lunar de estrella', luna:'Lunar de luna'},
    collar:{encaje:'Encaje de Valenciennes', gorguera:'Gorguera', perlas:'Collar de perlas', cinta:'Cinta con lazo'}}[slot]?.[v] || v;
}
const _rdD=renderDress;
renderDress=function(){
  _rdD();
  const box=document.getElementById('dressSlots'), lvl=booksRead();
  Object.keys(DRESS_EXTRA).forEach(slot=>{
    const row=document.createElement('div');
    row.innerHTML='<div style="font-family:var(--disp); font-weight:700; font-size:13.5px; margin:10px 0 4px">✨ '+DRESS_NAMES[slot]+'</div>';
    const opts=document.createElement('div'); opts.style.cssText='display:flex; gap:6px; flex-wrap:wrap';
    DRESS_EXTRA[slot].forEach(([v,req])=>{
      const b=document.createElement('button'); b.className='dressb'+((outfit[slot]||'')===v?' sel':'');
      const ok=lvl>=req || bonusUnlocks.has(slot+':'+v);
      if(ok){
        b.innerHTML=dressPreview(slot, v); b.title=dressLabel(slot, v);
        b.onclick=()=>{ outfit[slot]=v; applyOutfit(); renderDress(); scheduleSave(); state.c.dress=1; state.c.dress14=1; checkAch();
          toast('«'+(v?'¡'+dressLabel(slot, v)+'! Me siento en Versalles 👑':'Al natural, también soy encantador 💗')+'»'); };
      } else {
        b.classList.add('lk'); b.textContent='🔒'; b.title=dressLabel(slot, v)+' · se desbloquea con '+req+' libros leídos';
        b.onclick=()=>toast('«Termina '+(req-lvl)+' libro(s) más y luciré '+dressLabel(slot, v)+' 😉📚»');
      }
      opts.appendChild(b);
    });
    row.appendChild(opts); box.appendChild(row);
  });
};
ACH.push({id:'dress14', e:'👑', nm:'Dama de Versalles', st:'Viste a tu libro con una tela, peluca o mascota rococó', chk:()=>!!state.c.dress14});
