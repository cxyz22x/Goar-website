import "../../../services/storage.js";
globalThis.buildMovieTab = async function buildMovieTab(){
  await ensureGenres();
  const main = document.getElementById("mainContent"); exitProvMode(); main.innerHTML = "";
  main.appendChild(sectionEl("m_theaters","In Theaters","Currently playing", ()=>showSpecial("now_movie")));
  main.appendChild(sectionEl("m_new","New Releases","Latest releases", ()=>showSpecial("new_movie")));
  main.appendChild(sectionEl("m_upcoming","Coming Soon","Landing soon", ()=>showSpecial("upcoming_movie")));
  main.appendChild(sectionEl("m_trend","Trending Movies","Hits right now", ()=>showSpecial("trend_movie")));
  main.appendChild(sectionEl("m_pop","Popular Movies","Most popular", ()=>showSpecial("pop_movie")));
  main.appendChild(sectionEl("m_top","Top Rated Movies","Highest rated", ()=>showSpecial("top_movie")));
  const gs = document.createElement("div"); gs.className = "section";
  gs.innerHTML = '<div class="section-head"><h2>Browse Movies by Genre</h2></div>';
  gs.appendChild(genreChipsBar(genresMovie, g => showGenreGrid(g,"movie")));
  main.appendChild(gs);
  buildHero(async ()=> (await tmdb("/trending/movie/week")).results, "TRENDING MOVIES");
  loadRail("m_theaters", async ()=> (await tmdb("/movie/now_playing",{region:REGION})).results.map(x=>({...x,media_type:"movie"})));
  loadRail("m_new", async ()=> (await tmdb("/discover/movie",{sort_by:"primary_release_date.desc","primary_release_date.lte":TODAY,"vote_count.gte":30,include_adult:false})).results.map(x=>({...x,media_type:"movie"})));
  loadRail("m_upcoming", async ()=> (await tmdb("/movie/upcoming",{region:REGION})).results.map(x=>({...x,media_type:"movie"})));
  loadRail("m_trend", async ()=> (await tmdb("/trending/movie/day")).results.map(x=>({...x,media_type:"movie"})));
  loadRail("m_pop", async ()=> (await tmdb("/movie/popular")).results.map(x=>({...x,media_type:"movie"})));
  loadRail("m_top", async ()=> (await tmdb("/movie/top_rated")).results.map(x=>({...x,media_type:"movie"})));
}
globalThis.buildTVTab = async function buildTVTab(){
  await ensureGenres();
  const main = document.getElementById("mainContent"); exitProvMode(); main.innerHTML = "";
  main.appendChild(sectionEl("t_airing","Airing Today","Episodes dropping today", ()=>showSpecial("airing_tv")));
  main.appendChild(sectionEl("t_onair","On The Air","Currently airing", ()=>showSpecial("onair_tv")));
  main.appendChild(sectionEl("t_new","New TV Releases","Just premiered", ()=>showSpecial("new_tv")));
  main.appendChild(sectionEl("t_trend","Trending TV","Hits right now", ()=>showSpecial("trend_tv")));
  main.appendChild(sectionEl("t_pop","Popular TV","Most popular", ()=>showSpecial("pop_tv")));
  main.appendChild(sectionEl("t_top","Top Rated TV","Highest rated", ()=>showSpecial("top_tv")));
  const gs = document.createElement("div"); gs.className = "section";
  gs.innerHTML = '<div class="section-head"><h2>Browse TV by Genre</h2></div>';
  gs.appendChild(genreChipsBar(genresTV, g => showGenreGrid(g,"tv")));
  main.appendChild(gs);
  buildHero(async ()=> (await tmdb("/trending/tv/week")).results, "TRENDING TV SHOWS");
  loadRail("t_airing", async ()=> (await tmdb("/tv/airing_today")).results.map(x=>({...x,media_type:"tv"})));
  loadRail("t_onair", async ()=> (await tmdb("/tv/on_the_air")).results.map(x=>({...x,media_type:"tv"})));
  loadRail("t_new", async ()=> (await tmdb("/discover/tv",{sort_by:"first_air_date.desc","first_air_date.lte":TODAY,"vote_count.gte":15,include_adult:false})).results.map(x=>({...x,media_type:"tv"})));
  loadRail("t_trend", async ()=> (await tmdb("/trending/tv/day")).results.map(x=>({...x,media_type:"tv"})));
  loadRail("t_pop", async ()=> (await tmdb("/tv/popular")).results.map(x=>({...x,media_type:"tv"})));
  loadRail("t_top", async ()=> (await tmdb("/tv/top_rated")).results.map(x=>({...x,media_type:"tv"})));
}
globalThis.animeDiscover = async function animeDiscover(extra={}, kind="both"){
  const calls = [];
  if (kind==="both" || kind==="tv") calls.push(tmdb("/discover/tv",{with_genres:16,with_origin_country:"JP",include_adult:false,...extra}).then(r=>r.results.map(x=>({...x,_forceType:"anime",_animeKind:"tv"}))));
  if (kind==="both" || kind==="movie") calls.push(tmdb("/discover/movie",{with_genres:16,with_origin_country:"JP",include_adult:false,...extra}).then(r=>r.results.map(x=>({...x,_forceType:"anime",_animeKind:"movie"}))));
  const res = await Promise.all(calls);
  return extra.sort_by && extra.sort_by.includes("date") ? mergeTwo(res[0]||[], res[1]||[], cmpDate) : mergeTwo(res[0]||[], res[1]||[], cmpRating);
}
globalThis.buildAnimeTab = async function buildAnimeTab(){
  const main = document.getElementById("mainContent"); exitProvMode(); main.innerHTML = "";
  main.appendChild(sectionEl("a_new","New Anime Releases","Freshly released", ()=>showAnime("new")));
  main.appendChild(sectionEl("a_hits","Popular Anime","Biggest hits", ()=>showAnime("popular")));
  main.appendChild(sectionEl("a_airing","Airing Anime","Currently airing", ()=>showAnime("airing")));
  main.appendChild(sectionEl("a_top","Top Rated Anime","Highest rated", ()=>showAnime("top")));
  main.appendChild(sectionEl("a_movies","Anime Movies","Feature films", ()=>showAnime("movies")));
  const gs = document.createElement("div"); gs.className = "section";
  gs.innerHTML = '<div class="section-head"><h2>Browse Anime by Genre</h2></div>';
  gs.appendChild(genreChipsBar(ANIME_SUBGENRES, g => showAnimeGenreGrid(g)));
  main.appendChild(gs);
  buildHero(async ()=> animeDiscover({sort_by:"popularity.desc"}), "TRENDING ANIME");
  loadRail("a_new", async ()=> (await animeDiscover({sort_by:"first_air_date.desc","first_air_date.lte":TODAY,"vote_count.gte":5})).slice(0,14));
  loadRail("a_hits", async ()=> (await animeDiscover({sort_by:"popularity.desc"})).slice(0,14));
  loadRail("a_airing", async ()=> (await animeDiscover({sort_by:"popularity.desc","first_air_date.lte":TODAY,"vote_count.gte":10},"tv")).slice(0,14));
  loadRail("a_top", async ()=> (await animeDiscover({sort_by:"vote_average.desc","vote_count.gte":100})).slice(0,14));
  loadRail("a_movies", async ()=> (await animeDiscover({sort_by:"popularity.desc"},"movie")).slice(0,14));
}

