/* Enganches y arranque */
/* ---------- Enganches (vistas, contadores y guardado) ---------- */
const _show=show;
show=function(id){
  _show(id);
  if(id==='v-stats'){ renderStats(); renderCalendar(); }
  if(id==='v-achievements'){ checkAch(); renderAchievements(); renderBookmarks(); }
  if(id==='v-quotes') renderQuotes();
  if(id==='v-diary') renderDiary();
  if(id==='v-calendar'){ renderCal2(); renderOurDatesCard(); }
  if(id==='v-letters'){ renderLetters(); updateLettersBadge(); }
  if(id==='v-wrapped') renderWrapped();
  if(id==='v-wishes'){ renderWishes(); const f=document.getElementById('lnF'); if(f && !f.value) f.value=fmtDay(new Date()); }
  if(id==='v-stats'){ renderSagas(); renderAdvStats(); }
  if(id==='v-map'){ renderMap(); renderMapPanel(); }
  if(id==='v-goals'){ renderGoals(); const f=document.getElementById('mgFrom'); if(f && !f.value) f.value=fmtDay(new Date()); }
  if(id==='v-album') renderAlbum();
  if(id==='v-historia') renderHistoria();
  if(id==='v-plan') renderPlanner();
  if(id==='v-law'){ lawHome(); if(!document.getElementById('lawTpls').childElementCount) document.getElementById('lawTpls').innerHTML=Object.entries(LAW_TEMPLATES).map(([k,t])=>'<button class="ld-tpl" onclick="newDoc(\''+k+'\')"><span>'+t.e+'</span>'+esc(t.n)+'</button>').join(''); if(lawTabNow!=='visor'&&lawTabNow!=='editor') lawTab(lawTabNow); }
};
const _sb=seasonBurst; seasonBurst=function(...a){ if(state.c){ state.c.season=1; checkAch(); scheduleSave(); } return _sb(...a); };
const _ta=toggleAmb; toggleAmb=function(...a){ if(state.c){ state.c.amb=1; checkAch(); scheduleSave(); } return _ta(...a); };
const _cas=confirmAddSection; confirmAddSection=function(...a){
  const n=state.sections.length; const r=_cas(...a);
  if(state.sections.length>n && state.c){ state.c.shelves=(state.c.shelves||0)+1; checkAch(); }
  scheduleSave(); return r;
};
const _ms=moveSpine; moveSpine=function(...a){ const r=_ms(...a); scheduleSave(); return r; };
const _dsx=delSection; delSection=function(...a){ const r=_dsx(...a); scheduleSave(); return r; };
const _st=setTheme; setTheme=function(n,b){ const r=_st(n,b); settings.theme=n; scheduleSave(); return r; };
const _sl=setLang; setLang=function(l){ const r=_sl(l); scheduleSave(); return r; };
const _chk=checkAch; checkAch=function(){ _chk(); if(typeof checkGoals==='function') checkGoals(); if(typeof checkLetters==='function') checkLetters(); };
const _mrt=markReadToday; markReadToday=function(){ _mrt(); checkAch(); scheduleSave(); };
const _dr=doRegister; doRegister=function(...a){ const r=_dr(...a); if(r&&r.then) r.then(()=>{ checkAch(); saveState(); }); else { checkAch(); saveState(); } return r; };
const _sp=switchProfile; switchProfile=function(...a){ const r=_sp(...a); applySave({}); scheduleSave(); return r; };

/* ---------- Amanecer del salón ---------- */
if(navigator.userAgent.indexOf('Electron')>-1 || (window.bibFS && !bibFS.web)) document.body.classList.add('electron');
(async function initV12(){
  await idbOpen();
  await loadState();
  ensureBookIds();
  migrateEmoji();
  await autoPurgeTrash();
  await preloadFileURLs();
  restoreUI();
  syncTray();
  lockOnStart();
  renderLibrary();
  renderQuotes();
  renderDiary();
  startIdle();
  initSwipe();
  initDrop();
  initFlipDrag();
  restoreSounds();
  initStatTip();
  initUpdates();
  loadPortrait();
  const an=document.getElementById('setAutoNight'); if(an) an.checked=!!settings.autoNight;
  autoNightTick(); setInterval(autoNightTick, 60000);
  countdownTeaser();
  initBuddyAnim();
  initSalonLife();
  initRuler(); applyAccess();
  const acc=settings.access||{};
  const af=document.getElementById('setAccFont'); if(af) af.value=acc.font||'';
  [['setAccSp','spacing'],['setAccRuler','ruler'],['setAccCream','cream']].forEach(([i,k])=>{ const e=document.getElementById(i); if(e) e.checked=!!acc[k]; });
  const bt=document.getElementById('setBedtime'); if(bt) bt.checked=!!settings.bedtime;
  const bm=document.getElementById('setBedMins'); if(bm) bm.value=String(settings.bedtimeMins||20);
  const bb=document.getElementById('bedBtn'); if(bb) bb.style.display=settings.bedtime?'':'none';
  const wk=document.getElementById('setWeekly'); if(wk) wk.checked=settings.weeklyBackup!==false;
  const yb=document.getElementById('ybYear'); if(yb){ const y=new Date().getFullYear(); yb.innerHTML=[y,y-1,y-2,y-3].map(v=>'<option>'+v+'</option>').join(''); }
  setTimeout(()=>weeklyBackup(false), 90000);
  planNudge();
  initLaw();
  const ba=document.getElementById('setBookAnim'); if(ba) ba.checked=settings.bookAnim!==false;
  const wc=document.getElementById('setWxCity'); if(wc) wc.value=(settings.wxPlace&&settings.wxPlace.name)||'Trujillo';
  const pf=document.getElementById('setPageFlip'); if(pf) pf.checked=settings.pageFlip!==false;
  const ps=document.getElementById('setPageSound'); if(ps) ps.checked=settings.pageSound!==false;
  applyOutfit();
  startChatter();
  seedStreak();
  renderCalendar();
  applySeason();
  await loadExtraFacts();
  greetStreak();
  greetEfemeride();
  const fs0=document.getElementById('setFaces'); if(fs0) fs0.value=settings.faceSet||'clasicas';
  renderFaceButtons();
  setTimeout(checkLetters, 6000);
  announceEvents();
  if(!lastMilestone) lastMilestone=booksRead();
  if(booksRead()>=100) document.querySelector('.win').classList.add('garland');
  updateGoal();
  renderStats();
  renderAchievements();
  checkAch();
  setInterval(()=>{ state.timeMin=(state.timeMin||0)+1;
    if(curBook && document.getElementById('v-reader').classList.contains('active'))
      curBook.mins=(curBook.mins||0)+1;
    scheduleSave();
    if(document.getElementById('v-stats').classList.contains('active')) renderStats(); }, 60000);
  setInterval(checkReminder, 30000);
  setInterval(()=>{ if(saveDirty) saveState(); }, 5000);
  window.addEventListener('beforeunload', saveState);
  window.addEventListener('keydown', e=>{
    if(!document.getElementById('v-reader').classList.contains('active')) return;
    if(e.target && (e.target.isContentEditable || /INPUT|TEXTAREA/.test(e.target.tagName))) return;
    if(e.key==='ArrowRight') nextPage();
    if(e.key==='ArrowLeft') prevPage();
    if(e.key==='+'||e.key==='=') zoomIn();
    if(e.key==='-') zoomOut();
    if(e.key==='b'||e.key==='B') toggleBookmark();
  });
  setTimeout(()=>maybeCelebrate(false), 1600);
})();
