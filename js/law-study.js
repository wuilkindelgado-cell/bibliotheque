/* v1.9: Mis cursos (ciclos, evaluaciones, archivos, apuntes) y Estudio (fichas con repaso espaciado, quiz y glosario) */

const COURSE_COLORS=['#C27A8C','#6E9FC4','#94A879','#C9A04A','#A68BC8','#D9798F','#5E8C7E','#B9763A'];
/* ---------- cursos ---------- */
function renderCourses(){
  const box=document.getElementById('lawCourses'); if(!box) return;
  const L=law(), ciclos=[...new Set(L.courses.map(c=>c.ciclo||'Sin ciclo'))].sort().reverse();
  let h='<div class="lc-new"><input type="text" id="lcName" placeholder="Nombre del curso (p. ej. Derecho Civil I)"><input type="text" id="lcCiclo" placeholder="Ciclo (p. ej. 2026-II)" style="width:140px"><input type="text" id="lcProf" placeholder="Docente (opcional)" style="width:180px"><button class="btn rose small" onclick="addCourse()">＋ Agregar curso</button></div>';
  if(!L.courses.length) h+='<div class="lbl" style="font-style:italic; padding:10px">Agrega tus cursos del ciclo: ahí guardarás apuntes, archivos, fechas de exámenes y notas 🎓</div>';
  ciclos.forEach(cy=>{
    h+='<div class="lc-ciclo">📚 Ciclo '+esc(cy)+'</div><div class="lc-grid">';
    L.courses.filter(c=>(c.ciclo||'Sin ciclo')===cy).forEach(c=>{
      const avg=courseAvg(c), next=(c.evals||[]).filter(e=>e.date>=fmtDay(new Date()) && e.grade==null).sort((a,b)=>a.date.localeCompare(b.date))[0];
      h+='<button class="lc-card" data-id="'+c.id+'" style="--cc:'+c.color+'"><b>'+esc(c.name)+'</b><span class="lbl">'+esc(c.prof||'')+'</span>'
        +'<span class="lc-avg">'+(avg!=null?'Promedio: <b>'+avg.toFixed(2)+'</b>':'Sin notas aún')+'</span>'
        +(next?'<span class="lc-next">⏳ '+esc(next.name)+' · '+esc(niceDate(next.date,false))+'</span>':'')
        +'<span class="lbl">'+law().docs.filter(d=>d.course===c.id).length+' escrito(s) · '+state.floor.concat(state.sections.flatMap(s=>s.books)).filter(b=>b.law===c.id).length+' archivo(s)</span></button>';
    });
    h+='</div>';
  });
  box.innerHTML=h;
  box.querySelectorAll('.lc-card').forEach(b=>b.onclick=()=>openCourse(b.dataset.id));
}
function addCourse(){
  const n=document.getElementById('lcName').value.trim(); if(!n){ toast('«Escribe el nombre del curso 🎓»'); return; }
  const L=law(); L.courses.push({id:lawId(), name:n, ciclo:document.getElementById('lcCiclo').value.trim()||String(new Date().getFullYear()), prof:document.getElementById('lcProf').value.trim(), color:COURSE_COLORS[L.courses.length%COURSE_COLORS.length], evals:[]});
  scheduleSave(); renderCourses(); fillCourseSelects(); state.c.course=1; checkAch();
}
function courseAvg(c){ const g=(c.evals||[]).filter(e=>e.grade!=null && e.grade!==''); if(!g.length) return null;
  const tw=g.reduce((a,e)=>a+(+e.weight||0),0); return tw ? g.reduce((a,e)=>a+(+e.grade)*(+e.weight||0),0)/tw : g.reduce((a,e)=>a+(+e.grade),0)/g.length; }
