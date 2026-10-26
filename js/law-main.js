/* v1.9: Despacho de la Abogada — pestañas y enganches con el resto del salón */
let lawTabNow='codigos';
function lawTab(t){
  lawTabNow=t;
  document.querySelectorAll('#v-law .law-tabs button').forEach(b=>b.classList.toggle('on', b.dataset.t===t || (t==='visor'&&b.dataset.t==='codigos') || (t==='editor'&&b.dataset.t==='escritos')));
  document.querySelectorAll('#v-law .law-pane').forEach(p=>p.style.display=p.dataset.p===t?'':'none');
  if(t==='codigos') renderCodes();
  if(t==='articulos'){ const s=document.getElementById('lawArtCode'); if(s && !s.options.length) s.innerHTML='<option value="">Todos los códigos</option>'+LAW_CODES.map(c=>'<option value="'+c.k+'">'+esc(c.n)+'</option>').join(''); renderMyArticles(); }
  if(t==='escritos'){ fillCourseSelects(); renderDocs(); }
  if(t==='cursos') renderCourses();
  if(t==='estudio') renderStudy();
  if(t==='pasion') renderPassion();
}
function lawHome(){
  const L=law(), next=lawEvals().filter(e=>e.grade==null && e.date>=fmtDay(new Date())).sort((a,b)=>a.date.localeCompare(b.date))[0];
  const m=document.getElementById('lawMotto');
  if(m) m.textContent='Despacho de la Abogada '+(state.name||'')+' — '+L.articles.length+' artículos · '+L.docs.length+' escritos · '+L.courses.length+' cursos'+(next?' · ⏳ '+next.name+' el '+niceDate(next.date,false):'');
}
/* los archivos de un curso no caen al suelo del salón: viven en su curso */
const _rlL=renderLibrary;
renderLibrary=function(){
  const hidden=state.floor.filter(b=>b.law && !b.status); hidden.forEach(b=>b.status='__law');
  try{ return _rlL(); } finally { hidden.forEach(b=>{ if(b.status==='__law') delete b.status; }); }
};
/* al cerrar el lector desde un archivo del curso, se vuelve al Despacho */
const _shL=show;
show=function(id){ if(id==='v-library' && document.getElementById('v-reader').classList.contains('active') && curBook && curBook.law){ _shL('v-law'); lawTab('cursos'); return; } return _shL(id); };
/* el buscador global también busca en el Despacho */
const _rgsL=runGlobalSearch;
runGlobalSearch=function(){
  _rgsL();
  const raw=document.getElementById('gsQ').value.trim(), q=norm(raw); if(q.length<2) return;
  const res=document.getElementById('gsRes'), L=law(), items=[];
  L.articles.forEach(a=>{ if(norm(a.text+' '+a.note+' '+codeOf(a.code).ab+' '+a.num).includes(q)) items.push(['⚖️', codeOf(a.code).ab+' art. '+a.num, snippet(a.text,q), ()=>{ show('v-law'); lawTab('articulos'); }]); });
  L.docs.forEach(d=>{ const t=d.html.replace(/<[^>]+>/g,' '); if(norm(d.title+' '+t).includes(q)) items.push(['📝', d.title, snippet(t,q), ()=>{ show('v-law'); openDoc(d.id); }]); });
  if(!items.length) return;
  if(/Nada con/.test(res.innerText)) res.innerHTML='';
  const h=document.createElement('div'); h.className='gs-h'; h.textContent='Despacho de Derecho ('+items.length+')'; res.insertBefore(h, res.children[1]||null);
  items.slice(0,20).reverse().forEach(([ic,t,x,go])=>{ const b=document.createElement('button'); b.className='gs-item'; b.innerHTML='<span class="gi">'+ic+'</span><span><span class="gt">'+esc(t)+'</span><br><span class="gx">'+x+'</span></span>';
    b.onclick=()=>{ document.getElementById('gsOv').classList.remove('show'); go(); }; h.after(b); });
};
/* vestuario de abogada para el libro-asistente */
CATALOG.head.push({e:'🎓', req:0}); CATALOG.hand.push({e:'⚖️', req:0}, {e:'📜', req:0}); CATALOG.neck.push({e:'🎀', req:0});
ACH.push(
 {id:'law1', e:'⚖️', nm:'Abogada en formación', st:'Abre un código en el Despacho', chk:()=>!!state.c.lawcode},
 {id:'law10', e:'📜', nm:'Codificadora', st:'Guarda 10 artículos', chk:()=>law().articles.length>=10},
 {id:'lawdoc', e:'✍️', nm:'Pluma jurídica', st:'Crea tu primer escrito', chk:()=>(state.c.lawdoc||0)>=1},
 {id:'demanda', e:'🏛️', nm:'Primera demanda', st:'Redacta una demanda de práctica', chk:()=>!!state.c.demanda},
 {id:'cards50', e:'🧠', nm:'Memoria de jurista', st:'Crea 50 fichas de estudio', chk:()=>law().cards.length>=50},
 {id:'quiz10', e:'🎯', nm:'Ojo de jueza', st:'Acierta 10 artículos en el quiz', chk:()=>(state.c.lawquiz||0)>=10},
 {id:'grade', e:'🏅', nm:'Nota de honor', st:'Registra una nota de 14 o más', chk:()=>!!state.c.goodgrade}
);
function initLaw(){ law(); examNudge(); passionNudge(); }
