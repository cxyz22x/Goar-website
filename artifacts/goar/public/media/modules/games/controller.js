import { GAMES } from "../../data/game-catalog.js";
import { mediaRouteUrl, routeFromHistory, routeFromSearch, WATCH_TABS } from "./route-state.js";
const titles={home:"goarxyz",movie:"Movies — goarxyz",tv:"TV — goarxyz",live:"Live — goarxyz",list:"List — goarxyz",music:"Music — goarxyz",games:"Games — goarxyz"};
  let gamesLoaded=false;
  function show(name, push, requestedTab){
    const requestedView = name;
    let watchTab = null;
    if(name==="watch"){
      watchTab = WATCH_TABS.has(requestedTab) ? requestedTab : "movie";
      name = watchTab;
    } else if(WATCH_TABS.has(name)){
      watchTab = name;
    }
    const asked = name;
    if (asked !== "games" && !document.getElementById("gamePlay")?.hidden) closeGame(false);
    const watchTabs=["movie","tv","anime","kids","hubs","music","list","live"];
    let inner=null;
    if(name==="live"||name==="list"){ inner=name; name="movie"; }
    const view = requestedView === "watch" ? "watch" : name==="home"||name==="music"||name==="games" ? name : "watch";
    ["home","watch","music","games"].forEach(v=>{
      const el=document.getElementById("view-"+v);
      if(el) el.classList.toggle("on", v===view);
    });
    document.querySelectorAll("#app-dock [data-view]").forEach(b=>{
      const id=b.getAttribute("data-view");
      b.classList.toggle("on", (requestedView !== "watch" || watchTab !== "home") && (id===asked || (!inner && id==="movie" && asked==="movie") || (asked==="tv" && id==="tv")));
    });
    document.title=titles[asked]||"goarxyz";
    if(view==="watch" && typeof routeTo==="function"){
      routeTo(inner || (watchTabs.indexOf(name)>=0?name:"home"));
    }
    if(name==="games") loadGames();
    if(push){
      const historyView = requestedView === "watch" ? "watch" : asked;
      const url = mediaRouteUrl(historyView, watchTab, location.href);
      const state = {view:historyView};
      if (historyView === "watch") state.tab = watchTab || "movie";
      history.pushState(state, "", url);
    }
  }
  
  let gamesReady = false;
  let gameQuery = "";
  let gameCat = "all";
  let activeGame = null;
  let gameSession = 0;
  let gameTimer = 0;
  let previousGameFocus = null;
  const GAME_CATS = ["all", ...new Set(GAMES.map(g => (g.category || "").trim().toLowerCase()).filter(Boolean))];
  const escapeText = value => String(value || "").replace(/[&<>"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
  })[char]);
  function gameUrl(game){
    try {
      const url = new URL(game.file);
      if (url.protocol !== "https:" || !["cdn-factory.marketjs.com", "cdn-consumer.marketjs.com"].includes(url.hostname)) return null;
      if (url.hostname === "cdn-consumer.marketjs.com" && /^\/game\/[^/]+$/.test(url.pathname)) url.pathname += "/";
      return url.href;
    } catch (_) {
      return null;
    }
  }
  function gameCoverUrl(game){
    try {
      const url = new URL(game.cover);
      return url.protocol === "https:" && url.hostname === "www.marketjs.com" ? url.href : "";
    } catch (_) {
      return "";
    }
  }
  function updateGameStatus(message){
    const status = document.getElementById("gameStatus");
    if (status) status.textContent = message;
  }
  function loadGameFrame(){
    if (!activeGame) return;
    const frame = document.getElementById("gameFrame");
    const url = gameUrl(activeGame);
    if (!url) {
      updateGameStatus("This catalogue entry has no valid game source.");
      return;
    }
    const session = ++gameSession;
    window.clearTimeout(gameTimer);
    updateGameStatus("Loading game…");
    frame.title = (activeGame.title || "Game") + " player";
    frame.onload = function(){
      if (session !== gameSession) return;
      updateGameStatus("Game page opened. If play does not start, retry or open separately.");
      window.clearTimeout(gameTimer);
      gameTimer = window.setTimeout(function(){
        if (session === gameSession) updateGameStatus("Still waiting? The publisher may block embedded play. Retry or open separately.");
      }, 12000);
    };
    frame.onerror = function(){
      if (session !== gameSession) return;
      window.clearTimeout(gameTimer);
      updateGameStatus("Could not load this game here. Try again or open it separately.");
    };
    frame.src = url;
    gameTimer = window.setTimeout(function(){
      if (session === gameSession) updateGameStatus("The game is taking a while to load. Retry or open separately.");
    }, 20000);
  }
  function renderGames(){
    const box = document.getElementById("gameGrid");
    const q = gameQuery.trim().toLowerCase();
    const rows = GAMES.filter(function(g){
      if (gameCat !== "all" && (g.category || "") !== gameCat) return false;
      if (!q) return true;
      return ((g.title || "") + " " + (g.description || "") + " " + (g.category || "")).toLowerCase().includes(q);
    });
    const count = document.getElementById("gameCount");
    if (count) count.textContent = `${rows.length} ${rows.length === 1 ? "game" : "games"} shown · publisher availability varies.`;
    box.replaceChildren();
    if (!rows.length){
      const empty = document.createElement("p");
      empty.className = "gempty";
      empty.textContent = "No games match this search and category. Try another term or choose All.";
      box.appendChild(empty);
      return;
    }
    rows.forEach(function(g){
      const title = g.title || "Game";
      const category = g.category || "game";
      const source = gameUrl(g);
      const card = document.createElement("button");
      card.type = "button";
      card.className = "game-card" + (source ? "" : " unavailable");
      card.dataset.id = g.id;
      card.disabled = !source;
      card.setAttribute("aria-label", source
        ? `Play ${title}, ${category}. ${g.description || ""}`
        : `${title} is unavailable because it has no valid source.`);
      const coverUrl = gameCoverUrl(g);
      if (coverUrl){
        const image = document.createElement("img");
        image.src = coverUrl;
        image.alt = "";
        image.loading = "lazy";
        image.onerror = function(){
          const placeholder = document.createElement("span");
          placeholder.className = "game-cover-fallback";
          placeholder.setAttribute("aria-hidden", "true");
          placeholder.textContent = "GOAR";
          image.replaceWith(placeholder);
        };
        card.appendChild(image);
      } else {
        const placeholder = document.createElement("span");
        placeholder.className = "game-cover-fallback";
        placeholder.setAttribute("aria-hidden", "true");
        placeholder.textContent = "GOAR";
        card.appendChild(placeholder);
      }
      const info = document.createElement("span");
      info.className = "game-card-info";
      const name = document.createElement("b");
      name.textContent = title;
      const description = document.createElement("span");
      description.className = "game-card-description";
      description.textContent = g.description || "";
      const meta = document.createElement("span");
      meta.className = "game-card-category";
      meta.textContent = source ? category : "Unavailable";
      info.append(name, description, meta);
      card.appendChild(info);
      card.onclick = function(){ if (source) playGame(g.id); };
      box.appendChild(card);
    });
  }
  function playGame(id){
    const g = GAMES.find(function(x){ return x.id === id; });
    if (!g) return;
    if (!gameUrl(g)) return;
    const play = document.getElementById("gamePlay");
    const link = document.getElementById("gameStandalone");
    activeGame = g;
    previousGameFocus = document.activeElement;
    document.getElementById("gameTitle").textContent = g.title || "Game";
    link.href = gameUrl(g);
    play.hidden = false;
    document.body.classList.add("playing-game");
    document.getElementById("gameBack").focus();
    loadGameFrame();
  }
  function closeGame(restoreFocus=true){
    const frame = document.getElementById("gameFrame");
    const play = document.getElementById("gamePlay");
    if (!play || play.hidden) return;
    gameSession++;
    window.clearTimeout(gameTimer);
    frame.onload = null;
    frame.onerror = null;
    frame.removeAttribute("src");
    if (document.fullscreenElement) document.exitFullscreen().catch(function(){});
    play.hidden = true;
    document.body.classList.remove("playing-game");
    activeGame = null;
    if (restoreFocus && previousGameFocus && previousGameFocus.isConnected) previousGameFocus.focus();
    previousGameFocus = null;
  }
  function loadGames(){
    if (gamesReady) return;
    gamesReady = true;
    const cats = document.getElementById("gameCats");
    cats.innerHTML = GAME_CATS.map(function(c){
      const label = c === "all" ? "All" : c.charAt(0).toUpperCase() + c.slice(1);
      const count = c === "all" ? GAMES.length : GAMES.filter(g => (g.category || "").toLowerCase() === c).length;
      return '<button type="button" class="gchip' + (c===gameCat?" on":"") + '" data-cat="' + escapeText(c) + '" aria-pressed="' + (c===gameCat) + '">' + escapeText(label) + ' <span>' + count + '</span></button>';
    }).join("");
    cats.querySelectorAll("[data-cat]").forEach(function(btn){
      btn.onclick = function(){
        gameCat = btn.getAttribute("data-cat");
        cats.querySelectorAll(".gchip").forEach(function(x){
          x.classList.toggle("on", x===btn);
          x.setAttribute("aria-pressed", String(x===btn));
        });
        renderGames();
      };
    });
    document.getElementById("gameSearch").addEventListener("input", function(e){
      gameQuery = e.target.value || "";
      renderGames();
    });
    document.getElementById("gameBack").onclick = closeGame;
    document.getElementById("gameRetry").onclick = loadGameFrame;
    document.getElementById("gameFullscreen").onclick = async function(){
      const frame = document.getElementById("gameFrame");
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (frame.requestFullscreen) await frame.requestFullscreen();
        else updateGameStatus("Fullscreen is not available in this browser.");
      } catch (_) {
        updateGameStatus("Fullscreen was blocked. You can still open the game separately.");
      }
    };
    document.addEventListener("keydown", function(e){ if (e.key === "Escape" && document.getElementById("view-games").classList.contains("on")) closeGame(); });
    renderGames();
  }
  window.goarShow = show;
  document.querySelectorAll("#app-shell [data-view], #view-home [data-view], #app-dock [data-view]").forEach(el=>{
    el.addEventListener("click", ev=>{ ev.preventDefault(); show(el.getAttribute("data-view"), true); });
  });
  window.addEventListener("popstate", ev=>{
    const route = routeFromHistory(ev.state, location.search);
    show(route.view, false, route.tab);
  });
  const initialRoute = routeFromSearch(location.search);
  show(initialRoute.view, false, initialRoute.tab);
