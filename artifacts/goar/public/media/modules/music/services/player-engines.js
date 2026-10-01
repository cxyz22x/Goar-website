import "../../../services/storage.js";
import { WispHlsLoader } from "./catalog-search.js";

globalThis.musicAssertEngine = function musicAssertEngine(token){
  if(token!==undefined&&token!==engine.token){
    const error=new Error("Playback request was superseded.");
    error.name="AbortError";
    throw error;
  }
}
globalThis.destroyEngine = function destroyEngine(){
  if(engine.hls){ try{ engine.hls.destroy(); }catch{} engine.hls=null; }
  try{ media.pause(); media.removeAttribute("src"); media.load(); }catch{}
  if(engine.blob){ try{ URL.revokeObjectURL(engine.blob); }catch{} engine.blob=null; }
  engine.kind="";
}
globalThis.ytPlayer=null,globalThis.ytReadyApi=false;
window.onYouTubeIframeAPIReady=function(){ ytReadyApi=true; };
globalThis.waitYtApi = function waitYtApi(){
  if(window.YT&&YT.Player){ ytReadyApi=true; return Promise.resolve(); }
  return new Promise((resolve,reject)=>{
    const t0=Date.now();
    const iv=setInterval(()=>{
      if(window.YT&&YT.Player){ clearInterval(iv); ytReadyApi=true; resolve(); }
      else if(Date.now()-t0>12000){ clearInterval(iv); reject(new Error("YouTube player API did not load. Online playback may be unavailable.")); }
    },50);
  });
}
globalThis.ytState = function ytState(){
  try{ return ytPlayer&&ytPlayer.getPlayerState?ytPlayer.getPlayerState():-1; }catch{ return -1; }
}
globalThis.attachYt = function attachYt(id,auto){
  return waitYtApi().then(()=>new Promise((resolve,reject)=>{
    const start=()=>{
      try{
        if(ytPlayer&&ytPlayer.loadVideoById){
          if(auto) ytPlayer.loadVideoById(id); else ytPlayer.cueVideoById(id);
          engine.kind="yt";
          resolve();
          return;
        }
      }catch{}
      try{ if(ytPlayer&&ytPlayer.destroy) ytPlayer.destroy(); }catch{}
      ytPlayer=new YT.Player("ytMount",{
        width:1,height:1,videoId:id,
        playerVars:{autoplay:auto?1:0,controls:0,disablekb:1,fs:0,rel:0,modestbranding:1,playsinline:1,origin:location.origin},
        events:{
          onReady(event){
            try{ event.target.setVolume(musicVolume()); }catch{}
            engine.kind="yt";
            resolve();
          },
          onStateChange(event){
            if(event.data===YT.PlayerState.PLAYING){ state.playing=true; setStatus("Playing"); paintNow(); }
            if(event.data===YT.PlayerState.PAUSED){ state.playing=false; paintNow(); }
            if(event.data===YT.PlayerState.ENDED) next(true);
          },
          onError(){
            setStatus("Online track blocked");
            state.playing=false;
            paintNow();
            music_toast("The external video source blocked playback. Try another track or a local audio file.");
          }
        }
      });
    };
    try{ start(); }catch(error){ reject(error); }
  }));
}
globalThis.wispBlobUrl = async function wispBlobUrl(url,mime,token){
  musicAssertEngine(token);
  const response=await fetchAny(url,{},28000);
  musicAssertEngine(token);
  if(!response||!response.ok) throw new Error("Tunnel audio request failed (HTTP "+(response&&response.status||"no response")+").");
  const bytes=await response.arrayBuffer();
  musicAssertEngine(token);
  const objectUrl=URL.createObjectURL(new Blob([bytes],{type:mime||"audio/mp4"}));
  engine.blob=objectUrl;
  return objectUrl;
}
globalThis.waitMedia = function waitMedia(element,timeout=12000){
  return new Promise((resolve,reject)=>{
    let settled=false;
    const cleanup=()=>{
      clearTimeout(timer);
      element.removeEventListener("loadedmetadata",ok);
      element.removeEventListener("loadeddata",ok);
      element.removeEventListener("canplay",ok);
      element.removeEventListener("error",bad);
    };
    const finish=(error)=>{
      if(settled) return;
      settled=true; cleanup();
      if(error) reject(error); else resolve();
    };
    const ok=()=>finish();
    const bad=()=>{
      const code=element.error&&element.error.code;
      const reasons={2:"network error",3:"audio decode error",4:"unsupported audio format"};
      finish(new Error("Audio could not be loaded"+(reasons[code]?" ("+reasons[code]+")":"")+"."));
    };
    const timer=setTimeout(()=>finish(new Error("Audio metadata/load timed out. The source may be offline or blocked.")),timeout);
    element.addEventListener("loadedmetadata",ok,{once:true});
    element.addEventListener("loadeddata",ok,{once:true});
    element.addEventListener("canplay",ok,{once:true});
    element.addEventListener("error",bad,{once:true});
    if(element.readyState>=1) ok();
  });
}
globalThis.attachHls = async function attachHls(url,token){
  musicAssertEngine(token);
  if(media.canPlayType&&media.canPlayType("application/vnd.apple.mpegurl")&&!(window.Hls&&Hls.isSupported())){
    media.src=url;
    const ready=waitMedia(media,18000);
    media.load();
    await ready;
    musicAssertEngine(token);
    return;
  }
  if(typeof Hls==="undefined"||!Hls.isSupported()) throw new Error("HLS playback is unavailable because hls.js is not supported in this browser.");
  async function go(loader){
    musicAssertEngine(token);
    const options={enableWorker:false,lowLatencyMode:false,maxBufferLength:18,maxMaxBufferLength:36};
    if(loader) options.loader=loader;
    const hls=new Hls(options);
    engine.hls=hls;
    await new Promise((resolve,reject)=>{
      let settled=false;
      const finish=error=>{
        if(settled) return;
        settled=true; clearTimeout(timer);
        if(error) reject(error); else resolve();
      };
      const timer=setTimeout(()=>finish(new Error("HLS manifest timed out.")),16000);
      hls.on(Hls.Events.MANIFEST_PARSED,()=>finish());
      hls.on(Hls.Events.ERROR,(_,data)=>{
        if(data&&data.fatal) finish(new Error(data.details||data.type||"HLS playback failed."));
      });
      try{ hls.loadSource(url); hls.attachMedia(media); }
      catch(error){ finish(error); }
    }).catch(error=>{
      try{ hls.destroy(); }catch{}
      if(engine.hls===hls) engine.hls=null;
      throw error;
    });
    musicAssertEngine(token);
    await waitMedia(media,18000);
    musicAssertEngine(token);
  }
  try{
    await go(WispHlsLoader);
  }catch(error){
    musicAssertEngine(token);
    try{ await go(null); }
    catch(fallbackError){
      musicAssertEngine(token);
      throw new Error("HLS audio failed through the relay ("+error.message+"); direct HLS fallback failed ("+fallbackError.message+").");
    }
  }
}
globalThis.attachFile = async function attachFile(url,mime,token){
  musicAssertEngine(token);
  let tunnelError=null;
  if(music_tunnelState.status!=="bad"&&music_getLibcurl()&&typeof music_getLibcurl().fetch==="function"){
    try{
      setStatus("Trying relay audio…");
      media.src=await wispBlobUrl(url,mime,token);
      const ready=waitMedia(media,18000);
      media.load();
      await ready;
      musicAssertEngine(token);
      return;
    }catch(error){
      musicAssertEngine(token);
      tunnelError=error;
      destroyEngine();
      engine.token=token;
    }
  }
  try{
    media.src=url;
    const ready=waitMedia(media,12000);
    media.load();
    await ready;
    musicAssertEngine(token);
  }catch(error){
    musicAssertEngine(token);
    if(tunnelError) throw new Error("Relay audio failed ("+tunnelError.message+"); direct audio failed ("+error.message+").");
    throw error;
  }
}
globalThis.playCandidate = async function playCandidate(candidate,token){
  musicAssertEngine(token);
  if(candidate.kind==="dash") throw new Error("This source uses MPEG-DASH, which this audio player does not support.");
  engine.kind=candidate.kind==="hls"?"hls":"file";
  setStatus(candidate.kind==="hls"?"Loading HLS audio…":"Loading audio…");
  if(candidate.kind==="hls") await attachHls(candidate.url,token);
  else await attachFile(candidate.url,candidate.mime,token);
  musicAssertEngine(token);
}