import "../../../services/storage.js";
globalThis.buildHome = async function buildHome(navigationToken = watchNavigationGeneration){
  await ensureGenres();
  if (!isCurrentWatchNavigation(navigationToken)) return;
  const main = document.getElementById("mainContent");
  exitProvMode();
  main.innerHTML = "";

  if (continueList.length){
    const cw = sectionEl("h_continue","Continue Watching","Pick up where you left off", null);
    main.appendChild(cw);
    setTimeout(() => {
      if (!isCurrentWatchNavigation(navigationToken)) return;
      const el = document.getElementById("h_continue");
      if (!el) return;
      el.innerHTML = "";
      continueList.forEach((c,i) => {
        const item = { id:c.id, title:c.title, name:c.title, poster_path:c.poster, vote_average:c.rating, release_date:c.date, _forceType:c.type };
        const d = card(item, {}, i);
        d.onclick = () => openPlayer(c.id, c.type, c.title, item);
        el.appendChild(d);
      });
    }, 0);
  }

  const launcherSec = document.createElement("div");
  launcherSec.className = "section provider-launcher-section";
  launcherSec.innerHTML =
    '<div class="section-head"><div><h2>Your Apps</h2><p>Tap a service to open its own home screen</p></div><span class="see-all" id="seeAllProviders">See all →</span></div>' +
    '<div class="provider-launcher" id="homeProviderLauncher"></div>';
  main.appendChild(launcherSec);
  setTimeout(()=>{
    if (!isCurrentWatchNavigation(navigationToken)) return;
    const el = document.getElementById("seeAllProviders");
    if (el) el.onclick = () => routeTo("hubs");
  }, 0);

  main.appendChild(sectionEl("h_top10","Top 10 This Week","Most popular across movies & TV", ()=>showSpecial("trending")));
  main.appendChild(sectionEl("h_new","New Releases","Freshly out", ()=>showSpecial("new")));
  main.appendChild(sectionEl("h_top","Top Rated","Highest rated of all time", ()=>showSpecial("toprated")));
  main.appendChild(sectionEl("h_upcoming","Coming Soon","Landing soon in theaters", ()=>showSpecial("upcoming_movie")));
  main.appendChild(sectionEl("h_anime","Anime Spotlight","Popular anime right now", ()=>showAnime("popular")));
  main.appendChild(sectionEl("h_kids","Kids & Family","Safe picks for the little ones", ()=>showKids("popular")));
  main.appendChild(sectionEl("h_music","Music Spotlight","Trending music films & docs", ()=>showMusic("trend")));

  const gs = document.createElement("div"); gs.className = "section";
  gs.innerHTML = '<div class="section-head"><h2>Browse by Genre</h2><p>Find something by mood</p></div>';
  gs.appendChild(genreChipsBar(dedupeGenres([...genresMovie, ...genresTV]), g => showGenreGrid(g,"all")));
  main.appendChild(gs);

  buildHero(async ()=> (await tmdb("/trending/all/week")).results, "TRENDING THIS WEEK", navigationToken);
  loadRail("h_top10", async ()=> (await tmdb("/trending/all/week")).results.slice(0,10), {top10:true});
  loadRail("h_new", async () => {
    const [m,t] = await Promise.all([
      tmdb("/discover/movie",{sort_by:"primary_release_date.desc","primary_release_date.lte":TODAY,"vote_count.gte":30, include_adult:false}),
      tmdb("/discover/tv",{sort_by:"first_air_date.desc","first_air_date.lte":TODAY,"vote_count.gte":15, include_adult:false})
    ]);
    return mergeTwo(m.results.map(x=>({...x,media_type:"movie"})), t.results.map(x=>({...x,media_type:"tv"})), cmpDate).slice(0,14);
  });
  loadRail("h_top", async () => {
    const [m,t] = await Promise.all([tmdb("/movie/top_rated"), tmdb("/tv/top_rated")]);
    return mergeTwo(m.results.map(x=>({...x,media_type:"movie"})), t.results.map(x=>({...x,media_type:"tv"})), cmpRating).slice(0,14);
  });
  loadRail("h_upcoming", async ()=> (await tmdb("/movie/upcoming", {region:REGION})).results.map(x=>({...x,media_type:"movie"})).slice(0,14));
  loadRail("h_anime", async ()=> (await animeDiscover({sort_by:"popularity.desc"})).slice(0,14));
  loadRail("h_kids", async ()=> (await kidsDiscover({sort_by:"popularity.desc"})).slice(0,14), {kids:true});
  loadRail("h_music", async ()=> (await musicDiscover({sort_by:"popularity.desc"})).slice(0,14), {music:true});

  buildProviderLauncher("homeProviderLauncher", 12, navigationToken);
}

/* ================= PROVIDER LAUNCHER ================= */

