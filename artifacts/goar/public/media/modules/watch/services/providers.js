import "../../../services/storage.js";
globalThis.fetchAllProviders = async function fetchAllProviders(){
  const key = "providers_" + REGION;
  const cached = providerMapCache[key];
  if (cached && cached._at && Date.now() - cached._at < 60*60*1000) return cached.list;
  try {
    const [m,t] = await Promise.all([tmdb("/watch/providers/movie",{watch_region:REGION}), tmdb("/watch/providers/tv",{watch_region:REGION})]);
    const map = {};
    [...m.results, ...t.results].forEach(p => { map[p.provider_id] = {id:p.provider_id, name:p.provider_name, logo:p.logo_path}; });
    const list = Object.values(map).sort((a,b) => {
      const aF = FEATURED_PROVIDERS.indexOf(a.name), bF = FEATURED_PROVIDERS.indexOf(b.name);
      if (aF>=0 && bF<0) return -1;
      if (bF>=0 && aF<0) return 1;
      if (aF>=0 && bF>=0) return aF-bF;
      return a.name.localeCompare(b.name);
    });
    providerMapCache[key] = { list, _at: Date.now() };
    return list;
  } catch(e){ return []; }
}
globalThis.buildProviderLauncher = async function buildProviderLauncher(containerId, limit=12){
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = "";
  for (let i=0;i<limit;i++){ const sk = document.createElement("div"); sk.className = "skel"; sk.style.cssText = "width:72px;height:72px;border-radius:20px;"; el.appendChild(sk); }
  const providers = await fetchAllProviders();
  if (!providers.length){ el.innerHTML = '<div class="loader small" style="grid-column:1/-1;padding:14px 0;">Couldn\'t load providers.</div>'; return; }
  el.innerHTML = "";
  providers.slice(0, limit).forEach((p, i) => {
    const design = getProviderDesign(p.name);
    const btn = document.createElement("button");
    btn.className = "provider-app anim-pop";
    btn.style.animationDelay = Math.min(i*35, 400) + "ms";
    btn.style.setProperty("--pa-color", design.color);
    btn.setAttribute("aria-label", p.name);
    const initials = p.name.split(/\s+/).map(w => w[0]).join("").replace(/'/g,"").slice(0,2).toUpperCase();
    btn.innerHTML = '<div class="provider-app-icon">' +
      (p.logo ? '<img src="' + providerLogo(p.logo,"w92") + '" alt="' + p.name + '" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'pa-fallback\',textContent:\'' + initials + '\'}))">' : '<span class="pa-fallback">' + initials + '</span>') +
      '</div><div class="provider-app-name">' + p.name + '</div>';
    btn.onclick = () => { btn.style.transform = "translateY(-2px) scale(.94)"; setTimeout(() => renderProviderHome({id:p.id, name:p.name}), 90); };
    el.appendChild(btn);
  });
}

/* ================= PROVIDER HOME ================= */
globalThis.contrastText = function contrastText(hex){
  const raw = String(hex || "#ffffff").replace("#","").trim();
  const full = raw.length === 3 ? raw.split("").map(c => c+c).join("") : raw;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return "#0a0a0d";
  const r = (n>>16)&255, g = (n>>8)&255, b = n&255;
  return (0.2126*r + 0.7152*g + 0.0722*b) > 186 ? "#0a0a0d" : "#ffffff";
}
globalThis.applyBrandTheme = function applyBrandTheme(design){
  const color = (design && design.color) ? design.color : "#ffffff";
  document.body.style.setProperty("--cta", color);
  document.body.style.setProperty("--cta-text", contrastText(color));
  document.body.style.setProperty("--rank", color);
  document.body.style.setProperty("--p-color", color);
  if (design){
    if (design.bg) document.body.style.setProperty("--p-bg", design.bg);
    if (design.bg2) document.body.style.setProperty("--p-bg2", design.bg2);
    if (design.accent) document.body.style.setProperty("--p-accent", design.accent);
  }
}
globalThis.clearBrandTheme = function clearBrandTheme(){
  ["--cta","--cta-text","--rank","--p-color","--p-bg","--p-bg2","--p-accent"].forEach(k => document.body.style.removeProperty(k));
}
globalThis.enterProvMode = function enterProvMode(design){
  document.body.classList.add("prov-mode");
  document.body.style.background = design.bg;
  applyBrandTheme(design);
  const mc = document.getElementById("mainContent");
  mc.className = "prov-home theme-" + design.style;
  mc.style.cssText = "--p-color:" + design.color + ";--p-bg:" + design.bg + ";--p-bg2:" + design.bg2 + ";--p-accent:" + design.accent + ";--cta:" + design.color + ";--cta-text:" + contrastText(design.color) + ";--rank:" + design.color + ";";
}
globalThis.exitProvMode = function exitProvMode(){
  document.body.classList.remove("prov-mode");
  document.body.style.background = "";
  clearBrandTheme();
  const mc = document.getElementById("mainContent");
  mc.className = ""; mc.style.cssText = "";
  const hero = document.getElementById("hero");
  hero.classList.remove("prov-hero");
  hero.style.background = ""; hero.style.backgroundColor = ""; hero.style.backgroundImage = "";
}

globalThis.provToken= 0;
globalThis.renderProviderHome = async function renderProviderHome(prov){
  const myToken = ++provToken;
  await ensureGenres();
  if (myToken !== provToken) return;
  const main = document.getElementById("mainContent");
  const hero = document.getElementById("hero");
  const design = getProviderDesign(prov.name);
  const cfg = { ...DEFAULT_PROVIDER_CONTENT, ...(PROVIDER_CONTENT[design.key] || {}) };
  enterProvMode(design);
  main.innerHTML = "";
  hero.classList.add("prov-hero");
  hero.innerHTML = '<div class="loader">Loading ' + prov.name + '…</div>';
  hero.style.backgroundImage = "none";

  let pid = prov.id, logoPath = null, provName = prov.name;
  try {
    const list = await fetchAllProviders();
    const found = list.find(p => p.id == pid) || list.find(p => p.name.toLowerCase() === prov.name.toLowerCase());
    if (found){ pid = found.id; logoPath = found.logo; provName = found.name; }
  } catch(e){}
  if (myToken !== provToken) return;

  const topBar = document.createElement("div");
  topBar.className = "prov-home-bar";
  topBar.innerHTML = '<span class="back-link" id="provHomeBack" style="color:' + design.color + ';">← All Apps</span>' +
    '<div class="prov-badge" style="background:' + design.bg2 + ';border-color:' + design.color + ';">' +
    (logoPath ? '<img src="' + providerLogo(logoPath,"w92") + '" alt="' + provName + '">' : '') +
    '<span style="color:' + design.color + ';">' + provName + '</span></div>';
  main.appendChild(topBar);

  if (!pid){
    const err = document.createElement("div"); err.className = "loader err";
    err.textContent = "Not available in " + REGION + "."; main.appendChild(err);
    const back = document.getElementById("provHomeBack"); if (back) back.onclick = () => routeTo("hubs");
    return;
  }

  const anime = cfg.genres === "16";

  let featured = [];
  try {
    const [m, t] = await Promise.all([
      provDiscoverSafe(pid, REGION, "movie", { ...cfg, sortBy: "popularity.desc" }),
      provDiscoverSafe(pid, REGION, "tv", { ...cfg, sortBy: "popularity.desc" })
    ]);
    featured = mergeTwo(m, t, cmpPop);
  } catch(e){}
  if (myToken !== provToken) return;
  const pick = featured.find(r => r.backdrop_path) || featured[0];

  let heroHtml = '<div class="hero-content">';
  if (logoPath) heroHtml += '<img class="hero-logo" src="' + providerLogo(logoPath,"w300") + '" alt="' + provName + '">';
  else heroHtml += '<div class="hero-eyebrow">' + provName + '</div>';
  heroHtml += '<div class="hero-title">' + (pick ? titleOf(pick) : "On " + provName) + '</div>' +
    '<div class="prov-hero-tagline">' + (pick && pick.overview ? pick.overview : getProviderTagline(design.key, provName)) + '</div>' +
    '<div class="hero-actions">' +
    (pick ? '<button class="btn btn-prov" id="provPlayFeatured">▶ ' + (design.style==="netflix"?"Play":"Watch Now") + '</button>' : '') +
    (pick ? '<button class="btn btn-ghost" id="provInfoFeatured">ⓘ More Info</button>' : '') +
    (pick ? '<button class="btn-icon" id="provSaveFeatured">' + bookmarkSvg(false) + '</button>' : '') +
    '</div></div>';
  hero.innerHTML = heroHtml;

  if (pick && pick.backdrop_path){
    hero.style.backgroundImage = "linear-gradient(to top, " + design.bg + " 6%, rgba(0,0,0,.4) 55%, rgba(0,0,0,.08) 85%), linear-gradient(to right, rgba(0,0,0,.7) 0%, rgba(0,0,0,.05) 60%), url(" + backdropImg(pick) + ")";
    hero.style.backgroundSize = "cover";
    hero.style.backgroundPosition = "center top";
  } else {
    hero.style.backgroundImage = "linear-gradient(135deg, " + design.bg + ", " + design.bg2 + ")";
  }

  const hp = document.getElementById("provPlayFeatured");
  if (hp && pick) hp.onclick = () => openPlayer(pick.id, pick.media_type, titleOf(pick), pick);
  const hi = document.getElementById("provInfoFeatured");
  if (hi && pick) hi.onclick = () => openModal(pick.id, pick.media_type);
  const hs = document.getElementById("provSaveFeatured");
  if (hs && pick){
    hs.classList.toggle("saved", isSaved(pick.id, pick.media_type));
    hs.onclick = () => { toggleSave(pick, pick.media_type); hs.classList.toggle("saved", isSaved(pick.id, pick.media_type)); hs.innerHTML = bookmarkSvg(isSaved(pick.id, pick.media_type)); };
  }

  const style = design.style;
  if (style === "netflix") main.appendChild(sectionEl("ph_top10", "Top 10 in " + REGION + " Today", "Most watched on Netflix", () => showProviderGrid(prov, pid, "trending")));
  else if (style === "disney"){ main.appendChild(buildDisneyBrandRow(pid)); main.appendChild(sectionEl("ph_featured","Featured","Handpicked for you", () => showProviderGrid(prov, pid, "trending"))); }
  else if (style === "crunchyroll") main.appendChild(sectionEl("ph_simul","Simulcast Season","Currently airing on Crunchyroll", () => showProviderGrid(prov, pid, "trending")));
  else if (style === "apple") main.appendChild(sectionEl("ph_featured","Apple Originals","Award-winning stories", () => showProviderGrid(prov, pid, "trending")));
  else if (style === "prime") main.appendChild(sectionEl("ph_featured","Featured on Prime","Movies, TV & Originals", () => showProviderGrid(prov, pid, "trending")));
  else if (style === "hulu") main.appendChild(sectionEl("ph_originals","Hulu Originals","Critically-acclaimed shows & films", () => showProviderGrid(prov, pid, "trending")));
  else if (style === "max") main.appendChild(sectionEl("ph_featured","HBO & Max Originals","Prestige storytelling", () => showProviderGrid(prov, pid, "trending")));
  else main.appendChild(sectionEl("ph_featured", "Featured on " + provName, "Top picks for you", () => showProviderGrid(prov, pid, "trending")));

  main.appendChild(sectionEl("ph_new","New & Recently Added","Fresh on " + provName, () => showProviderGrid(prov, pid, "new")));
  main.appendChild(sectionEl("ph_trend","Trending on " + provName,"What everyone's watching", () => showProviderGrid(prov, pid, "trending")));
  main.appendChild(sectionEl("ph_movies","Movies", "Feature films on " + provName, () => showProviderGrid(prov, pid, "movie")));
  main.appendChild(sectionEl("ph_tv","TV Shows", "Series on " + provName, () => showProviderGrid(prov, pid, "tv")));
  if (!anime) main.appendChild(sectionEl("ph_kids","Kids & Family", "Safe picks on " + provName, () => showProviderGrid(prov, pid, "kids")));
  main.appendChild(sectionEl("ph_top","Top Rated", "Highest rated on " + provName, () => showProviderGrid(prov, pid, "top")));

  if (style === "netflix"){
    loadRail("ph_top10", async () => {
      if (myToken !== provToken) return [];
      const tightCfg = { ...cfg, recencyDays: 120, minVotes: Math.max(cfg.minVotes, 20) };
      const [m,t] = await Promise.all([provDiscoverSafe(pid, REGION, "movie", { ...tightCfg, sortBy: "popularity.desc" }), provDiscoverSafe(pid, REGION, "tv", { ...tightCfg, sortBy: "popularity.desc" })]);
      return mergeTwo(m, t, cmpPop).slice(0, 10);
    }, {top10:true});
  } else {
    loadRail("ph_featured", async () => {
      if (myToken !== provToken) return [];
      const [m,t] = await Promise.all([provDiscoverSafe(pid, REGION, "movie", { ...cfg, sortBy: "popularity.desc" }), provDiscoverSafe(pid, REGION, "tv", { ...cfg, sortBy: "popularity.desc" })]);
      return mergeTwo(m, t, cmpPop).slice(0, 20);
    });
    if (style === "crunchyroll"){
      loadRail("ph_simul", async () => {
        if (myToken !== provToken) return [];
        const simulCfg = { ...cfg, recencyDays: 180 };
        const [m,t] = await Promise.all([provDiscoverSafe(pid, REGION, "movie", { ...simulCfg, sortBy: "popularity.desc" }), provDiscoverSafe(pid, REGION, "tv", { ...simulCfg, sortBy: "popularity.desc" })]);
        return mergeTwo(m, t, cmpPop).slice(0, 20);
      });
    }
  }
  loadRail("ph_new", async () => {
    if (myToken !== provToken) return [];
    const [m,t] = await Promise.all([
      provDiscoverSafe(pid, REGION, "movie", { ...cfg, sortBy: "primary_release_date.desc", recencyDays: Math.min(cfg.recencyDays, 180), extra: { "primary_release_date.lte": TODAY } }),
      provDiscoverSafe(pid, REGION, "tv", { ...cfg, sortBy: "first_air_date.desc", recencyDays: Math.min(cfg.recencyDays, 180), extra: { "first_air_date.lte": TODAY } })
    ]);
    return mergeTwo(m, t, cmpDate).slice(0, 20);
  });
  loadRail("ph_trend", async () => {
    if (myToken !== provToken) return [];
    const trendCfg = { ...cfg, recencyDays: Math.min(cfg.recencyDays, 90) };
    const [m,t] = await Promise.all([provDiscoverSafe(pid, REGION, "movie", { ...trendCfg, sortBy: "popularity.desc" }), provDiscoverSafe(pid, REGION, "tv", { ...trendCfg, sortBy: "popularity.desc" })]);
    return mergeTwo(m, t, cmpPop).slice(0, 20);
  });
  loadRail("ph_movies", async () => { if (myToken !== provToken) return []; return (await provDiscoverSafe(pid, REGION, "movie", { ...cfg, sortBy: "popularity.desc" })).slice(0, 20); });
  loadRail("ph_tv", async () => { if (myToken !== provToken) return []; return (await provDiscoverSafe(pid, REGION, "tv", { ...cfg, sortBy: "popularity.desc" })).slice(0, 20); });
  if (!anime){
    loadRail("ph_kids", async () => {
      if (myToken !== provToken) return [];
      const kidCfg = { ...cfg, genres: "10751|16", minVotes: 5, recencyDays: Math.min(cfg.recencyDays, 1095) };
      const [m,t] = await Promise.all([
        provDiscoverSafe(pid, REGION, "movie", { ...kidCfg, sortBy: "popularity.desc", extra: { certification_country: "US", "certification.lte": "PG" } }),
        provDiscoverSafe(pid, REGION, "tv", { ...kidCfg, sortBy: "popularity.desc" })
      ]);
      return mergeTwo(m, t, cmpPop).slice(0, 20);
    }, {kids:true});
  }
  loadRail("ph_top", async () => {
    if (myToken !== provToken) return [];
    const topCfg = { ...cfg, minVotes: Math.max(cfg.minVotes, 100) };
    const [m,t] = await Promise.all([provDiscoverSafe(pid, REGION, "movie", { ...topCfg, sortBy: "vote_average.desc" }), provDiscoverSafe(pid, REGION, "tv", { ...topCfg, sortBy: "vote_average.desc" })]);
    return mergeTwo(m, t, cmpRating).slice(0, 20);
  });

  const back = document.getElementById("provHomeBack");
  if (back) back.onclick = () => routeTo("hubs");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
globalThis.bookmarkSvg = function bookmarkSvg(filled){
  return '<svg viewBox="0 0 24 24" fill="' + (filled?'currentColor':'none') + '" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>';
}
globalThis.getProviderTagline = function getProviderTagline(key, name){
  const lines = {
    netflix:"Watch TV shows and movies anytime, anywhere.",
    disney:"The best of Disney, Pixar, Marvel, Star Wars & National Geographic.",
    crunchyroll:"The world's largest anime library.",
    prime:"Movies, TV, and Amazon Originals.",
    hulu:"TV shows, movies, and originals.",
    max:"The best of HBO, Warner Bros., DC, and more.",
    apple:"Apple Originals. Award-winning stories.",
    paramount:"A mountain of entertainment.",
    peacock:"Streaming what you love.",
    stan:"Australia's home of TV and movies.",
    binge:"Endless entertainment.",
    shudder:"Fear is in the house.",
    mubi:"Hand-picked cinema.",
    tubi:"Free movies and TV.",
    pluto:"Drop in. It's free.",
    roku:"Stream what you love."
  };
  return lines[key] || ("Streaming on " + name + " in " + REGION + ".");
}
globalThis.buildDisneyBrandRow = function buildDisneyBrandRow(pid){
  const sec = document.createElement("div");
  sec.className = "section";
  sec.innerHTML = '<div class="section-head"><div><h2>Explore</h2><p>Brands and collections</p></div></div><div class="brand-hubs" id="disneyBrandHubs"></div>';
  setTimeout(() => {
    const el = document.getElementById("disneyBrandHubs");
    if (!el) return;
    el.innerHTML = DISNEY_BRANDS.map((b,i) => '<div class="brand-tile anim-pop" style="animation-delay:' + (i*40) + 'ms; background:' + b.bg + ';" data-cid="' + b.cid + '" data-label="' + b.label + '"><span style="color:' + b.color + ';letter-spacing:.05em;">' + b.label.toUpperCase() + '</span></div>').join("");
    el.querySelectorAll(".brand-tile").forEach(t => { t.onclick = () => showDisneyBrandGrid(t.dataset.label, t.dataset.cid, pid); });
  }, 0);
  return sec;
}
globalThis.showDisneyBrandGrid = async function showDisneyBrandGrid(brand, cid, pid){
  const grid = openGrid("Disney+ · " + brand);
  try {
    const base = { with_watch_providers: pid, watch_region: REGION, with_watch_monetization_types: "flatrate", with_companies: cid, sort_by: "popularity.desc", include_adult: false };
    const [m,t] = await Promise.all([tmdb("/discover/movie", base), tmdb("/discover/tv", base)]);
    const items = mergeTwo(m.results.map(x=>({...x,media_type:"movie"})), t.results.map(x=>({...x,media_type:"tv"})), cmpPop).slice(0, 60);
    grid.innerHTML=""; items.forEach((i,idx)=>grid.appendChild(card(i, {}, idx)));
  } catch(e){ grid.innerHTML = '<div class="loader err">Couldn\'t load.</div>'; }
}

globalThis.showProviderGrid = async function showProviderGrid(prov, pid, kind){
  const titles = {trending:prov.name+" · Trending", movie:"Movies on "+prov.name, tv:"TV on "+prov.name, kids:"Kids on "+prov.name, top:"Top Rated on "+prov.name, new:"New on "+prov.name};
  const grid = openGrid(titles[kind]);
  try {
    const design = getProviderDesign(prov.name);
    const cfg = { ...DEFAULT_PROVIDER_CONTENT, ...(PROVIDER_CONTENT[design.key] || {}) };
    let items = [];
    if (kind==="movie") items = await provDiscoverSafe(pid, REGION, "movie", { ...cfg, sortBy: "popularity.desc" });
    else if (kind==="tv") items = await provDiscoverSafe(pid, REGION, "tv", { ...cfg, sortBy: "popularity.desc" });
    else if (kind==="kids"){
      const kidCfg = { ...cfg, genres: "10751|16", minVotes: 5, recencyDays: Math.min(cfg.recencyDays, 1095) };
      const [m,t] = await Promise.all([
        provDiscoverSafe(pid, REGION, "movie", { ...kidCfg, sortBy: "popularity.desc", extra: { certification_country: "US", "certification.lte": "PG" } }),
        provDiscoverSafe(pid, REGION, "tv", { ...kidCfg, sortBy: "popularity.desc" })
      ]);
      items = mergeTwo(m, t, cmpPop);
    } else if (kind==="top"){
      const topCfg = { ...cfg, minVotes: Math.max(cfg.minVotes, 100) };
      const [m,t] = await Promise.all([provDiscoverSafe(pid, REGION, "movie", { ...topCfg, sortBy: "vote_average.desc" }), provDiscoverSafe(pid, REGION, "tv", { ...topCfg, sortBy: "vote_average.desc" })]);
      items = mergeTwo(m, t, cmpRating);
    } else if (kind==="new"){
      const [m,t] = await Promise.all([
        provDiscoverSafe(pid, REGION, "movie", { ...cfg, sortBy: "primary_release_date.desc", recencyDays: Math.min(cfg.recencyDays, 180), extra: { "primary_release_date.lte": TODAY } }),
        provDiscoverSafe(pid, REGION, "tv", { ...cfg, sortBy: "first_air_date.desc", recencyDays: Math.min(cfg.recencyDays, 180), extra: { "first_air_date.lte": TODAY } })
      ]);
      items = mergeTwo(m, t, cmpDate);
    } else {
      const trendCfg = { ...cfg, recencyDays: Math.min(cfg.recencyDays, 90) };
      const [m,t] = await Promise.all([provDiscoverSafe(pid, REGION, "movie", { ...trendCfg, sortBy: "popularity.desc" }), provDiscoverSafe(pid, REGION, "tv", { ...trendCfg, sortBy: "popularity.desc" })]);
      items = mergeTwo(m, t, cmpPop);
    }
    grid.innerHTML=""; items.slice(0,60).forEach((i,idx)=>grid.appendChild(card(i, {kids:kind==="kids"}, idx)));
  } catch(e){ grid.innerHTML = '<div class="loader err">Couldn\'t load.</div>'; }
}

/* ================= MOVIE / TV / ANIME TABS ================= */

