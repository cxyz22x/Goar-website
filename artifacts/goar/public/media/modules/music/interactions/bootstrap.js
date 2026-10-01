import "../../../services/storage.js";
globalThis.goView = function goView(name){ if(name==="home") viewHome(); if(name==="search") viewSearch(""); if(name==="library") viewLibrary(); }
music_musicQueryAll("[data-view]").forEach(b=>b.onclick=()=>goView(b.dataset.view));
music_musicQuery("#addFiles").onclick=music_musicQuery("#mAdd").onclick=()=>music_musicQuery("#filePick").click();
music_musicQuery("#filePick").onchange=async e=>{
  const files=[...e.target.files||[]].filter(f=>/^audio\//.test(f.type)||/\.(mp3|m4a|ogg|wav|flac|aac|opus)$/i.test(f.name));
  for(const file of files){ const id="local_"+Date.now().toString(36)+Math.random().toString(36).slice(2,6); await idbPut(id,file); addSong({id,title:file.name.replace(/\.[^.]+$/,""),artist:"This device",local:true}); }
  if(files.length) music_toast("Added "+files.length);
  e.target.value=""; if(state.view==="library") viewLibrary();
};
document.addEventListener("keydown", e=>{
  if(!document.getElementById("view-music").classList.contains("on")) return;
  if(e.target.matches("input,textarea")) return;
  if(e.code==="Space"){ e.preventDefault(); togglePlay(); }
  if(e.code==="ArrowRight") next();
  if(e.code==="ArrowLeft") prev();
  if(e.code==="Escape") music_closePlayer();
  if(e.code==="KeyF") music_openPlayer();
});
if(navigator.mediaSession){
  navigator.mediaSession.setActionHandler("play", togglePlay);
  navigator.mediaSession.setActionHandler("pause", togglePlay);
  navigator.mediaSession.setActionHandler("nexttrack", next);
  navigator.mediaSession.setActionHandler("previoustrack", prev);
}

viewHome(); paintNow();
music_ensureLibcurl().then(()=>loadLiveCatalog()).then(()=>{ if(state.view==="home") viewHome(); paintSide(); }).catch(()=>{
  setStatus("Direct");
  loadLiveCatalog().then(()=>{ if(state.view==="home") viewHome(); paintSide(); }).catch(()=>{});
});
