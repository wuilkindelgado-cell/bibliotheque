/* v1.2: logros de las novedades */
ACH.push(
 {id:'comic',   e:'🎨', nm:'Lectora de viñetas', st:'Lee un cómic o manga', chk:()=>!!state.c.comic},
 {id:'audio',   e:'🎧', nm:'Oídos de oro', st:'Escucha un audiolibro', chk:()=>(state.audioMin||0)>=5},
 {id:'audio10', e:'🎼', nm:'Diez horas de cuentos', st:'Escucha 10 horas de audiolibros', chk:()=>(state.audioMin||0)>=600},
 {id:'bulk5',   e:'🌧️', nm:'Lluvia de libros', st:'Agrega 5 libros de una sola vez', chk:()=>(state.c.bulk||0)>=5},
 {id:'free',    e:'🕊️', nm:'Lectora libre', st:'Deja un libro sin culpa', chk:()=>(state.c.abandon||0)>=1},
 {id:'wish',    e:'🌠', nm:'Deseo cumplido', st:'Consigue un libro de tu lista de deseos', chk:()=>(state.c.wishGot||0)>=1},
 {id:'goal1',   e:'🏅', nm:'Meta alcanzada', st:'Cumple tu primera meta', chk:()=>(state.c.goals||0)>=1},
 {id:'goal5',   e:'🎖️', nm:'Coleccionista de medallas', st:'Cumple 5 metas', chk:()=>(state.c.goals||0)>=5},
 {id:'album',   e:'📸', nm:'Guardiana de recuerdos', st:'Hojea tu álbum de recuerdos', chk:()=>!!state.c.album},
 {id:'saga1',   e:'🏰', nm:'Saga completa', st:'Termina todos los libros de una saga', chk:()=>{
   const m={}; state.sections.flatMap(s=>s.books).forEach(b=>{ if(b.series&&b.series.name){ const x=m[b.series.name]=m[b.series.name]||{n:0,t:0}; x.n++; x.t=Math.max(x.t,b.series.total||0); } });
   return Object.values(m).some(x=>x.t && x.n>=x.t); }}
);
