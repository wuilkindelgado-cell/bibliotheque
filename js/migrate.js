/* v1.5: emojis que Windows 10 no sabe dibujar → equivalentes visibles (también en lo ya guardado) */
const EMOJI_FIX={'🫖':'☕','🪞':'🖼️','🪷':'🌸','🪄':'✨','🪴':'🌳','🫶':'🤗','🪭':'🌸','🫧':'✨','🪶':'✒️'};
function fixEmoji(s){ return typeof s==='string' ? s.replace(/🫖|🪞|🪷|🪄|🪴|🫶|🪭|🫧|🪶/gu, m=>EMOJI_FIX[m]) : s; }
function migrateEmoji(){
  let ch=false;
  (state.sections||[]).forEach(s=>{ const n=fixEmoji(s.decor); if(n!==s.decor){ s.decor=n; ch=true; } });
  Object.keys(outfit).forEach(k=>{ const n=fixEmoji(outfit[k]); if(n!==outfit[k]){ outfit[k]=n; ch=true; } });
  [...bonusUnlocks].forEach(b=>{ const n=fixEmoji(b); if(n!==b){ bonusUnlocks.add(n); ch=true; } });
  if(ch) scheduleSave();
}
