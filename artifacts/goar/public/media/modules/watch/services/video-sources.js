import "../../../services/storage.js";
globalThis.playerToken= 0;
globalThis.playerState= { id:null, type:"movie", title:"", item:null, seasons:[], season:1, episode:1, sources:[], sourceName:null, hls:null };
globalThis.playerRetryAction = null;
globalThis.playerReturnFocus = null;
let playerStatusTimer = 0;
window.playerState = playerState;

globalThis.VR_ORIGINS= ["https://vidrock.net", "https://vidrock.to"];
globalThis.VR_ORIGIN= VR_ORIGINS[0];
globalThis.VR_AES_KEY_HEX= "7f3e9c2a8b5d1f4e6a9c3b7d2e5f8a1c4b6d9e2f5a8c1b4d7e9f2a5c8b1d4e7f";
globalThis.PLAY_UA= "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
globalThis.SOURCES_CACHE_TTL= 60000;
globalThis.SERVER_ORDER= ["Nova","Atlas","Luna","Orion","Astra"];
globalThis.SERVER_PROFILES= {
  Nova:  { hosts:["cdn.ngcorp.dad"], needsProxy:true,  directPlayable:false },
  Atlas: { hosts:["cdn1.ngcorp.dad"], needsProxy:true,  directPlayable:false },
  Luna:  { hosts:["dreadnought.flamingo-e55.workers.dev"], needsProxy:true, directPlayable:true },
  Orion: { hosts:["dream.flamingo-e55.workers.dev","celestialdreamer.lol","goldenfirewanderer.lol","obsidiancircuit.site"], needsProxy:true, directPlayable:true },
  Astra: { hosts:["streamrk.site","v1.streamrk.site"], needsProxy:false, directPlayable:true, normalize:true }
};
globalThis.sourceCache= new Map();
globalThis.playHeaders = function playHeaders(extra){
  return Object.assign({
    "User-Agent": PLAY_UA,
    Referer: VR_ORIGIN + "/",
    Origin: VR_ORIGIN,
    Accept: "*/*"
  }, extra || {});
}
globalThis.profileByName = function profileByName(name){ return SERVER_PROFILES[name] || null; }
globalThis.profileByUrl = function profileByUrl(url){
  try {
    const host = new URL(url).hostname;
    for (const name of SERVER_ORDER){
      const p = SERVER_PROFILES[name];
      if (p.hosts.some(h => host === h || host.endsWith("." + h))) return Object.assign({ name }, p);
    }
  } catch(e){}
  return null;
}
globalThis.stripPngPrefix = function stripPngPrefix(buf){
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  if (u8.length >= 1 && u8[0] === 0x47) return u8;
  if (u8.length < 8 || u8[0] !== 0x89 || u8[1] !== 0x50 || u8[2] !== 0x4e || u8[3] !== 0x47) return u8;
  const n = [0x49,0x45,0x4e,0x44];
  for (let i = 0; i < u8.length - 8; i++){
    if (u8[i]===n[0] && u8[i+1]===n[1] && u8[i+2]===n[2] && u8[i+3]===n[3]) return u8.subarray(i + 8);
  }
  return u8;
}
globalThis._vrKeyPromise= null;

