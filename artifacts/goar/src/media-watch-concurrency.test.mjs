import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const modulePath = (path) => resolve(projectRoot, "public/media/modules/watch", path);
const source = (path) => readFileSync(modulePath(path), "utf8").replace(/^import .*;\s*/m, "");

function element(id = ""){
  const classes = new Set();
  const node = {
    id,
    children: [],
    listeners: {},
    style: {},
    attributes: {},
    dataset: {},
    isConnected: true,
    className: "",
    textContent: "",
    htmlWrites: 0,
    replaceChildrenCalls: 0,
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
      toggle: (name, force) => {
        const enabled = force === undefined ? !classes.has(name) : Boolean(force);
        if (enabled) classes.add(name);
        else classes.delete(name);
        return enabled;
      },
    },
    set innerHTML(value){ this._innerHTML = value; this.htmlWrites++; this.children = []; },
    get innerHTML(){ return this._innerHTML || ""; },
    appendChild(child){ this.children.push(child); return child; },
    replaceChildren(...children){ this.replaceChildrenCalls++; this.children = children; },
    querySelectorAll(){ return []; },
    querySelector(){ return null; },
    addEventListener(name, handler){ this.listeners[name] = handler; },
    setAttribute(name, value){ this.attributes[name] = value; },
    removeAttribute(name){ delete this.attributes[name]; },
    focus(){},
  };
  return node;
}

function harness(){
  const ids = new Map([
    "view-watch", "gridView", "hero", "mainContent", "gridTitle", "gridGrid", "gridBack",
  ].map(id => [id, element(id)]));
  const timers = [];
  const document = {
    body: element("body"),
    getElementById(id){ return ids.get(id) || null; },
    createElement(tag){ const node = element(tag); node.tagName = tag.toUpperCase(); return node; },
    querySelectorAll(){ return []; },
  };
  const context = {
    document,
    window: { scrollTo(){} },
    setTimeout(callback){ timers.push(callback); return timers.length; },
    clearTimeout(){},
    activeTab: "home",
  };
  context.globalThis = context;
  vm.createContext(context);
  return { context, document, ids, timers };
}

function evaluate(ctx, path){
  vm.runInContext(source(path), ctx, { filename: path });
}

function deferred(){
  let resolvePromise;
  let rejectPromise;
  const promise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return { promise, resolve: resolvePromise, reject: rejectPromise };
}

test("navigation ignores delayed builders and errors from superseded routes", async () => {
  const { context: ctx, ids, timers } = harness();
  evaluate(ctx, "interactions/navigation.js");
  const oldBuild = deferred();
  let tvBuilds = 0;
  ctx.buildMovieTab = () => oldBuild.promise;
  ctx.buildTVTab = () => { tvBuilds++; return Promise.resolve(); };
  ctx.buildAnimeTab = () => Promise.resolve();
  ctx.routeTo("movie", true);
  ctx.routeTo("tv", true);
  const staleTimer = timers.shift();
  const currentTimer = timers.shift();
  await staleTimer();
  assert.equal(tvBuilds, 0);
  await currentTimer();
  assert.equal(tvBuilds, 1);

  ctx.routeTo("movie", true);
  const delayedFailure = timers.shift()();
  ctx.routeTo("anime", true);
  const latestRoute = timers.shift()();
  oldBuild.reject(new Error("stale failure"));
  await delayedFailure;
  await latestRoute;
  assert.equal(ids.get("mainContent").replaceChildrenCalls, 0);
});

test("Watch-tab clicks delegate history ownership to the shell router", () => {
  const { context: ctx, ids } = harness();
  const homeLink = element("watch-home-link");
  homeLink.dataset.tab = "home";
  const tvLink = element("watch-tv-link");
  tvLink.dataset.tab = "tv";
  const links = [homeLink, tvLink];
  ids.get("view-watch").querySelectorAll = (selector) => selector === "nav a[data-tab]" ? links : [];
  const calls = [];
  ctx.window.goarShow = (...args) => calls.push(args);
  evaluate(ctx, "interactions/navigation.js");
  for (const link of links) link.listeners.click({ preventDefault(){} });
  assert.deepEqual(calls, [["watch", true, "home"], ["tv", true]]);
});

test("genre-tab builds stop before DOM writes when their deferred genre request is stale", async () => {
  const { context: ctx, ids } = harness();
  evaluate(ctx, "interactions/navigation.js");
  evaluate(ctx, "views/catalogue-tabs.js");
  const genres = deferred();
  ctx.ensureGenres = () => genres.promise;
  ctx.exitProvMode = () => {};
  const pending = ctx.buildMovieTab();
  ctx.setActiveTab("tv");
  genres.resolve();
  await pending;
  assert.equal(ids.get("mainContent").htmlWrites, 0);
});

test("home and hero deferred responses do not overwrite the latest Watch view", async () => {
  const { context: ctx, ids } = harness();
  evaluate(ctx, "interactions/navigation.js");
  evaluate(ctx, "views/home.js");
  evaluate(ctx, "views/hero.js");
  const genres = deferred();
  ctx.ensureGenres = () => genres.promise;
  const home = ctx.buildHome();
  ctx.setActiveTab("tv");
  genres.resolve();
  await home;
  assert.equal(ids.get("mainContent").htmlWrites, 0);

  const feature = deferred();
  const hero = ids.get("hero");
  const initialWrites = hero.htmlWrites;
  const heroRequest = ctx.buildHero(() => feature.promise, "FEATURED");
  ctx.setActiveTab("anime");
  feature.resolve([{ id: 7, backdrop_path: "/image.jpg" }]);
  await heroRequest;
  assert.equal(hero.htmlWrites, initialWrites + 1);
});

for (const [feature, route, discoverName] of [
  ["kids.js", "showKids", "kidsDiscover"],
  ["music-catalogue.js", "showMusic", "musicDiscover"],
]){
  test(`${feature} ignores stale grid results and offers retry on current failures`, async () => {
    const { context: ctx, ids } = harness();
    evaluate(ctx, "views/grid.js");
    evaluate(ctx, `views/${feature}`);
    ctx.card = () => element("card");
    ctx.musicCard = () => element("music-card");
    const oldRequest = deferred();
    ctx[discoverName] = () => oldRequest.promise;
    const stale = feature === "kids.js" ? ctx[route]("popular") : ctx[route]("trend");
    const grid = ids.get("gridGrid");
    ctx.openGrid("New destination");
    const latestMarkup = grid.innerHTML;
    oldRequest.resolve([{ id: 1 }]);
    await stale;
    assert.equal(grid.innerHTML, latestMarkup);
    assert.equal(grid.children.length, 0);

    const failed = deferred();
    ctx[discoverName] = () => failed.promise;
    const current = feature === "kids.js" ? ctx[route]("popular") : ctx[route]("trend");
    failed.reject(new Error("temporary failure"));
    await current;
    const alert = grid.children[0];
    assert.equal(alert.attributes.role, "alert");
    const retry = alert.children.find(child => child.tagName === "BUTTON");
    assert.equal(retry.textContent, "Retry");
    assert.equal(typeof retry.onclick, "function");
    let retryCalls = 0;
    ctx[discoverName] = async () => { retryCalls++; return []; };
    await retry.onclick();
    assert.equal(retryCalls, 1);
  });
}