import "../../../services/storage.js";

globalThis.musicVolume = function musicVolume(){
  const raw=Number(S.prefs().vol);
  return Math.max(0,Math.min(100,Number.isFinite(raw)?raw:80));
}
globalThis.musicSetVolume = function musicSetVolume(value){
  const volume=Math.max(0,Math.min(100,Number(value)||0));
  S.setPrefs({vol:volume});
  try{ media.volume=volume/100; }
  catch{ setStatus("Use device volume controls in this browser"); }
  try{ if(ytPlayer&&ytPlayer.setVolume) ytPlayer.setVolume(volume); }catch{}
  const input=music_musicQuery("#vol");
  if(input&&Number(input.value)!==volume) input.value=volume;
}
globalThis.addSong = function addSong(song, options={}){
  if(!song||!song.id) return;
  const saved=S.list();
  const exists=saved.find(x=>x.id===song.id);
  if(exists){
    if(song.duration&&!exists.duration){ exists.duration=song.duration; S.save(saved); }
    if(!options.silent) music_toast("Already saved");
    return;
  }
  saved.unshift({
    id:song.id,
    title:song.title||song.id,
    artist:song.artist||"",
    duration:Number(song.duration)||0,
    local:!!song.local
  });
  S.save(saved);
  if(!options.silent) music_toast("Saved to library");
  paintSide();
  if(state.view==="library"&&!options.silent) viewLibrary();
}
globalThis.playAt = async function playAt(i, auto){
  if(!state.list.length) return;
  const index=Number(i);
  if(!Number.isInteger(index)) return;
  musicMarkQueueIntent();
  state.i=(index+state.list.length)%state.list.length;
  const song=current(), my=++state.token;
  state.playing=false;
  try{ if(ytPlayer&&ytPlayer.pauseVideo) ytPlayer.pauseVideo(); }catch{}
  destroyEngine();
  engine.token=my;
  paintNow(); tick(); setStatus("Loading…");
  try{
    if(isLocal(song)){
      const blob=await idbGet(song.id);
      if(my!==state.token) return;
      if(!blob) throw new Error("The saved audio file is missing. Add the file again from this device.");
      engine.kind="file";
      engine.blob=URL.createObjectURL(blob);
      media.src=engine.blob;
      const ready=waitMedia(media,18000);
      media.load();
      await ready;
      if(my!==state.token) return;
      if(Number.isFinite(media.duration)&&media.duration>0) song.duration=media.duration;
      musicSetVolume(musicVolume());
      if(auto) await media.play();
      state.playing=!media.paused;
    }else{
      const sources=await music_resolveSources(song.id);
      if(my!==state.token) return;
      if(!Array.isArray(sources)||!sources.length) throw new Error("No playable audio source was returned.");
      const first=sources[0];
      if(first.title) song.title=first.title;
      if(first.artist) song.artist=first.artist;
      if(first.duration) song.duration=first.duration;
      let last=null;
      for(const src of sources){
        if(my!==state.token) return;
        try{
          await playCandidate(src,my);
          if(my!==state.token) return;
          musicSetVolume(musicVolume());
          if(auto) await media.play();
          state.playing=!media.paused;
          last=null;
          break;
        }catch(e){
          if(my!==state.token) return;
          if(e&&e.name==="NotAllowedError"){
            state.playing=false;
            setStatus("Press Play to start");
            paintNow(); tick();
            music_toast("The browser blocked autoplay. Press Play to start this track.");
            return;
          }
          last=e;
          destroyEngine();
          engine.token=my;
        }
      }
      if(last) throw last;
      if(engine.kind==="") throw new Error("None of the available audio sources could be loaded.");
    }
    state.skip=0;
    state.playing=!media.paused;
    setStatus(state.playing?"Playing":"Ready");
    paintNow(); tick();
  }catch(e){
    if(my!==state.token) return;
    state.playing=false;
    setStatus(e&&e.name==="NotAllowedError"?"Press Play to start":"Playback failed");
    paintNow(); tick();
    const message=e&&e.name==="NotAllowedError"
      ?"The browser blocked autoplay. Press Play to start this track."
      :(e&&e.message)||"Playback failed. Check the audio file or source and try again.";
    music_toast(message);
  }
}
globalThis.jump = function jump(id, auto){
  const idx=state.list.findIndex(x=>x.id===id);
  if(idx>=0) playAt(idx,auto);
}
globalThis.musicPlayCurrent = async function musicPlayCurrent(){
  if(engine.kind==="yt"&&ytPlayer){
    try{
      ytPlayer.playVideo();
      if(ytState()===1){ state.playing=true; setStatus("Playing"); paintNow(); }
    }catch(e){ music_toast(e.message||"Could not start playback."); }
    return;
  }
  if(!media.src){
    if(current()) return playAt(state.i,true);
    music_toast("Choose a track to play.");
    return;
  }
  try{
    if(media.ended) media.currentTime=0;
    await media.play();
    state.playing=!media.paused;
    setStatus(state.playing?"Playing":"Ready");
    paintNow();
  }catch(e){
    state.playing=false; setStatus("Playback blocked");
    paintNow();
    music_toast(e&&e.name==="NotAllowedError"
      ?"Playback was blocked by the browser. Press Play to try again."
      :(e&&e.message)||"The audio source could not be played.");
  }
}
globalThis.musicPauseCurrent = function musicPauseCurrent(){
  if(engine.kind==="yt"&&ytPlayer){
    try{ ytPlayer.pauseVideo(); }catch(e){ music_toast(e.message||"Could not pause playback."); }
    return;
  }
  media.pause();
  state.playing=!media.paused;
  if(media.paused) setStatus("Paused");
  paintNow();
}
globalThis.togglePlay = function togglePlay(){
  if(engine.kind==="yt"&&ytPlayer){
    if(ytState()===1) musicPauseCurrent();
    else musicPlayCurrent();
    return;
  }
  if(media.paused) musicPlayCurrent();
  else musicPauseCurrent();
}
globalThis.next = function next(ended=false){
  const p=S.prefs(), length=state.list.length;
  if(!length) return;
  if(p.repeat==="one"){
    if(ended&&engine.kind!=="yt"&&media.src){
      media.currentTime=0;
      musicPlayCurrent();
    }else playAt(state.i,true);
    return;
  }
  if(p.shuffle&&length>1){
    const choices=state.list.map((_,index)=>index).filter(index=>index!==state.i);
    const selected=choices[Math.floor(Math.random()*choices.length)];
    state.shuffleHistory=state.shuffleHistory||[];
    state.shuffleHistory.push(state.i);
    playAt(selected,true);
    return;
  }
  if(state.i<length-1) return playAt(state.i+1,true);
  if(p.repeat==="all") return playAt(0,true);
  if(!ended){
    musicPauseCurrent();
    setStatus("End of queue");
    music_toast("End of queue");
  }else{
    state.playing=false;
    setStatus("Finished");
    paintNow();
  }
}
globalThis.prev = function prev(){
  if(S.prefs().shuffle&&state.shuffleHistory&&state.shuffleHistory.length){
    return playAt(state.shuffleHistory.pop(),true);
  }
  let cur=0;
  try{ cur=engine.kind==="yt"&&ytPlayer?ytPlayer.getCurrentTime():media.currentTime; }catch{}
  if(cur>3){
    if(engine.kind==="yt"&&ytPlayer) ytPlayer.seekTo(0,true);
    else if(Number.isFinite(media.duration)) media.currentTime=0;
    tick();
    return;
  }
  if(state.i>0) return playAt(state.i-1,true);
  if(S.prefs().repeat==="all"&&state.list.length) return playAt(state.list.length-1,true);
  if(engine.kind==="yt"&&ytPlayer) ytPlayer.seekTo(0,true);
  else if(Number.isFinite(media.duration)) media.currentTime=0;
}