/* v1.2: metas con premios — las crea ella para sí misma, o Yeri desde su escritorio con un premio (vale, carta o accesorio) */

const GOAL_TYPES={
  books:{n:'Terminar libros', u:'libro(s)', e:'📚'},
  pages:{n:'Leer páginas', u:'página(s)', e:'📃'},
  days:{n:'Días con lectura', u:'día(s)', e:'🌸'},
  streak:{n:'Racha de días seguidos', u:'día(s) seguidos', e:'🔥'},
  saga:{n:'Completar una saga', u:'libro(s) de la saga', e:'🏰'}
};
function inRange(iso, g){ return iso && iso>=g.from && (!g.until || iso<=g.until); }
function goalProgress(g){
  const shelf=state.sections.flatMap(s=>s.books);
  switch(g.type){
    case 'books': return shelf.filter(b=>inRange(b.doneDate, g)).length;
    case 'pages': return Object.keys(state.pageLog||{}).filter(k=>inRange(k, g)).reduce((a,k)=>a+(state.pageLog[k]||0),0);
    case 'days': return (state.readDays||[]).filter(k=>inRange(k, g)).length;
    case 'streak': { const ds=(state.readDays||[]).filter(k=>inRange(k, g)).sort(); let best=0, run=0, prev=null;
      ds.forEach(k=>{ const d=isoToDate(k); run=(prev && d-prev===864e5)?run+1:1; best=Math.max(best,run); prev=d; }); return best; }
    case 'saga': return shelf.filter(b=>b.series && b.series.name===g.saga).length;
  }
  return 0;
}
function goalTarget(g){
  if(g.type==='saga'){ const t=Math.max(0, ...allBooks().filter(b=>b.series && b.series.name===g.saga).map(b=>b.series.total||0)); return t||g.target||1; }
  return g.target||1;
}
function rewardText(r){
  if(!r || r.kind==='ninguno') return '';
  if(r.kind==='vale') return '🎟️ Vale por: '+r.text;
  if(r.kind==='carta') { const l=(state.letters||[]).find(x=>x.id===r.letterId); return '💌 Carta secreta'+(l?': «'+l.title+'»':''); }
  if(r.kind==='accesorio') return r.emoji+' Accesorio exclusivo para tu libro';
  return '';
}
/* revisa si alguna meta se cumplió y entrega el premio (una sola vez) */
function checkGoals(){
  (state.goals||[]).forEach(g=>{
    if(g.reachedAt) return;
    if(goalProgress(g)>=goalTarget(g)){
      g.reachedAt=Date.now(); scheduleSave();
      if(g.reward && g.reward.kind==='accesorio' && g.reward.emoji){ bonusUnlocks.add(g.reward.emoji); unlockedCount++; }
      state.c.goals=(state.c.goals||0)+1;
      setTimeout(()=>showCeleb({grand:true, emoji:'🏅✨', title:'¡Meta cumplida!',
        msg:'«'+g.title+'»\n\n'+(rewardText(g.reward) ? 'Tu premio:\n'+rewardText(g.reward)+(g.reward.kind==='vale'?'\n\nBúscalo en «Metas y premios» para canjearlo 🎟️':g.reward.kind==='carta'?'\n\nYa puedes abrirla en «Cartas secretas» 💌':'\n\nYa está en el Vestidor 👗') : '¡Lo lograste! Estoy tan orgulloso de ti 🥹')}), 1200);
    }
  });
  const b=document.getElementById('goalsBadge');
  if(b){ const n=(state.goals||[]).filter(g=>g.reachedAt && g.reward && g.reward.kind==='vale' && !g.redeemedAt).length; b.textContent=n?String(n):''; }
}
function renderGoals(){
  const box=document.getElementById('goalsGrid'); if(!box) return;
  const gs=(state.goals||[]).slice().sort((a,b)=>(a.reachedAt?1:0)-(b.reachedAt?1:0) || (a.until||'9').localeCompare(b.until||'9'));
  box.innerHTML='';
  if(!gs.length) box.innerHTML='<div class="stat-card" style="grid-column:1/-1; text-align:center"><div style="font-size:30px">🏅</div><div style="font-family:var(--hand); font-size:18px">Aún no hay metas… crea la tuya abajo, o espera una sorpresa con premio 🎁</div></div>';
  gs.forEach(g=>{
    const p=goalProgress(g), t=goalTarget(g), pct=Math.min(100, Math.round(p/t*100)), T=GOAL_TYPES[g.type];
    const left=g.until ? Math.ceil((isoToDate(g.until)-isoToDate(fmtDay(new Date())))/864e5) : null;
    const c=document.createElement('div'); c.className='stat-card goal-card'+(g.reachedAt?' won':'')+(left!=null&&left<0&&!g.reachedAt?' expired':'');
    const prize=g.reward && g.reward.kind!=='ninguno' ? (g.reachedAt || g.reward.show ? rewardText(g.reward) : '🎁 Premio sorpresa (se revela al cumplirla)') : '';
    c.innerHTML='<div style="display:flex; justify-content:space-between; gap:8px"><div style="font-family:var(--disp); font-weight:700; font-size:16px">'+T.e+' '+esc(g.title)+'</div>'
      +(g.by==='yeri'?'<span class="chip" style="font-size:10.5px; cursor:default">de '+esc(g.from_name||'Yeri')+' 💌</span>':'<span class="gdel" title="Quitar meta">✕</span>')+'</div>'
      +'<div class="lbl" style="font-size:12px; margin-top:2px">'+T.n+(g.type==='saga'?' «'+esc(g.saga)+'»':'')+' · desde el '+niceDate(g.from)+(g.until?' hasta el '+niceDate(g.until):'')+'</div>'
      +'<div class="gbar"><i style="width:'+pct+'%"></i></div>'
      +'<div style="display:flex; justify-content:space-between; font-size:12.5px"><b>'+p+' de '+t+' '+T.u+'</b><span>'+(g.reachedAt?'🏅 ¡Cumplida el '+niceDate(fmtDay(new Date(g.reachedAt)))+'!':left==null?'':left<0?'⌛ terminó el plazo':left===0?'⏳ ¡hoy es el último día!':'⏳ quedan '+left+' día(s)')+'</span></div>'
      +(prize?'<div class="prize'+(g.reachedAt?' open':'')+'">'+esc(prize)+'</div>':'')
      +(g.reachedAt && g.reward && g.reward.kind==='vale' ? (g.redeemedAt?'<div class="lbl" style="text-align:center; font-size:12px; margin-top:6px">✅ Canjeado el '+niceDate(fmtDay(new Date(g.redeemedAt)))+'</div>':'<div style="text-align:center; margin-top:8px"><button class="btn rose small">🎟️ Canjear vale</button></div>') : '');
    const d=c.querySelector('.gdel'); if(d) d.onclick=()=>{ if(!confirm('¿Quitar la meta «'+g.title+'»?')) return; state.goals=state.goals.filter(x=>x!==g); scheduleSave(); renderGoals(); };
    const rb=c.querySelector('.btn.rose'); if(rb) rb.onclick=()=>{ if(!confirm('¿Canjear «'+g.reward.text+'»? 🎟️\nEnséñale este vale a quien te lo regaló 💗')) return;
      g.redeemedAt=Date.now(); scheduleSave(); renderGoals(); checkGoals(); seasonBurst(5000, 18); toast('«¡Vale canjeado! Que lo disfruten muchísimo 💗🎟️»'); };
    box.appendChild(c);
  });
}
function goalTypeUI(prefix){
  const t=document.getElementById(prefix+'Type').value;
  document.getElementById(prefix+'SagaWrap').style.display=t==='saga'?'block':'none';
  document.getElementById(prefix+'Target').style.display=t==='saga'?'none':'inline-block';
  const dl=document.getElementById(prefix+'Saga');
  if(t==='saga' && dl){ dl.innerHTML=[...new Set(allBooks().map(b=>b.series&&b.series.name).filter(Boolean))].map(s=>'<option>'+esc(s)+'</option>').join('') || '<option value="">(primero marca libros como saga)</option>'; }
}
function readGoalForm(prefix){
  const title=document.getElementById(prefix+'Title').value.trim();
  const type=document.getElementById(prefix+'Type').value;
  const target=parseInt(document.getElementById(prefix+'Target').value)||0;
  const saga=type==='saga' ? document.getElementById(prefix+'Saga').value : null;
  if(!title){ toast('«Ponle un nombre bonito a la meta 🏅»'); return null; }
  if(type!=='saga' && target<1){ toast('«¿Cuánto es la meta? 🎯»'); return null; }
  if(type==='saga' && !saga){ toast('«Elige la saga 🏰»'); return null; }
  return {id:'G'+Date.now().toString(36), title, type, target, saga,
    from:document.getElementById(prefix+'From').value||fmtDay(new Date()), until:document.getElementById(prefix+'Until').value||null, created:Date.now()};
}
function addMyGoal(){
  const g=readGoalForm('mg'); if(!g) return;
  g.by='yo'; g.reward={kind:'ninguno'};
  const self=document.getElementById('mgReward').value.trim(); if(self) g.reward={kind:'vale', text:self, show:true};
  (state.goals=state.goals||[]).push(g); scheduleSave();
  ['mgTitle','mgTarget','mgReward'].forEach(i=>document.getElementById(i).value='');
  renderGoals(); checkGoals(); toast('«¡Meta en marcha! Yo te acompaño en cada página 🏅💗»');
}
/* --- desde el escritorio de Yeri --- */
function addDeskGoal(){
  const g=readGoalForm('dg'); if(!g) return;
  const kind=document.getElementById('dgRKind').value;
  g.by='yeri'; g.from_name=document.getElementById('dkFrom').value.trim()||'Yeri';
  if(kind==='vale'){ const t=document.getElementById('dgRText').value.trim(); if(!t){ toast('«¿Qué regalo es? 🎟️»'); return; } g.reward={kind, text:t}; }
  else if(kind==='carta'){ const id=document.getElementById('dgRLetter').value; if(!id){ toast('«Elige la carta (escríbela arriba primero) 💌»'); return; }
    g.reward={kind, letterId:id}; const l=state.letters.find(x=>x.id===id); if(l){ l.cond={t:'goal', v:g.id, label:g.title}; l.announced=false; } }
  else if(kind==='accesorio'){ g.reward={kind, emoji:document.getElementById('dgREmoji').value||'💎'}; }
  else g.reward={kind:'ninguno'};
  g.reward.show=document.getElementById('dgRShow').checked;
  (state.goals=state.goals||[]).push(g); scheduleSave(); saveState();
  document.getElementById('dgTitle').value=''; document.getElementById('dgTarget').value=''; document.getElementById('dgRText').value='';
  renderDeskGoals(); renderGoals(); renderDesk();
  toast('«Meta con premio creada 🏅🎁 ella la verá en «Metas y premios»»');
}
function deskGoalRewardUI(){
  const k=document.getElementById('dgRKind').value;
  ['dgRText','dgRLetter','dgREmoji'].forEach(i=>document.getElementById(i).style.display='none');
  if(k==='vale') document.getElementById('dgRText').style.display='block';
  if(k==='carta'){ const s=document.getElementById('dgRLetter'); s.style.display='block';
    s.innerHTML=(state.letters||[]).filter(l=>!l.openedAt).map(l=>'<option value="'+l.id+'">'+esc(l.title)+'</option>').join('')||'<option value="">(escribe primero una carta arriba)</option>'; }
  if(k==='accesorio') document.getElementById('dgREmoji').style.display='block';
}
function renderDeskGoals(){
  const l=document.getElementById('dgList'); if(!l) return;
  const gs=(state.goals||[]).filter(g=>g.by==='yeri');
  l.innerHTML=gs.length?'':'<div class="lbl" style="font-style:italic">Aún no hay metas con premio 🏅</div>';
  gs.forEach(g=>{ const r=document.createElement('div'); r.className='idx-item'; r.style.cursor='default';
    r.innerHTML='<span class="pg">'+(g.reachedAt?'🏅':Math.round(goalProgress(g)/goalTarget(g)*100)+'%')+'</span><span style="flex:1"><b>'+esc(g.title)+'</b><br><span style="font-size:11.5px; color:var(--ink-soft)">'+esc(rewardText(g.reward)||'sin premio')+(g.redeemedAt?' · canjeado':'')+'</span></span><button class="chip" style="border-color:var(--wax)">✕</button>';
    r.querySelector('button').onclick=()=>{ if(!confirm('¿Quitar la meta «'+g.title+'»?')) return; state.goals=state.goals.filter(x=>x!==g); scheduleSave(); renderDeskGoals(); renderGoals(); };
    l.appendChild(r); });
}
/* las cartas pueden abrirse al cumplir una meta */
COND_TYPES.goal={n:'Al cumplir una meta', hint:c=>'Se abrirá cuando cumplas la meta «'+(c.label||'especial')+'» 🏅'};
const _luG=letterUnlocked;
letterUnlocked=function(l){ if(l.cond && l.cond.t==='goal'){ const g=(state.goals||[]).find(x=>x.id===l.cond.v); return !!(g && g.reachedAt); } return _luG(l); };
/* sección de metas dentro del escritorio de Yeri */
const _rdG=renderDesk;
renderDesk=function(){
  _rdG();
  const card=document.querySelector('#deskOv .frame-card');
  if(card && !document.getElementById('dgBox')){
    const box=document.createElement('div'); box.id='dgBox';
    box.innerHTML='<div class="divider">🏅</div><div style="font-family:var(--disp); font-weight:700; font-size:15px">Metas con premio</div>'
      +'<input type="text" id="dgTitle" placeholder="p. ej. Reto de verano" style="margin-top:6px">'
      +'<div style="display:flex; gap:6px; margin-top:6px; flex-wrap:wrap"><select id="dgType" onchange="goalTypeUI(\'dg\')" style="width:auto">'+Object.keys(GOAL_TYPES).map(k=>'<option value="'+k+'">'+GOAL_TYPES[k].e+' '+GOAL_TYPES[k].n+'</option>').join('')+'</select>'
      +'<input type="number" id="dgTarget" min="1" placeholder="¿cuántos?" style="width:110px"><span id="dgSagaWrap" style="display:none"><select id="dgSaga" style="width:auto"></select></span></div>'
      +'<div style="display:flex; gap:6px; margin-top:6px; align-items:center; flex-wrap:wrap"><span class="lbl">desde</span><input type="date" id="dgFrom" style="width:auto"><span class="lbl">hasta (opcional)</span><input type="date" id="dgUntil" style="width:auto"></div>'
      +'<div style="display:flex; gap:6px; margin-top:6px; flex-wrap:wrap"><select id="dgRKind" onchange="deskGoalRewardUI()" style="width:auto"><option value="vale">🎟️ Vale de regalo</option><option value="carta">💌 Abrir una carta secreta</option><option value="accesorio">👗 Accesorio exclusivo</option><option value="ninguno">Sin premio</option></select>'
      +'<input type="text" id="dgRText" placeholder="Vale por… (una cena, un libro nuevo, un paseo)" style="flex:1; min-width:200px"><select id="dgRLetter" style="display:none; flex:1"></select>'
      +'<select id="dgREmoji" style="display:none; width:auto"><option>💎</option><option>👑</option><option>🦄</option><option>🌈</option><option>🎀</option><option>🏆</option><option>💐</option></select></div>'
      +'<label class="setrow chk" style="margin:6px 0"><span class="sl" style="font-size:13px">Mostrar el premio desde ya (si no, es sorpresa)</span><input type="checkbox" id="dgRShow"></label>'
      +'<div style="text-align:right"><button class="btn rose small" onclick="addDeskGoal()">Crear meta con premio 🏅</button></div>'
      +'<div id="dgList" style="display:flex; flex-direction:column; gap:6px; margin-top:8px"></div>';
    card.insertBefore(box, card.lastElementChild);
    document.getElementById('dgFrom').value=fmtDay(new Date());
  }
  renderDeskGoals(); deskGoalRewardUI();
};
