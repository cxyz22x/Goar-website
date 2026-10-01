import "../../../services/storage.js";
globalThis.watchNavigationGeneration = 0;
globalThis.watchNavigationTab = "home";
globalThis.isCurrentWatchNavigation = function isCurrentWatchNavigation(token){
  return token === watchNavigationGeneration && activeTab === watchNavigationTab;
}
globalThis.setActiveTab = function setActiveTab(tab){
  activeTab = tab;
  watchNavigationTab = tab;
  const token = ++watchNavigationGeneration;
  if (typeof invalidateGridRequests === "function") invalidateGridRequests();
  document.getElementById("view-watch").querySelectorAll("nav a[data-tab]").forEach(x => {
    const active = x.dataset.tab === tab;
    x.classList.toggle("active", active);
    if (active) x.setAttribute("aria-current", "page");
    else x.removeAttribute("aria-current");
  });
  document.getElementById("view-watch").querySelectorAll(".pill-item[data-tab]").forEach(x => x.classList.toggle("active", x.dataset.tab === tab));
  document.getElementById("gridView").classList.remove("open");
  document.getElementById("hero").style.display = "";
  document.getElementById("mainContent").style.display = "";
  return token;
}
globalThis.routeTo = function routeTo(tab, force = false){
  const requested = ["home","movie","tv","anime","kids","music","live","list","hubs"].includes(tab) ? tab : "home";
  const gridOpen = document.getElementById("gridView").classList.contains("open");
  if (!force && activeTab === requested && !document.body.classList.contains("prov-mode") && !gridOpen) return;
  const navigationToken = setActiveTab(requested);
  const main = document.getElementById("mainContent");
  main.style.transition = "opacity .15s";
  main.style.opacity = "0.3";
  setTimeout(async () => {
    if (!isCurrentWatchNavigation(navigationToken)) return;
    try {
      if (requested==="movie") await buildMovieTab(navigationToken);
      else if (requested==="tv") await buildTVTab(navigationToken);
      else if (requested==="anime") await buildAnimeTab(navigationToken);
      else if (requested==="kids") await buildKidsTab(navigationToken);
      else if (requested==="music") await buildMusicTab(navigationToken);
      else if (requested==="live") await buildWestLive(navigationToken);
      else if (requested==="hubs") await buildHubsTab(navigationToken);
      else if (requested==="list") await buildListTab(navigationToken);
      else await buildHome(navigationToken);
      if (!isCurrentWatchNavigation(navigationToken)) return;
    } catch {
      if (!isCurrentWatchNavigation(navigationToken)) return;
      main.replaceChildren();
      const error = document.createElement("div");
      error.className = "loader err";
      error.setAttribute("role", "alert");
      error.textContent = "This Watch section could not load. Check your connection or region and try again.";
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "btn btn-ghost";
      retry.textContent = "Retry";
      retry.onclick = () => routeTo(requested, true);
      error.appendChild(retry);
      main.appendChild(error);
    } finally {
      if (!isCurrentWatchNavigation(navigationToken)) return;
      main.style.opacity = "1";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, 60);
}
document.getElementById("view-watch").querySelectorAll("nav a[data-tab]").forEach(a => a.addEventListener("click", event => {
  event.preventDefault();
  if (typeof window.goarShow === "function") {
    if (a.dataset.tab === "home") window.goarShow("watch", true, "home");
    else window.goarShow(a.dataset.tab, true);
  }
  else routeTo(a.dataset.tab);
}));


