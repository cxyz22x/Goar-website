import "../../../services/storage.js";
globalThis.addSong = function addSong(song){
  if(!song||!song.id) return;
  const saved=S.list(); if(saved.some(x=>x.id===song.id)) return music_toast("Already saved");
  saved.unshift({id:song.id,title:song.title||song.id,artist:song.artist||"",local:!!song.local});
  S.save(saved); music_toast("Saved to library"); paintSide();
  if(state.view==="library") viewLibrary();
}
globalThis.playAt = async function playAt(i, auto){
  if(!state.list.length) return;
  state.i=(i+state.list.length)%state.list.length;
  const song=current(), my=++state.token;
  paintNow();
  setStatus("Loading…");
  try{
    if(isLocal(song)){
      destroyEngine();
      try{ if(ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo(); }catch{}
      const blob=await idbGet(song.id); if(!blob) throw new Error("File missing");
      engine.blob=URL.createObjectURL(blob);
      media.src=engine.blob;
      await waitMedia(media, 8000);
      engine.kind="file";
      media.volume=Math.max(0,Math.min(1,(S.prefs().vol||80)/100));
      if(auto) await media.play();
      state.playing=!media.paused;
    } else {
      try{ if(ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo(); }catch{}
      try{ media.pause(); }catch{}
      const sources=await music_resolveSources(song.id);
      if(my!==state.token) return;
      if(sources[0]){
        if(sources[0].title) song.title=sources[0].title;
        if(sources[0].artist) song.artist=sources[0].artist;
      }
      let last=null;
      for(const src of sources){
        try{
          await playCandidate(src);
          if(my!==state.token) return;
          media.volume=Math.max(0,Math.min(1,(S.prefs().vol||80)/100));
          if(auto) await media.play();
          state.playing=!media.paused;
          last=null;
          break;
        }catch(e){
          last=e;
          destroyEngine();
        }
      }
      if(last) throw last;
    }
    state.skip=0;
    setStatus(state.playing?"Playing":"Ready");
    paintNow();
  }catch(e){
    if(my!==state.token) return;
    setStatus("Couldn't play");
    state.playing=false; paintNow();
    music_toast(e.message||"Playback failed");
  }
}
globalThis.jump = function jump(id, auto){ const idx=state.list.findIndex(x=>x.id===id); if(idx>=0) playAt(idx,auto); }
globalThis.togglePlay = function togglePlay(){
  if(!current()) return playAt(0,true);
  if(engine.kind==="yt" && ytPlayer){
    const st=ytState();
    if(st===1){ ytPlayer.pauseVideo(); state.playing=false; }
    else { ytPlayer.playVideo(); state.playing=true; }
    paintNow(); return;
  }
  if(!media.src && !engine.hls) return playAt(state.i,true);
  if(media.paused){ media.play(); state.playing=true; } else { media.pause(); state.playing=false; }
  paintNow();
}
globalThis.next = function next(){ const p=S.prefs(); if(p.repeat==="one") return playAt(state.i,true); if(p.shuffle) return playAt(Math.floor(Math.random()*state.list.length),true); playAt(state.i+1,true); }
globalThis.prev = function prev(){
  let cur=0;
  try{ cur=engine.kind==="yt"&&ytPlayer?ytPlayer.getCurrentTime():media.currentTime; }catch{}
  if(cur>3){
    if(engine.kind==="yt"&&ytPlayer) ytPlayer.seekTo(0,true);
    else media.currentTime=0;
    return;
  }
  playAt(state.i-1,true);
}