function openCourse(id){
  const c=law().courses.find(x=>x.id===id); if(!c) return;
  let ov=document.getElementById('courseOv');
  if(!ov){ ov=document.createElement('div'); ov.id='courseOv'; ov.className='ficha-overlay'; ov.style.zIndex=70; ov.onclick=e=>{ if(e.target===ov){ ov.classList.remove('show'); renderCourses(); } }; document.querySelector('.win').appendChild(ov); }
  const files=state.floor.concat(state.sections.flatMap(s=>s.books)).filter(b=>b.law===c.id);
  const docs=law().docs.filter(d=>d.course===c.id);
  const avg=courseAvg(c);
  ov.innerHTML='<div class="frame-card course-card" style="--cc:'+c.color+'"><div class="cc-head"><div><div class="cc-t">'+esc(c.name)+'</div><div class="lbl">Ciclo '+esc(c.ciclo)+(c.prof?' · '+esc(c.prof):'')+'</div></div>'
    +'<div class="cc-avg">'+(avg!=null?'<b>'+avg.toFixed(2)+'</b><span>promedio '+(avg>=10.5?'✅ aprobando':'⚠️ ¡a reforzar!')+'</span>':'<span>sin notas</span>')+'</div></div>'
    +'<div class="adv-h" style="margin-top:10px">📝 Evaluaciones <span class="lbl" style="font-weight:400">(notas de 0 a 20 · peso en %)</span></div><table class="cc-evals"><tr><th>Evaluación</th><th>Fecha</th><th>Peso %</th><th>Nota</th><th></th></tr>'
    +(c.evals||[]).map((e,i)=>'<tr data-i="'+i+'"><td><input value="'+esc(e.name)+'" data-f="name"></td><td><input type="date" value="'+esc(e.date||'')+'" data-f="date"></td><td><input type="number" min="0" max="100" value="'+(e.weight??'')+'" data-f="weight"></td><td><input type="number" min="0" max="20" step="0.5" value="'+(e.grade??'')+'" data-f="grade"></td><td><b class="cc-del">✕</b></td></tr>').join('')
    +'</table><button class="chip" id="ccAddEval">＋ Evaluación</button>'
    +'<div class="adv-h" style="margin-top:12px">📂 Archivos del curso <span class="lbl" style="font-weight:400">(sílabo, lecturas, separatas, casaciones… PDF y EPUB se leen en el lector)</span></div><div class="cc-files">'
    +(files.map(b=>'<button class="idx-item" data-b="'+b.id+'"><span class="pg">'+({pdf:'📄',epub:'📗',cbz:'🎨',audio:'🎧'}[b.fmt]||'📎')+'</span><span>'+esc(b.t)+'</span></button>').join('')||'<div class="lbl" style="font-style:italic">Sin archivos aún</div>')
    +'</div><button class="chip" id="ccAddFile">＋ Agregar archivos</button><input type="file" id="ccFile" multiple accept=".pdf,.epub,.docx" style="display:none">'
    +'<div class="adv-h" style="margin-top:12px">🗒️ Apuntes y escritos</div><div class="cc-files">'
    +(docs.map(d=>'<button class="idx-item" data-d="'+d.id+'"><span class="pg">'+(d.kind==='apunte'?'🗒️':'📄')+'</span><span>'+esc(d.title)+'</span></button>').join('')||'<div class="lbl" style="font-style:italic">Sin apuntes aún</div>')
    +'</div><div style="display:flex; gap:6px; flex-wrap:wrap"><button class="chip" id="ccNewNote">＋ Apunte de clase</button><button class="chip" id="ccNewDoc">＋ Escrito</button></div>'
    +'<div style="display:flex; justify-content:space-between; margin-top:14px"><button class="btn small" style="border-color:var(--wax)" id="ccDel">Eliminar curso</button><button class="btn rose small" id="ccClose">Listo ✨</button></div></div>';
  const save=()=>{ scheduleSave(); };
  ov.querySelectorAll('.cc-evals tr[data-i]').forEach(tr=>{ const e=c.evals[+tr.dataset.i];
    tr.querySelectorAll('input').forEach(inp=>inp.onchange=()=>{ const f=inp.dataset.f; e[f]=(f==='weight'||f==='grade')?(inp.value===''?null:Math.max(0,Math.min(f==='grade'?20:100,+inp.value))):inp.value; save(); if(f==='grade' && e.grade>=14){ state.c.goodgrade=1; checkAch(); } openCourse(id); });
    tr.querySelector('.cc-del').onclick=()=>{ c.evals.splice(+tr.dataset.i,1); save(); openCourse(id); }; });
  ov.querySelector('#ccAddEval').onclick=()=>{ (c.evals=c.evals||[]).push({id:lawId(), name:'Examen parcial', date:fmtDay(new Date()), weight:null, grade:null}); save(); openCourse(id); };
  ov.querySelector('#ccAddFile').onclick=()=>ov.querySelector('#ccFile').click();
  ov.querySelector('#ccFile').onchange=async e=>{ const fs=[...e.target.files]; e.target.value='';
    for(const f of fs){ if(/\.docx$/i.test(f.name)){ document.getElementById('lawDocCourse').value=c.id; await importDocx({files:[f], value:''}); continue; }
      const before=state.floor.length; if(await importOne(f)){ const b=state.floor[state.floor.length-1]; if(state.floor.length>before){ b.law=c.id; b.justFell=false; } } }
    scheduleSave(); renderLibrary(); openCourse(id); toast('«Archivos guardados en '+esc(c.name)+' 📂»'); };
  ov.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{ ov.classList.remove('show'); const i=state.floor.findIndex(x=>x.id===b.dataset.b); if(i>-1) openReaderFor(i); });
  ov.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{ ov.classList.remove('show'); show('v-law'); openDoc(b.dataset.d); });
  ov.querySelector('#ccNewNote').onclick=()=>{ ov.classList.remove('show'); show('v-law'); newDoc('blanco', c.id, 'apunte'); };
  ov.querySelector('#ccNewDoc').onclick=()=>{ ov.classList.remove('show'); show('v-law'); lawTab('escritos'); document.getElementById('lawDocCourse').value=c.id; renderDocs(); toast('«Elige una plantilla para tu escrito de '+esc(c.name)+' 📝»'); };
  ov.querySelector('#ccDel').onclick=()=>{ if(!confirm('¿Eliminar el curso «'+c.name+'»? (sus escritos y archivos no se borran)')) return; law().courses=law().courses.filter(x=>x!==c); save(); ov.classList.remove('show'); renderCourses(); };
  ov.querySelector('#ccClose').onclick=()=>{ ov.classList.remove('show'); renderCourses(); };
  ov.classList.add('show');
}
function fillCourseSelects(){
  const opts='<option value="">Todos los cursos</option>'+law().courses.map(c=>'<option value="'+c.id+'">'+esc(c.name)+'</option>').join('');
  ['lawDocCourse'].forEach(i=>{ const s=document.getElementById(i); if(s){ const v=s.value; s.innerHTML=opts; s.value=v; } });
}
/* exámenes en el calendario y avisos del libro */
function lawEvals(){ return law().courses.flatMap(c=>(c.evals||[]).map(e=>Object.assign({course:c}, e))); }
const _dmL=dayMarks; dayMarks=function(iso){ const r=_dmL(iso); if(lawEvals().some(e=>e.date===iso)) r.m.push('⚖️'); return r; };
const _rdpL=renderDayPanel; renderDayPanel=function(iso){ _rdpL(iso); const ev=lawEvals().filter(e=>e.date===iso); if(!ev.length) return;
  const p=document.querySelector('#dayPanel .day-panel'); if(p){ const d=document.createElement('div'); d.className='dp-sec'; d.style.borderColor='var(--gold)';
    d.innerHTML='<b>⚖️ Derecho:</b>'+ev.map(e=>'<div>'+esc(e.name)+' de <i>'+esc(e.course.name)+'</i>'+(e.grade!=null?' · nota <b>'+e.grade+'</b>':'')+'</div>').join(''); p.insertBefore(d, p.children[1]); } };
