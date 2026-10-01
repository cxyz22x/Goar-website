import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const workspace = resolve(scriptDir, "..");
const mediaRoot = resolve(workspace, "artifacts/goar/public/media");
const sourceHtml = await readFile(resolve(workspace, "attached_assets/goar_(16)_1790817694377.html"), "utf8");
const readMedia = (path) => readFile(resolve(mediaRoot, path), "utf8");

test("generated CSS preserves every authored line in cascade order", async () => {
  const authoredCss = sourceHtml.match(/<style>([\s\S]*?)<\/style>/i)?.[1];
  assert.ok(authoredCss, "the uploaded page must retain its authored stylesheet");
  const generatedCss = (
    await Promise.all(["watch", "music", "shell", "games", "overrides"].map((name) => readMedia(`styles/${name}.css`)))
  ).join("\n");
  assert.ok(generatedCss.startsWith(authoredCss), "generated CSS must include the full source cascade without gaps or reordering");
  assert.ok(generatedCss.slice(authoredCss.length).includes(".media-service-links"), "only the discreet service-link rules may follow the source CSS");
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

test("initial and history navigation both accept the safe view and legacy v params", async () => {
  const router = await readMedia("modules/games/controller.js");
  assert.ok(router.includes('params.get("view") || params.get("v") || "home"'), "the initial view helper must prioritize view and retain v compatibility");
  assert.ok(router.includes("show((ev.state&&ev.state.view)||requestedInitialView(), false)"), "popstate must use the same validated query helper");
  assert.ok(router.includes("show(requestedInitialView(), false)"), "initial routing must use the validated query helper");
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