/* v1.9: Mis escritos — editor con plantillas, citas de artículos, abrir Word y exportar a Word/PDF */

const H=t=>'<h2>'+t+'</h2>', P=t=>'<p>'+t+'</p>', PH=t=>'<p><span class="ph">'+t+'</span></p>';
const LAW_TEMPLATES={
  blanco:{n:'Documento en blanco', e:'📄', html:'<h1>Título</h1><p></p>'},
  ensayo:{n:'Ensayo jurídico', e:'🖋️', html:'<h1 style="text-align:center">Título del ensayo</h1><p style="text-align:center"><i>Nombre · Curso · Universidad · Fecha</i></p>'
    +H('Resumen')+PH('En 150–250 palabras: tema, tesis, método y conclusión principal.')+P('<b>Palabras clave:</b> <span class="ph">tres a cinco palabras</span>')
    +H('Introducción')+PH('Planteamiento del problema, relevancia y tesis que defenderás.')+H('Desarrollo')+PH('Argumentos ordenados, con citas a la norma, la doctrina y la jurisprudencia.')
    +H('Conclusiones')+PH('Respuesta clara a tu tesis.')+H('Referencias')+PH('Autor, A. (Año). Título. Editorial. (formato APA u otro que pida tu curso)')},
  informe:{n:'Informe jurídico', e:'📑', html:'<h1 style="text-align:center">INFORME JURÍDICO N.° <span class="ph">__</span></h1>'
    +P('<b>A:</b> <span class="ph">destinatario</span><br><b>De:</b> <span class="ph">tu nombre</span><br><b>Asunto:</b> <span class="ph">materia</span><br><b>Fecha:</b> <span class="ph">fecha</span>')
    +H('I. Antecedentes')+PH('Hechos relevantes en orden cronológico.')+H('II. Problema jurídico')+PH('¿Cuál es la cuestión que se debe resolver?')
    +H('III. Base normativa')+PH('Normas aplicables (usa ⚖️ Citar artículo).')+H('IV. Análisis')+PH('Aplicación de la norma, doctrina y jurisprudencia a los hechos.')
    +H('V. Conclusiones')+PH('Respuesta concreta al problema.')+H('VI. Recomendaciones')+PH('Qué se sugiere hacer.')},
  demanda:{n:'Demanda (práctica)', e:'⚖️', html:'<p style="text-align:right"><b>Sumilla:</b> <span class="ph">materia de la demanda</span></p>'
    +P('<b>SEÑOR JUEZ DEL <span class="ph">__</span> JUZGADO <span class="ph">__</span> DE <span class="ph">__</span>:</b>')
    +P('<span class="ph">Nombres y apellidos</span>, identificado(a) con DNI N.° <span class="ph">__</span>, con domicilio real en <span class="ph">__</span> y domicilio procesal en <span class="ph">__</span>; a usted digo:')
    +H('I. Petitorio')+PH('Lo que se pide al juez, de forma clara y concreta.')+H('II. Datos del demandado')+PH('Nombre y domicilio del demandado.')
    +H('III. Fundamentos de hecho')+PH('Hechos numerados, precisos y ordenados.')+H('IV. Fundamentos de derecho')+PH('Normas que amparan el pedido (⚖️ Citar artículo).')
    +H('V. Vía procedimental')+PH('Proceso que corresponde.')+H('VI. Monto del petitorio')+PH('Si corresponde.')+H('VII. Medios probatorios')+PH('Documentos y demás pruebas.')
    +H('VIII. Anexos')+PH('1-A Copia del DNI… (revisa los requisitos de la demanda y sus anexos en el Código Procesal Civil)')
    +P('<b>POR TANTO:</b> A usted señor juez, pido admitir la presente demanda y declararla fundada en su oportunidad.')+P('<span class="ph">Lugar y fecha</span>')+P('<br><span class="ph">Firma del demandante</span>&nbsp;&nbsp;&nbsp;&nbsp;<span class="ph">Firma y registro del abogado</span>')},
  contestacion:{n:'Contestación de demanda (práctica)', e:'🛡️', html:'<p style="text-align:right"><b>Expediente:</b> <span class="ph">__</span><br><b>Sumilla:</b> Contesta demanda</p>'
    +P('<b>SEÑOR JUEZ DEL <span class="ph">__</span> JUZGADO:</b>')+P('<span class="ph">Nombres</span>, en los seguidos por <span class="ph">demandante</span> sobre <span class="ph">materia</span>; a usted digo:')
    +H('I. Petitorio')+PH('Se declare infundada / improcedente la demanda.')+H('II. Pronunciamiento sobre los hechos')+PH('Respuesta a cada hecho de la demanda.')
    +H('III. Fundamentos de hecho de la defensa')+PH('Tu versión de los hechos.')+H('IV. Fundamentos de derecho')+PH('Normas aplicables.')+H('V. Medios probatorios')+PH('—')+H('VI. Anexos')+PH('—')
    +P('<b>POR TANTO:</b> pido tener por contestada la demanda.')},
  apelacion:{n:'Recurso de apelación (práctica)', e:'📮', html:'<p style="text-align:right"><b>Expediente:</b> <span class="ph">__</span><br><b>Sumilla:</b> Interpone recurso de apelación</p>'
    +P('<b>SEÑOR JUEZ:</b>')+P('<span class="ph">Nombres</span>, en los seguidos sobre <span class="ph">materia</span>, a usted digo: que interpongo recurso de apelación contra <span class="ph">la resolución N.° __</span>, por los siguientes fundamentos:')
    +H('I. Errores de hecho y de derecho')+PH('Precisa el error o los errores de la resolución.')+H('II. Agravio')+PH('Cómo te perjudica la resolución.')+H('III. Fundamentación')+PH('Por qué debe revocarse o anularse.')+H('IV. Pretensión impugnatoria')+PH('Qué pides al superior.')
    +P('<b>POR TANTO:</b> pido conceder el recurso y elevar los actuados al superior.')},
  caso:{n:'Ficha de caso / casación', e:'🔎', html:'<h1>Ficha de caso</h1>'+P('<b>Órgano / N.° de expediente o casación:</b> <span class="ph">__</span><br><b>Fecha:</b> <span class="ph">__</span><br><b>Materia:</b> <span class="ph">__</span>')
    +H('Hechos')+PH('—')+H('Problema jurídico')+PH('—')+H('Decisión')+PH('—')+H('Fundamentos principales (ratio decidendi)')+PH('—')+H('Mi comentario')+PH('—')},
  monografia:{n:'Monografía', e:'📚', html:'<h1 style="text-align:center">Título de la monografía</h1><p style="text-align:center"><i>Curso · Docente · Integrantes · Fecha</i></p>'
    +H('Índice')+PH('—')+H('Introducción')+PH('—')+H('Capítulo I: Marco teórico')+PH('—')+H('Capítulo II: Marco normativo')+PH('—')+H('Capítulo III: Análisis')+PH('—')+H('Conclusiones')+PH('—')+H('Referencias')+PH('—')}
};

