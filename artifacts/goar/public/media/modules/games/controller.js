const MEDIA_VIEWS = new Set(["home", "watch", "movie", "tv", "live", "music", "games", "anime", "kids", "hubs", "list"]);
function requestedInitialView(){
  const params = new URLSearchParams(location.search);
  const requested = params.get("view") || params.get("v") || "home";
  return MEDIA_VIEWS.has(requested) ? requested : "home";
}

import { GAMES } from "../../data/game-catalog.js";
const titles={home:"goarxyz",movie:"Movies — goarxyz",tv:"TV — goarxyz",live:"Live — goarxyz",list:"List — goarxyz",music:"Music — goarxyz",games:"Games — goarxyz"};
  let gamesLoaded=false;
  function show(name, push){
    if(name==="watch") name="movie";
    const asked = name;
    const watchTabs=["movie","tv","anime","kids","hubs","music","list","live"];
    let inner=null;
    if(name==="live"||name==="list"){ inner=name; name="movie"; }
    const view = name==="home"||name==="music"||name==="games" ? name : "watch";
    ["home","watch","music","games"].forEach(v=>{
      const el=document.getElementById("view-"+v);
      if(el) el.classList.toggle("on", v===view);
    });
    document.querySelectorAll("#app-dock [data-view]").forEach(b=>{
      const id=b.getAttribute("data-view");
      b.classList.toggle("on", id===asked || (!inner && id==="movie" && asked==="movie") || (asked==="tv" && id==="tv"));
    });
    document.title=titles[asked]||"goarxyz";
    if(view==="watch" && typeof routeTo==="function"){
      routeTo(inner || (watchTabs.indexOf(name)>=0?name:"home"));
    }
    if(name==="games") loadGames();
    if(push){
      const url = new URL("./index.html", location.href);
      if (asked !== "home") url.searchParams.set("view", asked);
      history.pushState({view:asked}, "", url);
    }
  }
  
  let gamesReady = false;
  let gameQuery = "";
  let gameCat = "all";
  const GAME_CATS = ["all","arcade","puzzle","word","skill","strategy","creative"];
  function renderGames(){
    const box = document.getElementById("gameGrid");
    const q = gameQuery.trim().toLowerCase();
    const rows = GAMES.filter(function(g){
      if (gameCat !== "all" && (g.category || "") !== gameCat) return false;
      if (!q) return true;
      return ((g.title || "") + " " + (g.description || "") + " " + (g.category || "")).toLowerCase().indexOf(q) >= 0;
    });
    if (!rows.length){ box.innerHTML = '<p class="gempty">No games match.</p>'; return; }
    box.innerHTML = rows.map(function(g){
      const cover = g.cover || "";
      const title = g.title || "Game";
      return '<button type="button" data-id="' + g.id + '"><img src="' + cover + '" alt="" loading="lazy"><b>' + String(title).replace(/&/g,"&"+"amp;").replace(/</g,"&"+"lt;").replace(/>/g,"&"+"gt;") + '</b><span>' + (g.category || "") + '</span></button>';
    }).join("");
    box.querySelectorAll("[data-id]").forEach(function(el){
      el.onclick = function(){ playGame(el.getAttribute("data-id")); };
    });
  }
  function playGame(id){
    const g = GAMES.find(function(x){ return x.id === id; });
    if (!g || !g.file) return;
    const play = document.getElementById("gamePlay");
    const frame = document.getElementById("gameFrame");
    const status = document.getElementById("gameStatus");
    document.getElementById("gameTitle").textContent = g.title || "Game";
    if (status) status.textContent = "Loading…";
    play.hidden = false;
    document.body.classList.add("playing-game");
    frame.onload = function(){
      if (!status) return;
      if (frame.src && frame.src.indexOf("about:blank") < 0) status.textContent = "";
    };
    frame.src = "about:blank";
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ frame.src = g.file; });
    });
  }
  function closeGame(){
    const frame = document.getElementById("gameFrame");
    frame.src = "about:blank";
    document.getElementById("gamePlay").hidden = true;
    document.body.classList.remove("playing-game");
  }
  function loadGames(){
    if (gamesReady) return;
    gamesReady = true;
    const cats = document.getElementById("gameCats");
    cats.innerHTML = GAME_CATS.map(function(c){
      return '<button type="button" class="gchip' + (c===gameCat?" on":"") + '" data-cat="' + c + '">' + (c==="all"?"All":c) + '</button>';
    }).join("");
    cats.querySelectorAll("[data-cat]").forEach(function(btn){
      btn.onclick = function(){
        gameCat = btn.getAttribute("data-cat");
        cats.querySelectorAll(".gchip").forEach(function(x){ x.classList.toggle("on", x===btn); });
        renderGames();
      };
    });
    document.getElementById("gameSearch").addEventListener("input", function(e){
      gameQuery = e.target.value || "";
      renderGames();
    });
    document.getElementById("gameBack").onclick = closeGame;
    document.addEventListener("keydown", function(e){ if (e.key === "Escape" && document.getElementById("view-games").classList.contains("on")) closeGame(); });
    renderGames();
  }
  window.goarShow = show;
  document.querySelectorAll("#app-shell [data-view], #view-home [data-view], #app-dock [data-view]").forEach(el=>{
    el.addEventListener("click", ev=>{ ev.preventDefault(); show(el.getAttribute("data-view"), true); });
  });
  window.addEventListener("popstate", ev=> show((ev.state&&ev.state.view)||requestedInitialView(), false));
  show(requestedInitialView(), false);
