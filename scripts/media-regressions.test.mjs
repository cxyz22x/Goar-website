import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const workspace = resolve(scriptDir, "..");
const mediaRoot = resolve(workspace, "artifacts/goar/public/media");
const latestRoot = resolve(workspace, "artifacts/goar/public/pages");
const sourceHtml = await readFile(resolve(workspace, "attached_assets/goar_(16)_1790817694377.html"), "utf8");
const readMedia = (path) => readFile(resolve(mediaRoot, path), "utf8");
const readLatest = (path) => readFile(resolve(latestRoot, path), "utf8");

test("media styles cover every maintained surface and control after the requested redesign", async () => {
  const names = ["watch", "music", "shell", "games", "overrides"];
  const files = await Promise.all(names.map((name) => readMedia(`styles/${name}.css`)));
  const required = [
    [".hero", ".rail", ".card"],
    ["#view-music.on", ".sidebar", ".controls"],
    ["#view-home .lead", "#view-home"],
    ["#view-games .ggrid", "#gamePlay", ".game-library-head"],
    ["#app-dock"],
  ];
  for (let index = 0; index < files.length; index++) {
    const css = files[index].replace(/\/\*[\s\S]*?\*\//g, "");
    assert.ok(css.length > 200, `${names[index]} must retain a real stylesheet`);
    for (const selector of required[index]) assert.ok(css.includes(selector), `${names[index]} must style ${selector}`);
    assert.equal((css.match(/\{/g) || []).length, (css.match(/\}/g) || []).length, `${names[index]} stylesheet blocks must balance`);
  }
});

test("music WISP HLS loader is explicitly shared with the music player engine", async () => {
  const catalogSearch = await readMedia("modules/music/services/catalog-search.js");
  const playerEngines = await readMedia("modules/music/services/player-engines.js");
  assert.ok(catalogSearch.includes("export class WispHlsLoader{"), "the music loader must be exported by its owning module");
  assert.ok(playerEngines.includes('import { WispHlsLoader } from "./catalog-search.js";'), "the player engine must import its loader");
  assert.ok(playerEngines.includes("go(WispHlsLoader)"), "the imported loader must be used for WISP playback");
});

test("watch and music own separate HTTP sessions under one coordinated relay", async () => {
  const watchTunnel = await readMedia("modules/watch/services/tunnel.js");
  const musicWisp = await readMedia("modules/music/services/wisp.js");
  assert.ok(watchTunnel.includes('mediaRelay.getSession("watch", window.libcurl)'), "watch must request its own relay session");
  assert.ok(musicWisp.includes('mediaRelay.getSession("music", window.libcurl)'), "music must request its own relay session");
  assert.ok(watchTunnel.includes('mediaRelay.resetSession("watch")'), "watch reset must only release watch's session");
  assert.ok(musicWisp.includes('mediaRelay.resetSession("music")'), "music reset must only release music's session");
  assert.ok(musicWisp.includes("globalThis.music_ensureLibcurl = async function music_ensureLibcurl("), "music's libcurl initializer must survive WISP-module extraction");
  assert.ok(musicWisp.includes("const sharedUrl=mediaRelay.getUrl();"), "music must honor the same active relay URL as watch");
  assert.ok(watchTunnel.includes('import { mediaRelay } from "../../../services/relay.js";'), "watch must use the shared relay owner");
  assert.ok(musicWisp.includes('import { mediaRelay } from "../../../services/relay.js";'), "music must use the shared relay owner");
  assert.ok(!watchTunnel.includes("_httpSession") && !musicWisp.includes("_httpSession"), "service modules must not share a global session variable");
  assert.ok(!watchTunnel.includes("lc.set_websocket(") && !musicWisp.includes("lc.set_websocket("), "relay mutation must go through the shared manager");

  const oldStorage = globalThis.mediaStorage;
  const oldWindow = globalThis.window;
  const oldCustomEvent = globalThis.CustomEvent;
  globalThis.mediaStorage = { getItem: () => "", setItem: () => {} };
  globalThis.window = { dispatchEvent: () => {} };
  if (!globalThis.CustomEvent) globalThis.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init.detail; } };
  try {
    const { mediaRelay } = await import(pathToFileURL(resolve(mediaRoot, "services/relay.js")).href);
    const created = [];
    const configured = [];
    const library = {
      transport: "",
      set_websocket(url) { configured.push(url); },
      HTTPSession: class {
        constructor() { this.closed = false; created.push(this); }
        set_connections() {}
        close() { this.closed = true; }
      },
    };
    mediaRelay.configure(library, "wss://relay-a.invalid/");
    const watchSession = mediaRelay.getSession("watch", library);
    const musicSession = mediaRelay.getSession("music", library);
    assert.notEqual(watchSession, musicSession, "surfaces must receive distinct session instances");
    mediaRelay.resetSession("watch");
    assert.equal(watchSession.closed, true, "watch reset must close watch's session");
    assert.equal(musicSession.closed, false, "watch reset must not close music's session");
    mediaRelay.configure(library, "wss://relay-b.invalid/");
    assert.equal(musicSession.closed, true, "a shared relay change must invalidate other owners' stale sessions");
    const watchOnB = mediaRelay.getSession("watch", library);
    const musicOnB = mediaRelay.getSession("music", library);
    mediaRelay.configure(library, "wss://relay-c.invalid/");
    assert.equal(watchOnB.closed, true, "a shared relay change must invalidate watch's old session");
    assert.equal(musicOnB.closed, true, "a shared relay change must invalidate music's old session");
    assert.deepEqual(configured, ["wss://relay-a.invalid/", "wss://relay-b.invalid/", "wss://relay-c.invalid/"], "both surfaces must configure one shared transport");
    assert.equal(created.length, 4, "each surface must receive its own session after relay changes");
  } finally {
    if (oldStorage === undefined) delete globalThis.mediaStorage; else globalThis.mediaStorage = oldStorage;
    if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow;
    if (oldCustomEvent === undefined) delete globalThis.CustomEvent; else globalThis.CustomEvent = oldCustomEvent;
  }
});

