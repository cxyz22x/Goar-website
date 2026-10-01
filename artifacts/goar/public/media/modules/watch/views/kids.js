import "../../../services/storage.js";
globalThis.kidsDiscover = async function kidsDiscover(extra={}, kind="both"){
  const calls = [];
  if (kind==="both" || kind==="movie") calls.push(tmdb("/discover/movie",{with_genres:KIDS_GENRES, certification_country:"US","certification.lte":"PG", include_adult:false, ...extra}).then(r=>r.results.map(x=>({...x,_forceType:"kids",_realType:"movie"}))));
  if (kind==="both" || kind==="tv") calls.push(tmdb("/discover/tv",{with_genres:KIDS_GENRES, include_adult:false, ...extra}).then(r=>r.results.map(x=>({...x,_forceType:"kids",_realType:"tv"}))));
  const res = await Promise.all(calls);
  return extra.sort_by && extra.sort_by.includes("date") ? mergeTwo(res[0]||[], res[1]||[], cmpDate) : mergeTwo(res[0]||[], res[1]||[], cmpRating);
}
globalThis.buildKidsTab = async function buildKidsTab(){
  const main = document.getElementById("mainContent"); exitProvMode(); main.innerHTML = "";
  main.appendChild(sectionEl("k_new","New for Kids","Fresh family titles", ()=>showKids("new")));
  main.appendChild(sectionEl("k_pop","Popular with Kids","Most watched family titles", ()=>showKids("popular")));
  main.appendChild(sectionEl("k_movies","Kids Movies","Animated & family films", ()=>showKids("movies")));
  main.appendChild(sectionEl("k_tv","Kids TV Shows","Family series", ()=>showKids("tv")));
  main.appendChild(sectionEl("k_top","Top Rated Family","Highest rated kids content", ()=>showKids("top")));
  const gs = document.createElement("div"); gs.className="section";
  gs.innerHTML = '<div class="section-head"><h2>Browse Kids by Genre</h2></div>';
  gs.appendChild(genreChipsBar([{id:16,name:"Animation"},{id:10751,name:"Family"},{id:12,name:"Adventure"},{id:35,name:"Comedy"},{id:14,name:"Fantasy"},{id:10402,name:"Music"}], g=>showKidsGenreGrid(g)));
  main.appendChild(gs);
  buildHero(async ()=> kidsDiscover({sort_by:"popularity.desc"}), "FOR THE WHOLE FAMILY");
  loadRail("k_new", async ()=> (await kidsDiscover({sort_by:"primary_release_date.desc","primary_release_date.lte":TODAY,"vote_count.gte":5})).slice(0,14), {kids:true});
  loadRail("k_pop", async ()=> (await kidsDiscover({sort_by:"popularity.desc"})).slice(0,14), {kids:true});
  loadRail("k_movies", async ()=> (await kidsDiscover({sort_by:"popularity.desc"},"movie")).slice(0,14), {kids:true});
  loadRail("k_tv", async ()=> (await kidsDiscover({sort_by:"popularity.desc"},"tv")).slice(0,14), {kids:true});
  loadRail("k_top", async ()=> (await kidsDiscover({sort_by:"vote_average.desc","vote_count.gte":50})).slice(0,14), {kids:true});
}
globalThis.showKids = async function showKids(kind){
  const titles = {new:"New for Kids", popular:"Popular with Kids", movies:"Kids Movies", tv:"Kids TV Shows", top:"Top Rated Family"};
  const grid = openGrid(titles[kind]);
  const requestToken = gridRequestGeneration;
  try {
    let items;
    if (kind==="new") items = await kidsDiscover({sort_by:"primary_release_date.desc","primary_release_date.lte":TODAY,"vote_count.gte":5});
    else if (kind==="top") items = await kidsDiscover({sort_by:"vote_average.desc","vote_count.gte":50});
    else if (kind==="movies") items = await kidsDiscover({sort_by:"popularity.desc"},"movie");
    else if (kind==="tv") items = await kidsDiscover({sort_by:"popularity.desc"},"tv");
    else items = await kidsDiscover({sort_by:"popularity.desc"});
    if (!currentGridRequest(requestToken, grid)) return;
    grid.innerHTML=""; items.forEach((i,idx)=>grid.appendChild(card(i, {kids:true}, idx)));
  } catch {
    if (!currentGridRequest(requestToken, grid)) return;
    showGridRequestError(grid, () => showKids(kind), requestToken);
  }
}
globalThis.showKidsGenreGrid = async function showKidsGenreGrid(g){
  const grid = openGrid("Kids · "+g.name);
  const requestToken = gridRequestGeneration;
  try {
    const items = await kidsDiscover({with_genres:"" + g.id, sort_by:"popularity.desc"});
    if (!currentGridRequest(requestToken, grid)) return;
    grid.innerHTML=""; items.forEach((i,idx)=>grid.appendChild(card(i, {kids:true}, idx)));
  } catch {
    if (!currentGridRequest(requestToken, grid)) return;
    showGridRequestError(grid, () => showKidsGenreGrid(g), requestToken);
  }
}


