import "../../../services/storage.js";
globalThis.musicDiscover = async function musicDiscover(extra={}, kind="both"){
  const calls = [];
  if (kind==="both" || kind==="movie") calls.push(tmdb("/discover/movie",{with_genres:MUSIC_GENRE_ID, include_adult:false, ...extra}).then(r=>r.results.map(x=>({...x,_forceType:"music",_mediaType:"movie"}))));
  if (kind==="both" || kind==="tv") calls.push(tmdb("/discover/tv",{with_genres:MUSIC_GENRE_ID, include_adult:false, ...extra}).then(r=>r.results.map(x=>({...x,_forceType:"music",_mediaType:"tv"}))));
  const res = await Promise.all(calls);
  return extra.sort_by && extra.sort_by.includes("date") ? mergeTwo(res[0]||[], res[1]||[], cmpDate) : mergeTwo(res[0]||[], res[1]||[], cmpRating);
}
globalThis.buildMusicTab = async function buildMusicTab(){
  const main = document.getElementById("mainContent"); exitProvMode(); main.innerHTML = "";
  main.appendChild(sectionEl("mu_new","New Music Releases","Fresh music films & docs", ()=>showMusic("new")));
  main.appendChild(sectionEl("mu_trend","Trending Music","Popular right now", ()=>showMusic("trend")));
  main.appendChild(sectionEl("mu_top","Top Rated Music","Highest rated", ()=>showMusic("top")));
  main.appendChild(sectionEl("mu_docs","Music Documentaries","Behind the scenes", ()=>showMusic("docs")));
  const gs = document.createElement("div"); gs.className="section";
  gs.innerHTML = '<div class="section-head"><h2>Browse Music by Genre</h2></div>';
  gs.appendChild(genreChipsBar([{id:28,name:"Action"},{id:18,name:"Drama"},{id:36,name:"History"},{id:99,name:"Documentary"},{id:35,name:"Comedy"},{id:10749,name:"Romance"}], g=>showMusicGenreGrid(g)));
  main.appendChild(gs);
  buildHero(async ()=> musicDiscover({sort_by:"popularity.desc"}), "TRENDING MUSIC");
  loadRail("mu_new", async ()=> (await musicDiscover({sort_by:"primary_release_date.desc","primary_release_date.lte":TODAY,"vote_count.gte":5})).slice(0,14), {music:true});
  loadRail("mu_trend", async ()=> (await musicDiscover({sort_by:"popularity.desc"})).slice(0,14), {music:true});
  loadRail("mu_top", async ()=> (await musicDiscover({sort_by:"vote_average.desc","vote_count.gte":50})).slice(0,14), {music:true});
  loadRail("mu_docs", async ()=> (await musicDiscover({sort_by:"popularity.desc", with_genres:"99,10402"})).slice(0,14), {music:true});
}
globalThis.showMusic = async function showMusic(kind){
  const titles = {new:"New Music Releases", trend:"Trending Music", top:"Top Rated Music", docs:"Music Documentaries"};
  const grid = openGrid(titles[kind]);
  const requestToken = gridRequestGeneration;
  try {
    let items;
    if (kind==="new") items = await musicDiscover({sort_by:"primary_release_date.desc","primary_release_date.lte":TODAY,"vote_count.gte":5});
    else if (kind==="top") items = await musicDiscover({sort_by:"vote_average.desc","vote_count.gte":50});
    else if (kind==="docs") items = await musicDiscover({sort_by:"popularity.desc", with_genres:"99,10402"});
    else items = await musicDiscover({sort_by:"popularity.desc"});
    if (!currentGridRequest(requestToken, grid)) return;
    grid.innerHTML=""; items.forEach((i,idx)=>grid.appendChild(musicCard(i, idx)));
  } catch {
    if (!currentGridRequest(requestToken, grid)) return;
    showGridRequestError(grid, () => showMusic(kind), requestToken);
  }
}
globalThis.showMusicGenreGrid = async function showMusicGenreGrid(g){
  const grid = openGrid("Music · "+g.name);
  const requestToken = gridRequestGeneration;
  try {
    const items = await musicDiscover({with_genres:MUSIC_GENRE_ID + "," + g.id, sort_by:"popularity.desc"});
    if (!currentGridRequest(requestToken, grid)) return;
    grid.innerHTML=""; items.forEach((i,idx)=>grid.appendChild(musicCard(i, idx)));
  } catch {
    if (!currentGridRequest(requestToken, grid)) return;
    showGridRequestError(grid, () => showMusicGenreGrid(g), requestToken);
  }
}

/* ================= HOME ================= */