globalThis.hexToBytes = function hexToBytes(hex){
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i*2, 2), 16);
  return out;
}
globalThis.b64urlToBytes = function b64urlToBytes(input){
  let b64 = String(input).replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  if (pad === 2) b64 += "==";
  else if (pad === 3) b64 += "=";
  else if (pad === 1) throw new Error("bad b64url");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
globalThis.vrAesKey = function vrAesKey(){
  if (_vrKeyPromise) return _vrKeyPromise;
  _vrKeyPromise = crypto.subtle.importKey("raw", hexToBytes(VR_AES_KEY_HEX), "AES-GCM", false, ["decrypt"]);
  return _vrKeyPromise;
}
globalThis.decryptStreamUrl = async function decryptStreamUrl(ciphertext){
  const bytes = b64urlToBytes(ciphertext);
  if (bytes.length < 28) throw new Error("ciphertext too short");
  const iv = bytes.slice(0, 12);
  const dataAndTag = bytes.slice(12);
  const key = await vrAesKey();
  const pt = await crypto.subtle.decrypt({ name:"AES-GCM", iv }, key, dataAndTag);
  return new TextDecoder().decode(pt);
}
globalThis.decryptSourcesPayload = async function decryptSourcesPayload(payload){
  const sources = [];
  for (const name of Object.keys(payload || {})){
    const row = payload[name];
    if (!row || typeof row !== "object" || !row.url) continue;
    try {
      const url = await decryptStreamUrl(row.url);
      let format = row.type === "mp4" ? "mp4" : (row.type === "hls" ? "hls" : null);
      if (!format) format = /\.m3u8(\?|$)/i.test(url) ? "hls" : "mp4";
      sources.push({ name, url, format, language: row.language || "" });
    } catch(e){
    }
  }
  return sources;
}

globalThis.mediaFetch = async function mediaFetch(url, init){
  const merged = Object.assign({}, init || {});
  merged.headers = playHeaders(init && init.headers);
  if (tunnelState.status === "ok"){
    try { return await wispFetch(url, merged); } catch(e){}
  }
  return fetch(url, merged);
}

globalThis.qualityPref = function qualityPref(){
  try {
    const v = mediaStorage.getItem("goar_q") || "auto";
    return (v === "480" || v === "720" || v === "1080") ? v : "auto";
  } catch(e){ return "auto"; }
}
globalThis.setQualityPref = function setQualityPref(v){
  try { mediaStorage.setItem("goar_q", v); } catch(e){}
}
globalThis.closestQuality = function closestQuality(list, pref){
  if (!list || !list.length) return null;
  const sorted = list.slice().sort((a, b) => b.height - a.height);
  if (!pref || pref === "auto") return sorted[0];
  const want = Number(pref);
  let best = sorted[0], diff = Math.abs((sorted[0].height || 0) - want);
  for (const row of sorted){
    const d = Math.abs((row.height || 0) - want);
    if (d < diff){ best = row; diff = d; }
  }
  return best;
}
globalThis.serverRowHtml = function serverRowHtml(sources, active){
  const names = SERVER_ORDER.slice();
  sources.forEach(s => { if (names.indexOf(s.name) < 0) names.push(s.name); });
  return '<div class="srv-row">' + names.map(n => {
    const ok = sources.some(s => s.name === n);
    return '<button type="button" class="srv' + (n === active ? ' on' : '') + '" data-srv="' + n + '"' + (ok ? '' : ' disabled') + '>' + n + '</button>';
  }).join('') + '</div>';
}
globalThis.bindServerRow = function bindServerRow(sources){
  const row = document.querySelector("#playerPicker .srv-row");
  if (!row) return;
  row.querySelectorAll("[data-srv]").forEach(btn => {
    btn.onclick = () => {
      if (btn.disabled) return;
      const next = sources.find(s => s.name === btn.getAttribute("data-srv"));
      if (!next) return;
      row.querySelectorAll(".srv").forEach(b => b.classList.toggle("on", b === btn));
      playSource(next).catch(e => setPlayerStatus(e.message || String(e), true));
    };
  });
}
globalThis.qualitySelectHtml = function qualitySelectHtml(){
  const pref = qualityPref();
  return '<select id="selQuality" aria-label="Quality">' +
    ["auto","1080","720","480"].map(v =>
      '<option value="' + v + '"' + (v === pref ? " selected" : "") + ">" + (v === "auto" ? "Auto" : v + "p") + "</option>"
    ).join("") + "</select>";
}
globalThis.applyHlsQuality = function applyHlsQuality(hls){
  if (!hls || !hls.levels || !hls.levels.length) return;
  const pref = qualityPref();
  if (pref === "auto"){ hls.currentLevel = -1; return; }
  const want = Number(pref);
  let best = 0, diff = Infinity;
  hls.levels.forEach((lv, i) => {
    const d = Math.abs((lv.height || 0) - want);
    if (d < diff){ diff = d; best = i; }
  });
  hls.currentLevel = best;
}
globalThis.readAstraQualities = async function readAstraQualities(url){
  const res = await mediaFetch(url, { headers: playHeaders({ Accept: "application/json, */*" }) });
  if (!res.ok) throw new Error("astra playlist " + res.status);
  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch(e){ return []; }
  if (!Array.isArray(data)) return [];
  return data.filter(row => row && typeof row.resolution === "number" && typeof row.url === "string")
    .map(row => ({ height: row.resolution, url: row.url }));
}
globalThis.normalizeAstraUrl = async function normalizeAstraUrl(url){
  const rows = await readAstraQualities(url);
  const pick = closestQuality(rows, qualityPref());
  return pick ? pick.url : url;
}

globalThis.resolveSources = async function resolveSources(id, type, season, episode){
  const path = type === "movie" ? ("/api/movie/" + id) : ("/api/tv/" + id + "/" + season + "/" + episode);
  const cacheKey = path;
  const hit = sourceCache.get(cacheKey);
  if (hit && Date.now() - hit.at < SOURCES_CACHE_TTL) return hit.sources.map(s => Object.assign({}, s));

  let payload = null, lastErr = null;
  for (const origin of VR_ORIGINS){
    VR_ORIGIN = origin;
    const url = origin + path;
    const init = { headers: playHeaders({ Accept: "application/json" }) };
    try {
      let res;
      try { res = await mediaFetch(url, init); }
      catch(e){ res = await fetch(url, init); }
      if (!res.ok) throw new Error("source catalog HTTP " + res.status);
      const json = await res.json();
      if (!json || typeof json !== "object" || Array.isArray(json)) throw new Error("api json invalid");
      payload = json;
      break;
    } catch(e){ lastErr = e; }
  }
  if (!payload) throw lastErr || new Error("source catalog failed");

  let sources = await decryptSourcesPayload(payload);
  sources.sort((a, b) => {
    const ia = SERVER_ORDER.indexOf(a.name);
    const ib = SERVER_ORDER.indexOf(b.name);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  for (const src of sources){
    const prof = profileByName(src.name);
    if (prof && prof.normalize){
      try {
        const rows = await readAstraQualities(src.url);
        src.format = "mp4";
        if (rows.length){
          src.qualities = rows;
          const pick = closestQuality(rows, qualityPref());
          src.url = pick.url;
          src.height = pick.height;
        }
      } catch(e){ src._dead = true; }
    }
  }
  sources = sources.filter(s => !s._dead);
  if (!sources.length) throw new Error("no playable sources");
  sourceCache.set(cacheKey, { at: Date.now(), sources });
  return sources.map(s => Object.assign({}, s));
}

globalThis.setPlayerStatus = function setPlayerStatus(html, isErr){
  const el = document.getElementById("playerStatus");
  if (!el) return;
  clearTimeout(playerStatusTimer);
  if (!html){
    el.classList.add("hide");
    el.replaceChildren();
    el.style.pointerEvents = "none";
    return;
  }
  el.classList.remove("hide");
  el.style.pointerEvents = isErr ? "auto" : "none";
  el.replaceChildren();
  const message = document.createElement("span");
  message.textContent = String(html);
  if (isErr) {
    const heading = document.createElement("b");
    heading.textContent = "Playback problem";
    el.appendChild(heading);
    el.setAttribute("role", "alert");
    el.appendChild(message);
    if (typeof playerRetryAction === "function") {
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "btn btn-ghost";
      retry.textContent = "Retry playback";
      retry.onclick = () => playerRetryAction();
      el.appendChild(retry);
    }
    return;
  }
  el.setAttribute("role", "status");
  el.appendChild(message);
  if (String(html).startsWith("Ready —")) {
    playerStatusTimer = setTimeout(() => setPlayerStatus(""), 6000);
  }
}

globalThis.destroyHls = function destroyHls(){
  if (playerState.hls){
    try { playerState.hls.destroy(); } catch(e){}
    playerState.hls = null;
  }
  const v = document.getElementById("playerVideo");
  if (v){ try { v.pause(); } catch(e){} v.removeAttribute("src"); v.load(); }
}

class WispHlsLoader {
  constructor(config){
    this.config = config;
    this.stats = { aborted:false, loaded:0, retry:0, total:0, chunkCount:0, bwEstimate:0, loading:{start:0,first:0,end:0}, buffering:{start:0,first:0,end:0}, parsing:{start:0,end:0} };
    this._abort = false;
  }
  abort(){ this._abort = true; this.stats.aborted = true; }
  destroy(){ this.abort(); }
  load(context, config, callbacks){
    this.stats.loading.start = performance.now();
    const wantText = context.responseType === "text" || (context.type && String(context.type).indexOf("manifest") >= 0);
    mediaFetch(context.url, { headers: playHeaders() }).then(async (r) => {
      if (this._abort) return;
      if (!r.ok) throw new Error("HTTP " + r.status);
      let data;
      if (wantText){
        data = await r.text();
      } else {
        const raw = new Uint8Array(await r.arrayBuffer());
        const stripped = stripPngPrefix(raw);
        data = stripped.buffer.slice(stripped.byteOffset, stripped.byteOffset + stripped.byteLength);
      }
      this.stats.loaded = typeof data === "string" ? data.length : data.byteLength;
      this.stats.total = this.stats.loaded;
      this.stats.loading.first = this.stats.loading.end = performance.now();
      callbacks.onSuccess({ url: context.url, data }, this.stats, context, null);
    }).catch((err) => {
      if (this._abort) return;
      callbacks.onError({ code: 0, text: String(err && err.message ? err.message : err) }, context, null);
    });
  }
}

globalThis.playSource = async function playSource(source){
  const video = document.getElementById("playerVideo");
  destroyHls();
  playerState.sourceName = source.name;
  setPlayerStatus("Starting " + source.name + "…");
  if (source.format === "mp4"){
    if (source.qualities && source.qualities.length){
      const pick = closestQuality(source.qualities, qualityPref());
      if (pick){ source.url = pick.url; source.height = pick.height; }
    }
    const keep = video.currentTime || 0;
    video.src = source.url;
    if (keep > 1){
      video.addEventListener("loadedmetadata", function once(){
        video.removeEventListener("loadedmetadata", once);
        try { video.currentTime = keep; } catch(e){}
      });
    }
    setPlayerStatus("");
    try { await video.play(); }
    catch { setPlayerStatus("Ready — press Play on the video controls if playback did not start."); }
    return;
  }
  const canNative = video.canPlayType && video.canPlayType("application/vnd.apple.mpegurl");
  if (canNative && !window.Hls){
    video.src = source.url;
    setPlayerStatus("");
    try { await video.play(); }
    catch { setPlayerStatus("Ready — press Play on the video controls if playback did not start."); }
    return;
  }
  if (typeof Hls === "undefined") throw new Error("hls.js missing");
  async function attach(loader){
    const opts = { enableWorker: true, lowLatencyMode: false, maxBufferLength: 8, maxMaxBufferLength: 16 };
    if (loader) opts.loader = loader;
    const hls = new Hls(opts);
    playerState.hls = hls;
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("manifest timeout")), 18000);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { applyHlsQuality(hls); clearTimeout(t); resolve(); });
      hls.on(Hls.Events.LEVEL_SWITCHED, function(_, data){
        const lv = hls.levels && hls.levels[data.level];
        if (lv && lv.height && qualityPref() !== "auto") setPlayerStatus(lv.height + "p");
      });
      hls.on(Hls.Events.ERROR, (evt, data) => {
        if (data && data.fatal){ clearTimeout(t); reject(new Error(data.details || data.type || "hls fatal")); }
      });
      hls.loadSource(source.url);
      hls.attachMedia(video);
    });
  }
  try {
    if (tunnelState.status === "ok") await attach(WispHlsLoader);
    else await attach(null);
  } catch(e1){
    destroyHls();
    await attach(tunnelState.status === "ok" ? null : WispHlsLoader);
  }
  setPlayerStatus("");
  try { await video.play(); }
  catch { setPlayerStatus("Ready — press Play on the video controls if playback did not start."); }
}

