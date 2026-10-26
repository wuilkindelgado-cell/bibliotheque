/* v1.9: Mi pasión por el Derecho — máxima del día, mi porqué, camino a la toga y cartas por ciclo aprobado */

/* solo frases clásicas de autoría conocida (o principios tradicionales, marcados como tales) */
const LAW_MAXIMS=[
  ['Honeste vivere, alterum non laedere, suum cuique tribuere.','Vivir honestamente, no dañar a otro, dar a cada uno lo suyo.','Ulpiano · Digesto 1.1.10'],
  ['Iustitia est constans et perpetua voluntas ius suum cuique tribuendi.','La justicia es la constante y perpetua voluntad de dar a cada uno su derecho.','Ulpiano · Digesto 1.1.10'],
  ['Ius est ars boni et aequi.','El derecho es el arte de lo bueno y lo equitativo.','Celso, citado por Ulpiano · Digesto 1.1.1'],
  ['Legum servi sumus ut liberi esse possimus.','Somos esclavos de las leyes para poder ser libres.','Cicerón · Pro Cluentio'],
  ['Salus populi suprema lex esto.','Que el bienestar del pueblo sea la ley suprema.','Cicerón · De legibus'],
  ['Pacta sunt servanda.','Los pactos deben cumplirse.','Principio tradicional'],
  ['In dubio pro reo.','En la duda, a favor del reo.','Principio tradicional'],
  ['Audi alteram partem.','Escucha también a la otra parte.','Principio tradicional'],
  ['Nullum crimen, nulla poena sine lege.','No hay delito ni pena sin ley previa.','Principio de legalidad (Feuerbach)'],
  ['Dura lex, sed lex.','La ley es dura, pero es la ley.','Máxima tradicional'],
  ['','La defensa de la persona humana y el respeto de su dignidad son el fin supremo de la sociedad y del Estado.','Constitución Política del Perú · art. 1'],
  ['','El fin del derecho es la paz; el medio para alcanzarlo, la lucha.','Rudolf von Jhering · La lucha por el derecho'],
  ['','Estudia. El derecho se transforma constantemente. Si no sigues sus pasos, serás cada día un poco menos abogado.','Eduardo J. Couture · Mandamientos del abogado'],
  ['','Piensa. El derecho se aprende estudiando, pero se ejerce pensando.','Eduardo J. Couture · Mandamientos del abogado'],
  ['','Lucha. Tu deber es luchar por el derecho; pero el día que encuentres en conflicto el derecho con la justicia, lucha por la justicia.','Eduardo J. Couture · Mandamientos del abogado'],
  ['','Ten paciencia. El tiempo se venga de las cosas que se hacen sin su colaboración.','Eduardo J. Couture · Mandamientos del abogado'],
  ['','Ten fe en el derecho, como el mejor instrumento para la convivencia humana; en la justicia, como destino normal del derecho.','Eduardo J. Couture · Mandamientos del abogado'],
  ['','Ama tu profesión.','Eduardo J. Couture · Mandamientos del abogado'],
  ['','La injusticia en cualquier lugar es una amenaza para la justicia en todas partes.','Martin Luther King Jr. · Carta desde la cárcel de Birmingham'],
  ['','Lucha por las cosas que te importan, pero hazlo de una manera que lleve a otros a unirse a ti.','Ruth Bader Ginsburg']
];
function maximOfDay(){ const d=Math.floor((Date.now()-new Date().getTimezoneOffset()*6e4)/864e5); return LAW_MAXIMS[d%LAW_MAXIMS.length]; }
const LAW_AREAS=['','Derecho Penal','Derecho Civil','Derecho Constitucional','Derechos Humanos','Derecho de Familia','Derecho Laboral','Derecho Ambiental','Derecho Internacional','Derecho Corporativo','Derecho Tributario','Derecho Administrativo','Otra'];
const ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV'];
function lawPath(){ const L=law(); L.path=L.path||{total:12, done:[], grad:'', steps:{}}; return L.path; }
function generalAvg(){ const a=law().courses.map(courseAvg).filter(x=>x!=null); return a.length? a.reduce((s,x)=>s+x,0)/a.length : null; }

