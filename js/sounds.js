/* Sonidos ambientales */
/* ===== Sonidos ambientales: grabaciones REALES (archive.org) con respaldo offline ===== */
let ac=null, amb={}, masterVol=.7, customSnds=[];
const AMB_SRC={
  fuego:{ local:'sounds/fuego.ogg', onLocal:'«Crepita la chimenea del salón… 🔥»',
    urls:['https://archive.org/download/Freesound-263994/Fireplace_3_hours-263994.mp3'],
    on:'«Crepita una chimenea de verdad (3 h)… 🔥»' },
  lluvia:{ local:'sounds/lluvia.ogg', onLocal:'«Llueve sobre los jardines del salón… 🌧️»',
    urls:['https://archive.org/download/1HourThunderstorm/1HrThunderstorm.mp3'],
    on:'«Una hora de tormenta real sobre Versalles… 🌧️⚡»' },
  clave:{ local:'sounds/clave.ogg', onLocal:'«El clavecín del salón toca para ti… 🎻✨»',
    urls:[
      'https://archive.org/download/lp_sonatas-for-harpsichord-vol-vii_domenico-scarlatti-fernando-valenti/disc1/01.03.%20Sonatas%20For%20Harpsichord%3A%20Longo%20304%20In%20G%20Major.mp3',
      'https://archive.org/download/lp_sonatas-for-harpsichord-vol-vii_domenico-scarlatti-fernando-valenti/disc1/01.01.%20Sonatas%20For%20Harpsichord%3A%20Longo%20470%20In%20E%20Major.mp3',
      'https://archive.org/download/lp_sonatas-for-harpsichord-vol-vii_domenico-scarlatti-fernando-valenti/disc1/02.01.%20Sonatas%20For%20Harpsichord%3A%20Longo%20428%20In%20A%20Major.mp3',
      'https://archive.org/download/lp_sonatas-for-harpsichord-vol-vii_domenico-scarlatti-fernando-valenti/disc1/02.06.%20Sonatas%20For%20Harpsichord%3A%20Longo%20301%20In%20C%20Major.mp3'],
    on:'«Clavecín de verdad: sonatas de Scarlatti (1955) 🎻✨»' }
};
function ensureAC(){ if(!ac) ac=new (window.AudioContext||window.webkitAudioContext)(); }
function makeNoise(freq,type,gainV,crackle){
  const size=2*ac.sampleRate, buf=ac.createBuffer(1,size,ac.sampleRate), d=buf.getChannelData(0);
  let last=0;
  for(let i=0;i<size;i++){ const w=Math.random()*2-1; last=(last+0.02*w)/1.02; d[i]=crackle?last*3.5:w; }
  const src=ac.createBufferSource(); src.buffer=buf; src.loop=true;
  const f=ac.createBiquadFilter(); f.type=type; f.frequency.value=freq;
  const g=ac.createGain(); g.gain.value=gainV*masterVol;
  src.connect(f); f.connect(g); g.connect(ac.destination); src.start();
  let ivl=null;
  if(crackle) ivl=setInterval(()=>g.gain.setTargetAtTime(gainV*masterVol*(0.55+Math.random()), ac.currentTime, .06), 280);
  return {stop(){ try{src.stop()}catch(e){} if(ivl)clearInterval(ivl); }, setVol(){ g.gain.value=gainV*masterVol; }};
}
function makeHarp(){
  const g=ac.createGain(); g.gain.value=.045*masterVol; g.connect(ac.destination);
  const notes=[261.6,311.1,392,466.2,523.3,466.2,392,311.1];
  let i=0;
  const ivl=setInterval(()=>{
    const o=ac.createOscillator(); o.type='triangle';
    o.frequency.value=notes[i++%notes.length]*(Math.random()<.15?2:1);
    const e=ac.createGain(); e.gain.setValueAtTime(.6,ac.currentTime);
    e.gain.exponentialRampToValueAtTime(.001,ac.currentTime+1.1);
    o.connect(e); e.connect(g); o.start(); o.stop(ac.currentTime+1.2);
  },430);
  return {stop(){ clearInterval(ivl); }, setVol(){ g.gain.value=.045*masterVol; }};
}
function synthFallback(kind){
  ensureAC();
  if(kind==='fuego') return makeNoise(420,'lowpass',.07,true);
  if(kind==='lluvia') return makeNoise(2400,'bandpass',.05,false);
  return makeHarp();
}
function toggleAmb(kind,btn){
  if(amb[kind]){ amb[kind].stop(); delete amb[kind]; btn.classList.remove('on'); toast('«Silencio en el salón… 🤫»'); return; }
  const src=AMB_SRC[kind];
  const mk=a=>({ stop(){ a.onerror=null; a.onended=null; a.pause(); a.src=''; }, setVol(){ a.volume=masterVol; } });
  const tryOnline=()=>{
    const audio=new Audio(); audio.volume=masterVol; audio.preload='auto';
    let track=0, fellBack=false;
    const playTrack=()=>{ audio.src=src.urls[track % src.urls.length]; audio.play().catch(()=>{}); };
    if(src.urls.length>1){ audio.onended=()=>{ track++; playTrack(); }; }
    else audio.loop=true;
    audio.onerror=()=>{
      if(fellBack) return; fellBack=true;
      try{ amb[kind]=synthFallback(kind); btn.classList.add('on');
        toast('«Uso mi versión de cámara del salón 🎼»');
      }catch(e){ btn.classList.remove('on'); delete amb[kind]; }
    };
    audio.onplaying=()=>{ if(!fellBack) toast(src.on); };
    playTrack();
    amb[kind]=mk(audio);
  };
  /* v17: primero el sonido incluido en la app (sin internet), luego el online, luego el sintetizado */
  if(src.local){
    const la=new Audio(); la.volume=masterVol; la.loop=true;
    let failed=false;
    const fail=()=>{ if(failed) return; failed=true; try{ la.pause(); }catch(e){} delete amb[kind]; tryOnline(); };
    la.onerror=fail;
    la.onplaying=()=>toast(src.onLocal||src.on);
    la.src=src.local;
    la.play().catch(fail);
    amb[kind]=mk(la);
  } else tryOnline();
  btn.classList.add('on');
}
function setVolume(v){
  masterVol=v/100;
  Object.values(amb).forEach(a=>a.setVol&&a.setVol());
  customSnds.forEach(c=>{ c.audio.volume=masterVol; });
}
/* v1.3: los sonidos propios se guardan en la memoria del salón y vuelven al abrir la app */
async function addCustomSound(inp){
  const file=inp.files[0]; if(!file) return;
  inp.value='';
  const id='s'+Date.now().toString(36);
  await idbPut('files','snd_'+id, file);
  (state.sounds=state.sounds||[]).push({id, name:file.name});
  scheduleSave();
  soundChip(id, file.name, file);
  toast('«¡Tu propio sonido ya vive en el salón para siempre! 🎵 tócalo para reproducirlo (clic derecho para quitarlo)»');
}
function soundChip(id, name, blob){
  const audio=new Audio(URL.createObjectURL(blob)); audio.loop=true; audio.volume=masterVol;
  const chip=document.createElement('button'); chip.className='sndchip';
  chip.textContent='🎵 '+name.replace(/\.[^.]+$/,'').slice(0,16);
  chip.title=name+' · clic derecho para quitarlo';
  const entry={audio, playing:false, id};
  chip.onclick=()=>{
    entry.playing=!entry.playing;
    chip.classList.toggle('on', entry.playing);
    entry.playing ? audio.play() : audio.pause();
  };
  chip.oncontextmenu=async ev=>{
    ev.preventDefault();
    if(!confirm('¿Quitar el sonido «'+name+'» del salón?')) return;
    audio.pause(); chip.remove();
    customSnds.splice(customSnds.indexOf(entry),1);
    state.sounds=(state.sounds||[]).filter(s=>s.id!==id);
    await idbDel('files','snd_'+id); scheduleSave();
    toast('«Sonido retirado del salón 🤫»');
  };
  customSnds.push(entry);
  document.getElementById('customSnds').appendChild(chip);
}
async function restoreSounds(){
  for(const s of (state.sounds||[])){
    const bl=await idbGet('files','snd_'+s.id);
    if(bl) soundChip(s.id, s.name, bl);
  }
}

