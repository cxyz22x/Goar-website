import "../../../services/storage.js";
globalThis.fetchAny = async function fetchAny(url, opts={}, timeout=16000){
  const tryWisp=async()=>{
    const lc=music_getLibcurl();
    if(!lc || typeof lc.fetch!=="function" || music_tunnelState.status==="bad") return null;
    return Promise.race([music_wispFetch(url,opts), new Promise((_,rej)=>setTimeout(()=>rej(new Error("wisp timeout")),timeout))]);
  };
  try{ const r=await tryWisp(); if(r) return r; }catch{}
  const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(),timeout);
  try{ return await fetch(url, Object.assign({},opts,{signal:ctrl.signal})); } finally{ clearTimeout(t); }
}

const storedTracks=S.list();
const savedTracks=Array.isArray(storedTracks)?storedTracks:[];
globalThis.state={ view:"home", viewHistory:[], shuffleHistory:[], tops:S.get("tops",TOP_SEED.slice()), news:S.get("news",NEW_SEED.slice()), list:savedTracks.slice(), queueGeneration:0, queueTouched:false, queueSeedable:savedTracks.length===0, i:0, playing:false, token:0, skip:0 };
globalThis.musicMarkQueueIntent=function musicMarkQueueIntent(){
  state.queueGeneration=(state.queueGeneration||0)+1;
  state.queueTouched=true;
  state.queueSeedable=false;
}
globalThis.musicSetQueue=function musicSetQueue(items){
  musicMarkQueueIntent();
  state.list=Array.isArray(items)?items.slice():[];
  return state.list;
}
globalThis.musicSeedQueueIfUntouched=function musicSeedQueueIfUntouched(items,generation,eligibleAtStart){
  if(!eligibleAtStart||!state.queueSeedable||state.queueTouched||state.queueGeneration!==generation||state.list.length||S.list().length) return false;
  const queue=Array.isArray(items)?items.slice():[];
  if(!queue.length) return false;
  state.list=queue;
  state.i=0;
  state.queueSeedable=false;
  return true;
}
globalThis.media=music_musicQuery("#player");
globalThis.engine={ hls:null, blob:null, kind:"" };
const initialVolume=Number(S.prefs().vol);
media.volume=Math.max(0,Math.min(1,Number.isFinite(initialVolume)?initialVolume:80)/100);
music_musicQuery("#vol").value=Number.isFinite(initialVolume)?Math.max(0,Math.min(100,initialVolume)):80;
globalThis.current=()=>state.list[state.i]||null;
globalThis.setStatus = function setStatus(msg){ const el=music_musicQuery("#playStatus"); if(el) el.textContent=msg; }

