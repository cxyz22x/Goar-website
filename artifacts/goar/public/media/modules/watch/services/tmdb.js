import "../../../services/storage.js";
globalThis.tmdb = async function tmdb(path, params={}){
  const url = new URL(BASE+path);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language","en-US");
  for (const k in params){ if (params[k] !== undefined && params[k] !== null) url.searchParams.set(k, params[k]); }
  let res;
  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt++){
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      res = await fetch(url, { signal: controller.signal });
      if (res.ok || (res.status < 500 && res.status !== 429) || attempt === 1) break;
      lastError = new Error("TMDB HTTP " + res.status);
    } catch(e){
      lastError = e;
      if (attempt === 1) throw new Error("NETWORK: " + (e.name === "AbortError" ? "TMDB request timed out" : e.message));
    } finally {
      clearTimeout(timeout);
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (!res) throw new Error("NETWORK: " + (lastError && lastError.message || "TMDB unavailable"));
  let body; try { body = await res.json(); } catch(e){ body = null; }
  if (!res.ok){ const msg = body && body.status_message ? body.status_message : ("HTTP "+res.status); throw new Error("TMDB "+res.status+": "+msg); }
  return body;
}
globalThis.showKeyBanner = function showKeyBanner(msg){ const b = document.getElementById("keyBanner"); b.textContent = "⚠ " + msg; b.classList.add("show"); }
globalThis.toast = function toast(msg){ const t = document.getElementById("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(()=>t.classList.remove("show"), 2200); }

/* ================= HELPERS ================= */
globalThis.yearOf = function yearOf(item){ return (item.release_date||item.first_air_date||"").slice(0,4) || "—"; }
globalThis.titleOf = function titleOf(item){ return item.title || item.name || "Untitled"; }
globalThis.typeOf = function typeOf(item){ return item._forceType || item.media_type || (item.title ? "movie":"tv"); }
globalThis.ratingOf = function ratingOf(item){ return item.vote_average ? item.vote_average.toFixed(1) : "—"; }
globalThis.posterImg = function posterImg(item, size="w342"){ return item.poster_path ? IMG + "/" + size + item.poster_path : "https://placehold.co/300x450/17171e/8b8c98?text=No+Image"; }
globalThis.backdropImg = function backdropImg(item, size="original"){ return item.backdrop_path ? IMG + "/" + size + item.backdrop_path : posterImg(item,"w780"); }
globalThis.profileImg = function profileImg(p, size="w185"){ return p ? IMG + "/" + size + p : "https://placehold.co/185x185/1a1a22/5a5a68?text=%20"; }
globalThis.providerLogo = function providerLogo(path, size="w92"){ return path ? IMG + "/" + size + path : ""; }
globalThis.daysAgoISO = function daysAgoISO(days){ const d = new Date(); d.setDate(d.getDate()-days); return d.toISOString().slice(0,10); }
globalThis.mergeTwo = function mergeTwo(a, b, cmp){
  const out = []; let i = 0, j = 0;
  while (i < a.length || j < b.length){
    if (i >= a.length){ out.push(b[j++]); continue; }
    if (j >= b.length){ out.push(a[i++]); continue; }
    out.push(cmp(a[i], b[j]) >= 0 ? a[i++] : b[j++]);
  }
  return out;
}
globalThis.cmpPop= (a,b) => (a.popularity||0) - (b.popularity||0);
globalThis.cmpRating= (a,b) => (a.vote_average||0) - (b.vote_average||0);
globalThis.cmpDate= (a,b) => ((a.release_date||a.first_air_date||"")).localeCompare((b.release_date||b.first_air_date||""));

/* ================= LOCAL STORAGE ================= */
globalThis.LS= {
  get(k, fallback){ try { const v = mediaStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch(e){ return fallback; } },
  set(k, v){ try { mediaStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
};
globalThis.watchlist= LS.get("goar_watchlist", []);
globalThis.continueList= LS.get("goar_continue", []);
globalThis.isSaved = function isSaved(id, type){ return watchlist.some(x => x.id == id && x.type === type); }
globalThis.toggleSave = function toggleSave(item, type){
  const i = watchlist.findIndex(x => x.id == item.id && x.type === type);
  if (i >= 0){ watchlist.splice(i, 1); toast("Removed from My List"); }
  else { watchlist.unshift({ id:item.id, type, title:titleOf(item), poster:item.poster_path, rating:item.vote_average, date:yearOf(item), added:Date.now() }); toast("Added to My List"); }
  LS.set("goar_watchlist", watchlist);
  document.getElementById("view-watch").querySelectorAll(".card-save[data-id=\"" + item.id + "\"][data-type=\"" + type + "\"]").forEach(b => {
    const saved = isSaved(item.id, type); b.classList.toggle("saved", saved);
  });
}
globalThis.pushContinue = function pushContinue(item, type, season, episode){
  continueList = continueList.filter(x => !(x.id == item.id && x.type === type));
  continueList.unshift({ id:item.id, type, title:titleOf(item), poster:item.poster_path, rating:item.vote_average, season:season||null, episode:episode||null, at:Date.now() });
  if (continueList.length > 20) continueList.length = 20;
  LS.set("goar_continue", continueList);
}

/* ================= CARD ================= */

