import "../services/storage.js";
import { composeMediaService } from "./templates/service.js";

document.body.insertAdjacentHTML("afterbegin", composeMediaService());
const homeKicker = document.querySelector("#view-home .kicker");
if (homeKicker) homeKicker.textContent = "Media";

const mediaRoot = new URL("../../", import.meta.url);
const serviceUrls = {
  overview: new URL("./", mediaRoot).href,
  agent: new URL("agent", mediaRoot).href,
  watch: new URL("media/index.html?view=watch", mediaRoot).href,
  music: new URL("media/index.html?view=music", mediaRoot).href,
  games: new URL("media/index.html?view=games", mediaRoot).href,
};
document.querySelectorAll("#app-shell [data-service]").forEach((link) => {
  const href = serviceUrls[link.dataset.service];
  if (href) link.href = href;
});
// Resolve the legacy music-sidebar overview link for deployments below a base path.
document.querySelectorAll("#view-music .sidebar .logo").forEach((link) => {
  link.href = serviceUrls.overview;
  const marks = link.querySelector(".marks");
  link.replaceChildren(document.createTextNode("Media"), ...(marks ? [marks] : []));
  link.setAttribute("aria-label", "Media overview");
});

const supportedViews = new Set([
  "home", "watch", "movie", "tv", "live", "list", "music", "games",
  "anime", "kids", "hubs",
]);
function setMediaTitle(view) {
  const titles = {
    home: "Overview", watch: "Watch", movie: "Movies", tv: "TV Shows",
    live: "Live TV", list: "My List", music: "Music", games: "Games",
    anime: "Anime", kids: "Kids", hubs: "Apps",
  };
  const name = titles[view] || "Media";
  document.title = name === "Overview" ? "Media — Overview" : `${name} — Media`;
}
function mediaRoute(name, push = false) {
  const asked = supportedViews.has(name) ? name : "home";
  if (typeof window.goarShow === "function" && window.goarShow !== mediaRoute) {
    window.goarShow(asked, push);
    setMediaTitle(asked);
    return;
  }

  const tab = asked === "watch" ? "movie" : asked;
  const innerTab = ["movie", "tv", "live", "list", "anime", "kids", "hubs"].includes(tab);
  const visibleView = innerTab ? "watch" : tab;
  ["home", "watch", "music", "games"].forEach((view) => {
    document.getElementById("view-" + view)?.classList.toggle("on", view === visibleView);
  });
  if (visibleView === "watch") {
    if (typeof window.routeTo === "function") window.routeTo(tab);
  }
  if (push) {
    const url = new URL("media/index.html", mediaRoot);
    if (asked !== "home") url.searchParams.set("view", asked);
    history.pushState({ view: asked }, "", url);
  }
  setMediaTitle(asked);
}
window.goarShow = mediaRoute;

// Own the shell's click delegation so it can still switch to healthy services if
// one feature bundle fails before registering its own listeners.
document.addEventListener("click", (event) => {
  const control = event.target.closest("#app-shell [data-view], #view-home [data-view], #app-dock [data-view]");
  if (!control) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  mediaRoute(control.dataset.view, true);
}, true);
window.addEventListener("popstate", (event) => {
  const view = event.state?.view || requestedView();
  if (window.goarShow === mediaRoute) mediaRoute(view);
  setTimeout(() => setMediaTitle(view), 0);
});
function requestedView() {
  const params = new URLSearchParams(location.search);
  const requested = params.get("view") || params.get("v") || "home";
  return supportedViews.has(requested) ? requested : "home";
}
function requestedWatchTab() {
  const params = new URLSearchParams(location.search);
  const tab = params.get("tab");
  const watchTabs = new Set(["home", "movie", "tv", "anime", "kids", "music", "live", "list", "hubs"]);
  return params.get("view") === "watch" && watchTabs.has(tab) ? tab : null;
}

