/* v1.9: Despacho de la Abogada — los códigos (consulta en SPIJ, la fuente oficial del MINJUSDH) y «Mis artículos» */

function law(){ state.law=state.law||{}; const L=state.law; ['articles','docs','courses','cards','files'].forEach(k=>{ if(!L[k]) L[k]=[]; }); return L; }
const lawId=()=>Date.now().toString(36)+Math.floor(Math.random()*9999);

/* nombres tal como aparecen en el menú de acceso libre de SPIJ */
const LAW_CODES=[
  {k:'CONST', id:'H682678', ab:'Const.', n:'Constitución Política del Perú (1993)', spij:'CONSTITUCION POLITICA', e:'🏛️'},
  {k:'CC', id:'H682684',    ab:'CC',     n:'Código Civil', spij:'CODIGO CIVIL', e:'📗'},
  {k:'CPC', id:'H682685',   ab:'CPC',    n:'Código Procesal Civil (TUO)', spij:'(TUO) CODIGO PROCESAL CIVIL', e:'📘'},
  {k:'CP', id:'H682692',    ab:'CP',     n:'Código Penal', spij:'CODIGO PENAL', e:'📕'},
  {k:'NCPP', id:'H682695',  ab:'NCPP',   n:'Nuevo Código Procesal Penal (D. Leg. 957)', spij:'NUEVO CODIGO PROCESAL PENAL (D.L 957)', e:'📙'},
  {k:'CPCO', id:'H1288461',  ab:'NCPCo',  n:'Nuevo Código Procesal Constitucional', spij:'NUEVO CODIGO PROCESAL CONSTITUCIONAL', e:'⚖️'},
  {k:'CNA', id:'H682689',   ab:'CNA',    n:'Código de los Niños y Adolescentes', spij:'CODIGO DE LOS NIÑOS Y ADOLESCENTES', e:'🧸'},
  {k:'CRPA', id:'H682687',  ab:'CRPA',   n:'Código de Responsabilidad Penal de Adolescentes', spij:'CODIGO DE RESPONSABILIDAD PENAL DE ADOLESCENTES', e:'📒'},
  {k:'CEP', id:'H682688',   ab:'CEP',    n:'Código de Ejecución Penal', spij:'CODIGO DE EJECUCION PENAL', e:'🔐'},
  {k:'CPDC', id:'H682697',  ab:'CPDC',   n:'Código de Protección y Defensa del Consumidor', spij:'CODIGO DE PROTECCION Y DEFENSA DEL CONSUMIDOR', e:'🛍️'},
  {k:'CT', id:'H682696',    ab:'CT',     n:'Código Tributario (TUO)', spij:'CODIGO TRIBUTARIO (TUO)', e:'🧾'},
  {k:'CCOM', id:'H682686',  ab:'C. de C.', n:'Código de Comercio', spij:'CODIGO DE COMERCIO', e:'💼'}
];
const SPIJ_NORMA='https://spij.minjus.gob.pe/spij-ext-web/#/detallenorma/';
const codeOf=k=>LAW_CODES.find(c=>c.k===k)||{k, ab:k, n:k, e:'📜'};