let lawDoc=null;
function renderDocs(){
  const box=document.getElementById('lawDocsList'); if(!box) return;
  const fc=document.getElementById('lawDocCourse').value;
  const docs=law().docs.filter(d=>!fc || d.course===fc).sort((a,b)=>b.updated-a.updated);
  box.innerHTML=docs.length?'':'<div class="lbl" style="font-style:italic; padding:8px">Aún no hay escritos. Crea uno desde una plantilla o abre tu Word 📝</div>';
  docs.forEach(d=>{ const c=law().courses.find(x=>x.id===d.course);
    const el=document.createElement('div'); el.className='law-doc';
    el.innerHTML='<div class="ld-e">'+(d.kind==='apunte'?'🗒️':(LAW_TEMPLATES[d.tpl]||{e:'📄'}).e)+'</div><div class="ld-b"><b>'+esc(d.title)+'</b><div class="lbl">'+(c?esc(c.name)+' · ':'')+esc(wordsOf(d.html))+' palabras · editado el '+esc(niceDate(fmtDay(new Date(d.updated))))+'</div></div><button class="chip" title="Eliminar">✕</button>';
    el.onclick=e=>{ if(e.target.closest('.chip')) return; openDoc(d.id); };
    el.querySelector('.chip').onclick=()=>{ if(!confirm('¿Eliminar «'+d.title+'»?')) return; law().docs=law().docs.filter(x=>x!==d); scheduleSave(); renderDocs(); };
    box.appendChild(el); });
}
function wordsOf(html){ const t=String(html||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' '); return (t.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+/g)||[]).length; }
function newDoc(tpl, course, kind){
  const t=LAW_TEMPLATES[tpl]||LAW_TEMPLATES.blanco;
  const d={id:lawId(), title:kind==='apunte'?'Apunte del '+niceDate(fmtDay(new Date()),false):t.n, tpl, kind:kind||'escrito', course:course||document.getElementById('lawDocCourse').value||'', html:t.html, created:Date.now(), updated:Date.now()};
  law().docs.unshift(d); scheduleSave(); openDoc(d.id);
  state.c.lawdoc=(state.c.lawdoc||0)+1; if(tpl==='demanda') state.c.demanda=1; checkAch();
}
function openDoc(id){
  const d=law().docs.find(x=>x.id===id); if(!d) return;
  lawDoc=d; lawTab('editor');
  document.getElementById('lawDocTitle').value=d.title;
  const sel=document.getElementById('lawDocCourseE'); sel.innerHTML='<option value="">(sin curso)</option>'+law().courses.map(c=>'<option value="'+c.id+'">'+esc(c.name)+'</option>').join(''); sel.value=d.course||'';
  const ed=document.getElementById('lawEditor'); ed.innerHTML=d.html; updateWordCount();
}
let docSaveT=null;
function docChanged(){ if(!lawDoc) return; clearTimeout(docSaveT); docSaveT=setTimeout(()=>{ lawDoc.html=document.getElementById('lawEditor').innerHTML; lawDoc.updated=Date.now(); scheduleSave(); document.getElementById('lawSaved').textContent='✓ guardado'; }, 600); document.getElementById('lawSaved').textContent='…'; updateWordCount(); }
function updateWordCount(){ const n=wordsOf(document.getElementById('lawEditor').innerHTML); document.getElementById('lawWords').textContent=n+' palabras'; }
function fmt(cmd, val){ document.getElementById('lawEditor').focus(); document.execCommand(cmd, false, val||null); docChanged(); }
/* placeholders: al hacer clic, se selecciona para escribir encima */
document.addEventListener('click', e=>{ const ph=e.target.closest && e.target.closest('#lawEditor .ph'); if(!ph) return;
  const r=document.createRange(); r.selectNodeContents(ph); const s=getSelection(); s.removeAllRanges(); s.addRange(r); ph.classList.remove('ph'); });