function showServiceError(service, message, retry) {
  const section = document.getElementById("view-" + service);
  if (!section) return;
  let alert = section.querySelector(".media-boot-alert");
  if (!alert) {
    alert = document.createElement("div");
    alert.className = "media-boot-alert";
    alert.setAttribute("role", "alert");
    alert.setAttribute("aria-live", "assertive");
    section.prepend(alert);
  }
  alert.replaceChildren();
  const copy = document.createElement("span");
  copy.textContent = message;
  const retryButton = document.createElement("button");
  retryButton.type = "button";
  retryButton.textContent = "Retry";
  retryButton.onclick = retry;
  alert.append(copy, retryButton);
}

function clearServiceError(service) {
  document.getElementById("view-" + service)?.querySelector(".media-boot-alert")?.remove();
}

const watchModules = [
  () => import("../data/watch-bridge.js"),
  () => import("./watch/services/tunnel.js"),
  () => import("./watch/interactions/tv-mode.js"),
  () => import("./watch/services/tmdb.js"),
  () => import("./watch/views/cards.js"),
  () => import("./watch/services/video-sources.js"),
  () => import("./watch/views/hero.js"),
  () => import("./watch/views/kids.js"),
  () => import("./watch/views/music-catalogue.js"),
  () => import("./watch/views/home.js"),
  () => import("./watch/services/providers.js"),
  () => import("./watch/views/catalogue-tabs.js"),
  () => import("./watch/views/grid.js"),
  () => import("./watch/views/category-bar.js"),
  () => import("./watch/views/region.js"),
  () => import("./watch/views/live.js"),
  () => import("./watch/interactions/navigation.js"),
  () => import("./watch/views/watchlist.js"),
  () => import("./watch/interactions/search.js"),
  () => import("./watch/views/detail-modal.js"),
  () => import("./watch/interactions/watch-boot.js"),
];
const musicModules = [
  () => import("../data/music-bridge.js"),
  () => import("./music/services/foundation.js"),
  () => import("./music/services/wisp.js"),
  () => import("./music/services/catalog-search.js"),
  () => import("./music/services/player-engines.js"),
  () => import("./music/services/search.js"),
  () => import("./music/services/local-files.js"),
  () => import("./music/views/components.js"),
  () => import("./music/views/pages.js"),
  () => import("./music/interactions/queue.js"),
  () => import("./music/interactions/now-playing.js"),
  () => import("./music/interactions/bootstrap.js"),
];
const gameModules = [() => import("./games/controller.js")];

async function loadModules(modules) {
  for (const load of modules) await load();
}
async function bootService(service, modules) {
  try {
    await loadModules(modules);
    clearServiceError(service);
    return true;
  } catch {
    const name = service[0].toUpperCase() + service.slice(1);
    showServiceError(service, `${name} could not start. Retry the feature or reload the page.`, () => {
      const alert = document.querySelector(`#view-${service} .media-boot-alert`);
      const button = alert?.querySelector("button");
      if (button) {
        button.disabled = true;
        button.textContent = "Retrying…";
      }
      bootService(service, modules);
    });
    return false;
  }
}

const watchReady = await bootService("watch", watchModules);
await bootService("music", musicModules);
const gamesReady = await bootService("games", gameModules);

// A healthy game controller owns normal history routing. This fallback keeps the
// other sections reachable if that feature bundle itself failed to initialize.
if (!gamesReady || typeof window.goarShow !== "function") {
  window.goarShow = mediaRoute;
  if (!gamesReady) mediaRoute(requestedView());
} else if (!watchReady && requestedView() !== "home") {
  // The failing feature already has a visible retry action. Preserve it rather
  // than replacing it with a generic navigation error.
  mediaRoute(requestedView());
}
// The shared games controller recognizes view=watch as the Movies tab. Apply an
// explicit Watch sub-tab afterward so deep links such as ?view=watch&tab=tv
// cannot be replaced by that default.
const deepWatchTab = requestedWatchTab();
if (deepWatchTab && typeof window.routeTo === "function") window.routeTo(deepWatchTab, true);
setMediaTitle(requestedWatchTab() || requestedView());