globalThis.openPlayer = async function openPlayer(id, type, title, itemData){
  type = (type === "movie") ? "movie" : "tv";
  const myToken = ++playerToken;
  playerState.id = id;
  playerState.type = type;
  playerState.title = title || "";
  playerState.item = itemData || null;
  playerState.seasons = [];
  playerState.season = 1;
  playerState.episode = 1;
  playerState.sources = [];
  playerState.sourceName = null;

  const overlay = document.getElementById("playerOverlay");
  if (!overlay.classList.contains("open")) globalThis.playerReturnFocus = document.activeElement;
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
  playerRetryAction = () => openPlayer(id, type, title, itemData);
  document.body.style.overflow = "hidden";
  document.getElementById("playerTitle").textContent = title || "Now Playing";
  document.getElementById("playerTag").textContent = type === "movie" ? "MOVIE" : "TV";
  document.getElementById("playerPicker").innerHTML = "";
  destroyHls();
  setPlayerStatus("Resolving stream…");

  try { if (overlay.requestFullscreen) await overlay.requestFullscreen(); } catch(e){}
  ensureLibcurl().catch(()=>{});

  async function loadEpisode(seasonNum, episodeNum){
    if (myToken !== playerToken) return;
    if (seasonNum) playerState.season = seasonNum;
    if (episodeNum) playerState.episode = episodeNum;
    playerRetryAction = () => loadEpisode(playerState.season, playerState.episode);
    setPlayerStatus("Connecting player…");
    destroyHls();
    try {
      try { await ensureLibcurl(); } catch(e){}
      const sources = await resolveSources(id, type, playerState.season, playerState.episode);
      if (myToken !== playerToken) return;
      playerState.sources = sources;
      const prefer = sources.find(s => s.name === playerState.sourceName) || sources[0];
      const picker = document.getElementById("playerPicker");
      const srcSel = '<select id="selServer">' + sources.map(s =>
        '<option value="' + s.name + '"' + (s.name === prefer.name ? ' selected' : '') + '>' + s.name + ' · ' + s.format.toUpperCase() + '</option>'
      ).join("") + '</select>';
      const seasonHtml = picker.querySelector("#selSeason") ? picker.querySelector("#selSeason").outerHTML : "";
      const epHtml = picker.querySelector("#selEpisode") ? picker.querySelector("#selEpisode").outerHTML : "";
      if (type === "tv" && playerState.seasons.length){
        /* keep season selects; rebuild server only */
      }
      const seasonBlock = (type === "tv" && playerState.seasons.length)
        ? '<select id="selSeason">' + playerState.seasons.map(s => '<option value="' + s.season_number + '"' + (s.season_number === playerState.season ? ' selected' : '') + '>Season ' + s.season_number + '</option>').join("") + '</select>' +
          '<select id="selEpisode"></select>'
        : "";
      picker.innerHTML = serverRowHtml(sources, prefer.name) + qualitySelectHtml() + seasonBlock;
      bindServerRow(sources);
      document.getElementById("selQuality").onchange = () => {
        setQualityPref(document.getElementById("selQuality").value);
        if (playerState.hls){ applyHlsQuality(playerState.hls); return; }
        const cur = playerState.sources.find(s => s.name === playerState.sourceName);
        if (cur && cur.qualities && cur.qualities.length){
          playSource(cur).catch(e => setPlayerStatus(e.message || String(e), true));
        }
      };
      if (type === "tv" && playerState.seasons.length){
        const sObj = playerState.seasons.find(x => x.season_number === playerState.season);
        const count = sObj && sObj.episode_count ? sObj.episode_count : 1;
        document.getElementById("selEpisode").innerHTML =
          Array.from({ length: count }, (_, i) => '<option value="' + (i+1) + '"' + ((i+1) === playerState.episode ? ' selected' : '') + '>Episode ' + (i+1) + '</option>').join("");
        document.getElementById("selSeason").onchange = () => {
          playerState.season = Number(document.getElementById("selSeason").value);
          playerState.episode = 1;
          loadEpisode(playerState.season, 1);
        };
        document.getElementById("selEpisode").onchange = () => {
          playerState.episode = Number(document.getElementById("selEpisode").value);
          loadEpisode(playerState.season, playerState.episode);
        };
      }
      let lastErr = null;
      const order = [prefer].concat(sources.filter(s => s !== prefer));
      for (const src of order){
        try {
          const row = document.querySelector("#playerPicker .srv-row");
          if (row) row.querySelectorAll(".srv").forEach(b => b.classList.toggle("on", b.getAttribute("data-srv") === src.name));
          await playSource(src);
          lastErr = null;
          break;
        } catch(e){
          lastErr = e;
        }
      }
      if (lastErr) throw lastErr;
    } catch(e){
      const detail = String(e && e.message ? e.message : e).replace(/([?&](?:api_key|key|token|password|secret|auth)=)[^&\s]+/gi, "$1[redacted]");
      setPlayerStatus("Could not start playback: " + detail, true);
    }
  }

  if (type === "tv"){
    try {
      const show = await tmdb("/tv/" + id);
      if (myToken !== playerToken) return;
      playerState.seasons = (show.seasons || []).filter(s => s.season_number > 0);
      if (playerState.seasons.length){
        playerState.season = playerState.seasons[0].season_number;
        playerState.episode = 1;
      }
    } catch(e){}
  }

  await loadEpisode(playerState.season, playerState.episode);
  if (itemData) pushContinue(itemData, type, playerState.season, playerState.episode);
}

globalThis.closePlayer = function closePlayer(){
  playerToken++;
  destroyHls();
  setPlayerStatus("");
  playerRetryAction = null;
  const overlay = document.getElementById("playerOverlay");
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");
  document.getElementById("playerPicker").innerHTML = "";
  document.body.style.overflow = "";
  if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
  if (globalThis.playerReturnFocus && globalThis.playerReturnFocus.isConnected) globalThis.playerReturnFocus.focus();
  globalThis.playerReturnFocus = null;
}
document.getElementById("playerClose").onclick = closePlayer;
document.getElementById("playerVideo").addEventListener("error", () => {
  if (document.getElementById("playerOverlay").classList.contains("open") && document.getElementById("playerVideo").currentSrc) {
    setPlayerStatus("The selected stream stopped or could not be decoded. Choose another server or retry.", true);
  }
});

/* ================= HERO ================= */

