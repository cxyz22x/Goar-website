import "../../../services/storage.js";
globalThis.music_openPlayer = function music_openPlayer(){ document.body.classList.add("np-open"); music_musicQuery("#nowPlaying").classList.add("open"); paintNow(); }
globalThis.music_closePlayer = function music_closePlayer(){ document.body.classList.remove("np-open"); music_musicQuery("#nowPlaying").classList.remove("open"); }

globalThis.mediaTime = function mediaTime(){
  if(engine.kind==="yt" && ytPlayer && ytPlayer.getCurrentTime){
    return { cur:ytPlayer.getCurrentTime()||0, dur:ytPlayer.getDuration()||0 };
  }
  return { cur:media.currentTime||0, dur:media.duration||0 };
}
globalThis.bindSeek = function bindSeek(el){
  el.oninput=e=>{
    const {dur}=mediaTime();
    if(!dur) return;
    const t=(e.target.value/1000)*dur;
    if(engine.kind==="yt" && ytPlayer) ytPlayer.seekTo(t,true);
    else media.currentTime=t;
  };
}
globalThis.tick = function tick(){
  const {cur,dur}=mediaTime();
  const t=fmt(cur), d=fmt(dur), v=dur?Math.floor((cur/dur)*1000):0;
  music_musicQuery("#curT").textContent=t; music_musicQuery("#durT").textContent=d; music_musicQuery("#npCur").textContent=t; music_musicQuery("#npDur").textContent=d;
  if(document.activeElement!==music_musicQuery("#seek")) music_musicQuery("#seek").value=v;
  if(document.activeElement!==music_musicQuery("#npSeek")) music_musicQuery("#npSeek").value=v;
}
media.addEventListener("timeupdate", tick);
setInterval(()=>{ if(engine.kind==="yt") tick(); }, 400);
media.addEventListener("play", ()=>{ state.playing=true; paintNow(); });
media.addEventListener("pause", ()=>{ state.playing=false; paintNow(); });
media.addEventListener("ended", ()=>{ if(S.prefs().repeat!=="off") next(); else next(); });
bindSeek(music_musicQuery("#seek")); bindSeek(music_musicQuery("#npSeek"));
music_musicQuery("#vol").oninput=e=>{
  const v=Number(e.target.value); S.setPrefs({vol:v});
  media.volume=v/100;
  try{ if(ytPlayer && ytPlayer.setVolume) ytPlayer.setVolume(v); }catch{}
};
globalThis.toggleShuffle = function toggleShuffle(){ S.setPrefs({shuffle:!S.prefs().shuffle}); paintNow(); }
globalThis.cycleRepeat = function cycleRepeat(){ const o=["off","all","one"]; S.setPrefs({repeat:o[(o.indexOf(S.prefs().repeat)+1)%3]}); music_toast("Repeat "+S.prefs().repeat); paintNow(); }
music_musicQuery("#btnPlay").onclick=music_musicQuery("#npPlay").onclick=togglePlay;
music_musicQuery("#btnNext").onclick=music_musicQuery("#npNext").onclick=next;
music_musicQuery("#btnPrev").onclick=music_musicQuery("#npPrev").onclick=prev;
music_musicQuery("#btnShuffle").onclick=music_musicQuery("#npShuffle").onclick=toggleShuffle;
music_musicQuery("#btnRepeat").onclick=music_musicQuery("#npRepeat").onclick=cycleRepeat;
music_musicQuery("#openNow").onclick=music_openPlayer; music_musicQuery("#expandBtn").onclick=music_openPlayer;
music_musicQuery("#npClose").onclick=music_closePlayer;
music_musicQuery("#npSave").onclick=()=>{ if(current()) addSong(current()); };

