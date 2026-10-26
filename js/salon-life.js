/* v1.7: el salón vivo — chimenea con fuego animado, velas que titilan y una ventana con el clima real */

/* ---------- chimenea rococó ---------- */
const FIRE_SVG='<svg viewBox="0 0 120 110" class="fp-svg">'
 +'<defs><linearGradient id="fpm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBF4E8"/><stop offset="1" stop-color="#E3D3BC"/></linearGradient>'
 +'<radialGradient id="fpg" cx=".5" cy="1" r=".9"><stop offset="0" stop-color="#FFD58A" stop-opacity=".9"/><stop offset="1" stop-color="#FF8A3C" stop-opacity="0"/></radialGradient></defs>'
 +'<rect x="6" y="14" width="108" height="94" rx="6" fill="url(#fpm)" stroke="#C9A04A" stroke-width="2.5"/>'
 +'<rect x="0" y="6" width="120" height="12" rx="3" fill="#F7ECDD" stroke="#9A782C" stroke-width="2"/>'
 +'<path d="M30 108 V62 Q30 40 60 40 Q90 40 90 62 V108 Z" fill="#3A2A24" stroke="#C9A04A" stroke-width="2"/>'
 +'<ellipse class="fp-glow" cx="60" cy="100" rx="36" ry="22" fill="url(#fpg)"/>'
 +'<g class="fp-flames"><path class="fl f1" d="M60 100 C48 92 50 78 58 66 C58 76 66 78 64 68 C74 80 74 92 60 100 Z" fill="#FF9F43"/>'
 +'<path class="fl f2" d="M52 100 C44 94 46 84 50 78 C52 86 56 86 56 82 C60 90 58 96 52 100 Z" fill="#FFC56B"/>'
 +'<path class="fl f3" d="M68 100 C62 96 62 88 66 82 C68 88 72 88 72 84 C76 92 74 98 68 100 Z" fill="#FFD98A"/></g>'
 +'<rect x="40" y="99" width="40" height="5" rx="2" fill="#6B4A35"/><rect x="44" y="96" width="32" height="4" rx="2" fill="#7E583E" transform="rotate(-6 60 98)"/>'
 +'<path d="M46 30 q14 -10 28 0" stroke="#C27A8C" stroke-width="2" fill="none"/><circle cx="60" cy="27" r="3" fill="#C9A04A"/>'
 +'<text x="26" y="12" font-size="10">🕯️</text><text x="84" y="12" font-size="10">🕯️</text></svg>';
function renderFireplace(){
  const fl=document.querySelector('#v-library .floor'); if(!fl) return;
  let el=document.getElementById('fireplace');
  if(!el){ el=document.createElement('div'); el.id='fireplace'; el.title='La chimenea del salón · toca para encenderla o apagarla';
    el.innerHTML=FIRE_SVG; el.onclick=()=>{ const b=document.getElementById('amb-fuego'); if(b) toggleAmb('fuego', b); setTimeout(updateFireplace, 300); };
    fl.appendChild(el); }
  updateFireplace();
}
function updateFireplace(){
  const el=document.getElementById('fireplace'); if(!el) return;
  const h=new Date().getHours(), night=(h>=19||h<6), sound=!!(typeof amb!=='undefined' && amb.fuego);
  el.classList.toggle('lit', night||sound);
  document.querySelector('.win').classList.toggle('candles-on', night);
}

/* ---------- ventana con el clima real ---------- */
const WMO={0:['Despejado','☀️','clear'],1:['Casi despejado','🌤️','clear'],2:['Parcialmente nublado','⛅','cloudy'],3:['Nublado','☁️','cloudy'],
 45:['Neblina','🌫️','fog'],48:['Neblina','🌫️','fog'],51:['Garúa ligera','🌦️','drizzle'],53:['Garúa','🌦️','drizzle'],55:['Garúa intensa','🌧️','drizzle'],
 56:['Garúa helada','🌧️','drizzle'],57:['Garúa helada','🌧️','drizzle'],61:['Lluvia ligera','🌧️','rain'],63:['Lluvia','🌧️','rain'],65:['Lluvia fuerte','🌧️','rain'],
 66:['Lluvia helada','🌧️','rain'],67:['Lluvia helada','🌧️','rain'],71:['Nieve','🌨️','snow'],73:['Nieve','🌨️','snow'],75:['Nevada','❄️','snow'],77:['Nieve','🌨️','snow'],
 80:['Chubascos','🌦️','rain'],81:['Chubascos','🌧️','rain'],82:['Chubascos fuertes','⛈️','rain'],85:['Nieve','🌨️','snow'],86:['Nieve','🌨️','snow'],95:['Tormenta','⛈️','storm'],96:['Tormenta','⛈️','storm'],99:['Tormenta','⛈️','storm']};
