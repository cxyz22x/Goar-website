import "../../../services/storage.js";
globalThis.buildListTab = async function buildListTab(){
  const main = document.getElementById("mainContent"); exitProvMode();
  document.getElementById("hero").style.display = "none";
  main.innerHTML = "";
  const sec = document.createElement("div");
  sec.className = "section";
  sec.innerHTML = '<div class="section-head"><div><h2>My List</h2><p>' + watchlist.length + ' saved title' + (watchlist.length===1?'':'s') + '</p></div></div>';
  const gridWrap = document.createElement("div");
  gridWrap.className = "grid";
  gridWrap.style.padding = "0 5vw";
  gridWrap.style.display = "grid";
  gridWrap.style.gridTemplateColumns = "repeat(auto-fill, minmax(140px, 1fr))";
  gridWrap.style.gap = "16px";
  sec.appendChild(gridWrap);
  main.appendChild(sec);
  if (!watchlist.length){
    gridWrap.outerHTML = '<div class="loader" style="padding:60px 5vw;">Nothing saved yet. Tap the ★ on any card or in a title\'s detail view.</div>';
    return;
  }
  watchlist.forEach((w,i) => {
    const item = { id:w.id, title:w.title, name:w.title, poster_path:w.poster, vote_average:w.rating, release_date:w.date, _forceType:w.type };
    gridWrap.appendChild(card(item, {}, i));
  });
}

globalThis.PILL_ICONS= {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
  movie: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9h4M17 9h4M3 15h4M17 15h4"/></svg>',
  tv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M8 3l4 3 4-3"/></svg>',
  anime: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></svg>',
  kids: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>',
  music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  live: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M5.5 12a6.5 6.5 0 0113 0M2 12a10 10 0 0120 0"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>'
};
globalThis.buildPillNav = function buildPillNav(){ return; /* pill removed */
  const pn = document.getElementById("pillNav"); if(!pn){ return; }
  if (!pn) return;
  const items = [
    {tab:"home", label:"Home"}, {tab:"movie", label:"Movies"}, {tab:"tv", label:"TV"},
    {tab:"anime", label:"Anime"}, {tab:"kids", label:"Kids"}, {tab:"music", label:"Music"},
    {tab:"live", label:"Live"}, {tab:"list", label:"List"}
  ];
  pn.innerHTML = items.map(it =>
    '<div class="pill-item ' + (it.tab==="home"?"active":"") + ' ' + (it.tab==="music"?"music":"") + ' ' + (it.tab==="kids"?"kids":"") + ' ' + (it.tab==="list"?"list":"") + '" data-tab="' + it.tab + '">' +
    PILL_ICONS[it.tab] + '<span>' + it.label + '</span></div>'
  ).join("");
  pn.querySelectorAll(".pill-item[data-tab]").forEach(el => el.addEventListener("click", () => routeTo(el.dataset.tab)));
}

/* ================= SEARCH ================= */

