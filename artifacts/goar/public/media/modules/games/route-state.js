export const MEDIA_VIEWS = new Set(["home", "watch", "movie", "tv", "live", "music", "games", "anime", "kids", "hubs", "list"]);
export const WATCH_TABS = new Set(["home", "movie", "tv", "anime", "kids", "live", "hubs", "list"]);

export function routeFromSearch(search = ""){
  const params = new URLSearchParams(search);
  const hasExplicitView = params.has("view") || params.has("v");
  const requestedView = params.has("view") ? params.get("view") : params.get("v");
  if (hasExplicitView){
    if (!MEDIA_VIEWS.has(requestedView)) return {view:"home"};
    if (requestedView === "watch"){
      const tab = params.get("tab");
      return {view:"watch", tab:WATCH_TABS.has(tab) ? tab : "movie"};
    }
    return {view:requestedView};
  }
  const legacyTab = params.get("tab");
  return WATCH_TABS.has(legacyTab) ? {view:"watch", tab:legacyTab} : {view:"home"};
}

export function routeFromHistory(state, search = ""){
  if (!state || !MEDIA_VIEWS.has(state.view)) return routeFromSearch(search);
  if (state.view !== "watch") return {view:state.view};
  if (WATCH_TABS.has(state.tab)) return {view:"watch", tab:state.tab};
  const fromUrl = routeFromSearch(search);
  return {view:"watch", tab:fromUrl.view === "watch" ? fromUrl.tab : "movie"};
}

export function mediaRouteUrl(view, tab, currentUrl){
  const url = new URL("./index.html", currentUrl);
  url.searchParams.delete("view");
  url.searchParams.delete("v");
  url.searchParams.delete("tab");
  if (view !== "home") url.searchParams.set("view", view);
  if (view === "watch" && WATCH_TABS.has(tab) && tab !== "movie") url.searchParams.set("tab", tab);
  return url;
}