test("music toast, keyboard, selectors, navigation, and hero controls stay inside music", async () => {
  const foundation = await readMedia("modules/music/services/foundation.js");
  const components = await readMedia("modules/music/views/components.js");
  const bootstrap = await readMedia("modules/music/interactions/bootstrap.js");
  const watchSources = await readMedia("modules/watch/views/hero.js");
  const watchTvMode = await readMedia("modules/watch/interactions/tv-mode.js");
  const watchModal = await readMedia("modules/watch/views/detail-modal.js");
  const watchNavigation = await readMedia("modules/watch/interactions/navigation.js");
  const watchTmdb = await readMedia("modules/watch/services/tmdb.js");
  const games = await readMedia("modules/games/controller.js");
  assert.ok(foundation.includes("(c||music_MUSIC_ROOT).querySelector(s)"), "music selectors must default to the music root");
  assert.ok(foundation.includes("(c||music_MUSIC_ROOT).querySelectorAll(s)"), "music multi-selectors must default to the music root");
  assert.ok(foundation.includes('music_musicQueryAll(".toast")') && foundation.includes("music_MUSIC_ROOT.appendChild(t)"), "music toast removal and insertion must remain music-owned");
  assert.ok(!foundation.includes("globalThis.$="), "music must not replace a generic page-wide selector global");
  assert.ok(components.includes('music_musicQueryAll("[data-view]")'), "music navigation state updates must not reach other surfaces");
  assert.ok(bootstrap.includes('if(!document.getElementById("view-music").classList.contains("on")) return;'), "music keyboard shortcuts must be gated on the active view");
  assert.ok(components.includes('id="musicHeroPlay"') && components.includes('music_musicQuery("#musicHeroPlay")'), "music hero markup and binding must share a unique ID");
  assert.ok(watchSources.includes('id="watchHeroPlay"') && watchSources.includes('getElementById("watchHeroPlay")'), "watch hero markup and binding must use a different unique ID");
  assert.ok(!components.includes('id="heroPlay"') && !watchSources.includes('id="heroPlay"'), "neither surface may emit the colliding hero ID");
  assert.ok(watchTvMode.includes('if (!document.getElementById("view-watch").classList.contains("on")) return;'), "TV keyboard controls must not capture keys outside watch");
  assert.ok(watchTvMode.includes('document.getElementById("view-watch").querySelectorAll('), "TV focus traversal must stay inside watch");
  assert.ok(watchModal.includes('if (!document.getElementById("view-watch").classList.contains("on")) return;'), "watch modal shortcuts must not capture keys outside watch");
  assert.ok(watchNavigation.includes('document.getElementById("view-watch").querySelectorAll("nav a[data-tab]")'), "watch navigation updates and handlers must stay inside watch");
  assert.ok(watchTmdb.includes('document.getElementById("view-watch").querySelectorAll(".card-save[data-id'), "watch card state updates must stay inside watch");
  assert.ok(games.includes('e.key === "Escape" && document.getElementById("view-games").classList.contains("on")'), "game Escape handling must stay inside games");
});