globalThis.musicParseDuration = function musicParseDuration(value){
  if(Number.isFinite(Number(value))&&Number(value)>0) return Number(value);
  const parts=String(value||"").split(":").map(Number);
  if(parts.length<2||parts.some(part=>!Number.isFinite(part))) return 0;
  return parts.reduce((total,part)=>total*60+part,0);
}
globalThis.uniqSongs = function uniqSongs(items){
  const out=[], seen=new Set();
  (items||[]).forEach(it=>{
    if(!it) return;
    const id=parseVideoId(it.id||it.videoId||it.url||"")||(typeof it.videoId==="string"&&it.videoId.length===11?it.videoId:"");
    const title=it.title||it.name; if(!id||!title||seen.has(id)||String(id).length!==11) return;
    seen.add(id); out.push({
      id,
      title,
      artist:String(it.artist||it.author||it.uploaderName||it.uploader||"YouTube").split("•")[0].trim(),
      duration:musicParseDuration(it.durationSeconds??it.lengthSeconds??it.length_seconds??it.duration)
    });
  });
  return out;
}
globalThis.invGet = async function invGet(path){
  let last;
  for(const base of INV){
    try{ const r=await fetchAny(base.replace(/\/$/,"")+path,{headers:{Accept:"application/json"}}); if(r&&r.ok) return r.json(); last=new Error("HTTP "+(r&&r.status)); }
    catch(e){ last=e; }
  }
  throw last||new Error("catalog down");
}
globalThis.playlistRss = async function playlistRss(pid){
  const r=await fetchAny("https://www.youtube.com/feeds/videos.xml?playlist_id="+pid);
  if(!r||!r.ok) return [];
  const xml=await r.text();
  const out=[];
  xml.split("<entry>").slice(1).forEach(block=>{
    const id=(block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)||[])[1];
    const title=(block.match(/<title>([^<]+)<\/title>/)||[])[1];
    const artist=(block.match(/<name>([^<]+)<\/name>/)||[])[1]||"YouTube";
    if(id&&title) out.push({id,title,artist});
  });
  return uniqSongs(out);
}
globalThis.playlistSongs = async function playlistSongs(pid){
  try{ const pl=await invGet("/api/v1/playlists/"+pid); const rows=uniqSongs(pl.videos||[]); if(rows.length) return rows; }catch{}
  for(const base of PIPED){
    try{ const r=await fetchAny(base+"/playlists/"+pid); if(!r||!r.ok) continue; const j=await r.json(); const rows=uniqSongs(j.relatedStreams||j.videos||j); if(rows.length) return rows; }catch{}
  }
  try{ return await playlistRss(pid); }catch{ return []; }
}
globalThis.kindOfUrl = function kindOfUrl(url, mime){
  const u=String(url||""), m=String(mime||"").toLowerCase();
  if(/\.m3u8(\?|$)/i.test(u) || m.includes("mpegurl") || m.includes("apple.mpeg")) return "hls";
  if(/\.mpd(\?|$)/i.test(u) || m.includes("dash+xml") || m.includes("mpd")) return "dash";
  return "file";
}
globalThis.pushCand = function pushCand(list, url, mime, title, artist, audioOnly){
  if(!url || /signatureCipher=|s=/.test(url) && !/[?&]url=/.test(url)) return;
  list.push({ url, mime:mime||"", kind:kindOfUrl(url, mime), title:title||"", artist:artist||"", audioOnly:!!audioOnly });
}
/* Client list mirrors iv-org/invidious src/invidious/yt_backend/youtube_api.cr */
globalThis.YT_CLIENTS= [
  { name:"ANDROID", version:"20.10.38", id:"3", ua:"com.google.android.youtube/20.10.38 (Linux; U; Android 14) gzip", extra:{ androidSdkVersion:30 } },
  { name:"ANDROID", version:"21.03.38", id:"3", ua:"com.google.android.youtube/21.03.38 (Linux; U; Android 14) gzip", extra:{ androidSdkVersion:34 } },
  { name:"TVHTML5", version:"7.20260311.16.00", id:"7", ua:"Mozilla/5.0 (ChromiumStyle TV)", extra:{} },
  { name:"MWEB", version:"2.20260722.01.00", id:"2", ua:"Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36", extra:{} }
];
globalThis.YT_PLAYER_ENDPOINTS= [
  "https://www.youtube.com/youtubei/v1/player?prettyPrint=false&key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
  "https://youtubei.googleapis.com/youtubei/v1/player?prettyPrint=false&key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8"
];
globalThis.harvestPlayer = function harvestPlayer(j, into){
  if(!j) return into;
  const d=j.videoDetails||{};
  if(d.title) into.title=d.title;
  if(d.author) into.artist=d.author;
  if(d.lengthSeconds) into.duration=musicParseDuration(d.lengthSeconds);
  const sd=j.streamingData||{};
  if(sd.hlsManifestUrl) into.hls=into.hls||sd.hlsManifestUrl;
  (sd.adaptiveFormats||[]).forEach(f=>{ if(f&&f.url) into.adaptive.push(f); });
  (sd.formats||[]).forEach(f=>{ if(f&&f.url) into.muxed.push(f); });
  return into;
}
globalThis.hasUsable = function hasUsable(bag){
  return !!(bag.hls || bag.adaptive.some(f=>f.url) || bag.muxed.some(f=>f.url));
}
globalThis.ytPlayerClient = async function ytPlayerClient(id, client){
  const ctxClient=Object.assign({
    clientName:client.name,
    clientVersion:client.version,
    hl:"en", gl:"US",
    userAgent:client.ua,
    utcOffsetMinutes:-new Date().getTimezoneOffset()
  }, client.extra||{});
  const body={
    context:{ client:ctxClient },
    videoId:id,
    contentCheckOk:true,
    racyCheckOk:true,
    playbackContext:{ contentPlaybackContext:{ html5Preference:"HTML5_PREF_WANTS", vis:0, splay:false, lactMilliseconds:"-1" } }
  };
  for(const url of YT_PLAYER_ENDPOINTS){
    try{
      const r=await fetchAny(url,{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "X-YouTube-Client-Name":client.id,
          "X-YouTube-Client-Version":client.version,
          "User-Agent":client.ua,
          "Origin":"https://www.youtube.com",
          "Referer":"https://www.youtube.com/"
        },
        body:JSON.stringify(body)
      },18000);
      if(r&&r.ok) return r.json();
    }catch{}
  }
  return null;
}
globalThis.ytExtract = async function ytExtract(id){
  const bag={ title:"", artist:"", hls:"", adaptive:[], muxed:[] };
  for(const client of YT_CLIENTS){
    try{
      const j=await ytPlayerClient(id, client);
      harvestPlayer(j, bag);
      if(hasUsable(bag) && (bag.adaptive.length || bag.muxed.length)) break;
    }catch{}
  }
  return bag;
}
globalThis.ytMusicSearch = async function ytMusicSearch(q){
  globalThis.musicYoutubeSearchFailure="";
  const body={
    context:{ client:{ clientName:"WEB_REMIX", clientVersion:"1.20260804.16.00", hl:"en", gl:"US" } },
    query:q
  };
  try{
    const r=await fetchAny("https://music.youtube.com/youtubei/v1/search?prettyPrint=false&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30",{
      method:"POST",
      headers:{ "Content-Type":"application/json", "X-YouTube-Client-Name":"67", "X-YouTube-Client-Version":"1.20260804.16.00" },
      body:JSON.stringify(body)
    },18000);
    if(!r||!r.ok){
      globalThis.musicYoutubeSearchFailure="HTTP "+(r&&r.status||"no response");
      return [];
    }
    const j=await r.json();
    const songs=[]; const seen=new Set();
    (function walk(n){
      if(!n||typeof n!=="object") return;
      if(Array.isArray(n)){ n.forEach(walk); return; }
      const item=n.musicResponsiveListItemRenderer;
      if(item){
        let id=item.playlistItemData&&item.playlistItemData.videoId;
        if(!id){ JSON.stringify(item).replace(/"videoId":"([\w-]{11})"/,(_,v)=>id=id||v); }
        if(id&&!seen.has(id)){
          const cols=(item.flexColumns||[]).map(c=>{
            const t=(c.musicResponsiveListItemFlexColumnRenderer||{}).text||{};
            return t.simpleText||(Array.isArray(t.runs)?t.runs.map(x=>x.text||"").join(""):"");
          });
          seen.add(id); songs.push({id,title:cols[0]||id,artist:String(cols[1]||"YouTube").split("•")[0].trim()});
        }
      }
      Object.values(n).forEach(walk);
    })(j);
    return uniqSongs(songs);
  }catch(error){
    globalThis.musicYoutubeSearchFailure=error&&error.message?error.message:"request failed";
    return [];
  }
}
globalThis.music_resolveSources = async function music_resolveSources(id){
  const cands=[]; let title="", artist="", duration=0;
  try{
    const bag=await ytExtract(id);
    title=bag.title||title; artist=bag.artist||artist;
    duration=bag.duration||duration;
    bag.adaptive.filter(f=>/audio/i.test(f.mimeType||f.type||"")).sort((a,b)=>(b.bitrate||0)-(a.bitrate||0)).forEach(f=>pushCand(cands,f.url,f.mimeType||f.type,title,artist,true));
    bag.muxed.forEach(f=>pushCand(cands,f.url,f.mimeType||f.type,title,artist,false));
    if(bag.hls) pushCand(cands, bag.hls, "application/vnd.apple.mpegurl", title, artist, false);
  }catch{}
  try{
    const j=await invGet("/api/v1/videos/"+encodeURIComponent(id)+"?region=US");
    title=j.title||title; artist=j.author||artist;
    duration=musicParseDuration(j.lengthSeconds??j.length_seconds??j.duration)||duration;
    const adaptive=j.adaptiveFormats||[], muxed=j.formatStreams||[];
    adaptive.filter(f=>/audio/i.test(f.type||f.mimeType||"")&&f.url).sort((a,b)=>(b.bitrate||0)-(a.bitrate||0)).forEach(f=>pushCand(cands,f.url,f.type||f.mimeType,title,artist,true));
    muxed.filter(f=>f.url).forEach(f=>pushCand(cands,f.url,f.type||f.mimeType,title,artist,false));
    if(j.hlsUrl) pushCand(cands, j.hlsUrl, "application/vnd.apple.mpegurl", title, artist, false);
  }catch{}
  for(const base of PIPED){
    try{
      const r=await fetchAny(base+"/streams/"+id); if(!r||!r.ok) continue;
      const j=await r.json();
      title=j.title||title; artist=j.uploader||artist;
      duration=musicParseDuration(j.duration)||duration;
      (j.audioStreams||[]).sort((a,b)=>(b.bitrate||0)-(a.bitrate||0)).forEach(f=>pushCand(cands,f.url,f.mimeType||f.codec,title,artist,true));
      if(j.hls) pushCand(cands, j.hls, "application/vnd.apple.mpegurl", title, artist, false);
      (j.videoStreams||[]).filter(f=>f.url).slice(0,2).forEach(f=>pushCand(cands,f.url,f.mimeType,title,artist,false));
      if(cands.length) break;
    }catch{}
  }
  const seen=new Set();
  const out=cands.filter(c=>{ if(!c.url||seen.has(c.url)) return false; seen.add(c.url); return true; });
  out.sort((a,b)=>{
    const rank=x=>x.audioOnly&&x.kind==="file"?0:x.kind==="file"?1:x.kind==="hls"?2:3;
    return rank(a)-rank(b);
  });
  if(!out.length) throw new Error("No playable audio source could be resolved. Public YouTube/Invidious/Piped sources may be unavailable or may block playback in this browser. Try again later or add an audio file from this device.");
  out.forEach(c=>{ c.title=c.title||title; c.artist=c.artist||artist; c.duration=duration; });
  return out;
}
export class WispHlsLoader{
  constructor(config){ this.config=config; this.stats={aborted:false,loaded:0,retry:0,total:0,chunkCount:0,bwEstimate:0,loading:{start:0,first:0,end:0},buffering:{start:0,first:0,end:0},parsing:{start:0,end:0}}; this._abort=false; }
  abort(){ this._abort=true; this.stats.aborted=true; }
  destroy(){ this.abort(); }
  load(context, config, callbacks){
    this.stats.loading.start=performance.now();
    const wantText=context.responseType==="text" || (context.type && String(context.type).indexOf("manifest")>=0);
    fetchAny(context.url).then(async r=>{
      if(this._abort) return;
      if(!r.ok) throw new Error("HTTP "+r.status);
      const data=wantText ? await r.text() : await r.arrayBuffer();
      this.stats.loaded=typeof data==="string"?data.length:data.byteLength;
      this.stats.total=this.stats.loaded;
      this.stats.loading.first=this.stats.loading.end=performance.now();
      callbacks.onSuccess({url:context.url,data}, this.stats, context, null);
    }).catch(err=>{
      if(this._abort) return;
      callbacks.onError({code:0,text:String(err&&err.message?err.message:err)}, context, null);
    });
  }
}