/* citar un artículo guardado */
function citeArticle(){
  const arts=law().articles; if(!arts.length){ toast('«Primero guarda artículos desde 📜 Códigos ⚖️»'); return; }
  const ed=document.getElementById('lawEditor'); const s=getSelection(); const range=s.rangeCount && ed.contains(s.anchorNode)?s.getRangeAt(0).cloneRange():null;
  let ov=document.getElementById('citeOv');
  if(!ov){ ov=document.createElement('div'); ov.id='citeOv'; ov.className='ficha-overlay'; ov.style.zIndex=89; ov.onclick=e=>{ if(e.target===ov) ov.classList.remove('show'); }; document.querySelector('.win').appendChild(ov); }
  ov.innerHTML='<div class="frame-card" style="width:100%; max-width:560px; max-height:80vh; overflow-y:auto"><div style="font-family:var(--disp); font-weight:700; font-size:18px">⚖️ Citar un artículo</div><div class="lbl">Toca uno para insertarlo en tu escrito</div><div class="cite-list"></div></div>';
  const list=ov.querySelector('.cite-list');
  arts.forEach(a=>{ const b=document.createElement('button'); b.className='idx-item'; b.innerHTML='<span class="pg">'+esc(codeOf(a.code).ab)+' '+esc(a.num)+'</span><span>'+esc(String(a.text).slice(0,140))+'…</span>';
    b.onclick=()=>{ ov.classList.remove('show'); ed.focus(); if(range){ s.removeAllRanges(); s.addRange(range); }
      document.execCommand('insertHTML', false, '<blockquote>'+esc(articleCite(a))+'</blockquote><p></p>'); docChanged(); state.c.cite=1; checkAch(); };
    list.appendChild(b); });
  ov.classList.add('show');
}
/* abrir un Word (.docx) para seguir editándolo aquí */
async function importDocx(inp){
  const f=inp.files[0]; inp.value=''; if(!f) return;
  if(!window.mammoth){ toast('«No encuentro el lector de Word 🥺»'); return; }
  try{
    const r=await mammoth.convertToHtml({arrayBuffer:await f.arrayBuffer()});
    const d={id:lawId(), title:f.name.replace(/\.docx$/i,''), tpl:'blanco', kind:'escrito', course:document.getElementById('lawDocCourse').value||'', html:r.value||'<p></p>', created:Date.now(), updated:Date.now()};
    law().docs.unshift(d);
    await idbPut('files','law_orig_'+d.id, f); fsMirror('derecho/originales/'+fsSafe(f.name), f);
    scheduleSave(); openDoc(d.id);
    toast('«¡'+esc(f.name)+' abierto! 📝 Ya puedes editarlo aquí (el original queda guardado aparte)»');
  }catch(e){ toast('«No pude abrir ese Word 🥺 ¿es un .docx?»'); }
}
/* ---------- exportar ---------- */
function docHtmlForPrint(d){
  return '<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:"Times New Roman",serif; font-size:12pt; line-height:1.5; text-align:justify; color:#000}'
    +'h1{font-size:14pt; text-align:center; margin:0 0 12pt} h2{font-size:12pt; margin:14pt 0 6pt; text-transform:uppercase} h3{font-size:12pt; font-style:italic}'
    +'p{margin:0 0 8pt} blockquote{margin:6pt 1.2cm; font-size:11pt; line-height:1.2} .ph{background:none}</style></head><body>'+d.html.replace(/class="ph"/g,'')+'</body></html>';
}
async function exportPdf(){
  if(!lawDoc) return; docChanged(); lawDoc.html=document.getElementById('lawEditor').innerHTML;
  const buf=await bibFS.htmlToPdf(docHtmlForPrint(lawDoc)); if(!buf){ toast('«No pude crear el PDF 🥺»'); return; }
  const p=await bibFS.saveAs(fsSafe(lawDoc.title)+'.pdf', buf, 'pdf'); if(p) toast('«PDF listo para entregar 📄✨»');
}
/* .docx real (Office Open XML) con Times New Roman 12, interlineado 1,5 y justificado */
function xmlEsc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function runsOf(node, st){
  let out='';
  node.childNodes.forEach(n=>{
    if(n.nodeType===3){ if(!n.nodeValue) return; out+='<w:r><w:rPr>'+(st.b?'<w:b/>':'')+(st.i?'<w:i/>':'')+(st.u?'<w:u w:val="single"/>':'')+'</w:rPr><w:t xml:space="preserve">'+xmlEsc(n.nodeValue.replace(/ /g,' '))+'</w:t></w:r>'; return; }
    if(n.nodeType!==1) return;
    const t=n.tagName, s2=Object.assign({}, st);
    if(t==='B'||t==='STRONG') s2.b=true; if(t==='I'||t==='EM') s2.i=true; if(t==='U') s2.u=true;
    if(t==='BR'){ out+='<w:r><w:br/></w:r>'; return; }
    out+=runsOf(n, s2);
  });
  return out;
}
function paraXml(el, style){
  const al=(el.style && el.style.textAlign)||'', jc={center:'center', right:'right', left:'left', justify:'both'}[al]||'';
  return '<w:p><w:pPr>'+(style?'<w:pStyle w:val="'+style+'"/>':'')+(jc?'<w:jc w:val="'+jc+'"/>':'')+'</w:pPr>'+runsOf(el, {})+'</w:p>';
}
function htmlToDocxBody(html){
  const root=document.createElement('div'); root.innerHTML=html; let x='';
  const walk=parent=>parent.childNodes.forEach(el=>{
    if(el.nodeType===3){ if(el.nodeValue.trim()) x+='<w:p>'+runsOf({childNodes:[el]}, {})+'</w:p>'; return; }
    if(el.nodeType!==1) return;
    const t=el.tagName;
    if(t==='H1') x+=paraXml(el,'Ttulo1'); else if(t==='H2') x+=paraXml(el,'Ttulo2'); else if(t==='H3') x+=paraXml(el,'Ttulo3');
    else if(t==='BLOCKQUOTE') x+=paraXml(el,'Cita');
    else if(t==='UL'||t==='OL'){ let k=0; el.querySelectorAll(':scope > li').forEach(li=>{ k++; const pre=t==='OL'?k+'. ':'• '; x+='<w:p><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr><w:r><w:t xml:space="preserve">'+pre+'</w:t></w:r>'+runsOf(li,{})+'</w:p>'; }); }
    else if(t==='DIV'||t==='SECTION'||t==='ARTICLE') walk(el);
    else x+=paraXml(el, '');
  });
  walk(root); return x;
}
async function exportDocx(){
  if(!lawDoc) return; lawDoc.html=document.getElementById('lawEditor').innerHTML; scheduleSave();
  const z=new JSZip();
  z.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>');
  z.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  z.file('word/_rels/document.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
  const rpr='<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:lang w:val="es-PE"/></w:rPr>';
  z.file('word/styles.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    +'<w:docDefaults><w:rPrDefault>'+rpr+'</w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="360" w:lineRule="auto"/><w:jc w:val="both"/></w:pPr></w:pPrDefault></w:docDefaults>'
    +'<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>'
    +'<w:style w:type="paragraph" w:styleId="Ttulo1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:jc w:val="center"/><w:spacing w:after="240"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style>'
    +'<w:style w:type="paragraph" w:styleId="Ttulo2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="240" w:after="120"/><w:jc w:val="left"/></w:pPr><w:rPr><w:b/><w:caps/></w:rPr></w:style>'
    +'<w:style w:type="paragraph" w:styleId="Ttulo3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:i/></w:rPr></w:style>'
    +'<w:style w:type="paragraph" w:styleId="Cita"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="680" w:right="680"/><w:spacing w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:sz w:val="22"/></w:rPr></w:style></w:styles>');
  z.file('word/document.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
    +htmlToDocxBody(lawDoc.html.replace(/<span class="ph">/g,'<span>'))
    +'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1701" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>');
  const buf=await z.generateAsync({type:'arraybuffer', mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  const p=await bibFS.saveAs(fsSafe(lawDoc.title)+'.docx', buf, 'docx'); if(p) toast('«Documento de Word listo 📘✨»');
  state.c.docx=1; checkAch();
}