/* ================= APPS TAB ================= */
globalThis.buildHubsTab = async function buildHubsTab(){
  const main = document.getElementById("mainContent");
  exitProvMode();
  document.getElementById("hero").innerHTML =
    '<div class="hero-content"><div class="hero-eyebrow">STREAMING APPS</div>' +
    '<div class="hero-title">Every Service, One Grid</div>' +
    '<div class="hero-overview">Tap any app icon to open its own themed home screen — with its real brand identity, colors, and a feed of only what\'s on that service in ' + REGION + '.</div></div>';
  document.getElementById("hero").style.backgroundImage = "linear-gradient(120deg,#151520,#0a0a0d)";
  main.innerHTML = "";
  const launcherSec = document.createElement("div");
  launcherSec.className = "section provider-launcher-section";
  launcherSec.innerHTML = '<div class="section-head"><div><h2>All Apps</h2><p>Tap to launch a service</p></div></div><div class="provider-launcher" id="hubsLauncher"></div>';
  main.appendChild(launcherSec);
  const hubContainer = document.createElement("div");
  hubContainer.id = "hubContainer";
  main.appendChild(hubContainer);
  buildProviderLauncher("hubsLauncher", 24);
  const providers = (await fetchAllProviders()).slice(0, 12);
  for (const p of providers){
    const design = getProviderDesign(p.name);
    const sec = document.createElement("div");
    sec.className = "hub-section";
    sec.style.cssText = "--p-color:" + design.color + ";--p-bg:" + design.bg2 + ";--p-accent:" + design.accent + ";";
    sec.innerHTML = '<div class="hub-banner" style="background:linear-gradient(135deg, ' + design.bg2 + ', #0a0a0d); border-bottom:2px solid ' + design.color + ';">' +
      '<img class="hub-logo" src="' + providerLogo(p.logo,"w154") + '" alt="' + p.name + '" onerror="this.style.display=\'none\'">' +
      '<span class="hub-name" style="color:' + design.color + ';">' + p.name + '</span>' +
      '<span class="hub-arrow">→</span></div>' +
      '<div class="hub-body"><div class="rail" id="hub_' + p.id + '"></div></div>';
    sec.querySelector(".hub-banner").onclick = () => renderProviderHome({id:p.id, name:p.name});
    hubContainer.appendChild(sec);
  }
  for (const p of providers){
    const el = document.getElementById("hub_" + p.id);
    if (!el) continue;
    el.innerHTML = "";
    for (let i=0;i<4;i++){ const sk = document.createElement("div"); sk.className = "skel"; el.appendChild(sk); }
    try {
      const design = getProviderDesign(p.name);
      const cfg = { ...DEFAULT_PROVIDER_CONTENT, ...(PROVIDER_CONTENT[design.key] || {}) };
      const [m,t] = await Promise.all([provDiscoverSafe(p.id, REGION, "movie", { ...cfg, sortBy: "popularity.desc" }), provDiscoverSafe(p.id, REGION, "tv", { ...cfg, sortBy: "popularity.desc" })]);
      railInto(el, mergeTwo(m, t, cmpPop).slice(0, 16));
    } catch(e){ el.innerHTML = '<div class="loader err small">Couldn\'t load ' + p.name + '.</div>'; }
  }
}

/* ================= GRID VIEWS ================= */

