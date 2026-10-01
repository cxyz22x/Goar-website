import "../../../services/storage.js";

let musicPlayerReturnFocus=null;
globalThis.music_openPlayer = function music_openPlayer(){
  const player=music_musicQuery("#nowPlaying");
  if(player.classList.contains("open")){ paintNow(); return; }
  musicPlayerReturnFocus=document.activeElement;
  document.body.classList.add("np-open");
  player.classList.add("open");
  player.setAttribute("aria-hidden","false");
  paintNow();
  music_musicQuery("#npClose").focus();
}
globalThis.music_closePlayer = function music_closePlayer(){
  const player=music_musicQuery("#nowPlaying");
  if(!player.classList.contains("open")) return;
  document.body.classList.remove("np-open");
  player.classList.remove("open");
  player.setAttribute("aria-hidden","true");
  if(musicPlayerReturnFocus&&musicPlayerReturnFocus.isConnected) musicPlayerReturnFocus.focus();
}

globalThis.mediaTime = function mediaTime(){
  if(engine.kind==="yt"&&ytPlayer&&ytPlayer.getCurrentTime){
    let cur=0,dur=0;
    try{ cur=ytPlayer.getCurrentTime()||0; dur=ytPlayer.getDuration()||0; }catch{}
    return {cur:Number.isFinite(cur)?cur:0,dur:Number.isFinite(dur)&&dur>0?dur:0};
  }
  const cur=Number(media.currentTime);
  const mediaDuration=Number(media.duration);
  const fallback=Number(current()&&current().duration);
  return {
    cur:Number.isFinite(cur)&&cur>0?cur:0,
    dur:Number.isFinite(mediaDuration)&&mediaDuration>0
      ?mediaDuration
      :(Number.isFinite(fallback)&&fallback>0?fallback:0)
  };
}
globalThis.bindSeek = function bindSeek(el){
  el.oninput=e=>{
    const {dur}=mediaTime();
    if(!dur) return;
    const t=(Number(e.target.value)/1000)*dur;
    try{
      if(engine.kind==="yt"&&ytPlayer&&Number(ytPlayer.getDuration())>0) ytPlayer.seekTo(t,true);
      else if(Number.isFinite(media.duration)&&media.duration>0) media.currentTime=t;
    }catch(error){ music_toast(error.message||"Seeking is unavailable for this track."); }
  };
}
globalThis.tick = function tick(){
  const {cur,dur}=mediaTime();
  const t=fmt(cur), d=fmt(dur), v=dur?Math.min(1000,Math.floor((cur/dur)*1000)):0;
  music_musicQuery("#curT").textContent=t;
  music_musicQuery("#durT").textContent=d;
  music_musicQuery("#npCur").textContent=t;
  music_musicQuery("#npDur").textContent=d;
  const seek=music_musicQuery("#seek"), npSeek=music_musicQuery("#npSeek");
  const canSeek=engine.kind==="yt"?dur>0:(Number.isFinite(media.duration)&&media.duration>0);
  seek.disabled=npSeek.disabled=!canSeek;
  if(document.activeElement!==seek) seek.value=v;
  if(document.activeElement!==npSeek) npSeek.value=v;
}
media.addEventListener("loadedmetadata",()=>{
  const song=current();
  if(song&&Number.isFinite(media.duration)&&media.duration>0){
    song.duration=media.duration;
    if(song.local){
      const saved=S.list(), track=saved.find(item=>item.id===song.id);
      if(track){ track.duration=media.duration; S.save(saved); }
    }
  }
  tick();
});
media.addEventListener("durationchange",tick);
media.addEventListener("timeupdate",tick);
media.addEventListener("play",()=>{
  state.playing=!media.paused;
  if(state.playing) setStatus("Playing");
  paintNow();
});
media.addEventListener("pause",()=>{
  state.playing=!media.paused;
  if(media.paused&&engine.kind) setStatus("Paused");
  paintNow();
});
media.addEventListener("ended",()=>next(true));
media.addEventListener("error",()=>{
  if(!media.error) return;
  if(media.error.code===1) return;
  const messages={
    1:"Audio loading was cancelled.",
    2:"The audio source could not be reached. Check the connection and try again.",
    3:"This audio could not be decoded by the browser.",
    4:"This browser cannot play this audio format."
  };
  state.playing=false;
  setStatus("Audio unavailable");
  paintNow();
  music_toast(messages[media.error.code]||"The audio source failed.");
});
setInterval(()=>{
  if(engine.kind==="yt"){
    const playing=ytState()===1;
    if(state.playing!==playing){ state.playing=playing; paintNow(); }
    tick();
  }
},400);
bindSeek(music_musicQuery("#seek"));
bindSeek(music_musicQuery("#npSeek"));
music_musicQuery("#vol").oninput=e=>musicSetVolume(e.target.value);

globalThis.toggleShuffle = function toggleShuffle(){
  const enabled=!S.prefs().shuffle;
  S.setPrefs({shuffle:enabled});
  if(!enabled) state.shuffleHistory=[];
  paintNow();
}
globalThis.cycleRepeat = function cycleRepeat(){
  const options=["off","all","one"];
  S.setPrefs({repeat:options[(options.indexOf(S.prefs().repeat)+1)%options.length]});
  music_toast("Repeat "+S.prefs().repeat);
  paintNow();
}
music_musicQuery("#btnPlay").onclick=music_musicQuery("#npPlay").onclick=togglePlay;
music_musicQuery("#btnNext").onclick=music_musicQuery("#npNext").onclick=()=>next(false);
music_musicQuery("#btnPrev").onclick=music_musicQuery("#npPrev").onclick=prev;
music_musicQuery("#btnShuffle").onclick=music_musicQuery("#npShuffle").onclick=toggleShuffle;
music_musicQuery("#btnRepeat").onclick=music_musicQuery("#npRepeat").onclick=cycleRepeat;
music_musicQuery("#openNow").onclick=music_openPlayer;
music_musicQuery("#expandBtn").onclick=music_openPlayer;
music_musicQuery("#npClose").onclick=music_closePlayer;
music_musicQuery("#npSave").onclick=()=>{ if(current()) addSong(current()); };
if(navigator.mediaSession){
  try{
    navigator.mediaSession.setActionHandler("play",musicPlayCurrent);
    navigator.mediaSession.setActionHandler("pause",musicPauseCurrent);
    navigator.mediaSession.setActionHandler("nexttrack",()=>next(false));
    navigator.mediaSession.setActionHandler("previoustrack",prev);
    navigator.mediaSession.setActionHandler("seekto",event=>{
      if(Number.isFinite(event.seekTime)){
        try{
          if(engine.kind==="yt"&&ytPlayer) ytPlayer.seekTo(event.seekTime,true);
          else if(Number.isFinite(media.duration)) media.currentTime=event.seekTime;
        }catch(e){ music_toast(e.message||"Seeking is unavailable for this track."); }
      }
    });
  }catch{}
}