let lawCode=null; // código abierto en el visor
function renderCodes(){
  const box=document.getElementById('lawCodes'); if(!box) return;
  const counts={}; law().articles.forEach(a=>counts[a.code]=(counts[a.code]||0)+1);
  box.innerHTML='<div class="law-codes">'+LAW_CODES.map(c=>'<button class="law-code" data-k="'+c.k+'"><span class="lc-e">'+c.e+'</span><span class="lc-n">'+esc(c.n)+'</span><span class="lc-ab">'+esc(c.ab)+(counts[c.k]?' · '+counts[c.k]+' guardado(s)':'')+'</span></button>').join('')+'</div>'
    +'<div class="lbl law-note">📌 Los textos se consultan en el <b>SPIJ</b> (Sistema Peruano de Información Jurídica, Ministerio de Justicia), la fuente oficial y actualizada. Lo que guardes en «Mis artículos» queda contigo aunque no haya internet.</div>';
  box.querySelectorAll('.law-code').forEach(b=>b.onclick=()=>openCode(b.dataset.k));
}
function openCode(k, artNum){
  lawCode=codeOf(k);
  lawTab('visor');
  document.getElementById('lawViewTitle').textContent=lawCode.e+' '+lawCode.n;
  document.getElementById('lawFindInfo').textContent='';
  const host=document.getElementById('lawWebHost');
  let wv=document.getElementById('lawWeb');
  const url=SPIJ_NORMA+lawCode.id;
  document.getElementById('lawWebMsg').innerHTML='Abriendo el <b>'+esc(lawCode.n)+'</b> desde el SPIJ… ⏳ (los códigos grandes tardan unos segundos)';
  if(!wv){
    wv=document.createElement('webview'); wv.id='lawWeb'; wv.setAttribute('partition','persist:spij');
    wv.dataset.art=artNum||''; wv.src=url; host.appendChild(wv);
    wv.addEventListener('did-fail-load', e=>{ if(e.errorCode!==-3) document.getElementById('lawWebMsg').innerHTML='📡 No pude abrir el SPIJ (¿sin internet?). Tus artículos guardados siguen en «Mis artículos».'; });
  } else {
    wv.dataset.art=artNum||'';
    /* el SPIJ reutiliza la página al cambiar de norma: se marca la vieja y se recarga, así nunca se confunden los textos */
    wv.executeJavaScript('window.__bibOld=1').catch(()=>{}).then(()=>wv.loadURL(url)).then(()=>wv.reload()).catch(()=>{});
  }
  waitCodeText(wv, lawCode.id);
  state.c.lawcode=1; checkAch(); scheduleSave();
}
/* espera a que el SPIJ termine de cargar el texto de ESTE código */
let codeWaitTok=0;
async function waitCodeText(wv, id){
  const tok=++codeWaitTok;
  await new Promise(r=>setTimeout(r,1200));
  for(let i=0;i<90 && tok===codeWaitTok;i++){
    const n=await wv.executeJavaScript('(!window.__bibOld && location.href.includes("'+id+'"))?document.body.innerText.length:0').catch(()=>0);
    if(n>15000){
      document.getElementById('lawWebMsg').innerHTML='✨ Listo. Escribe un número arriba para ir directo a ese artículo, o selecciona un texto y toca <b>💾 Guardar artículo</b>.';
      if(wv.dataset.art){ document.getElementById('lawArtNum').value=wv.dataset.art; setTimeout(()=>findArticle(wv.dataset.art), 600); }
      return;
    }
    await new Promise(r=>setTimeout(r,500));
  }
}
/* búsqueda dentro del código: ubica el texto, lo lleva a la vista y lo resalta en dorado */
const SPIJ_FINDER=`window.__bibFind=window.__bibFind||function(mode, q, dir){
  const S=window.__bibS=window.__bibS||{hits:[], i:-1, key:''};
  const key=mode+'|'+q;
  document.querySelectorAll('.__bibhl').forEach(e=>{ e.style.background=e.dataset.bg||''; e.classList.remove('__bibhl'); });
  if(S.key!==key){
    S.key=key; S.hits=[]; S.i=-1;
    const esc=s=>s.replace(/[.*+?^\${}()|[\\]\\\\]/g,'\\\\$&');
    const re = mode==='art' ? new RegExp('^\\\\s*Art[íi]culo\\\\s+'+esc(q)+'(?!\\\\d|\\\\s*-\\\\s*[A-Za-z]\\\\b)','i') : new RegExp(esc(q).replace(/a/gi,'[aá]').replace(/e/gi,'[eé]').replace(/i/gi,'[ií]').replace(/o/gi,'[oó]').replace(/u/gi,'[uúü]').replace(/ +/g,'[\\\\s\\\\u00a0]+'),'i');
    const w=document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    const seen=new Set();
    while(n=w.nextNode()){ const el=n.parentElement; if(!el || !el.offsetParent) continue; const blk=el.closest('p,li,td,h1,h2,h3,h4,h5,div')||el; if(seen.has(blk)) continue; seen.add(blk);
      if(re.test(blk.textContent)) S.hits.push(blk); }
    S.hits=S.hits.filter(h=>!S.hits.some(o=>o!==h && h.contains(o)));
  }
  if(!S.hits.length) return {n:0, i:0};
  S.i = dir<0 ? (S.i-1+S.hits.length)%S.hits.length : (S.i+1)%S.hits.length;
  const el=S.hits[S.i]; el.dataset.bg=el.style.background; el.classList.add('__bibhl'); el.style.background='#FFF1C9';
  el.style.transition='background .4s'; el.scrollIntoView({block:'center'});
  return {n:S.hits.length, i:S.i+1};
};`;
async function spijFind(mode, q, dir){
  const wv=document.getElementById('lawWeb'); if(!wv || !q) return;
  const r=await wv.executeJavaScript(SPIJ_FINDER+'window.__bibFind('+JSON.stringify(mode)+','+JSON.stringify(q)+','+(dir||1)+')').catch(()=>null);
  const info=document.getElementById('lawFindInfo');
  if(!r){ info.textContent='el código aún está cargando…'; return; }
  info.textContent=r.n ? (mode==='art' ? 'Art. '+q+(r.n>1?' ('+r.i+' de '+r.n+')':'')+' ✓' : r.i+' de '+r.n) : 'sin coincidencias';
}
function findArticle(n){
  n=String(n||document.getElementById('lawArtNum').value||'').trim().replace(/^art(\.|ículo)?\s*/i,'');
  if(n) spijFind('art', n, 1);
}
function findNext(back){ spijFind('txt', document.getElementById('lawFindTxt').value.trim(), back?-1:1); }
function findText(){ spijFind('txt', document.getElementById('lawFindTxt').value.trim(), 1); }
/* guardar el artículo: la selección, o el bloque «Artículo N» completo si no hay selección */
async function saveArticle(){
  const wv=document.getElementById('lawWeb'); if(!wv || !lawCode) return;
  const n=String(document.getElementById('lawArtNum').value||'').trim().replace(/^art(\.|ículo)?\s*/i,'');
  const got=await wv.executeJavaScript(`(()=>{
    const sel=String(getSelection()||'').trim(); if(sel.length>15) return {text:sel, from:'sel'};
    const n=${JSON.stringify(n)}; if(!n) return null;
    const t=document.body.innerText, re=new RegExp('Art[íi]culo\\\\s+'+n.replace(/[.*+?^\${}()|[\\]\\\\]/g,'\\\\$&')+'\\\\s*[.º°-][\\\\s\\\\S]*?(?=\\\\n\\\\s*Art[íi]culo\\\\s+\\\\d|$)','i');
    const m=t.match(re); return m?{text:m[0].trim().slice(0,6000), from:'auto'}:null; })()`).catch(()=>null);
  /* solo el artículo: sin las concordancias ni la jurisprudencia que el SPIJ agrega debajo */
  if(got && got.text) got.text=got.text.split(/\n\s*(?:CONCORDANCIAS|PROCESOS CONSTITUCIONALES|JURISPRUDENCIA|DOCTRINA|NOTAS? DEL? |PRECEDENTE|EXPOSICI[OÓ]N DE MOTIVOS)/i)[0].replace(/\n{3,}/g,'\n\n').trim();
  if(!got || !got.text){ toast('«Selecciona el texto del artículo, o escribe su número arriba y búscalo primero ✍️»'); return; }
  const num=n || ((got.text.match(/Art[íi]culo\s+([\d\-A-Za-z]+)/)||[])[1]||'');
  const L=law();
  const ex=L.articles.find(a=>a.code===lawCode.k && a.num===num && num);
  if(ex){ ex.text=got.text; ex.at=Date.now(); }
  else L.articles.unshift({id:lawId(), code:lawCode.k, num, text:got.text, note:'', at:Date.now(), d:fmtDay(new Date()), fav:false});
  scheduleSave(); state.c.lawsave=(state.c.lawsave||0)+1; checkAch();
  toast('«Guardado: '+esc(lawCode.ab)+' art. '+esc(num||'—')+' ⚖️ en «Mis artículos» (con fecha '+niceDate(fmtDay(new Date()))+')»');
}
/* ---------- Mis artículos ---------- */
function renderMyArticles(){
  const box=document.getElementById('lawArticles'); if(!box) return;
  const q=norm(document.getElementById('lawArtQ').value||''), fc=document.getElementById('lawArtCode').value;
  const arts=law().articles.filter(a=>(!fc||a.code===fc) && (!q || norm(a.text+' '+a.note+' '+a.num+' '+codeOf(a.code).ab).includes(q)))
    .sort((a,b)=>(b.fav-a.fav) || a.code.localeCompare(b.code) || (parseInt(a.num)||0)-(parseInt(b.num)||0));
  box.innerHTML=arts.length?'':'<div class="lbl" style="font-style:italic; padding:8px">Aún no guardas artículos. Abre un código, busca el artículo y toca <b>💾 Guardar</b> ⚖️</div>';
  arts.forEach(a=>{
    const c=codeOf(a.code), el=document.createElement('div'); el.className='law-art'+(a.fav?' fav':'');
    el.innerHTML='<div class="la-h"><b>'+c.e+' '+esc(c.ab)+' · Art. '+esc(a.num||'—')+'</b><span class="lbl">guardado el '+esc(niceDate(a.d||fmtDay(new Date(a.at))))+'</span>'
      +'<span class="la-tools"><button title="Favorito">'+(a.fav?'⭐':'☆')+'</button><button title="Crear ficha de estudio">🧠</button><button title="Ver en el SPIJ (vigente)">🔄</button><button title="Copiar cita">📋</button><button title="Eliminar">✕</button></span></div>'
      +'<div class="la-t">'+esc(a.text)+'</div>'
      +'<textarea class="la-n" rows="2" placeholder="Tu nota, comentario o ejemplo…">'+esc(a.note||'')+'</textarea>';
    const [bf,bc,bs,bcp,bd]=el.querySelectorAll('.la-tools button');
    bf.onclick=()=>{ a.fav=!a.fav; scheduleSave(); renderMyArticles(); };
    bc.onclick=()=>{ addCard(c.ab+' art. '+a.num+' — ¿qué establece?', a.text, 'art:'+a.id); toast('«Ficha creada en 🧠 Estudio»'); };
    bs.onclick=()=>openCode(a.code, a.num);
    bcp.onclick=()=>{ navigator.clipboard.writeText(articleCite(a)); toast('«Cita copiada 📋»'); };
    bd.onclick=()=>{ if(!confirm('¿Eliminar este artículo guardado?')) return; law().articles=law().articles.filter(x=>x!==a); scheduleSave(); renderMyArticles(); };
    el.querySelector('.la-n').oninput=e=>{ a.note=e.target.value; scheduleSave(); };
    box.appendChild(el);
  });
}
function articleCite(a){ const c=codeOf(a.code); return 'Artículo '+(a.num||'')+' del '+c.n+': «'+String(a.text).replace(/^Art[íi]culo\s+[\dA-Za-z\-]+\s*[.º°-]+\s*/,'').replace(/\s+/g,' ').trim()+'»'; }
