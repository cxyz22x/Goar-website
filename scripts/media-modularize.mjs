import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const sourcePath = "attached_assets/goar_(16)_1790817694377.html";
// This is the preserved-source importer, not the authority for maintained app modules.
// Refuse to silently overwrite repaired/design-updated modules on a future import.
const outputOption = process.argv.find(argument => argument.startsWith("--output="));
const outputRoot = outputOption?.slice("--output=".length) || "artifacts/goar/public/media";
const maintainedRoot = resolve("artifacts/goar/public/media");
if (resolve(outputRoot) === maintainedRoot) {
  try {
    await access(join(outputRoot, "modules/entry.js"));
    throw new Error("The media app is already imported and maintained. Use --output=/tmp/goar-media-reference to extract a fresh source comparison without overwriting the working app.");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
const original = await readFile(sourcePath, "utf8");
const write = async (relativePath, contents) => {
  const filePath = join(outputRoot, relativePath);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, contents);
};

const style = original.match(/<style>([\s\S]*?)<\/style>/i)?.[1];
const body = original.match(/<body[^>]*>([\s\S]*?)<script type="application\/json" id="goar-games">([\s\S]*?)<\/script>([\s\S]*?)<script\s*>/i);
const scripts = [...original.matchAll(/<script\s*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
if (!style || !body || scripts.length !== 3) throw new Error("The supplied media HTML did not match its expected structure.");

const cssLines = style.split("\n");
const writeCss = async (name, from, to) => write(`styles/${name}.css`, cssLines.slice(from - 1, to).join("\n"));
await Promise.all([
  writeCss("watch", 1, 385),
  writeCss("music", 386, 520),
  writeCss("shell", 521, 557),
  writeCss("games", 558, 578),
  writeCss("overrides", 579, cssLines.length),
]);

const gameJson = body[2].trim();
const games = JSON.parse(gameJson);
if (!Array.isArray(games) || games.length === 0) throw new Error("The supplied game catalog is empty or invalid.");
await write("data/game-catalog.js", `// Original game catalog extracted from the supplied Goar media page.\nexport const GAMES = ${gameJson};\n`);
await write("services/storage.js", `const PREFIX = "goar_media:";
export const mediaStorage = Object.freeze({
  getItem(key) {
    return window.localStorage.getItem(PREFIX + key);
  },
  setItem(key, value) {
    window.localStorage.setItem(PREFIX + key, String(value));
  },
  removeItem(key) {
    window.localStorage.removeItem(PREFIX + key);
  },
});
globalThis.mediaStorage = mediaStorage;
`);
await write("services/relay.js", `const sessions = new Map();
let activeLibrary = null;
let activeUrl = mediaStorage.getItem("goar_wisp_url") || "";

function closeSessions() {
  for (const session of sessions.values()) {
    try {
      if (session && typeof session.close === "function") session.close();
    } catch {}
  }
  sessions.clear();
}

export const mediaRelay = Object.freeze({
  getUrl() {
    return activeUrl;
  },
  configure(library, url) {
    if (!library || typeof library.set_websocket !== "function") {
      throw new Error("The shared relay requires a ready libcurl transport.");
    }
    const nextUrl = String(url || "").trim();
    if (!nextUrl) throw new Error("A shared relay URL is required.");
    if (activeLibrary !== library || activeUrl !== nextUrl) {
      closeSessions();
      if (typeof library.transport === "string" || "transport" in library) library.transport = "wisp";
      library.set_websocket(nextUrl);
      activeLibrary = library;
      activeUrl = nextUrl;
      try {
        mediaStorage.setItem("goar_wisp_url", nextUrl);
      } catch {}
      window.dispatchEvent(new CustomEvent("goar:relay-change", { detail: { url: nextUrl } }));
    }
    return activeUrl;
  },
  getSession(owner, library = activeLibrary) {
    if (!owner || !library || library !== activeLibrary || !activeUrl) return null;
    if (sessions.has(owner)) return sessions.get(owner);
    if (typeof library.HTTPSession !== "function") return null;
    const session = new library.HTTPSession({ enable_cookies: true });
    if (session.set_connections) session.set_connections(30, 20, 6);
    sessions.set(owner, session);
    return session;
  },
  resetSession(owner) {
    const session = sessions.get(owner);
    if (session && typeof session.close === "function") {
      try {
        session.close();
      } finally {
        sessions.delete(owner);
      }
    } else {
      sessions.delete(owner);
    }
  },
});
`);

const watchSource = scripts[0];
const musicSource = scripts[1]
  .replace(/^\s*\(function\s*\(\s*\)\s*\{\s*/, "")
  .replace(/\s*\}\)\s*\(\s*\)\s*;\s*$/, "")
  .replace('const $=(s,c=document)=>c.querySelector(s);', `const MUSIC_ROOT = document.getElementById("view-music");
const $=(s,c)=>s==="#filePick"?document.querySelector(s):(c||MUSIC_ROOT).querySelector(s);`)
  .replace('const $$=(s,c=document)=>[...c.querySelectorAll(s)];', () => 'const $$=(s,c)=>[...(c||MUSIC_ROOT).querySelectorAll(s)];')
  .replace('const $$=', 'const musicQueryAll=')
  .replace('const $=', 'const musicQuery=')
  .replaceAll('$$("#view-music [data-view]")', () => 'musicQueryAll("[data-view]")')
  .replaceAll('$("#heroPlay")', 'musicQuery("#musicHeroPlay")')
  .replaceAll("$$(", "musicQueryAll(")
  .replaceAll("$(", "musicQuery(")
  .replace('document.body.appendChild(t);', 'MUSIC_ROOT.appendChild(t);')
  .replaceAll('id="heroPlay"', 'id="musicHeroPlay"')
  .replace('document.addEventListener("keydown", e=>{\n  if(e.target.matches("input,textarea")) return;', 'document.addEventListener("keydown", e=>{\n  if(!document.getElementById("view-music").classList.contains("on")) return;\n  if(e.target.matches("input,textarea")) return;');

function extractBlocks(source, blocks) {
  const taken = [];
  let remainder = source;
  for (const [start, end] of blocks) {
    const startAt = remainder.indexOf(start);
    if (startAt < 0) throw new Error(`Could not locate authored media section: ${start}`);
    const endAt = remainder.indexOf(end, startAt);
    if (endAt < 0) throw new Error(`Could not locate section boundary: ${end}`);
    taken.push(remainder.slice(startAt, endAt));
    remainder = remainder.slice(0, startAt) + remainder.slice(endAt);
  }
  return { remainder, blocks: taken };
}

const watchDataBlocks = [
  ["const PROVIDER_CONTENT =", "async function provDiscover("],
  ["const PROVIDER_DESIGNS =", "function getProviderDesign("],
  ["const DISNEY_BRANDS =", "async function kidsDiscover("],
  ["const MUSIC_GENRE_ID =", "async function musicDiscover("],
  ["const FEATURED_PROVIDERS =", "async function fetchAllProviders("],
  ["const ANIME_SUBGENRES =", "async function animeDiscover("],
  ["const PREDEFINED =", "function buildCatBar("],
  ["const REGIONS =", "function buildRegionSelect("],
  ["const WEST_LIVE =", "function buildWestLive("],
];
const { remainder: watchRuntime, blocks: watchData } = extractBlocks(watchSource, watchDataBlocks);

const musicCatalogEnd = musicSource.indexOf('const STORE="gxm5_";');
if (musicCatalogEnd < 0) throw new Error("Could not locate the original music catalog boundary.");
const musicCatalogSource = musicSource.slice(0, musicCatalogEnd);
const musicRuntime = musicSource.slice(musicCatalogEnd);

const musicNameCollisions = [
  "LIBCURL_SOURCES", "DEFAULT_WISP_URLS", "normalizeWispUrl", "loadSavedWispList",
  "WISP_URL", "tunnelState", "_libcurlReady", "getLibcurl", "injectLibcurlScript",
  "waitLibcurlObject", "waitLibcurlWasm", "applyWispUrl", "probeTunnel",
  "getHttpSession", "resetHttpSession", "ensureLibcurl", "wispFetch", "toast",
  "resolveSources", "openPlayer", "closePlayer", "_httpSession",
  "musicQuery", "musicQueryAll", "MUSIC_ROOT",
];

function renameOutsideStringsAndComments(code, names) {
  if (!names.length) return code;
  const rename = new Map(names.map((name) => [name, `music_${name}`]));
  let output = "";
  let i = 0;
  let state = "code";
  while (i < code.length) {
    const char = code[i];
    const next = code[i + 1];
    if (state === "code") {
      if (char === "'" || char === '"') {
        state = char;
        output += char;
        i++;
      } else if (char === "`") {
        state = "template";
        output += char;
        i++;
      } else if (char === "/" && next === "/") {
        state = "line-comment";
        output += "//";
        i += 2;
      } else if (char === "/" && next === "*") {
        state = "block-comment";
        output += "/*";
        i += 2;
      } else if (/[A-Za-z_$]/.test(char)) {
        let end = i + 1;
        while (end < code.length && /[\w$]/.test(code[end])) end++;
        const identifier = code.slice(i, end);
        output += rename.get(identifier) || identifier;
        i = end;
      } else {
        output += char;
        i++;
      }
    } else if (state === "'" || state === '"') {
      output += char;
      if (char === "\\") {
        output += code[i + 1] || "";
        i += 2;
      } else {
        if (char === state) state = "code";
        i++;
      }
    } else if (state === "template") {
      output += char;
      if (char === "\\") {
        output += code[i + 1] || "";
        i += 2;
      } else {
        if (char === "`") state = "code";
        i++;
      }
    } else if (state === "line-comment") {
      output += char;
      if (char === "\n") state = "code";
      i++;
    } else {
      output += char;
      if (char === "*" && next === "/") {
        output += "/";
        i += 2;
        state = "code";
      } else {
        i++;
      }
    }
  }
  return output;
}

function splitTopLevel(text, delimiter) {
  const parts = [];
  let start = 0;
  let round = 0, square = 0, curly = 0;
  let quote = "";
  let lineComment = false, blockComment = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i], next = text[i + 1];
    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === "*" && next === "/") { blockComment = false; i++; }
      continue;
    }
    if (quote) {
      if (char === "\\") { i++; continue; }
      if (char === quote) quote = "";
      continue;
    }
    if (char === "/" && next === "/") { lineComment = true; i++; continue; }
    if (char === "/" && next === "*") { blockComment = true; i++; continue; }
    if (char === "'" || char === '"' || char === "`") { quote = char; continue; }
    if (char === "(") round++;
    else if (char === ")") round--;
    else if (char === "[") square++;
    else if (char === "]") square--;
    else if (char === "{") curly++;
    else if (char === "}") curly--;
    else if (char === delimiter && round === 0 && square === 0 && curly === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

function topLevelNames(code) {
  const names = new Set();
  for (const line of code.split("\n")) {
    const functionMatch = line.match(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (functionMatch) names.add(functionMatch[1]);
    const declaration = line.match(/^(?:const|let|var)\s+([\s\S]*)$/);
    if (!declaration) continue;
    const statement = splitTopLevel(declaration[1], ";")[0];
    for (const part of splitTopLevel(statement, ",")) {
      const name = part.match(/^\s*([A-Za-z_$][\w$]*)\s*(?:=|$)/)?.[1];
      if (name) names.add(name);
    }
  }
  return [...names];
}

function transformGlobals(source, { rename = [], removePwa = false } = {}) {
  let code = renameOutsideStringsAndComments(source, rename);
  if (removePwa) {
    const pwaStart = code.indexOf("/* ================= PWA ================= */");
    const tvMode = code.indexOf("function isTvDevice(){", pwaStart);
    if (pwaStart < 0 || tvMode < 0) throw new Error("Could not isolate the source's optional PWA registration block.");
    code = code.slice(0, pwaStart) + code.slice(tvMode);
  }
  code = code.replace(/\blocalStorage\b/g, "mediaStorage");
  const declarations = new Map();
  for (const name of topLevelNames(code)) declarations.set(name, rename.includes(name) ? `music_${name}` : name);

  code = code.replace(/^(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm, (match, asyncPrefix = "", name) => {
    const target = declarations.get(name) || name;
    return `globalThis.${target} = ${asyncPrefix}function ${target}(`;
  });
  code = code.replace(/^(const|let|var)\s+([\s\S]*?);(?=\s*(?:\r?\n|$))/gm, (whole, _kind, body) => {
    const pieces = splitTopLevel(body, ",");
    const assignments = pieces.map((piece) => {
      const match = piece.match(/^\s*([A-Za-z_$][\w$]*)\s*([\s\S]*)$/);
      if (!match) throw new Error("Unsupported top-level variable declaration in supplied source.");
      const originalName = match[1];
      const target = declarations.get(originalName) || originalName;
      const initializer = match[2].trim();
      return `globalThis.${target}${initializer || " = undefined"}`;
    });
    return assignments.join(",") + ";";
  });
  return { code, declarations };
}

function globalsModule(code, options = {}) {
  const { code: transformed } = transformGlobals(code, options);
  const relayImport = options.relay ? 'import { mediaRelay } from "../../../services/relay.js";\n' : "";
  return `import "../../../services/storage.js";\n${relayImport}${transformed}\n`;
}

function watchCuts(source) {
  const pwaStart = source.indexOf("/* ================= PWA ================= */");
  const tvMode = source.indexOf("function isTvDevice(){", pwaStart);
  if (pwaStart < 0 || tvMode < 0) throw new Error("Could not isolate the source's optional PWA registration block.");
  source = source.slice(0, pwaStart) + source.slice(tvMode);
  source = source.replaceAll('id="heroPlay"', 'id="watchHeroPlay"')
    .replaceAll('document.getElementById("heroPlay")', 'document.getElementById("watchHeroPlay")')
    .replace('document.addEventListener("keydown", (e) => {\n    const keys', 'document.addEventListener("keydown", (e) => {\n    if (!document.getElementById("view-watch").classList.contains("on")) return;\n    const keys')
    .replace('document.addEventListener("keydown", e => {\n  if (e.key === "Escape"){', 'document.addEventListener("keydown", e => {\n  if (!document.getElementById("view-watch").classList.contains("on")) return;\n  if (e.key === "Escape"){')
    .replace('[...document.querySelectorAll(".card, .top10-item, .provider-app, .btn, nav a, .cat-chip, .see-all, .p-close, .player-picker select")]', '[...document.getElementById("view-watch").querySelectorAll(".card, .top10-item, .provider-app, .btn, nav a, .cat-chip, .see-all, .p-close, .player-picker select")]')
    .replaceAll('document.querySelectorAll("nav a[data-tab]")', 'document.getElementById("view-watch").querySelectorAll("nav a[data-tab]")')
    .replaceAll('document.querySelectorAll(".pill-item[data-tab]")', 'document.getElementById("view-watch").querySelectorAll(".pill-item[data-tab]")')
    .replaceAll('document.querySelectorAll(".card-save[data-id', 'document.getElementById("view-watch").querySelectorAll(".card-save[data-id')
    .replace('const first = document.getElementById("watchHeroPlay") || tvFocusables()[0];', 'if (!document.getElementById("view-watch").classList.contains("on")) return;\n    const first = document.getElementById("watchHeroPlay") || tvFocusables()[0];');
  source = source.replace(`  let res;
  try { res = await fetch(url); }
  catch(e){ throw new Error("NETWORK: " + e.message); }`, `  let res;
  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt++){
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      res = await fetch(url, { signal: controller.signal });
      if (res.ok || (res.status < 500 && res.status !== 429) || attempt === 1) break;
      lastError = new Error("TMDB HTTP " + res.status);
    } catch(e){
      lastError = e;
      if (attempt === 1) throw new Error("NETWORK: " + (e.name === "AbortError" ? "TMDB request timed out" : e.message));
    } finally {
      clearTimeout(timeout);
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (!res) throw new Error("NETWORK: " + (lastError && lastError.message || "TMDB unavailable"));`);
  const markers = [
    ["services/tunnel.js", "function isTvDevice(){"],
    ["interactions/tv-mode.js", "async function tmdb("],
    ["services/tmdb.js", "function card(item,"],
    ["views/cards.js", "let playerToken ="],
    ["services/video-sources.js", "async function buildHero("],
    ["views/hero.js", "async function kidsDiscover("],
    ["views/kids.js", "async function musicDiscover("],
    ["views/music-catalogue.js", "async function buildHome("],
    ["views/home.js", "async function fetchAllProviders("],
    ["services/providers.js", "async function buildMovieTab("],
    ["views/catalogue-tabs.js", "function openGrid("],
    ["views/grid.js", "function buildCatBar("],
    ["views/category-bar.js", "function buildRegionSelect("],
    ["views/region.js", "function buildWestLive("],
    ["views/live.js", "function setActiveTab("],
    ["interactions/navigation.js", "async function buildListTab("],
    ["views/watchlist.js", "let searchTimer;"],
    ["interactions/search.js", "const modalBackdrop ="],
    ["views/detail-modal.js", "/* ================= BOOT ================= */"],
  ];
  const modules = [];
  let offset = 0;
  for (const [file, marker] of markers) {
    const next = source.indexOf(marker, offset);
    if (next < 0) throw new Error(`Could not locate authored watch component boundary: ${marker}`);
    modules.push([file, source.slice(offset, next)]);
    offset = next;
  }
  modules.push(["interactions/watch-boot.js", source.slice(offset)]);
  return modules;
}

const watchDataNames = [
  "PROVIDER_CONTENT", "DEFAULT_PROVIDER_CONTENT", "PROVIDER_DESIGNS", "DISNEY_BRANDS",
  "KIDS_GENRES", "MUSIC_GENRE_ID", "FEATURED_PROVIDERS", "ANIME_SUBGENRES",
  "PREDEFINED", "REGIONS", "WEST_LIVE",
];
const watchDataCode = transformGlobals(watchData.join("\n"), {}).code;
await write("data/watch-catalogs.js", `${watchDataCode}\nexport const watchCatalogs = { ${watchDataNames.join(", ")} };\n`);
await write("data/watch-bridge.js", `import { watchCatalogs } from "./watch-catalogs.js";\nObject.assign(globalThis, watchCatalogs);\n`);

for (const [file, code] of watchCuts(watchRuntime)) {
  const path = `modules/watch/${file}`;
  if (file === "services/tunnel.js") {
    let watchTunnel = code
      .replace("let _httpSession = null;\n", "")
      .replace(/function applyWispUrl\(lc, url\)\{[\s\S]*?\n\}/, `function applyWispUrl(lc, url){
  const u = normalizeWispUrl(url);
  if (!u) throw new Error("WISP URL required and must end with /");
  mediaRelay.configure(lc, u);
  WISP_URL = u;
  tunnelState.url = u;
}`)
      .replace(/function getHttpSession\(\)\{[\s\S]*?\n\}/, `function getHttpSession(){
  return mediaRelay.getSession("watch", window.libcurl);
}`)
      .replace(/function resetHttpSession\(\)\{[\s\S]*?\n\}/, `function resetHttpSession(){
  mediaRelay.resetSession("watch");
}`)
      .replace("function setTunnelChip(status, label){", `window.addEventListener("goar:relay-change", (event) => {
  const url = event.detail && event.detail.url;
  if (!url) return;
  WISP_URL = url;
  tunnelState.url = url;
  const select = document.getElementById("wispSelect");
  if (select && [...select.options].some((option) => option.value === url)) select.value = url;
});

function setTunnelChip(status, label){`);
    if (watchTunnel.includes("_httpSession") || watchTunnel.includes("lc.set_websocket(") || watchTunnel.includes('lc.transport = "wisp"')) {
      throw new Error("Watch relay ownership was not fully moved to the shared relay manager.");
    }
    await write(path, globalsModule(watchTunnel, { relay: true }));
  } else {
    await write(path, globalsModule(code));
  }
}

const musicDataNames = topLevelNames(musicCatalogSource);
const musicDataTransformed = transformGlobals(musicCatalogSource, { rename: musicNameCollisions }).code;
await write("data/music-catalogs.js", `${musicDataTransformed}\nexport const musicCatalogs = { ${musicDataNames.map((name) => musicNameCollisions.includes(name) ? `music_${name}` : name).join(", ")} };\n`);
await write("data/music-bridge.js", `import { musicCatalogs } from "./music-catalogs.js";\nObject.assign(globalThis, musicCatalogs);\n`);

function splitMusic(source) {
  const markers = [
    ["services/foundation.js", "function parseVideoId("],
    ["services/wisp.js", "async function fetchAny("],
    ["services/catalog-search.js", "function destroyEngine("],
    ["services/player-engines.js", "async function searchSongs("],
    ["services/search.js", "const IDB_NAME="],
    ["services/local-files.js", "function paintNow("],
    ["views/components.js", "function viewLibrary("],
    ["views/pages.js", "function addSong("],
    ["interactions/queue.js", "function openPlayer("],
    ["interactions/now-playing.js", "function goView("],
  ];
  const output = [];
  let offset = 0;
  for (const [file, marker] of markers) {
    const next = source.indexOf(marker, offset);
    if (next < 0) throw new Error(`Could not locate authored music component boundary: ${marker}`);
    output.push([file, source.slice(offset, next)]);
    offset = next;
  }
  output.push(["interactions/bootstrap.js", source.slice(offset)]);
  return output;
}
for (const [file, sourceCode] of splitMusic(musicRuntime)) {
  let code = sourceCode;
  if (file === "services/wisp.js") {
    code = code
      .replace("let _libcurlReady=null, _httpSession=null;", "let _libcurlReady=null;")
      .replace("function loadSavedWispList(){\n  const extra=[];", `function loadSavedWispList(){
  const extra=[];
  const sharedUrl = mediaRelay.getUrl();
  if (sharedUrl) extra.push(normalizeWispUrl(sharedUrl));`)
      .replace(/function applyWispUrl\(lc,url\)\{[\s\S]*?\n\}/, `function applyWispUrl(lc,url){
  const u=normalizeWispUrl(url);
  if(!u) throw new Error("WISP URL required");
  mediaRelay.configure(lc,u);
  WISP_URL=u;
  tunnelState.url=u;
}`)
      .replace(/function getHttpSession\(\)\{[\s\S]*?\n\}/, `function getHttpSession(){
  return mediaRelay.getSession("music", window.libcurl);
}`)
      .replace("function resetHttpSession(){ if(_httpSession&&_httpSession.close){ try{_httpSession.close();}catch{} } _httpSession=null; }", `function resetHttpSession(){
  mediaRelay.resetSession("music");
}`)
      .replace("const urls=loadSavedWispList();", `const sharedUrl=mediaRelay.getUrl();
    const savedUrls=loadSavedWispList();
    const urls=sharedUrl?[sharedUrl,...savedUrls.filter(url=>url!==sharedUrl)]:savedUrls;`);
    if (code.includes("_httpSession") || code.includes("lc.set_websocket(") || code.includes('lc.transport="wisp"')) {
      throw new Error("Music relay ownership was not fully moved to the shared relay manager.");
    }
    if (!code.includes("async function ensureLibcurl(")) {
      throw new Error("Could not retain music's libcurl initializer while separating its relay session.");
    }
  }
  const path = `modules/music/${file}`;
  let transformed = transformGlobals(code, { rename: musicNameCollisions }).code
    .replaceAll('goarxyz-music', 'goarxyz-media-music');
  if (file === "services/catalog-search.js") {
    const loaderPattern = /(^|\n)class WispHlsLoader\{/;
    if (!loaderPattern.test(transformed)) throw new Error("Could not locate music's WISP HLS loader for explicit export.");
    transformed = transformed.replace(loaderPattern, "$1export class WispHlsLoader{");
  }
  const loaderImport = file === "services/player-engines.js" ? 'import { WispHlsLoader } from "./catalog-search.js";\n' : "";
  await write(path, `import "../../../services/storage.js";\n${file === "services/wisp.js" ? 'import { mediaRelay } from "../../../services/relay.js";\n' : ""}${loaderImport}${transformed}\n`);
}

const routerCode = scripts[2]
  .replace(/^\s*\(function\s*\(\s*\)\s*\{\s*/, "")
  .replace(/\s*\}\)\s*\(\s*\)\s*;\s*$/, "");
const gameLoadCode = `
import { GAMES } from "../../data/game-catalog.js";
${routerCode
  .replace('const GAMES = JSON.parse(document.getElementById("goar-games").textContent);', "")
  .replace('document.addEventListener("keydown", function(e){ if (e.key === "Escape") closeGame(); });', 'document.addEventListener("keydown", function(e){ if (e.key === "Escape" && document.getElementById("view-games").classList.contains("on")) closeGame(); });')}
`;
const normalizedRouter = gameLoadCode
  .replace('const url = asked==="home" ? "./" : "./?v="+asked;\n      history.pushState({view:asked}, "", url);', `const url = new URL("./index.html", location.href);
      if (asked !== "home") url.searchParams.set("view", asked);
      history.pushState({view:asked}, "", url);`)
  .replace('if(name==="watch") name="movie";', 'if(name==="watch") name="movie";')
  .replace(/new URLSearchParams\(location\.search\)\.get\("v"\)\s*\|\|\s*"home"/g, "requestedInitialView()");
const safeRouter = `const MEDIA_VIEWS = new Set(["home", "watch", "movie", "tv", "live", "music", "games", "anime", "kids", "hubs", "list"]);\nfunction requestedInitialView(){\n  const params = new URLSearchParams(location.search);\n  const requested = params.get("view") || params.get("v") || "home";\n  return MEDIA_VIEWS.has(requested) ? requested : "home";\n}\n${normalizedRouter}`;
await write("modules/games/controller.js", safeRouter);

function takeElement(markup, openingTag) {
  const start = markup.indexOf(openingTag);
  if (start < 0) throw new Error(`Could not locate authored DOM component: ${openingTag}`);
  const openEnd = markup.indexOf(">", start);
  const tagName = openingTag.match(/^<([A-Za-z][\w-]*)/)?.[1];
  if (!tagName || openEnd < 0) throw new Error(`Invalid DOM component boundary: ${openingTag}`);
  if (["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"].includes(tagName)) {
    return { html: markup.slice(start, openEnd + 1), remaining: markup.slice(0, start) + markup.slice(openEnd + 1) };
  }
  const tagMatcher = new RegExp(`<\\/?${tagName}\\b[^>]*>`, "gi");
  tagMatcher.lastIndex = start;
  let depth = 0, end = -1, match;
  while ((match = tagMatcher.exec(markup))) {
    if (match[0][1] === "/") depth--;
    else if (!/\/\s*>$/.test(match[0])) depth++;
    if (depth === 0) { end = tagMatcher.lastIndex; break; }
  }
  if (end < 0) throw new Error(`Could not close authored DOM component: ${openingTag}`);
  return { html: markup.slice(start, end), remaining: markup.slice(0, start) + markup.slice(end) };
}

function moduleValue(name, value) {
  return `export const ${name} = ${JSON.stringify(value)};\n`;
}

function composeExpression(template, replacements) {
  return template.split(/(\$\{[A-Za-z_$][\w$]*\})/g)
    .map((part) => {
      const name = part.match(/^\$\{([A-Za-z_$][\w$]*)\}$/)?.[1];
      return name && replacements.includes(name) ? name : JSON.stringify(part);
    })
    .join(" + ");
}

async function templateElement(markup, openingTag, name, path) {
  const element = takeElement(markup, openingTag);
  await write(path, moduleValue(name, element.html));
  return element;
}

let remainingMarkup = (body[1] + body[3]).trim();
const shellHeader = await templateElement(remainingMarkup, '<header id="app-shell">', "shellHeader", "modules/templates/shell/header.js");
remainingMarkup = shellHeader.remaining;
const homeView = await templateElement(remainingMarkup, '<section id="view-home">', "homeView", "modules/templates/home/view.js");
remainingMarkup = homeView.remaining;
const watchViewElement = takeElement(remainingMarkup, '<section id="view-watch">');
remainingMarkup = watchViewElement.remaining;
const musicViewElement = takeElement(remainingMarkup, '<section id="view-music">');
remainingMarkup = musicViewElement.remaining;
const gamesViewElement = await templateElement(remainingMarkup, '<section id="view-games">', "gamesView", "modules/templates/games/view.js");
remainingMarkup = gamesViewElement.remaining;
const filePicker = await templateElement(remainingMarkup, '<input id="filePick"', "localFileInput", "modules/templates/music/file-input.js");
remainingMarkup = filePicker.remaining;
const gamePlayer = await templateElement(remainingMarkup, '<div id="gamePlay"', "gamePlayer", "modules/templates/games/player.js");
remainingMarkup = gamePlayer.remaining;
const appDock = await templateElement(remainingMarkup, '<nav id="app-dock">', "appDock", "modules/templates/shell/app-dock.js");
remainingMarkup = appDock.remaining;
if (remainingMarkup.trim()) {
  const tags = [...remainingMarkup.matchAll(/<\/?([A-Za-z][\w-]*)\b/g)].map((match) => match[1]);
  throw new Error(`Unassigned media markup remained (${remainingMarkup.trim().length} characters; tags: ${tags.join(", ")}).`);
}

let watchMarkup = watchViewElement.html;
const watchHeader = takeElement(watchMarkup, "<header>");
watchMarkup = watchHeader.remaining.replace('<section id="view-watch">', "").replace(/<\/section>\s*$/, "");
let watchHeaderMarkup = watchHeader.html;
const watchNavigation = takeElement(watchHeaderMarkup, "<nav>");
watchHeaderMarkup = watchHeaderMarkup.replace(watchNavigation.html, "${watchNavigation}");
await write("modules/templates/watch/navigation.js", moduleValue("watchNavigation", watchNavigation.html));
const watchSearch = takeElement(watchHeaderMarkup, '<div class="header-tools">');
const watchSearchInner = watchSearch.html
  .replace(/^<div class="header-tools">/, "")
  .replace(/<\/div>$/, "");
watchHeaderMarkup = watchHeaderMarkup.replace(watchSearch.html, '<div class="header-tools">${watchSearch}</div>');
await write("modules/templates/watch/search.js", moduleValue("watchSearch", watchSearchInner));
await write("modules/templates/watch/header.js", `import { watchNavigation } from "./navigation.js";
import { watchSearch } from "./search.js";
export const watchHeader = ${composeExpression(watchHeaderMarkup, ["watchNavigation", "watchSearch"])};
`);
const watchParts = [
  ["<div class=\"cat-bar\" id=\"catBar\">", "watchCategoryBar", "modules/templates/watch/category-bar.js"],
  ["<div id=\"hero\" class=\"hero\">", "watchHero", "modules/templates/watch/hero.js"],
  ["<div id=\"mainContent\">", "watchCatalogueMount", "modules/templates/watch/catalogue.js"],
  ["<div class=\"grid-view\" id=\"gridView\">", "watchGrid", "modules/templates/watch/grid.js"],
  ["<footer>", "watchFooter", "modules/templates/watch/footer.js"],
  ["<div class=\"modal-backdrop\" id=\"modalBackdrop\">", "detailModal", "modules/templates/watch/detail-modal.js"],
  ["<div class=\"player-overlay\" id=\"playerOverlay\">", "videoPlayer", "modules/templates/watch/video-player.js"],
];
const extractedWatch = {};
for (const [openingTag, exportName, path] of watchParts) {
  const component = takeElement(watchMarkup, openingTag);
  watchMarkup = component.remaining;
  extractedWatch[exportName] = component.html;
  await write(path, moduleValue(exportName, component.html));
}
const watchStatus = takeElement(watchMarkup, '<div id="keyBanner">');
watchMarkup = watchStatus.remaining;
const watchToast = takeElement(watchMarkup, '<div class="toast" id="toast">');
watchMarkup = watchToast.remaining;
if (watchMarkup.trim()) {
  const tags = [...watchMarkup.matchAll(/<\/?([A-Za-z][\w-]*)\b/g)].map((match) => match[1]);
  throw new Error(`Unassigned watch-view markup remained (${watchMarkup.trim().length} characters; tags: ${tags.join(", ")}).`);
}
await write("modules/templates/watch/view.js", `import { watchHeader } from "./header.js";
import { watchCategoryBar, watchHero, watchCatalogueMount, watchGrid, watchFooter, detailModal, videoPlayer } from "./components.js";
export const watchView = ${JSON.stringify(`<section id="view-watch">${watchStatus.html}${watchToast.html}`)} + watchHeader + watchCategoryBar + watchHero + watchCatalogueMount + watchGrid + watchFooter + detailModal + videoPlayer + "</section>";
`);
await write("modules/templates/watch/components.js", `export { watchCategoryBar } from "./category-bar.js";
export { watchHero } from "./hero.js";
export { watchCatalogueMount } from "./catalogue.js";
export { watchGrid } from "./grid.js";
export { watchFooter } from "./footer.js";
export { detailModal } from "./detail-modal.js";
export { videoPlayer } from "./video-player.js";
`);

let musicMarkup = musicViewElement.html;
const musicParts = [
  ["<aside class=\"sidebar\">", "musicSidebar", "modules/templates/music/sidebar.js"],
  ["<main class=\"stage\" id=\"stage\">", "musicStage", "modules/templates/music/stage.js"],
  ['<footer class="dock" id="dock">', "musicTransport", "modules/templates/music/transport.js"],
  ['<nav class="mnav">', "musicMobileNav", "modules/templates/music/mobile-nav.js"],
  ['<section class="np" id="nowPlaying"', "nowPlaying", "modules/templates/music/now-playing.js"],
  ['<video id="player"', "musicVideoElement", "modules/templates/music/video-element.js"],
  ['<div id="ytHost"', "musicYoutubeHost", "modules/templates/music/youtube-host.js"],
];
const musicComponents = {};
for (const [openingTag, exportName, path] of musicParts) {
  const component = takeElement(musicMarkup, openingTag);
  musicMarkup = component.remaining;
  musicComponents[exportName] = exportName === "musicSidebar" ? component.html.replace('href="./goar.html"', 'href="/"') : component.html;
  await write(path, moduleValue(exportName, musicComponents[exportName]));
}
if (musicMarkup.replace('<section id="view-music">', "").replace("</section>", "").trim()) {
  throw new Error("Could not fully extract the music-view component markup.");
}
await write("modules/templates/music/view.js", `import { musicSidebar, musicStage, musicTransport, musicMobileNav, nowPlaying, musicVideoElement, musicYoutubeHost } from "./components.js";
export const musicView = "<section id=\\"view-music\\">" + musicSidebar + musicStage + musicTransport + musicMobileNav + nowPlaying + musicVideoElement + musicYoutubeHost + "</section>";
`);
await write("modules/templates/music/components.js", `export { musicSidebar } from "./sidebar.js";
export { musicStage } from "./stage.js";
export { musicTransport } from "./transport.js";
export { musicMobileNav } from "./mobile-nav.js";
export { nowPlaying } from "./now-playing.js";
export { musicVideoElement } from "./video-element.js";
export { musicYoutubeHost } from "./youtube-host.js";
`);

const shellHeaderWithLinks = shellHeader.html.replace("</header>", `  <nav class="media-service-links" aria-label="Goar links">
    <a href="/">Goar</a>
    <a href="/connections">Connections</a>
  </nav>
</header>`);
await write("modules/templates/shell/header.js", moduleValue("shellHeader", shellHeaderWithLinks));
const homeTiles = takeElement(homeView.html, '<div class="home-tiles">');
await write("modules/templates/home/tiles.js", moduleValue("homeTiles", homeTiles.html));
await write("modules/templates/home/view.js", `import { homeTiles } from "./tiles.js";
export const homeView = ${composeExpression(homeView.html.replace(homeTiles.html, "${homeTiles}"), ["homeTiles"])};
`);
await write("modules/templates/games/view.js", moduleValue("gamesView", gamesViewElement.html));
await write("modules/templates/games/player.js", moduleValue("gamePlayer", gamePlayer.html));
await write("modules/templates/shell/app-dock.js", moduleValue("appDock", appDock.html));
await write("modules/templates/service.js", `import { shellHeader } from "./shell/header.js";
import { homeView } from "./home/view.js";
import { watchView } from "./watch/view.js";
import { musicView } from "./music/view.js";
import { gamesView } from "./games/view.js";
import { localFileInput } from "./music/file-input.js";
import { gamePlayer } from "./games/player.js";
import { appDock } from "./shell/app-dock.js";
export function composeMediaService() {
  return shellHeader + homeView + watchView + musicView + gamesView + localFileInput + gamePlayer + appDock;
}
`);
await write("modules/entry.js", `import "../services/storage.js";
import { composeMediaService } from "./templates/service.js";

document.body.insertAdjacentHTML("afterbegin", composeMediaService());
await import("../data/watch-bridge.js");
await import("../data/music-bridge.js");
const services = [
${watchCuts(watchRuntime).map(([file]) => `  () => import("./watch/${file}"),`).join("\n")}
${splitMusic(musicRuntime).map(([file]) => `  () => import("./music/${file}"),`).join("\n")}
  () => import("./games/controller.js"),
];
for (const load of services) await load();
`);

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>goarxyz</title>
  <meta name="theme-color" content="#0a0a0d">
  <meta name="application-name" content="goarxyz">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <link rel="manifest" href="./manifest.webmanifest">
  <link rel="icon" href="./icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="./icon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="./styles/watch.css">
  <link rel="stylesheet" href="./styles/music.css">
  <link rel="stylesheet" href="./styles/shell.css">
  <link rel="stylesheet" href="./styles/games.css">
  <link rel="stylesheet" href="./styles/overrides.css">
  <script src="https://cdn.jsdelivr.net/npm/libcurl.js@0.7.4/libcurl_full.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js"></script>
</head>
<body class="app-root">
<script type="module" src="./modules/entry.js"></script>
</body>
</html>
`;
await write("index.html", html);
await write("manifest.webmanifest", JSON.stringify({
  id: "./index.html",
  name: "goarxyz",
  short_name: "goarxyz",
  description: "Movies, TV, anime, kids and music",
  start_url: "./index.html?view=home",
  scope: "./",
  display: "standalone",
  display_override: ["fullscreen", "standalone", "minimal-ui"],
  orientation: "any",
  background_color: "#0a0a0d",
  theme_color: "#0a0a0d",
  categories: ["entertainment", "video"],
  icons: [{ src: "./icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
}, null, 2) + "\n");
await write("icon.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="34" fill="#0a0a0d"/><text x="96" y="132" text-anchor="middle" fill="#e8b64c" font-family="Arial,sans-serif" font-size="126" font-weight="700">g</text></svg>\n`);
await write("styles/overrides.css", `${cssLines.slice(578).join("\n")}\n
.media-service-links{margin-left:auto;display:flex;align-items:center;gap:8px;font-size:11px;font-weight:700;color:#9aa0b4}
.media-service-links a{padding:7px 10px;border:1px solid #2c2c3c;border-radius:999px;white-space:nowrap}
.media-service-links a:hover{color:#fff;border-color:#4d8dff}
@media(max-width:520px){.media-service-links{gap:4px}.media-service-links a{padding:6px 8px;font-size:10px}}
`);

console.info(`Generated media service modules, preserving ${games.length} supplied games and the authored style cascade.`);