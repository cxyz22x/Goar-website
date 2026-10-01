import "../../../services/storage.js";
globalThis.goView = function goView(name){
  if(!["home","search","library"].includes(name)||name===state.view) return;
  state.viewHistory=state.viewHistory||[];
  state.viewHistory.push(state.view);
  if(name==="home") viewHome();
  if(name==="search") viewSearch("");
  if(name==="library") viewLibrary();
}
globalThis.goBackView = function goBackView(){
  const previous=state.viewHistory&&state.viewHistory.pop();
  if(previous==="search") viewSearch("");
  else if(previous==="library") viewLibrary();
  else if(previous==="home") viewHome();
  else if(typeof window.goarShow==="function") window.goarShow("home",true);
  else location.assign("./index.html?view=home");
}
music_musicQueryAll("[data-view]").forEach(b=>b.onclick=()=>goView(b.dataset.view));
music_musicQuery("#addFiles").onclick=music_musicQuery("#mAdd").onclick=()=>music_musicQuery("#filePick").click();
music_musicQuery("#filePick").onchange=async e=>{
  const selected=[...e.target.files||[]];
  const files=selected.filter(f=>/^audio\//i.test(f.type)||/\.(mp3|m4a|ogg|wav|flac|aac|opus|webm)$/i.test(f.name));
  const rejected=selected.length-files.length;
  let imported=0, metadataMissing=0;
  const results=await Promise.all(files.map(async file=>{
    const id="local_"+(globalThis.crypto&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2,10));
    try{
      await idbPut(id,file);
      const duration=await inspectAudioFile(file);
      addSong({
        id,
        title:file.name.replace(/\.[^.]+$/,"")||"Untitled audio",
        artist:"This device",
        duration,
        local:true
      },{silent:true});
      return {ok:true,duration};
    }catch(error){ return {ok:false,name:file.name,error}; }
  }));
  for(const result of results){
    if(result.ok){ imported++; if(!result.duration) metadataMissing++; }
  }
  const failed=results.filter(result=>!result.ok);
  const notices=[];
  if(imported) notices.push("Added "+imported+(imported===1?" audio file":" audio files"));
  if(metadataMissing) notices.push("duration metadata unavailable for "+metadataMissing);
  if(rejected) notices.push(rejected+" unsupported "+(rejected===1?"file was":"files were")+" skipped");
  if(failed.length) notices.push(failed.map(result=>result.name+": "+(result.error.message||"save failed")).join("; "));
  if(notices.length) music_toast(notices.join(". "));
  e.target.value="";
  if(state.view==="library") viewLibrary();
};
document.addEventListener("keydown", e=>{
  if(!document.getElementById("view-music").classList.contains("on")) return;
  if(e.target.matches("input,textarea,select,[contenteditable=true]")) return;
  if(e.code==="Space"){ e.preventDefault(); togglePlay(); }
  if(e.code==="ArrowRight") next(false);
  if(e.code==="ArrowLeft") prev();
  if(e.code==="Escape"&&music_musicQuery("#nowPlaying").classList.contains("open")) music_closePlayer();
  if(e.code==="KeyF") music_openPlayer();
});

viewHome(); paintNow();
music_ensureLibcurl().then(()=>loadLiveCatalog()).then(()=>{
  if(state.view==="home") viewHome();
  paintSide();
}).catch(error=>{
  setStatus("Relay unavailable: "+(error&&error.message||"checking direct sources"));
  loadLiveCatalog().then(()=>{
    if(state.view==="home") viewHome();
    paintSide();
    if(music_tunnelState.status==="bad") setStatus("Relay unavailable · direct sources only");
  }).catch(catalogError=>{
    setStatus("External catalogs unavailable: "+(catalogError&&catalogError.message||"request failed"));
    if(state.view==="home") viewHome();
    paintSide();
  });
});