function renderPassion(){
  const box=document.getElementById('lawPassion'); if(!box) return;
  const L=law(), P=lawPath(), m=maximOfDay(), avg=generalAvg(), done=P.done.length;
  const days=P.grad ? Math.ceil((isoToDate(P.grad)-isoToDate(fmtDay(new Date())))/864e5) : null;
  box.innerHTML='<div class="lp-maxim">'+(m[0]?'<div class="lp-lat">«'+esc(m[0])+'»</div>':'')+'<div class="lp-es">'+(m[0]?esc(m[1]):'«'+esc(m[1])+'»')+'</div><div class="lbl">— '+esc(m[2])+'</div><div class="lp-tag">⚖️ Máxima del día</div></div>'
    +'<div class="lp-grid"><div class="stat-card lp-why"><div class="adv-h">📜 Mi porqué</div>'
    +'<div class="lbl">¿Por qué elegiste el Derecho? Escríbelo con tus palabras: tu libro-asistente te lo recordará en los días difíciles y antes de tus exámenes 💛</div>'
    +'<textarea id="lpWhy" rows="6" placeholder="Estudio Derecho porque…">'+esc(L.why||'')+'</textarea>'
    +'<label class="fld" style="margin-top:8px">El área que más me apasiona</label><select id="lpArea">'+LAW_AREAS.map(a=>'<option'+(a===(L.area||'')?' selected':'')+' value="'+esc(a)+'">'+(a?esc(a):'— elige —')+'</option>').join('')+'</select></div>'
    +'<div class="stat-card lp-path"><div class="adv-h">🎓 Mi camino a la toga</div>'
    +'<div class="lp-bar"><i style="width:'+Math.round(done/P.total*100)+'%"></i></div><div class="lbl" style="text-align:center">'+done+' de '+P.total+' ciclos aprobados'+(avg!=null?' · promedio general <b>'+avg.toFixed(2)+'</b>':'')+'</div>'
    +'<div class="lp-medals">'+Array.from({length:P.total},(_,i)=>'<button class="lp-medal'+(P.done.includes(i+1)?' on':'')+'" data-c="'+(i+1)+'" title="Ciclo '+ROMAN[i]+(P.done.includes(i+1)?' aprobado ✓':' — tócalo cuando lo apruebes')+'">'+ROMAN[i]+'</button>').join('')+'</div>'
    +'<div class="lp-steps">'+[['bach','🎓 Bachiller'],['titulo','📜 Título de Abogada'],['coleg','🏛️ Colegiatura']].map(([k,n])=>'<label><input type="checkbox" data-s="'+k+'"'+(P.steps[k]?' checked':'')+'> '+n+'</label>').join('')+'</div>'
    +'<div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:8px"><label class="lbl">Ciclos de la carrera</label><input type="number" id="lpTotal" min="6" max="14" value="'+P.total+'" style="width:70px">'
    +'<label class="lbl">Egreso estimado</label><input type="date" id="lpGrad" value="'+esc(P.grad||'')+'" style="width:auto"></div>'
    +(days!=null?'<div class="lp-count">'+(days>0?'⏳ Faltan <b>'+days.toLocaleString('es-PE')+'</b> días para tu egreso':'🎉 ¡Egresaste, Abogada!')+'</div>':'')
    +'</div></div>';
  box.querySelector('#lpWhy').oninput=e=>{ L.why=e.target.value; if(L.why.trim().length>20){ state.c.lawwhy=1; checkAch(); } scheduleSave(); };
  box.querySelector('#lpArea').onchange=e=>{ L.area=e.target.value; scheduleSave(); lawHome(); };
  box.querySelector('#lpTotal').onchange=e=>{ P.total=Math.max(6,Math.min(14,+e.target.value||12)); P.done=P.done.filter(c=>c<=P.total); scheduleSave(); renderPassion(); };
  box.querySelector('#lpGrad').onchange=e=>{ P.grad=e.target.value; scheduleSave(); renderPassion(); };
  box.querySelectorAll('.lp-medal').forEach(b=>b.onclick=()=>toggleCiclo(+b.dataset.c));
  box.querySelectorAll('.lp-steps input').forEach(c=>c.onchange=()=>{ P.steps[c.dataset.s]=c.checked; scheduleSave();
    if(c.checked) showCeleb({emoji:{bach:'🎓',titulo:'📜',coleg:'🏛️'}[c.dataset.s], grand:c.dataset.s!=='bach', title:{bach:'¡Bachiller en Derecho!',titulo:'¡Abogada titulada!',coleg:'¡Abogada colegiada!'}[c.dataset.s],
      msg:'Todo ese esfuerzo, cada desvelo y cada código subrayado\nte trajeron hasta aquí.\n'+HIM+' está orgullosísimo de ti ⚖️💛'});
    checkAch(); });
}
function toggleCiclo(n){
  const P=lawPath(), i=P.done.indexOf(n);
  if(i>-1){ P.done.splice(i,1); scheduleSave(); renderPassion(); return; }
  P.done.push(n); P.done.sort((a,b)=>a-b); scheduleSave(); renderPassion(); checkAch(); try{ checkLetters(); }catch(e){}
  const left=P.total-P.done.length;
  showCeleb({emoji:left?'🏅':'🎓', grand:!left || P.done.length===Math.ceil(P.total/2),
    title:left?'¡Ciclo '+ROMAN[n-1]+' aprobado!':'¡Terminaste la carrera!',
    msg:left?(P.done.length===Math.ceil(P.total/2)?'¡Ya vas por la mitad del camino!\n':'')+'Un ciclo más cerca de la toga.\nFaltan '+left+(left>1?' ciclos':' ciclo')+' y '+HIM+' va a estar en cada uno 💛'
            :'Todos los ciclos, aprobados.\nLa futura Abogada '+(state.name||'')+' ya es egresada de Derecho.\n'+HIM+' no cabe de orgullo ⚖️🎓'});
}
/* cartas secretas que se abren al aprobar ciclos */
COND_TYPES.ciclos={n:'Al aprobar N ciclos de Derecho', hint:c=>'Se abrirá cuando apruebes '+c.v+' ciclo(s) de Derecho (llevas '+lawPath().done.length+') ⚖️'};
const _luP=letterUnlocked;
letterUnlocked=function(l){ return (l.cond&&l.cond.t==='ciclos') ? lawPath().done.length>=(+l.cond.v||1) : _luP(l); };
const _dcP=deskCondUI;
deskCondUI=function(val){
  if(document.getElementById('dkCond').value!=='ciclos') return _dcP(val);
  document.getElementById('dkValWrap').style.visibility='visible'; document.getElementById('dkValLbl').textContent='Ciclos aprobados';
  document.getElementById('dkValBox').innerHTML='<input type="number" id="dkVal" min="1" max="14" value="'+(val||1)+'">';
};
/* su porqué vuelve cuando más falta hace: si lleva días sin pasar por el Despacho o tiene examen mañana */
function passionNudge(){
  const L=law(), today=fmtDay(new Date()), why=(L.why||'').trim(); if(!why || state.celeb['why'+today]) return;
  const gap=L.lastVisit ? Math.round((isoToDate(today)-isoToDate(L.lastVisit))/864e5) : 0;
  const exam=lawEvals().find(e=>e.grade==null && e.date && Math.round((isoToDate(e.date)-isoToDate(today))/864e5)===1);
  if(gap<5 && !exam) return;
  state.celeb['why'+today]=1; scheduleSave();
  const q=why.length>220 ? why.slice(0,220)+'…' : why;
  setTimeout(()=>buddySay((exam?'⚖️ Mañana tienes '+esc(exam.name)+'. Y recuerda lo que tú misma escribiste:':'💛 Hace '+gap+' días que no pasas por tu Despacho. Tú misma escribiste:')+'<br><i>«'+esc(q)+'»</i>', 14000), exam?45000:30000);
}
const _lhP=lawHome;
lawHome=function(){ _lhP(); const L=law(); L.lastVisit=fmtDay(new Date());
  const m=document.getElementById('lawMotto'); if(m && L.area) m.textContent=m.textContent.replace(/^Despacho de la Abogada [^—]*/, s=>s.trim()+', futura especialista en '+L.area+' ');
};
/* decoración y logros de la abogada */
DECOR_CATALOG.push(['⚖️','Balanza de la justicia',0],['🏛️','Templo de la ley',0],['📜','Pergamino',0],['🎓','Birrete',1]);
ACH.push(
 {id:'lawwhy', e:'💛', nm:'Vocación', st:'Escribe tu porqué en «Mi pasión»', chk:()=>!!state.c.lawwhy},
 {id:'ciclo1', e:'🏅', nm:'Primer ciclo', st:'Aprueba tu primer ciclo de Derecho', chk:()=>lawPath().done.length>=1},
 {id:'mitad', e:'🌗', nm:'Media toga', st:'Aprueba la mitad de la carrera', chk:()=>lawPath().done.length>=Math.ceil(lawPath().total/2)},
 {id:'toga', e:'🎓', nm:'Egresada', st:'Aprueba todos los ciclos de la carrera', chk:()=>lawPath().done.length>=lawPath().total},
 {id:'coleg', e:'🏛️', nm:'Abogada colegiada', st:'Marca tu colegiatura en «Mi camino a la toga»', chk:()=>!!lawPath().steps.coleg}
);