function wxPlace(){ return settings.wxPlace || {name:'Trujillo', lat:-8.1116, lon:-79.0288}; }
async function fetchWeather(force){
  const c=state.weather;
  if(!force && c && Date.now()-c.at<30*60000 && c.place===wxPlace().name) return c;
  try{
    const p=wxPlace();
    const r=await fetch('https://api.open-meteo.com/v1/forecast?latitude='+p.lat+'&longitude='+p.lon+'&current=temperature_2m,weather_code,is_day,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1');
    if(!r.ok) throw 0;
    const j=await r.json();
    state.weather={at:Date.now(), place:p.name, t:Math.round(j.current.temperature_2m), code:j.current.weather_code, day:!!j.current.is_day,
      hum:j.current.relative_humidity_2m, max:Math.round(j.daily.temperature_2m_max[0]), min:Math.round(j.daily.temperature_2m_min[0])};
    scheduleSave();
  }catch(e){ /* sin internet: se usa el último dato o el cielo según la hora */ }
  return state.weather;
}
function weatherComment(w){
  const k=(WMO[w.code]||WMO[2])[2], h=new Date().getHours();
  if(k==='rain'||k==='drizzle') return '¡Está garuando afuera! Día perfecto para quedarse leyendo con una mantita ☕🌧️';
  if(k==='storm') return 'Hay tormenta… el salón es el lugar más seguro y acogedor del mundo ⛈️📚';
  if(k==='fog') return 'Neblina en la ciudad… como en las novelas de misterio 🌫️🕵️';
  if(!w.day) return 'Noche serena… las velas del salón ya están encendidas 🕯️🌙';
  if(w.t>=28) return 'Hace calorcito ('+w.t+'°): lectura ligera y algo fresquito para tomar 🍧';
  if(k==='clear') return 'Sol radiante afuera ☀️ ¿y si lees cerca de la ventana?';
  return h<12?'Mañanita nublada, ideal para unas páginas con café ☕':'Tarde tranquila de nubes ☁️ el salón te espera';
}
async function renderWindow(){
  const wall=document.getElementById('wall'); if(!wall) return;
  let card=document.getElementById('salonWindow');
  if(!card){ card=document.createElement('div'); card.id='salonWindow'; card.className='salon-window'; card.onclick=()=>openWeather(); }
  wall.insertBefore(card, document.getElementById('addCab'));
  const w=await fetchWeather(false);
  const h=new Date().getHours(), day=w?w.day:(h>=6&&h<18);
  const k=w?(WMO[w.code]||WMO[2])[2]:(day?'clear':'night');
  card.className='salon-window sky-'+(day?'day':'night')+' wx-'+k;
  card.innerHTML='<div class="sw-frame"><div class="sw-sky">'
    +(day?'<span class="sw-sun"></span>':'<span class="sw-moon"></span><i class="sw-stars"></i>')
    +'<span class="sw-cloud c1"></span><span class="sw-cloud c2"></span><i class="sw-rain"></i></div>'
    +'<div class="sw-mullion v"></div><div class="sw-mullion h"></div><div class="sw-curtain l"></div><div class="sw-curtain r"></div></div>'
    +'<div class="sw-info">'+(w?'<b>'+w.t+'°</b> '+(WMO[w.code]||WMO[2])[1]+' '+(WMO[w.code]||WMO[2])[0]:'🪟 sin conexión')+' · '+esc(wxPlace().name)+'</div>';
}
function openWeather(){
  const w=state.weather;
  buddySay(w ? '🪟 '+esc(wxPlace().name)+': <b>'+w.t+'°</b> '+(WMO[w.code]||WMO[2])[1]+' '+(WMO[w.code]||WMO[2])[0]+' · hoy entre '+w.min+'° y '+w.max+'° · humedad '+w.hum+'%<br>'+weatherComment(w)
    : '🪟 No pude mirar el cielo (sin internet). Te muestro el de la hora 🌤️', 10000);
}
/* el libro comenta el clima una vez al día */
async function weatherGreeting(){
  const key='wx'+fmtDay(new Date()); if(state.celeb[key]) return;
  const w=await fetchWeather(false); if(!w) return;
  state.celeb[key]=1; scheduleSave();
  setTimeout(()=>buddySay('🪟 '+weatherComment(w), 9000), 34000);
}
async function setWeatherPlace(name){
  name=String(name||'').trim(); if(!name) return;
  try{
    const r=await fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&language=es&name='+encodeURIComponent(name));
    const j=await r.json(); const g=j.results&&j.results[0];
    if(!g){ toast('«No encontré esa ciudad 🗺️»'); return; }
    settings.wxPlace={name:g.name, lat:g.latitude, lon:g.longitude}; scheduleSave();
    await fetchWeather(true); renderWindow();
    toast('«Ahora la ventana mira el cielo de '+esc(g.name)+(g.country?', '+esc(g.country):'')+' 🪟»');
  }catch(e){ toast('«Necesito internet para buscar la ciudad 📡»'); }
}
const _rlS=renderLibrary; renderLibrary=function(){ const r=_rlS(); renderWindow(); renderFireplace(); return r; };
const _taS=toggleAmb; toggleAmb=function(...a){ const r=_taS(...a); setTimeout(updateFireplace, 200); return r; };
function initSalonLife(){ renderFireplace(); renderWindow(); weatherGreeting(); setInterval(()=>{ updateFireplace(); renderWindow(); }, 10*60000); }
