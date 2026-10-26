/* v1.8: diccionario y traductor dentro de la app
   1) sin internet: Wikcionario (definiciones en español y español↔inglés)
   2) si no está o quieres más: la RAE (dle.rae.es), mostrada dentro del salón */

let dictLoaded=null;
function loadDict(){
  if(dictLoaded) return dictLoaded;
  const load=src=>new Promise(res=>{ const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=res; document.head.appendChild(s); });
  dictLoaded=Promise.all([load('js/data/dict-es.js'), load('js/data/dict-en.js')]).then(()=>{
    /* índice inverso de formas: «corrió» → «correr» */
    window.DICT_LEMMA=Object.create(null);
    const g=window.DICT_FORMS_BY_LEMMA||{};
    for(const b in g) g[b].split(',').forEach(f=>{ if(!DICT_LEMMA[f]) DICT_LEMMA[f]=b; });
  });
  return dictLoaded;
}
const POS_ES={noun:'sustantivo', verb:'verbo', adj:'adjetivo', adv:'adverbio', name:'nombre propio', pron:'pronombre', prep:'preposición', conj:'conjunción', intj:'interjección', phrase:'locución', det:'determinante', num:'numeral', article:'artículo', proverb:'refrán', particle:'partícula', affix:'afijo', suffix:'sufijo', prefix:'prefijo', contraction:'contracción'};
function cleanWord(w){ return String(w||'').trim().split(/\s+/)[0].replace(/^[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+|[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$/g,''); }
/* busca la palabra tal cual, en minúscula, por su forma base o con reglas simples (plurales y -mente) */
function lookupEs(w){
  const lw=w.toLowerCase(), D=window.DICT_ES||{};
  const tries=[lw];
  if(window.DICT_LEMMA && DICT_LEMMA[lw]) tries.push(DICT_LEMMA[lw]);
  if(lw.endsWith('es')) tries.push(lw.slice(0,-2)); if(lw.endsWith('s')) tries.push(lw.slice(0,-1));
  if(lw.endsWith('mente')) tries.push(lw.slice(0,-5), lw.slice(0,-6)+'o');
  for(const t of tries) if(D[t]) return {lemma:t, defs:D[t]};
  return null;
}
async function dictPopup(word){
  word=cleanWord(word);
  if(!word){ toast('«Selecciona una palabra de la página y toca 📚 Definir»'); return; }
  let ov=document.getElementById('dictOv');
  if(!ov){ ov=document.createElement('div'); ov.id='dictOv'; ov.className='ficha-overlay'; ov.style.zIndex=88;
    ov.onclick=e=>{ if(e.target===ov) ov.classList.remove('show'); }; document.querySelector('.win').appendChild(ov); }
  ov.innerHTML='<div class="frame-card dict-card"><div class="dict-load">Abriendo el diccionario… 📚</div></div>';
  ov.classList.add('show');
  await loadDict();
  const es=lookupEs(word), lw=word.toLowerCase();
  const toEn=(window.DICT_ESEN||{})[lw] || (es && (window.DICT_ESEN||{})[es.lemma]);
  const toEs=(window.DICT_ENES||{})[lw];
  let h='<div class="dict-head"><div><div class="dict-w">'+esc(word)+'</div>'
    +(es && es.lemma!==lw?'<div class="lbl">forma de <b>'+esc(es.lemma)+'</b></div>':'')+'</div>'
    +'<button class="chip" onclick="document.getElementById(\'dictOv\').classList.remove(\'show\')">✕</button></div>'
    +'<div class="tabs dict-tabs"><button class="on" data-t="def">📖 Definición</button><button data-t="tra">🌍 Traducción</button><button data-t="rae">🏛️ RAE</button></div>'
    +'<div class="dict-body" data-p="def">';
  if(es) es.defs.forEach(([pos,...ds])=>{ h+='<div class="dict-pos">'+esc(POS_ES[pos]||pos||'')+'</div><ol>'+ds.map(d=>'<li>'+esc(d)+'</li>').join('')+'</ol>'; });
  else h+='<div class="lbl" style="font-style:italic">No encontré «'+esc(word)+'» en el diccionario del salón 🥺<br>Toca <b>🏛️ RAE</b> para buscarla en la Real Academia (necesita internet).</div>';
  h+='</div><div class="dict-body" data-p="tra" style="display:none">'
    +(toEn?'<div class="dict-pos">🇪🇸 → 🇬🇧 inglés</div><ol>'+toEn.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ol>':'')
    +(toEs?'<div class="dict-pos">🇬🇧 → 🇪🇸 español</div><div>'+toEs.map(t=>'<span class="chip dict-chip">'+esc(t)+'</span>').join(' ')+'</div>':'')
    +(!toEn && !toEs?'<div class="lbl" style="font-style:italic">Sin traducción guardada para «'+esc(word)+'» 🌍</div>':'')
    +'</div><div class="dict-body" data-p="rae" style="display:none"><div class="lbl">Cargando la RAE… 🏛️</div></div>'
    +'<div class="dict-foot lbl">Diccionario del salón: Wikcionario (CC BY-SA) · RAE: dle.rae.es</div>';
  ov.querySelector('.frame-card').innerHTML=h;
  const tabs=ov.querySelectorAll('.dict-tabs button');
  const go=t=>{ tabs.forEach(b=>b.classList.toggle('on', b.dataset.t===t)); ov.querySelectorAll('.dict-body').forEach(p=>p.style.display=p.dataset.p===t?'':'none'); if(t==='rae') loadRae(word, ov.querySelector('[data-p="rae"]')); };
  tabs.forEach(b=>b.onclick=()=>go(b.dataset.t));
  if(!es) go(toEs||toEn?'tra':'rae');
  state.c.dict=(state.c.dict||0)+1; checkAch(); scheduleSave();
  (state.vocab=state.vocab||[]).unshift({w:word, d:fmtDay(new Date()), b:curBook?curBook.t:''}); state.vocab=state.vocab.slice(0,300);
}
/* la RAE dentro del salón: se descarga su página y se muestra solo la definición */
async function loadRae(word, box){
  if(box.dataset.done) return; box.dataset.done=1;
  try{
    const r=await fetch('https://dle.rae.es/'+encodeURIComponent(word.toLowerCase()), {headers:{'Accept':'text/html'}});
    if(!r.ok) throw 0;
    const doc=new DOMParser().parseFromString(await r.text(), 'text/html');
    const art=doc.querySelector('article') || doc.querySelector('#resultados');
    if(!art || !art.textContent.trim()) throw 0;
    art.querySelectorAll('script,style,button,img,svg,a.e2,.c-rae-sharing,.c-collapse').forEach(x=>x.remove());
    art.querySelectorAll('a').forEach(a=>{ const s=document.createElement('span'); s.textContent=a.textContent; a.replaceWith(s); });
    art.querySelectorAll('*').forEach(x=>{ [...x.attributes].forEach(at=>{ if(at.name!=='class') x.removeAttribute(at.name); }); });
    box.innerHTML='<div class="rae-body">'+art.innerHTML+'</div><div style="text-align:right; margin-top:6px"><button class="chip" onclick="window.open(\'https://dle.rae.es/'+encodeURIComponent(word.toLowerCase())+'\',\'_blank\')">Abrir en el navegador ↗</button></div>';
  }catch(e){
    box.innerHTML='<div class="lbl" style="font-style:italic">No pude consultar la RAE ahora (¿sin internet?) 📡</div><div style="margin-top:8px"><button class="chip" onclick="window.open(\'https://dle.rae.es/'+encodeURIComponent(word.toLowerCase())+'\',\'_blank\')">Intentar en el navegador ↗</button></div>';
  }
}
/* el botón 📚 Definir del lector abre el diccionario del salón en vez del navegador */
function selectedWord(){
  if(typeof isEpubOpen==='function' && isEpubOpen() && epubSel){ try{ return epubSel.contents.window.getSelection().toString(); }catch(e){} }
  const s=window.getSelection(); return s && !s.isCollapsed ? s.toString() : '';
}
defineSel=function(){ dictPopup(selectedWord()); };
/* doble clic sobre una palabra del libro → diccionario */
document.addEventListener('dblclick', e=>{
  if(!document.getElementById('v-reader').classList.contains('active') || !e.target.closest('.textLayer,.reflow')) return;
  setTimeout(()=>{ const w=cleanWord(selectedWord()); if(w && w.length>1) dictPopup(w); }, 30);
});
ACH.push({id:'dict10', e:'📚', nm:'Curiosa de las palabras', st:'Busca 10 palabras en el diccionario', chk:()=>(state.c.dict||0)>=10});
