import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const workspace = resolve(fileURLToPath(new URL("..", import.meta.url)));
const musicRoot = resolve(workspace, "artifacts/goar/public/media");
const readMusic = (path) => readFile(resolve(musicRoot, path), "utf8");

test("music playback uses a real HTMLAudioElement and waits for audio metadata", async () => {
  const template = await readMusic("modules/templates/music/video-element.js");
  const engines = await readMusic("modules/music/services/player-engines.js");
  const nowPlaying = await readMusic("modules/music/interactions/now-playing.js");
  assert.match(template, /<audio id=\\?"player\\?"/);
  assert.doesNotMatch(template, /<video id=\\?"player\\?"/);
  assert.match(engines, /loadedmetadata/);
  assert.match(engines, /unsupported audio format/);
  assert.match(nowPlaying, /durationchange/);
  assert.match(nowPlaying, /Number\.isFinite\(media\.duration\)/);
});

test("local music imports persist audio files, recover previous library files, and keep duration metadata", async () => {
  const files = await readMusic("modules/music/services/local-files.js");
  const bootstrap = await readMusic("modules/music/interactions/bootstrap.js");
  assert.match(files, /goarxyz-music/);
  assert.match(files, /idbRead\(id,IDB_LEGACY_NAME\)/);
  assert.match(files, /inspectAudioFile/);
  assert.match(bootstrap, /await idbPut\(id,file\)/);
  assert.match(bootstrap, /duration/);
  assert.match(bootstrap, /unsupported .*files? .*skipped/);
});

test("transport controls derive play state from the media element and preserve zero volume", async () => {
  const queue = await readMusic("modules/music/interactions/queue.js");
  const controls = await readMusic("modules/music/interactions/now-playing.js");
  assert.match(queue, /await media\.play\(\)/);
  assert.match(queue, /state\.playing=!media\.paused/);
  assert.match(queue, /media\.volume=volume\/100/);
  assert.match(queue, /p\.repeat==="one"/);
  assert.match(queue, /p\.repeat==="all"/);
  assert.match(controls, /setActionHandler\("pause",musicPauseCurrent\)/);
  assert.match(controls, /media\.currentTime=t/);
  assert.match(controls, /media\.addEventListener\("ended",\(\)=>next\(true\)\)/);
});

test("music navigation, full-player close, repeat, and shuffle expose usable controls", async () => {
  const nav = await readMusic("modules/templates/music/mobile-nav.js");
  const player = await readMusic("modules/templates/music/now-playing.js");
  const bootstrap = await readMusic("modules/music/interactions/bootstrap.js");
  const controls = await readMusic("modules/music/interactions/now-playing.js");
  assert.match(nav, /aria-label=\\?"Music navigation/);
  assert.match(player, /id=\\?"npClose\\?"/);
  assert.match(bootstrap, /goBackView/);
  assert.match(bootstrap, /window\.goarShow\("home",true\)/);
  assert.match(controls, /player\.setAttribute\("aria-hidden","true"\)/);
  assert.match(controls, /globalThis\.toggleShuffle/);
  assert.match(controls, /globalThis\.cycleRepeat/);
});

test("music colors and typography use the supplied paper-and-ink site tokens", async () => {
  const css = await readMusic("styles/music.css");
  assert.match(css, /#view-music\s*\{[\s\S]*?--bg:#efe9df/);
  assert.match(css, /--bg-elev:#f4efe6/);
  assert.match(css, /--card:#e4ddd2/);
  assert.match(css, /--text:#0d0d0d/);
  assert.match(css, /font-family:"Segoe UI",system-ui/);
});

test("catalog adapters retain existing online providers and explain external source failures", async () => {
  const catalogs = await readMusic("data/music-catalogs.js");
  const search = await readMusic("modules/music/services/search.js");
  const resolver = await readMusic("modules/music/services/catalog-search.js");
  assert.match(catalogs, /invidious/);
  assert.match(catalogs, /pipedapi/);
  assert.match(resolver, /youtube\.com/);
  assert.match(search, /External music catalogs could not be reached/);
  assert.match(resolver, /No playable audio source could be resolved/);
});