import "../../../services/storage.js";
import { mediaRelay } from "../../../services/relay.js";
globalThis.parseVideoId = function parseVideoId(input){
  if(!input) return "";
  const s=String(input).trim();
  if(/^[\w-]{11}$/.test(s)) return s;
  try{ const u=new URL(s); if(u.hostname.includes("youtu.be")) return u.pathname.replace(/^\//,"").slice(0,11); if(u.searchParams.get("v")) return u.searchParams.get("v"); const m=u.pathname.match(/\/(embed|shorts)\/([\w-]{11})/); if(m) return m[2]; }catch{}
  return "";
}

globalThis.music_normalizeWispUrl = function music_normalizeWispUrl(url){
  if(!url) return "";
  let u=String(url).trim();
  if(u.startsWith("https://")) u="wss://"+u.slice(8);
  if(u.startsWith("http://")) u="ws://"+u.slice(7);
  try{ const d=new URL(u.replace(/^wss:/i,"https:").replace(/^ws:/i,"http:")); d.port=""; u=(d.protocol==="https:"?"wss://":"ws://")+d.hostname+(d.pathname||"/")+d.search; }
  catch{ u=u.replace(/^(wss?:\/\/[^/]+):\d+/i,"$1"); }
  if(u && !u.endsWith("/")) u+="/";
  return u;
}
globalThis.music_loadSavedWispList = function music_loadSavedWispList(){
  const extra=[];
  const sharedUrl = mediaRelay.getUrl();
  if (sharedUrl) extra.push(music_normalizeWispUrl(sharedUrl));
  try{ const c=mediaStorage.getItem("goar_wisp_custom"); if(c) extra.push(music_normalizeWispUrl(c)); const l=mediaStorage.getItem("goar_wisp_url"); if(l) extra.push(music_normalizeWispUrl(l)); }catch{}
  extra.push(music_normalizeWispUrl(S.prefs().wisp));
  const seen=new Set();
  return [...extra, ...music_DEFAULT_WISP_URLS.map(music_normalizeWispUrl)].filter(u=>{ if(!u||seen.has(u)) return false; seen.add(u); return true; });
}
globalThis.music_WISP_URL=music_loadSavedWispList()[0];
globalThis.music_tunnelState={status:"boot",url:music_WISP_URL,error:""};
globalThis.music__libcurlReady=null;
globalThis.music_getLibcurl = function music_getLibcurl(){
  if(typeof window.libcurl!=="undefined" && window.libcurl) return window.libcurl;
  try{ const lc=(0,eval)("typeof libcurl!=='undefined'?libcurl:null"); if(lc){ window.libcurl=lc; return lc; } }catch{}
  return null;
}
globalThis.music_injectLibcurlScript = function music_injectLibcurlScript(src){
  if(music_getLibcurl()) return Promise.resolve(src);
  if(document.querySelector('script[src*="libcurl"]')) return music_waitLibcurlObject(8000).then(()=>src);
  return new Promise((resolve,reject)=>{ const s=document.createElement("script"); s.src=src; s.async=true; s.onload=()=>resolve(src); s.onerror=()=>reject(new Error(src)); document.head.appendChild(s); });
}
globalThis.music_waitLibcurlObject = function music_waitLibcurlObject(ms){
  return new Promise((resolve,reject)=>{
    const hit=music_getLibcurl(); if(hit) return resolve(hit);
    const t0=Date.now(); const iv=setInterval(()=>{ const lc=music_getLibcurl(); if(lc){ clearInterval(iv); resolve(lc);} else if(Date.now()-t0>ms){ clearInterval(iv); reject(new Error("libcurl missing")); } },50);
  });
}
globalThis.music_waitLibcurlWasm = async function music_waitLibcurlWasm(lc){
  if(lc.ready===true) return lc;
  if(typeof lc.load_wasm==="function"){ try{ await lc.load_wasm(); return lc; }catch{} }
  await new Promise((resolve,reject)=>{
    let done=false; const ok=()=>{ if(!done){ done=true; resolve(); } }; const fail=e=>{ if(!done){ done=true; reject(e||new Error("abort")); } };
    if(typeof lc.onload==="undefined" || lc.onload===null) lc.onload=ok;
    document.addEventListener("libcurl_load",ok,{once:true});
    document.addEventListener("libcurl_abort",(ev)=>fail(ev&&ev.error),{once:true});
    if(lc.events && typeof lc.events.addEventListener==="function") lc.events.addEventListener("load",ok,{once:true});
    setTimeout(()=>{ if(lc.ready===true||(lc.version&&lc.fetch)) ok(); },200);
    setTimeout(()=>fail(new Error("wasm timeout")),20000);
  });
  return lc;
}
globalThis.music_applyWispUrl = function music_applyWispUrl(lc,url){
  const u=music_normalizeWispUrl(url);
  if(!u) throw new Error("WISP URL required");
  mediaRelay.configure(lc,u);
  music_WISP_URL=u;
  music_tunnelState.url=u;
}
globalThis.music_probeTunnel = async function music_probeTunnel(lc){
  const ctrl=typeof AbortController!=="undefined"?new AbortController():null;
  const timer=setTimeout(()=>{ try{ ctrl&&ctrl.abort(); }catch{} },12000);
  try{
    const r=await lc.fetch("https://example.com/", ctrl?{signal:ctrl.signal}:{});
    const body=await r.text();
    if(!r.ok && r.status>=500) throw new Error("probe HTTP "+r.status);
    if(!body) throw new Error("empty probe");
    return true;
  } finally{ clearTimeout(timer); }
}
globalThis.music_getHttpSession = function music_getHttpSession(){
  return mediaRelay.getSession("music", window.libcurl);
}
globalThis.music_resetHttpSession = function music_resetHttpSession(){
  mediaRelay.resetSession("music");
}
globalThis.music_ensureLibcurl = async function music_ensureLibcurl(force){
  if(music__libcurlReady && !force) return music__libcurlReady;
  music__libcurlReady=(async()=>{
    setStatus("Tunnel…");
    let lc=null;
    try{ lc=await music_waitLibcurlObject(1500); }
    catch(e){
      let last=e;
      for(const src of music_LIBCURL_SOURCES){ try{ await music_injectLibcurlScript(src); lc=await music_waitLibcurlObject(8000); break; }catch(err){ last=err; } }
      if(!lc) throw last;
    }
    await music_waitLibcurlWasm(lc);
    if(typeof lc.fetch!=="function"||typeof lc.set_websocket!=="function") throw new Error("libcurl incomplete");
    const sharedUrl=mediaRelay.getUrl();
    const savedUrls=music_loadSavedWispList();
    const urls=sharedUrl?[sharedUrl,...savedUrls.filter(url=>url!==sharedUrl)]:savedUrls; let lastErr=null;
    for(const url of urls){
      try{ music_applyWispUrl(lc,url); music_resetHttpSession(); await music_probeTunnel(lc); music_tunnelState.status="ok"; music_tunnelState.error=""; window.libcurl=lc; setStatus("Tunnel live"); return lc; }
      catch(e){ lastErr=e; }
    }
    music_applyWispUrl(lc, urls[0]); music_tunnelState.status="bad"; music_tunnelState.error=lastErr&&lastErr.message?lastErr.message:"wisp down"; window.libcurl=lc; setStatus("Local / direct"); return lc;
  })();
  try{ return await music__libcurlReady; }catch(e){ music__libcurlReady=null; music_tunnelState.status="bad"; throw e; }
}
globalThis.music_wispFetch = async function music_wispFetch(url, init){
  const lc=await music_ensureLibcurl();
  const sess=music_getHttpSession();
  const fn=(sess&&sess.fetch)?sess.fetch.bind(sess):lc.fetch.bind(lc);
  return fn(url, init);
}