test("initial and history routes preserve explicit and legacy Watch tabs", async () => {
  const [{ routeFromSearch, routeFromHistory, mediaRouteUrl }, router] = await Promise.all([
    import(pathToFileURL(resolve(mediaRoot, "modules/games/route-state.js")).href),
    readMedia("modules/games/controller.js"),
  ]);
  assert.deepEqual(routeFromSearch("?view=watch&tab=tv"), {view:"watch", tab:"tv"});
  assert.deepEqual(routeFromSearch("?view=watch&tab=home"), {view:"watch", tab:"home"}, "Watch home must remain a validated Watch subtab");
  assert.deepEqual(routeFromSearch("?tab=tv"), {view:"watch", tab:"tv"}, "a bare legacy tab query must enter Watch");
  assert.deepEqual(routeFromSearch("?v=tv"), {view:"tv"}, "the legacy v view parameter remains supported");
  assert.deepEqual(routeFromSearch("?view=watch&tab=not-a-tab"), {view:"watch", tab:"movie"}, "invalid Watch tabs must fall back safely");
  assert.deepEqual(routeFromSearch("?view=movie&tab=tv"), {view:"movie"}, "an explicit view must take precedence over stale tab values");
  for (const tab of ["movie", "tv", "anime", "kids", "live", "hubs", "list"]) {
    assert.deepEqual(routeFromSearch(`?view=${tab}`), {view:tab}, `the explicit ${tab} view must resolve directly`);
  }
  assert.deepEqual(routeFromHistory({view:"watch", tab:"tv"}, "?view=watch&tab=movie"), {view:"watch", tab:"tv"}, "history state must restore the tab selected at that entry");
  assert.deepEqual(routeFromHistory({view:"watch", tab:"home"}, "?view=watch&tab=tv"), {view:"watch", tab:"home"}, "history state must preserve Watch home separately from media home");
  assert.deepEqual(routeFromHistory({view:"watch"}, "?view=watch&tab=tv"), {view:"watch", tab:"tv"}, "older Watch history entries may restore their tab from the URL");
  assert.deepEqual(routeFromHistory({view:"tv"}, "?tab=anime"), {view:"tv"}, "explicit history views must ignore stale tab parameters");
  const nextTabUrl = mediaRouteUrl("tv", "tv", "https://goarxyz.test/media/index.html?tab=kids&v=watch");
  assert.equal(nextTabUrl.searchParams.get("view"), "tv");
  assert.equal(nextTabUrl.searchParams.has("tab"), false, "pushing an explicit view must remove stale tab parameters");
  const watchUrl = mediaRouteUrl("watch", "tv", "https://goarxyz.test/media/index.html?tab=kids");
  assert.equal(watchUrl.searchParams.get("view"), "watch");
  assert.equal(watchUrl.searchParams.get("tab"), "tv");
  const watchHomeUrl = mediaRouteUrl("watch", "home", "https://goarxyz.test/media/index.html?tab=tv");
  assert.equal(watchHomeUrl.searchParams.get("view"), "watch");
  assert.equal(watchHomeUrl.searchParams.get("tab"), "home", "Watch home must survive direct links and Back navigation");
  assert.deepEqual(routeFromSearch(watchHomeUrl.search), {view:"watch", tab:"home"});
  assert.deepEqual(routeFromSearch("?view=home&tab=tv"), {view:"home"}, "explicit media home must remain distinct from Watch home");
  assert.ok(router.includes("routeFromHistory(ev.state, location.search)"), "popstate must restore route state and the current URL consistently");
  assert.ok(router.includes("routeFromSearch(location.search)"), "initial routing must validate the current URL");
  assert.ok(router.includes("mediaRouteUrl(historyView, watchTab, location.href)"), "navigation history URLs must be centrally canonicalized");
  assert.ok(router.includes('requestedView === "watch" ? "watch"'), "Watch subtabs including home must render inside the Watch section");
  assert.ok(router.includes("function show(name, push, requestedTab)"), "the route owner must honor the Watch worker's validated third argument");
  assert.ok(router.includes("window.goarShow = show"), "the shared Watch worker must be able to request top-level route history");
});

