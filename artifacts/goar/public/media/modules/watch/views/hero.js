import "../../../services/storage.js";
globalThis.buildHero = async function buildHero(fetcher, eyebrow){
  const heroEl = document.getElementById("hero");
  heroEl.innerHTML = '<div class="loader">Loading…</div>';
  heroEl.style.backgroundImage = "";
  try {
    const items = await fetcher();
    const pick = items.find(r => r.backdrop_path) || items[0];
    if (!pick){ heroEl.innerHTML = '<div class="loader">Nothing to show yet.</div>'; return; }
    const t = typeOf(pick);
    heroEl.style.backgroundImage = 'url(' + backdropImg(pick) + ')';
    heroEl.innerHTML =
      '<div class="hero-content">' +
      '<div class="hero-eyebrow">' + eyebrow + '</div>' +
      '<div class="hero-title">' + titleOf(pick) + '</div>' +
      '<div class="hero-meta"><span class="rating">★ ' + ratingOf(pick) + '</span><span>' + yearOf(pick) + '</span><span>' + (t==="movie"?"Movie":t==="anime"?"Anime":"TV Show") + '</span></div>' +
      '<div class="hero-overview">' + (pick.overview || "") + '</div>' +
      '<div class="hero-actions"><button class="btn btn-play" id="watchHeroPlay">▶ Watch Now</button><button class="btn btn-primary" id="heroDetails">Details</button></div>' +
      '</div>';
    const realType = pick._realType || (t==="anime" ? pick._animeKind : t);
    document.getElementById("watchHeroPlay").onclick = () => openPlayer(pick.id, realType, titleOf(pick), pick);
    document.getElementById("heroDetails").onclick = () => openModal(pick.id, realType);
  } catch(e){ heroEl.innerHTML = '<div class="loader err">Couldn\'t load — ' + e.message + '</div>'; }
}

/* ================= GENRES ================= */
globalThis.genresMovie= [],globalThis.genresTV= [];
globalThis.ensureGenres = async function ensureGenres(){
  if (genresMovie.length && genresTV.length) return;
  try { const [mg,tg] = await Promise.all([tmdb("/genre/movie/list"), tmdb("/genre/tv/list")]); genresMovie = mg.genres; genresTV = tg.genres; } catch(e){}
}
globalThis.genreChipsBar = function genreChipsBar(list, onPick){
  const div = document.createElement("div"); div.className = "chips";
  list.forEach(g => { const c = document.createElement("div"); c.className = "chip"; c.textContent = g.name; c.onclick = () => onPick(g); div.appendChild(c); });
  return div;
}
globalThis.dedupeGenres = function dedupeGenres(list){ const seen = new Set(); return list.filter(g => { if (seen.has(g.name)) return false; seen.add(g.name); return true; }); }

/* ================= PROVIDER PROFILES ================= */
globalThis.provDiscover = async function provDiscover(pid, region, kind, opts = {}){
  const isMovie = kind === "movie";
  const path = isMovie ? "/discover/movie" : "/discover/tv";
  const params = { with_watch_providers: pid, watch_region: region, include_adult: false, ...(opts.extra || {}) };
  if (opts.monetization) params.with_watch_monetization_types = opts.monetization;
  if (opts.sortBy) params.sort_by = opts.sortBy;
  if (opts.minVotes) params["vote_count.gte"] = opts.minVotes;
  if (opts.genres) params.with_genres = opts.genres;
  if (opts.originCountry) params.with_origin_country = opts.originCountry;
  if (opts.recencyDays){
    const key = isMovie ? "primary_release_date.gte" : "first_air_date.gte";
    params[key] = daysAgoISO(opts.recencyDays);
  }
  const res = await tmdb(path, params);
  return (res.results || []).map(x => ({ ...x, media_type: isMovie ? "movie" : "tv", _mediaType: isMovie ? "movie" : "tv" }));
}
globalThis.provDiscoverSafe = async function provDiscoverSafe(pid, region, kind, opts){
  let results = await provDiscover(pid, region, kind, opts);
  if (!results.length && opts.monetization) results = await provDiscover(pid, region, kind, { ...opts, monetization: null });
  return results;
}

globalThis.getProviderDesign = function getProviderDesign(name){
  const key = name.toLowerCase().trim();
  return PROVIDER_DESIGNS[key] || { key:"generic", style:"generic", color:"#5b8def", bg:"#0a0d18", bg2:"#0a0f1c", accent:"#8bb0ff" };
}