function examNudge(){
  const today=isoToDate(fmtDay(new Date()));
  lawEvals().filter(e=>e.grade==null && e.date).forEach(e=>{ const k=Math.round((isoToDate(e.date)-today)/864e5);
    if([0,1,3,7].includes(k)){ const key='ex'+e.id+'-'+k; if(state.celeb[key]) return; state.celeb[key]=1; scheduleSave();
      setTimeout(()=>buddySay('⚖️ '+(k===0?'¡Hoy es tu <b>'+esc(e.name)+'</b> de '+esc(e.course.name)+'! Respira hondo: lo sabes 💪✨':'Faltan <b>'+k+' día'+(k>1?'s':'')+'</b> para tu '+esc(e.name)+' de '+esc(e.course.name)+'. ¿Repasamos unas fichas en 🧠 Estudio? 📚'), 11000), 20000); } });
}

/* ---------- estudio: fichas con repaso espaciado (SM-2 simplificado) ---------- */
function addCard(front, back, src){
  const L=law(); if(src && L.cards.some(c=>c.src===src)) return;
  L.cards.push({id:lawId(), front, back, src:src||'', due:fmtDay(new Date()), ivl:0, ease:2.5, reps:0}); scheduleSave(); state.c.cards=(state.c.cards||0)+1; checkAch();
}
let studyQ=[], studyI=0;
function renderStudy(){
  const box=document.getElementById('lawStudy'); if(!box) return;
  const L=law(), today=fmtDay(new Date()), due=L.cards.filter(c=>c.due<=today);
  box.innerHTML='<div class="st-stats"><div><b>'+L.cards.length+'</b><span>fichas</span></div><div><b>'+due.length+'</b><span>para hoy</span></div><div><b>'+L.cards.filter(c=>c.ivl>=21).length+'</b><span>dominadas</span></div></div>'
    +'<div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin:10px 0"><button class="btn rose small" onclick="startReview()">🧠 Repasar ('+due.length+')</button><button class="btn small" onclick="startQuiz()">❓ Quiz de artículos</button><button class="btn small" onclick="openGlossary()">📜 Latinismos</button></div>'
    +'<div class="st-new"><input type="text" id="cardF" placeholder="Pregunta o concepto (frente)"><textarea id="cardB" rows="2" placeholder="Respuesta (reverso)"></textarea><button class="chip" onclick="addCard(document.getElementById(\'cardF\').value.trim()||\'(sin frente)\', document.getElementById(\'cardB\').value.trim()); renderStudy(); toast(\'«Ficha creada 🧠»\')">＋ Crear ficha</button></div>'
    +'<div id="studyStage"></div>';
}
function startReview(){
  const today=fmtDay(new Date()); studyQ=law().cards.filter(c=>c.due<=today).sort(()=>Math.random()-.5); studyI=0;
  if(!studyQ.length){ toast('«¡Nada pendiente para hoy! Vuelve mañana 🌸»'); return; } showCard(false);
}
function showCard(flipped){
  const st=document.getElementById('studyStage'), c=studyQ[studyI];
  if(!c){ st.innerHTML='<div class="flash done">🎉 ¡Repaso terminado! '+studyQ.length+' ficha(s) por hoy</div>'; state.c.review=(state.c.review||0)+1; checkAch(); renderStudyStats(); return; }
  st.innerHTML='<div class="flash'+(flipped?' flip':'')+'"><div class="fl-front">'+esc(c.front)+'</div>'+(flipped?'<div class="fl-back">'+esc(c.back)+'</div>':'')+'</div>'
    +(flipped?'<div class="fl-grades"><button class="chip" data-g="0">😵 Otra vez</button><button class="chip" data-g="3">😅 Difícil</button><button class="chip" data-g="4">🙂 Bien</button><button class="chip" data-g="5">😎 Fácil</button></div>'
      :'<div style="text-align:center"><button class="btn rose small" id="flShow">Ver respuesta</button></div>')+'<div class="lbl" style="text-align:center">'+(studyI+1)+' de '+studyQ.length+'</div>';
  const b=st.querySelector('#flShow'); if(b) b.onclick=()=>showCard(true);
  st.querySelectorAll('[data-g]').forEach(x=>x.onclick=()=>{ grade(c, +x.dataset.g); studyI++; showCard(false); });
}
function grade(c, q){
  if(q<3){ c.reps=0; c.ivl=1; } else { c.reps++; c.ivl=c.reps===1?1:c.reps===2?3:Math.round(c.ivl*c.ease); }
  c.ease=Math.max(1.3, c.ease+0.1-(5-q)*(0.08+(5-q)*0.02));
  const d=new Date(); d.setDate(d.getDate()+(q<3?0:c.ivl)); c.due=fmtDay(d); scheduleSave();
  if(q<3) studyQ.push(c);
}
function renderStudyStats(){ const s=document.querySelector('#lawStudy .st-stats'); if(s){ const t=document.getElementById('studyStage').innerHTML; renderStudy(); document.getElementById('studyStage').innerHTML=t; } }
/* quiz: ¿qué artículo dice esto? (con tus artículos guardados) */
function startQuiz(){
  const arts=law().articles.filter(a=>a.num && a.text.length>40);
  if(arts.length<4){ toast('«Guarda al menos 4 artículos en «Mis artículos» para jugar el quiz ⚖️»'); return; }
  const a=arts[Math.floor(Math.random()*arts.length)], opts=[a, ...arts.filter(x=>x!==a).sort(()=>Math.random()-.5).slice(0,3)].sort(()=>Math.random()-.5);
  const body=String(a.text).replace(/^Art[íi]culo\s+[\dA-Za-z\-]+\s*[.º°-]+\s*/,'').slice(0,420);
  const st=document.getElementById('studyStage');
  st.innerHTML='<div class="flash"><div class="lbl">¿Qué artículo dice…?</div><div class="fl-front" style="font-size:15px; text-align:left">«'+esc(body)+(a.text.length>420?'…':'')+'»</div></div><div class="fl-grades">'
    +opts.map(o=>'<button class="chip" data-id="'+o.id+'">'+esc(codeOf(o.code).ab)+' art. '+esc(o.num)+'</button>').join('')+'</div>';
  st.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{ const ok=b.dataset.id===a.id; b.classList.add(ok?'ok':'bad');
    state.c.lawquiz=(state.c.lawquiz||0)+(ok?1:0); checkAch(); scheduleSave();
    toast(ok?'«¡Correcto, abogada! ⚖️✨»':'«Era '+esc(codeOf(a.code).ab)+' art. '+esc(a.num)+' 📚»'); setTimeout(startQuiz, 1400); });
}
/* glosario de latinismos jurídicos */
const LATIN=[
 ['In dubio pro reo','En caso de duda, a favor del reo.'],['Pacta sunt servanda','Los pactos deben cumplirse.'],['Nullum crimen, nulla poena sine lege','No hay delito ni pena sin ley previa (principio de legalidad).'],
 ['Non bis in idem','Nadie puede ser juzgado o sancionado dos veces por el mismo hecho.'],['Iura novit curia','El juez conoce el derecho.'],['Res iudicata','Cosa juzgada.'],['Erga omnes','Frente a todos; efectos generales.'],
 ['Inter partes','Entre las partes; efectos solo para ellas.'],['Ex tunc','Desde entonces; con efectos retroactivos.'],['Ex nunc','Desde ahora; sin efectos retroactivos.'],['Lex posterior derogat priori','La ley posterior deroga a la anterior.'],
 ['Lex specialis derogat generali','La ley especial prevalece sobre la general.'],['Lex superior derogat inferiori','La norma superior prevalece sobre la inferior.'],['Onus probandi','Carga de la prueba.'],
 ['Quod non est in actis non est in mundo','Lo que no está en el expediente no existe para el juez.'],['Ultra petita','Más allá de lo pedido.'],['Extra petita','Fuera de lo pedido.'],['Infra (citra) petita','Menos de lo pedido; omisión de pronunciamiento.'],
 ['Ratio decidendi','Razón de la decisión; fundamento determinante del fallo.'],['Obiter dicta','Lo dicho de paso; argumentos no determinantes del fallo.'],['Stare decisis','Estarse a lo decidido; respeto al precedente.'],
 ['Habeas corpus','Proceso que protege la libertad individual.'],['Habeas data','Proceso que protege el acceso a la información y la autodeterminación informativa.'],['Locus regit actum','La ley del lugar rige la forma del acto.'],
 ['Mutatis mutandis','Cambiando lo que haya que cambiar.'],['Ad hoc','Para esto; para un fin específico.'],['A quo','Juez o tribunal de origen (de primera instancia en un recurso).'],['Ad quem','Juez o tribunal superior que resuelve el recurso.'],
 ['De iure','De derecho.'],['De facto','De hecho.'],['Ab intestato','Sin testamento.'],['Mortis causa','Por causa de muerte.'],['Inter vivos','Entre vivos.'],['Nasciturus','El concebido aún no nacido.'],
 ['Bona fide','De buena fe.'],['Reformatio in peius','Reforma en perjuicio del único recurrente (prohibida).'],['Prima facie','A primera vista.'],['Ipso iure','Por el mismo derecho; de pleno derecho.'],
 ['Sui generis','De su propio género; peculiar.'],['Lato sensu','En sentido amplio.'],['Stricto sensu','En sentido estricto.'],['Pro homine','Interpretación más favorable a la persona.'],
 ['Nemo iudex in causa sua','Nadie puede ser juez en su propia causa.'],['Audi alteram partem','Escúchese a la otra parte.'],['Nemo tenetur se ipsum accusare','Nadie está obligado a declarar contra sí mismo.'],
 ['Ubi lex non distinguit, nec nos distinguere debemus','Donde la ley no distingue, no debemos distinguir.'],['Dura lex, sed lex','La ley es dura, pero es la ley.'],['In limine','Al inicio; de plano.'],
 ['Petitum','Lo que se pide.'],['Causa petendi','Fundamento de lo que se pide.'],['Iuris tantum','Presunción que admite prueba en contrario.'],['Iure et de iure','Presunción que no admite prueba en contrario.'],
 ['Ad litem','Para el juicio (p. ej., curador ad litem).'],['Exequatur','Reconocimiento de una sentencia extranjera.'],['Fumus boni iuris','Apariencia de buen derecho (medidas cautelares).'],['Periculum in mora','Peligro en la demora (medidas cautelares).'],
 ['Animus domini','Intención de comportarse como dueño.'],['Animus necandi','Intención de matar.'],['Pro actione','A favor de la acción; interpretación que favorece el acceso a la justicia.'],['Ne bis in idem','Variante de non bis in idem.']
];
function openGlossary(){
  const st=document.getElementById('studyStage');
  st.innerHTML='<input type="text" id="glQ" placeholder="🔎 Buscar latinismo…" style="margin-bottom:8px"><div class="gl-list"></div>';
  const draw=()=>{ const q=norm(document.getElementById('glQ').value);
    st.querySelector('.gl-list').innerHTML=LATIN.filter(([a,b])=>!q||norm(a+' '+b).includes(q)).map(([a,b])=>'<div class="gl-it"><b><i>'+esc(a)+'</i></b><span>'+esc(b)+'</span><button class="chip" data-a="'+esc(a)+'" title="Crear ficha">🧠</button></div>').join('');
    st.querySelectorAll('.gl-it .chip').forEach(x=>x.onclick=()=>{ const it=LATIN.find(l=>l[0]===x.dataset.a); addCard(it[0], it[1], 'lat:'+it[0]); toast('«Ficha creada 🧠»'); }); };
  document.getElementById('glQ').oninput=draw; draw();
}