test("games retain the supplied catalogue and expose resilient player controls", async () => {
  const [{ GAMES }, controller, view, { gamePlayer: player }, styles] = await Promise.all([
    import(pathToFileURL(resolve(mediaRoot, "data/game-catalog.js")).href),
    readMedia("modules/games/controller.js"),
    readMedia("modules/templates/games/view.js"),
    import(pathToFileURL(resolve(mediaRoot, "modules/templates/games/player.js")).href),
    readMedia("styles/games.css"),
  ]);
  assert.equal(GAMES.length, 690, "the complete supplied games catalogue must remain available");
  assert.equal(new Set(GAMES.map((game) => game.id)).size, GAMES.length, "game IDs must be unique");
  assert.ok(GAMES.every((game) => {
    try {
      const url = new URL(game.file);
      return url.protocol === "https:" && ["cdn-factory.marketjs.com", "cdn-consumer.marketjs.com"].includes(url.hostname);
    } catch {
      return false;
    }
  }), "game sources must stay on the supplied HTTPS publishers");
  const needsCanonicalSlash = GAMES.filter((game) => {
    const url = new URL(game.file);
    return url.hostname === "cdn-consumer.marketjs.com" && /^\/game\/[^/]+$/.test(url.pathname);
  }).map((game) => game.id);
  assert.deepEqual(needsCanonicalSlash.sort(), ["m-idle-mining-empire", "m-spidey-swing"]);
  assert.ok(controller.includes('url.pathname += "/"'), "consumer game URLs must avoid known redirect-only paths");
  assert.ok(controller.includes("frame.onload") && controller.includes("frame.onerror"), "frame loading and failure must be handled");
  assert.ok(controller.includes("window.clearTimeout(gameTimer)") && controller.includes("publisher may block embedded play"), "stale loads and blocked embeds must have a recovery path");
  assert.ok(controller.includes('getElementById("gameRetry")') && controller.includes('getElementById("gameStandalone")'), "retry and standalone fallback controls must be bound");
  assert.ok(controller.includes("frame.requestFullscreen"), "the player must expose a fullscreen path");
  assert.ok(view.includes("gameSearch") && view.includes("gameCats") && view.includes("Some publishers restrict embedded play"), "catalogue search, filters and external availability disclosure must remain");
  assert.ok(player.includes('role="dialog"') && player.includes('role="status"') && player.includes("allowfullscreen"), "the player shell must expose accessible status and fullscreen");
  assert.ok(player.includes('rel="noopener noreferrer"') && player.includes("sandbox="), "standalone navigation and embedded permissions must be explicit");
  assert.ok(styles.includes(".game-library-head") && styles.includes("#gamePlay .gp-bar") && styles.includes("#view-games .ggrid"), "games view and player styling must remain scoped");
  assert.ok(["#efe9df", "#f4efe6", "#e4ddd2", "Segoe UI"].every((token) => styles.includes(token)), "games styling must follow the actual paper-and-ink light theme tokens");
});

