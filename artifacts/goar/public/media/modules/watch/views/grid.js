import "../../../services/storage.js";
let gridReturnFocus = null;
let gridRequestToken = 0;
globalThis.gridRequestGeneration = 0;
function nextGridRequest(){
  gridRequestToken++;
  gridRequestGeneration = gridRequestToken;
  return gridRequestToken;
}
globalThis.currentGridRequest = function currentGridRequest(token, grid){
  return token === gridRequestGeneration &&
    document.getElementById("gridView").classList.contains("open") &&
    (!grid || document.getElementById("gridGrid") === grid);
}
globalThis.invalidateGridRequests = function invalidateGridRequests(){
  nextGridRequest();
}
globalThis.openGrid = function openGrid(title){
  nextGridRequest();
  if (!document.getElementById("gridView").classList.contains("open")) gridReturnFocus = document.activeElement;
  document.getElementById("hero").style.display = "none";
  document.getElementById("mainContent").style.display = "none";
  document.getElementById("gridView").classList.add("open");
  document.getElementById("gridTitle").textContent = title;
  const grid = document.getElementById("gridGrid");
  grid.innerHTML = '<div class="loader">Loading…</div>';
  return grid;
}
document.getElementById("gridBack").onclick = () => {
  invalidateGridRequests();
  document.getElementById("gridView").classList.remove("open");
  document.getElementById("hero").style.display = "";
  document.getElementById("mainContent").style.display = "";
  const target = gridReturnFocus && gridReturnFocus.isConnected
    ? gridReturnFocus
    : document.querySelector("#view-watch nav a.active");
  target?.focus();
  gridReturnFocus = null;
};
globalThis.showGridRequestError = function showGridRequestError(grid, retry, token = gridRequestGeneration){
  if (!currentGridRequest(token, grid)) return;
  grid.replaceChildren();
  const message = document.createElement("div");
  message.className = "loader err";
  message.setAttribute("role", "alert");
  message.textContent = "Could not load these titles. Check your connection and retry.";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn btn-ghost";
  button.textContent = "Retry";
  button.onclick = retry;
  message.appendChild(button);
  grid.appendChild(message);
}
function gridError(grid, retry, token){
  showGridRequestError(grid, retry, token);
}
globalThis.showGenreGrid = async function showGenreGrid(genre, scope){
  const grid = openGrid(genre.name);
  const requestToken = gridRequestToken;
  try {
    let merged = [];
    if (scope==="movie" || scope==="all"){ const m = await tmdb("/discover/movie",{with_genres:genre.id, sort_by:"popularity.desc", include_adult:false}); merged.push(...m.results.map(x=>({...x,media_type:"movie"}))); }
    if (scope==="tv" || scope==="all"){ const t = await tmdb("/discover/tv",{with_genres:genre.id, sort_by:"popularity.desc", include_adult:false}); merged.push(...t.results.map(x=>({...x,media_type:"tv"}))); }
    if (!currentGridRequest(requestToken, grid)) return;
    merged = mergeTwo(merged.filter(x=>x.media_type==="movie"), merged.filter(x=>x.media_type==="tv"), cmpPop);
    grid.innerHTML=""; merged.forEach((i,idx)=>grid.appendChild(card(i, {}, idx)));
  } catch { if (currentGridRequest(requestToken, grid)) gridError(grid, () => showGenreGrid(genre, scope), requestToken); }
}
globalThis.showAnimeGenreGrid = async function showAnimeGenreGrid(g){
  const grid = openGrid("Anime · " + g.name);
  const requestToken = gridRequestToken;
  try { const items = await animeDiscover({with_genres:"16," + g.id, sort_by:"popularity.desc"}); if (!currentGridRequest(requestToken, grid)) return; grid.innerHTML=""; items.forEach((i,idx)=>grid.appendChild(card(i, {}, idx))); }
  catch { if (currentGridRequest(requestToken, grid)) gridError(grid, () => showAnimeGenreGrid(g), requestToken); }
}
globalThis.showAnime = async function showAnime(kind){
  const titles = {new:"New Anime Releases", popular:"Popular Anime", top:"Top Rated Anime", movies:"Anime Movies", airing:"Airing Anime"};
  const grid = openGrid(titles[kind]);
  const requestToken = gridRequestToken;
  try {
    let items;
    if (kind==="new") items = await animeDiscover({sort_by:"first_air_date.desc","first_air_date.lte":TODAY,"vote_count.gte":5});
    else if (kind==="top") items = await animeDiscover({sort_by:"vote_average.desc","vote_count.gte":100});
    else if (kind==="movies") items = await animeDiscover({sort_by:"popularity.desc"},"movie");
    else if (kind==="airing") items = await animeDiscover({sort_by:"popularity.desc","first_air_date.lte":TODAY,"vote_count.gte":10},"tv");
    else items = await animeDiscover({sort_by:"popularity.desc"});
    if (!currentGridRequest(requestToken, grid)) return;
    grid.innerHTML=""; items.forEach((i,idx)=>grid.appendChild(card(i, {}, idx)));
  } catch { if (currentGridRequest(requestToken, grid)) gridError(grid, () => showAnime(kind), requestToken); }
}
globalThis.showSpecial = async function showSpecial(kind){
  const titles = {
    trending:"Trending Now", new:"New Releases", toprated:"Top Rated",
    new_movie:"New Movie Releases", trend_movie:"Trending Movies", top_movie:"Top Rated Movies",
    now_movie:"In Theaters", upcoming_movie:"Coming Soon", pop_movie:"Popular Movies",
    new_tv:"New TV Releases", trend_tv:"Trending TV Shows", top_tv:"Top Rated TV Shows",
    airing_tv:"Airing Today", onair_tv:"On The Air", pop_tv:"Popular TV Shows"
  };
  const grid = openGrid(titles[kind] || kind);
  const requestToken = gridRequestToken;
  try {
    let items = [];
    if (kind==="trending") items = (await tmdb("/trending/all/week")).results;
    else if (kind==="new"){
      const [m,t] = await Promise.all([
        tmdb("/discover/movie",{sort_by:"primary_release_date.desc","primary_release_date.lte":TODAY,"vote_count.gte":30,include_adult:false}),
        tmdb("/discover/tv",{sort_by:"first_air_date.desc","first_air_date.lte":TODAY,"vote_count.gte":15,include_adult:false})
      ]);
      items = mergeTwo(m.results.map(x=>({...x,media_type:"movie"})), t.results.map(x=>({...x,media_type:"tv"})),cmpDate);
    } else if (kind==="toprated"){
      const [m,t] = await Promise.all([tmdb("/movie/top_rated"), tmdb("/tv/top_rated")]);
      items = mergeTwo(m.results.map(x=>({...x,media_type:"movie"})), t.results.map(x=>({...x,media_type:"tv"})),cmpRating);
    }
    else if (kind==="new_movie") items = (await tmdb("/discover/movie",{sort_by:"primary_release_date.desc","primary_release_date.lte":TODAY,"vote_count.gte":30,include_adult:false})).results.map(x=>({...x,media_type:"movie"}));
    else if (kind==="trend_movie") items = (await tmdb("/trending/movie/week")).results.map(x=>({...x,media_type:"movie"}));
    else if (kind==="top_movie") items = (await tmdb("/movie/top_rated")).results.map(x=>({...x,media_type:"movie"}));
    else if (kind==="now_movie") items = (await tmdb("/movie/now_playing",{region:REGION})).results.map(x=>({...x,media_type:"movie"}));
    else if (kind==="upcoming_movie") items = (await tmdb("/movie/upcoming",{region:REGION})).results.map(x=>({...x,media_type:"movie"}));
    else if (kind==="pop_movie") items = (await tmdb("/movie/popular")).results.map(x=>({...x,media_type:"movie"}));
    else if (kind==="new_tv") items = (await tmdb("/discover/tv",{sort_by:"first_air_date.desc","first_air_date.lte":TODAY,"vote_count.gte":15,include_adult:false})).results.map(x=>({...x,media_type:"tv"}));
    else if (kind==="trend_tv") items = (await tmdb("/trending/tv/week")).results.map(x=>({...x,media_type:"tv"}));
    else if (kind==="top_tv") items = (await tmdb("/tv/top_rated")).results.map(x=>({...x,media_type:"tv"}));
    else if (kind==="airing_tv") items = (await tmdb("/tv/airing_today")).results.map(x=>({...x,media_type:"tv"}));
    else if (kind==="onair_tv") items = (await tmdb("/tv/on_the_air")).results.map(x=>({...x,media_type:"tv"}));
    else if (kind==="pop_tv") items = (await tmdb("/tv/popular")).results.map(x=>({...x,media_type:"tv"}));
    if (!currentGridRequest(requestToken, grid)) return;
    grid.innerHTML=""; items.forEach((i,idx)=>grid.appendChild(card(i, {}, idx)));
  } catch { if (currentGridRequest(requestToken, grid)) gridError(grid, () => showSpecial(kind), requestToken); }
}

/* ================= CATEGORY BAR ================= */

