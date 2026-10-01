import "../../../services/storage.js";
import { WispHlsLoader } from "./catalog-search.js";
globalThis.destroyEngine = function destroyEngine(){
  if(engine.hls){ try{ engine.hls.destroy(); }catch{} engine.hls=null; }
  try{ media.pause(); media.removeAttribute("src"); media.load(); }catch{}
  if(engine.blob){ try{ URL.revokeObjectURL(engine.blob); }catch{} engine.blob=null; }
  engine.kind="";
}
globalThis.ytPlayer=null,globalThis.ytReadyApi=false;
window.onYouTubeIframeAPIReady=function(){ ytReadyApi=true; };
globalThis.waitYtApi = function waitYtApi(){
  if(window.YT && YT.Player){ ytReadyApi=true; return Promise.resolve(); }
  return new Promise((resolve,reject)=>{
    const t0=Date.now();
    const iv=setInterval(()=>{
      if(window.YT && YT.Player){ clearInterval(iv); ytReadyApi=true; resolve(); }
      else if(Date.now()-t0>12000){ clearInterval(iv); reject(new Error("YouTube player API missing")); }
    },50);
  });
}
globalThis.ytState = function ytState(){ try{ return ytPlayer && ytPlayer.getPlayerState ? ytPlayer.getPlayerState() : -1; }catch{ return -1; } }
globalThis.attachYt = function attachYt(id, auto){
  return waitYtApi().then(()=>new Promise((resolve,reject)=>{
    const start=()=>{
      try{
        if(ytPlayer && ytPlayer.loadVideoById){
          if(auto) ytPlayer.loadVideoById(id); else ytPlayer.cueVideoById(id);
          engine.kind="yt";
          resolve();
          return;
        }
      }catch{}
      try{ if(ytPlayer && ytPlayer.destroy) ytPlayer.destroy(); }catch{}
      ytPlayer=new YT.Player("ytMount",{
        width:1, height:1, videoId:id,
        playerVars:{ autoplay:auto?1:0, controls:0, disablekb:1, fs:0, rel:0, modestbranding:1, playsinline:1, origin:location.origin },
        events:{
          onReady(e){
            try{ e.target.setVolume(S.prefs().vol||80); }catch{}
            engine.kind="yt";
            resolve();
          },
          onStateChange(e){
            if(e.data===YT.PlayerState.PLAYING){ state.playing=true; setStatus("Playing"); paintNow(); }
            if(e.data===YT.PlayerState.PAUSED){ state.playing=false; paintNow(); }
            if(e.data===YT.PlayerState.ENDED) next();
          },
          onError(){
            setStatus("Track blocked");
            if(state.skip<3 && state.list.length>1){ state.skip++; setTimeout(()=>next(), 400); }
          }
        }
      });
    };
    start();
  }));
}
globalThis.wispBlobUrl = async function wispBlobUrl(url, mime){
  const r=await fetchAny(url, {}, 28000);
  if(!r || !r.ok) throw new Error("tunnel HTTP "+(r&&r.status));
  const buf=await r.arrayBuffer();
  engine.blob=URL.createObjectURL(new Blob([buf], {type: mime||"audio/mp4"}));
  return engine.blob;
}
globalThis.waitMedia = function waitMedia(el, timeout){
  return new Promise((resolve,reject)=>{
    const t=setTimeout(()=>reject(new Error("media timeout")), timeout||12000);
    const ok=()=>{ clearTimeout(t); cleanup(); resolve(); };
    const bad=()=>{ clearTimeout(t); cleanup(); reject(new Error("media error")); };
    const cleanup=()=>{ el.removeEventListener("loadeddata",ok); el.removeEventListener("canplay",ok); el.removeEventListener("error",bad); };
    el.addEventListener("loadeddata",ok,{once:true});
    el.addEventListener("canplay",ok,{once:true});
    el.addEventListener("error",bad,{once:true});
  });
}
globalThis.attachHls = async function attachHls(url){
  if(media.canPlayType && media.canPlayType("application/vnd.apple.mpegurl") && !(window.Hls && Hls.isSupported())){
    media.src=url; await waitMedia(media); return;
  }
  if(typeof Hls==="undefined" || !Hls.isSupported()) throw new Error("hls.js missing");
  async function go(loader){
    const opts={enableWorker:false,lowLatencyMode:false,maxBufferLength:18,maxMaxBufferLength:36};
    if(loader) opts.loader=loader;
    const hls=new Hls(opts);
    engine.hls=hls;
    await new Promise((resolve,reject)=>{
      const t=setTimeout(()=>reject(new Error("manifest timeout")),16000);
      hls.on(Hls.Events.MANIFEST_PARSED,()=>{ clearTimeout(t); resolve(); });
      hls.on(Hls.Events.ERROR,(_,data)=>{ if(data&&data.fatal){ clearTimeout(t); reject(new Error(data.details||data.type||"hls fatal")); } });
      hls.loadSource(url); hls.attachMedia(media);
    });
  }
  try{ await go(WispHlsLoader); }
  catch(e){ destroyEngine(); await go(null); }
}
globalThis.attachFile = async function attachFile(url, mime){
  if(music_getLibcurl() && typeof music_getLibcurl().fetch==="function"){
    try{
      setStatus("Audio via tunnel…");
      media.src=await wispBlobUrl(url, mime);
      await waitMedia(media, 18000);
      return;
    }catch{ destroyEngine(); }
  }
  media.src=url;
  await waitMedia(media, 8000);
}
globalThis.playCandidate = async function playCandidate(c){
  destroyEngine();
  engine.kind=c.kind==="hls"?"hls":"file";
  setStatus(c.kind==="hls"?"HLS…":"Audio…");
  if(c.kind==="hls") await attachHls(c.url);
  else await attachFile(c.url, c.mime);
}

