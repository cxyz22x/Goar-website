import "../../../services/storage.js";
import { mediaRelay } from "../../../services/relay.js";



/* ============================================================
   WISP TUNNEL CONFIGURATION
   ============================================================
   Point this at your own WISP server for reliability:

     expose it as wss://your-host/

   Public demo (rate-limited, may be down):
     wss://wisp.mercurywork.shop/

   WISP URLs are host + path only. No port number.
   ============================================================ */
globalThis.LIBCURL_SOURCES= [
  "https://cdn.jsdelivr.net/npm/libcurl.js@0.7.4/libcurl_full.js",
  "https://unpkg.com/libcurl.js@0.7.4/libcurl_full.js",
  "https://cdn.jsdelivr.net/npm/libcurl.js@latest/libcurl_full.js"
];
globalThis.DEFAULT_WISP_URLS= [
  "wss://wisp.mercurywork.shop/",
  "wss://wisp.mercurywork.shop/wisp/"
];
globalThis.normalizeWispUrl = function normalizeWispUrl(url){
  if (!url) return "";
  let u = String(url).trim();
  if (u.startsWith("https://")) u = "wss://" + u.slice(8);
  if (u.startsWith("http://")) u = "ws://" + u.slice(7);
  try {
    const dummy = new URL(u.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:"));
    dummy.port = "";
    const scheme = dummy.protocol === "https:" ? "wss://" : "ws://";
    u = scheme + dummy.hostname + (dummy.pathname || "/") + dummy.search;
  } catch(e){
    u = u.replace(/^(wss?:\/\/[^\/]+):\d+/i, "$1");
  }
  if (u && !u.endsWith("/")) u += "/";
  return u;
}
globalThis.loadSavedWispList = function loadSavedWispList(){
  const extra = [];
  try {
    const custom = mediaStorage.getItem("goar_wisp_custom");
    if (custom) extra.push(normalizeWispUrl(custom));
    const last = mediaStorage.getItem("goar_wisp_url");
    if (last) extra.push(normalizeWispUrl(last));
  } catch(e){}
  const seen = new Set();
  return [...extra, ...DEFAULT_WISP_URLS].filter(u => {
    if (!u || seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}
globalThis.WISP_URL= loadSavedWispList()[0] || "wss://wisp.mercurywork.shop/";
globalThis.tunnelState= { status: "boot", url: WISP_URL, error: "" };

globalThis.VIDROCK= "https://vidrock.to";
globalThis.API_KEY= "52b87ad6cb79d6149c0453cd52253b72";
globalThis.BASE= "https://api.themoviedb.org/3";
globalThis.IMG= "https://image.tmdb.org/t/p";
globalThis.REGION= "US";
try { const loc = (navigator.language || "en-US").split("-")[1]; if (loc) REGION = loc.toUpperCase(); } catch(e){}
globalThis.TODAY= new Date().toISOString().slice(0,10);
globalThis.activeTab= "home";
globalThis.providerMapCache= {};
globalThis.regionChangeHooked= false;

/* ================= libcurl.js bootstrap ================= */
globalThis._libcurlReady= null;

window.addEventListener("goar:relay-change", (event) => {
  const url = event.detail && event.detail.url;
  if (!url) return;
  WISP_URL = url;
  tunnelState.url = url;
  const select = document.getElementById("wispSelect");
  if (select && [...select.options].some((option) => option.value === url)) select.value = url;
});

globalThis.setTunnelChip = function setTunnelChip(status, label){
  tunnelState.status = status;
  const chip = document.getElementById("tunnelChip");
  const lab = document.getElementById("tunnelLabel");
  if (lab) lab.textContent = label;
  if (!chip) return;
  chip.classList.remove("ok","bad","busy");
  chip.classList.add(status === "ok" ? "ok" : status === "bad" ? "bad" : "busy");
}

globalThis.getLibcurl = function getLibcurl(){
  if (typeof window.libcurl !== "undefined" && window.libcurl) return window.libcurl;
  try {
    const lc = (0, eval)("typeof libcurl !== 'undefined' ? libcurl : null");
    if (lc){ window.libcurl = lc; return lc; }
  } catch(e){}
  return null;
}

globalThis.injectLibcurlScript = function injectLibcurlScript(src){
  if (getLibcurl()) return Promise.resolve(src);
  if (document.querySelector('script[src*="libcurl"]')) {
    return waitLibcurlObject(8000).then(() => src);
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve(src);
    s.onerror = () => reject(new Error("script failed: " + src));
    document.head.appendChild(s);
  });
}

globalThis.waitLibcurlObject = function waitLibcurlObject(ms){
  return new Promise((resolve, reject) => {
    const hit = getLibcurl();
    if (hit) return resolve(hit);
    const t0 = Date.now();
    const iv = setInterval(() => {
      const lc = getLibcurl();
      if (lc){
        clearInterval(iv);
        resolve(lc);
      } else if (Date.now() - t0 > ms){
        clearInterval(iv);
        reject(new Error("libcurl.js did not attach to window"));
      }
    }, 50);
  });
}

globalThis.waitLibcurlWasm = async function waitLibcurlWasm(lc){
  if (lc.ready === true) return lc;
  if (typeof lc.load_wasm === "function"){
    try { await lc.load_wasm(); return lc; } catch(e){}
  }
  await new Promise((resolve, reject) => {
    let settled = false;
    const done = () => { if (settled) return; settled = true; resolve(); };
    const fail = (e) => { if (settled) return; settled = true; reject(e || new Error("libcurl abort")); };
    if (typeof lc.onload === "undefined" || lc.onload === null){
      lc.onload = done;
    }
    document.addEventListener("libcurl_load", done, { once: true });
    document.addEventListener("libcurl_abort", (ev) => fail(ev && ev.error), { once: true });
    if (lc.events && typeof lc.events.addEventListener === "function"){
      lc.events.addEventListener("load", done, { once: true });
    }
    setTimeout(() => {
      if (lc.ready === true || (lc.version && lc.fetch)) done();
    }, 200);
    setTimeout(() => fail(new Error("libcurl WASM timed out")), 20000);
  });
  return lc;
}

globalThis.applyWispUrl = function applyWispUrl(lc, url){
  const u = normalizeWispUrl(url);
  if (!u) throw new Error("WISP URL required and must end with /");
  mediaRelay.configure(lc, u);
  WISP_URL = u;
  tunnelState.url = u;
}

globalThis.probeTunnel = async function probeTunnel(lc){
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = setTimeout(() => { try { ctrl && ctrl.abort(); } catch(e){} }, 12000);
  try {
    const r = await lc.fetch("https://example.com/", ctrl ? { signal: ctrl.signal } : {});
    const body = await r.text();
    if (!r.ok && r.status >= 500) throw new Error("probe HTTP " + r.status);
    if (!body) throw new Error("empty probe response");
    return true;
  } finally {
    clearTimeout(timer);
  }
}

globalThis.getHttpSession = function getHttpSession(){
  return mediaRelay.getSession("watch", window.libcurl);
}

globalThis.resetHttpSession = function resetHttpSession(){
  mediaRelay.resetSession("watch");
}

globalThis.ensureLibcurl = async function ensureLibcurl(force){
  if (_libcurlReady && !force) return _libcurlReady;
  _libcurlReady = (async () => {
    setTunnelChip("busy", "loading WASM…");
    let lc = null;
    try {
      lc = await waitLibcurlObject(1500);
    } catch(e){
      let last = e;
      for (const src of LIBCURL_SOURCES){
        try { await injectLibcurlScript(src); lc = await waitLibcurlObject(8000); break; }
        catch(err){ last = err; }
      }
      if (!lc) throw last;
    }
    await waitLibcurlWasm(lc);
    if (typeof lc.fetch !== "function" || typeof lc.set_websocket !== "function"){
      throw new Error("libcurl.js loaded without fetch/set_websocket");
    }

    const urls = loadSavedWispList();
    let lastErr = null;
    for (const url of urls){
      setTunnelChip("busy", "wisp…");
      try {
        applyWispUrl(lc, url);
        resetHttpSession();
        await probeTunnel(lc);
        setTunnelChip("ok", "wisp");
        tunnelState.error = "";
        window.libcurl = lc;
        return lc;
      } catch(e){
        lastErr = e;
        console.warn("[goarxyz] WISP probe failed:", url, e);
      }
    }
    // Keep last URL applied so a later retry / custom URL can still work
    applyWispUrl(lc, urls[0]);
    setTunnelChip("bad", "wisp down");
    tunnelState.error = lastErr && lastErr.message ? lastErr.message : String(lastErr || "all WISP endpoints failed");
    window.libcurl = lc;
    return lc;
  })();
  try {
    return await _libcurlReady;
  } catch(e){
    _libcurlReady = null;
    setTunnelChip("bad", "libcurl fail");
    tunnelState.error = e && e.message ? e.message : String(e);
    throw e;
  }
}

globalThis.wispFetch = async function wispFetch(url, init){
  const lc = await ensureLibcurl();
  const sess = getHttpSession();
  const fn = (sess && sess.fetch) ? sess.fetch.bind(sess) : lc.fetch.bind(lc);
  return fn(url, init);
}
globalThis.wispText = async function wispText(url, init){
  const r = await wispFetch(url, init);
  if (!r.ok) throw new Error("WISP HTTP " + r.status + " " + url);
  return r.text();
}
globalThis.wispBytes = async function wispBytes(url, init){
  const r = await wispFetch(url, init);
  if (!r.ok) throw new Error("WISP HTTP " + r.status + " " + url);
  return r.arrayBuffer();
}

globalThis.buildWispSelect = function buildWispSelect(){
  const sel = document.getElementById("wispSelect");
  if (!sel || sel._hooked) return;
  const urls = loadSavedWispList();
  sel.innerHTML = urls.map(u => '<option value="' + u + '"' + (u===WISP_URL?' selected':'') + '>' + u.replace(/^wss:\/\//,"") + '</option>').join("") +
    '<option value="__custom__">custom wss://…</option>';
  sel.onchange = async () => {
    let url = sel.value;
    if (url === "__custom__"){
      const typed = prompt("WISP WebSocket URL (must end with /)", WISP_URL);
      if (!typed){ sel.value = WISP_URL; return; }
      url = normalizeWispUrl(typed);
      try { mediaStorage.setItem("goar_wisp_custom", url); } catch(e){}
    }
    WISP_URL = url;
    try { mediaStorage.setItem("goar_wisp_url", url); } catch(e){}
    resetHttpSession();
    _libcurlReady = null;
    toast("Switching WISP…");
    try {
      const lc = await ensureLibcurl(true);
      applyWispUrl(lc, url);
      await probeTunnel(lc);
      setTunnelChip("ok", "wisp");
      toast("WISP connected");
    } catch(e){
      setTunnelChip("bad", "wisp down");
      toast("WISP failed: " + (e.message || e));
    }
    sel._hooked = false;
    buildWispSelect();
  };
  const retry = document.getElementById("wispRetry");
  if (retry && !retry._hooked){
    retry._hooked = true;
    retry.onclick = async () => {
      resetHttpSession();
      _libcurlReady = null;
      try { await ensureLibcurl(true); toast("Tunnel ready"); }
      catch(e){ toast("Tunnel failed: " + (e.message || e)); }
    };
  }
  sel._hooked = true;
}

window.goarTunnelFetch = function(url, init){
  return wispFetch(url, init);
};