test("all generated relative JavaScript imports resolve", async () => {
  const files = [];
  async function visit(directory) {
    const { readdir } = await import("node:fs/promises");
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = resolve(directory, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (file.endsWith(".js")) files.push(file);
    }
  }
  await visit(mediaRoot);
  const unresolved = [];
  for (const file of files) {
    const code = await readFile(file, "utf8");
    for (const match of code.matchAll(/(?:^|\n)\s*import\s+(?:[^;\n]+?\s+from\s+)?["'](\.{1,2}\/[^"']+)["']/g)) {
      try {
        await access(resolve(dirname(file), match[1]));
      } catch {
        unresolved.push(`${file}: ${match[1]}`);
      }
    }
  }
  assert.deepEqual(unresolved, [], "all generated module boundaries must resolve");
});

test("the latest Watch, Music, Games, Live, and Anime pages stay self-contained under the artifact base", async () => {
  const services = ["watch", "music", "games", "live", "anime"];
  for (const service of services) {
    const html = await readLatest(`${service}/index.html`);
    assert.ok(html.includes(`${service}.css`), `${service} must load its own stylesheet`);
    assert.ok(html.includes(`${service}.js`), `${service} must load its own page logic`);
    assert.ok(html.includes("../../shared/float.css") && html.includes("../../shared/float.js"), `${service} must load the shared menu relative to the artifact base`);
    assert.ok(html.includes('href="../../index.html"'), `${service} must link back to the existing Goar homepage`);
    await access(resolve(latestRoot, service, `${service}.css`));
    await access(resolve(latestRoot, service, `${service}.js`));
  }
  const catalogue = JSON.parse(await readFile(resolve(workspace, "artifacts/goar/public/games.json"), "utf8"));
  assert.ok(Array.isArray(catalogue) && catalogue.length > 0, "Games must have its supplied local catalogue");
  const games = await readLatest("games/games.js");
  assert.ok(games.includes('"../../games.json"'), "Games must fetch its catalogue within the artifact base path");
  const watch = await readLatest("watch/watch.js");
  assert.ok(!watch.includes("serviceWorker"), "the imported pages must not register a root-scoped service worker");
  const floatingMenu = await readFile(resolve(workspace, "artifacts/goar/public/shared/float.js"), "utf8");
  assert.ok(floatingMenu.includes('new URL("workspace/index.html", ROOT)'), "the shared service menu must provide the existing agent");
  assert.ok(floatingMenu.includes('new URL("index.html", ROOT)'), "the shared service menu must link to the existing homepage");
});

test("the existing Goar homepage defaults to dark monochrome without overriding saved theme choice", async () => {
  const [app, theme, tokens, navigation, footer] = await Promise.all([
    readFile(resolve(workspace, "artifacts/goar/src/App.tsx"), "utf8"),
    readFile(resolve(workspace, "artifacts/goar/src/site/preview/data/useTheme.ts"), "utf8"),
    readFile(resolve(workspace, "artifacts/goar/src/site/preview/styles/tokens.css"), "utf8"),
    readFile(resolve(workspace, "artifacts/goar/src/site/components/Navigation.tsx"), "utf8"),
    readFile(resolve(workspace, "artifacts/goar/src/site/components/Footer.tsx"), "utf8"),
  ]);
  assert.ok(app.includes('<Route path="/" component={Home} />'), "the React marketing page must remain at /");
  assert.ok(theme.includes("readStored() ?? 'dark'"), "a fresh visit must default to dark");
  assert.ok(theme.includes("s === 'light' || s === 'dark'"), "an explicit saved theme must be retained");
  assert.ok(tokens.includes('.gp[data-theme="light"]'), "light remains available only as an explicit theme choice");
  for (const page of ["watch", "music", "games", "live", "anime"]) {
    assert.ok(navigation.includes(`pages/${page}/index.html`) || footer.includes(`pages/${page}/index.html`), `${page} must be linked from the Goar site`);
  }
});