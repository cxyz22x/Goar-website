import "../../../services/storage.js";
const railRequests = new Map();
function makeCardKeyboardAccessible(element, label, action, role = "button"){
  element.setAttribute("role", role);
  element.setAttribute("aria-label", label);
  element.onkeydown = event => {
    if (event.target.closest(".card-save")) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    action(event);
  };
}
globalThis.card = function card(item, opts={}, idx=0){
  const t = typeOf(item);
  const div = document.createElement("div");
  div.className = "card anim-up";
  div.tabIndex = 0;
  div.style.animationDelay = Math.min(idx*35, 400)+"ms";
  let label = t==="anime" ? "ANIME" : (t==="movie" ? "MOVIE" : "TV");
  let badgeClass = t;
  if (opts.kids){ label = "KIDS"; badgeClass = "kids"; }
  else if (t==="music"){ label = "MUSIC"; badgeClass = "music"; }
  const saved = isSaved(item.id, t);
  div.innerHTML = '<div class="poster-wrap">' +
    '<img loading="lazy" src="' + posterImg(item) + '" alt="' + titleOf(item) + '">' +
    '<div class="badge-rating">★ ' + ratingOf(item) + '</div>' +
    '<div class="badge-type ' + badgeClass + '">' + label + '</div>' +
    '<button type="button" class="card-save ' + (saved?'saved':'') + '" data-id="' + item.id + '" data-type="' + t + '" aria-pressed="' + saved + '" aria-label="' + (saved ? "Remove " : "Add ") + titleOf(item) + ' ' + (saved ? "from" : "to") + ' My List">' +
    '<svg viewBox="0 0 24 24" fill="' + (saved?'currentColor':'none') + '" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>' +
    '</button></div>' +
    '<div class="card-title">' + titleOf(item) + '</div>' +
    '<div class="card-sub">' + yearOf(item) + '</div>';
  const open = (e) => {
    if (e.target.closest(".card-save")) return;
    openModal(item.id, item._realType || (t==="anime" ? item._animeKind : t));
  };
  div.onclick = open;
  makeCardKeyboardAccessible(div, titleOf(item) + ", " + label + ". Press Enter to view details.", open, "group");
  const saveBtn = div.querySelector(".card-save");
  saveBtn.onclick = (e) => { e.stopPropagation(); toggleSave(item, t); };
  return div;
}
globalThis.top10Card = function top10Card(item, idx=0){
  const t = typeOf(item);
  const wrap = document.createElement("div");
  wrap.className = "top10-item anim-up";
  wrap.tabIndex = 0;
  wrap.style.animationDelay = Math.min(idx*35, 400)+"ms";
  wrap.innerHTML =
    '<div class="top10-row">' +
      '<div class="top10-rank' + (idx >= 9 ? ' t10-wide' : '') + '">' + (idx+1) + '</div>' +
      '<div class="poster-wrap">' +
        '<img loading="lazy" src="' + posterImg(item) + '" alt="' + titleOf(item) + '">' +
        '<div class="badge-rating">★ ' + ratingOf(item) + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="card-title">' + titleOf(item) + '</div>' +
    '<div class="card-sub">' + yearOf(item) + '</div>';
  const open = () => openModal(item.id, item._realType || (t==="anime" ? item._animeKind : t));
  wrap.onclick = open;
  makeCardKeyboardAccessible(wrap, (idx + 1) + ". " + titleOf(item), open);
  return wrap;
}
globalThis.musicCard = function musicCard(item, idx=0){
  const div = document.createElement("div");
  div.className = "music-card anim-up";
  div.tabIndex = 0;
  div.style.animationDelay = Math.min(idx*35, 400)+"ms";
  div.innerHTML = '<div class="music-art">' +
    '<img loading="lazy" src="' + posterImg(item,"w342") + '" alt="' + titleOf(item) + '">' +
    '<div class="badge-music">♪ MUSIC</div></div>' +
    '<div class="card-title">' + titleOf(item) + '</div>' +
    '<div class="card-sub">' + yearOf(item) + '</div>';
  const open = () => openModal(item.id, item._mediaType || "movie");
  div.onclick = open;
  makeCardKeyboardAccessible(div, titleOf(item) + ", Music", open);
  return div;
}
globalThis.railInto = function railInto(container, items, opts={}){
  if (!container) return;
  container.innerHTML = "";
  container.className = "rail" + (opts.top10 ? " rail-top10" : "");
  if (!items.length){ container.innerHTML = '<div class="loader small">Nothing found here yet.</div>'; return; }
  items.forEach((item, i) => {
    if (opts.top10){
      container.appendChild(top10Card(item, i));
    } else if (opts.music) container.appendChild(musicCard(item, i));
    else container.appendChild(card(item, {kids: opts.kids}, i));
  });
}
globalThis.loadRail = async function loadRail(elId, fetcher, opts={}){
  const requestToken = (railRequests.get(elId) || 0) + 1;
  railRequests.set(elId, requestToken);
  const requestedTab = activeTab;
  const navigationToken = watchNavigationGeneration;
  const el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = "";
  for (let i=0;i<6;i++){ const sk = document.createElement("div"); sk.className = "skel"; el.appendChild(sk); }
  try {
    const items = await fetcher();
    if (railRequests.get(elId) !== requestToken || activeTab !== requestedTab ||
        !isCurrentWatchNavigation(navigationToken) || !el.isConnected) return;
    railInto(el, items, opts);
  }
  catch {
    if (railRequests.get(elId) !== requestToken || activeTab !== requestedTab ||
        !isCurrentWatchNavigation(navigationToken) || !el.isConnected) return;
    el.replaceChildren();
    const error = document.createElement("div");
    error.className = "loader err small";
    error.setAttribute("role", "alert");
    error.textContent = "Could not load this section. Check your connection and retry.";
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "btn btn-ghost";
    retry.textContent = "Retry";
    retry.onclick = () => loadRail(elId, fetcher, opts);
    error.appendChild(retry);
    el.appendChild(error);
  }
}
globalThis.sectionEl = function sectionEl(id, title, sub, seeAllFn){
  const navigationToken = watchNavigationGeneration;
  const s = document.createElement("div");
  s.className = "section";
  s.innerHTML = '<div class="section-head"><div><h2>' + title + '</h2>' + (sub ? '<p>'+sub+'</p>' : '') + '</div>' +
    (seeAllFn ? '<button type="button" class="see-all" id="' + id + '_seeall">See all →</button>' : '') + '</div>' +
    '<div class="rail" id="' + id + '"></div>';
  if (seeAllFn) setTimeout(()=>{
    if (!isCurrentWatchNavigation(navigationToken) || !s.isConnected) return;
    const el = s.querySelector("#" + id + "_seeall");
    if (el) el.onclick = seeAllFn;
  }, 0);
  return s;
}

/* ============================================================
   PLAYER — WISP + libcurl.js + Blob iframe
   ============================================================
   Pipeline:
     1. Parent already holds a live libcurl.js WASM + WISP socket.
     2. Fetch the player HTML through that tunnel.
     3. Strip sandbox detector / ad libs / Histats / CSP.
     4. Inject a bootstrap that REUSES parent.libcurl (blob iframe
        is same-origin). fetch / XHR / WebSocket are queued until
        the tunnel is ready, then flushed. Page scripts do not race
        a second WASM download.
     5. Load the rewritten HTML as a blob URL.
   ============================================================ */

