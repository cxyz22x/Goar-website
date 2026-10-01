import "../../../services/storage.js";
globalThis.setActiveTab = function setActiveTab(tab){
  activeTab = tab;
  document.getElementById("view-watch").querySelectorAll("nav a[data-tab]").forEach(x => x.classList.toggle("active", x.dataset.tab === tab));
  document.getElementById("view-watch").querySelectorAll(".pill-item[data-tab]").forEach(x => x.classList.toggle("active", x.dataset.tab === tab));
  document.getElementById("gridView").classList.remove("open");
  document.getElementById("hero").style.display = "";
  document.getElementById("mainContent").style.display = "";
}
globalThis.routeTo = function routeTo(tab){
  const gridOpen = document.getElementById("gridView").classList.contains("open");
  if (activeTab === tab && !document.body.classList.contains("prov-mode") && !gridOpen) return;
  setActiveTab(tab);
  const main = document.getElementById("mainContent");
  main.style.transition = "opacity .15s";
  main.style.opacity = "0.3";
  setTimeout(() => {
    if (tab==="movie") buildMovieTab();
    else if (tab==="tv") buildTVTab();
    else if (tab==="anime") buildAnimeTab();
    else if (tab==="kids") buildKidsTab();
    else if (tab==="music") buildMusicTab();
    else if (tab==="live") buildWestLive();
    else if (tab==="hubs") buildHubsTab();
    else if (tab==="list") buildListTab();
    else buildHome();
    main.style.opacity = "1";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 60);
}
document.getElementById("view-watch").querySelectorAll("nav a[data-tab]").forEach(a => a.addEventListener("click", () => routeTo(a.dataset.tab)));


