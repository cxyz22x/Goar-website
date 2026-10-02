(function(){
  const ROOT = new URL("../", document.currentScript.src);
  const hostname = location.hostname;
  const isDevelopmentHost = hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname === "::1"
    || hostname.endsWith(".replit.dev");
  if ("serviceWorker" in navigator && !isDevelopmentHost) {
    addEventListener("load", function(){
      navigator.serviceWorker.register(new URL("sw.js", ROOT).href, {
        scope: ROOT.href
      }).catch(function(error){
        console.error("Goar offline support could not start.", error);
      });
    }, { once: true });
  }
  const LINKS = [
    ["Product home", new URL("index.html", ROOT).href],
    ["Agent", new URL("workspace/index.html", ROOT).href],
    ["Movies", new URL("pages/watch/index.html?tab=movie", ROOT).href],
    ["TV", new URL("pages/watch/index.html?tab=tv", ROOT).href],
    ["Music", new URL("pages/music/index.html", ROOT).href],
    ["Games", new URL("pages/games/index.html", ROOT).href],
    ["Live", new URL("pages/live/index.html", ROOT).href],
    ["Anime", new URL("pages/anime/index.html", ROOT).href],
    ["Media home", new URL("pages/home/index.html", ROOT).href],
    ["Privacy", new URL("privacy.html", ROOT).href],
    ["Terms", new URL("terms.html", ROOT).href],
    ["License", new URL("license.html", ROOT).href],
    ["Data safety", new URL("data-safety.html", ROOT).href],
    ["Contact", new URL("contact.html", ROOT).href]
  ];
  const btn = document.createElement("button");
  btn.id = "goarFloat";
  btn.type = "button";
  btn.setAttribute("aria-label", "Open Goar pages");
  btn.setAttribute("aria-controls", "goarFloatMenu");
  btn.setAttribute("aria-expanded", "false");
  btn.title = "Goar pages";
  const logo = document.createElement("img");
  logo.src = new URL("brand.png", ROOT).href;
  logo.alt = "";
  logo.setAttribute("aria-hidden", "true");
  btn.appendChild(logo);
  const menu = document.createElement("nav");
  menu.id = "goarFloatMenu";
  menu.setAttribute("aria-label", "Goar pages");
  menu.hidden = true;
  const here = new URL(location.href);
  function normalizedPath(path){
    const normalized = path.replace(/\/index\.html$/, "/").replace(/\/+$/, "");
    return normalized || "/";
  }
  LINKS.forEach(function(pair){
    const a = document.createElement("a");
    a.href = pair[1];
    a.textContent = pair[0];
    const target = new URL(pair[1]);
    const samePath = normalizedPath(here.pathname) === normalizedPath(target.pathname);
    const sameTab = !target.searchParams.has("tab") || here.searchParams.get("tab") === target.searchParams.get("tab");
    if (samePath && sameTab) {
      a.className = "on";
      a.setAttribute("aria-current", "page");
    }
    menu.appendChild(a);
  });
  document.body.appendChild(menu);
  document.body.appendChild(btn);
  const KEY = "goar-float";
  function place(x, y){
    const w = 44, h = 44;
    x = Math.max(8, Math.min(x, innerWidth - w - 8));
    y = Math.max(8, Math.min(y, innerHeight - h - 8));
    btn.style.left = x + "px";
    btn.style.top = y + "px";
    const mw = menu.offsetWidth || 190;
    const mh = Math.min(menu.offsetHeight || 400, innerHeight - 16);
    let mx = x - mw - 10;
    if (mx < 8) mx = x + w + 10;
    let my = y;
    if (my + mh > innerHeight - 8) my = innerHeight - mh - 8;
    menu.style.left = mx + "px";
    menu.style.top = Math.max(8, my) + "px";
  }
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
  menu.style.maxHeight = Math.max(80, innerHeight - 16) + "px";
  place(saved && typeof saved.x === "number" ? saved.x : innerWidth - 60, saved && typeof saved.y === "number" ? saved.y : innerHeight - 74);
  let dragging = false, moved = false, suppressClick = false, sx = 0, sy = 0, ox = 0, oy = 0;
  btn.addEventListener("pointerdown", function(e){
    if (e.button !== 0) return;
    dragging = true;
    moved = false;
    btn.setPointerCapture(e.pointerId);
    const r = btn.getBoundingClientRect();
    sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
  });
  btn.addEventListener("pointermove", function(e){
    if (!dragging) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
    place(ox + dx, oy + dy);
  });
  btn.addEventListener("pointerup", function(){
    if (!dragging) return;
    dragging = false;
    const r = btn.getBoundingClientRect();
    try { localStorage.setItem(KEY, JSON.stringify({ x: r.left, y: r.top })); } catch (e) {}
    if (moved) {
      suppressClick = true;
      setTimeout(function(){ suppressClick = false; }, 0);
    }
  });
  btn.addEventListener("pointercancel", function(){ dragging = false; });
  btn.addEventListener("click", function(){
    if (suppressClick) return;
    menu.hidden = !menu.hidden;
    btn.setAttribute("aria-expanded", String(!menu.hidden));
    const r = btn.getBoundingClientRect();
    place(r.left, r.top);
    if (!menu.hidden) menu.querySelector("a.on")?.focus();
  });
  document.addEventListener("click", function(event){
    if (menu.hidden || btn.contains(event.target) || menu.contains(event.target)) return;
    menu.hidden = true;
    btn.setAttribute("aria-expanded", "false");
  });
  document.addEventListener("keydown", function(event){
    if (event.key !== "Escape" || menu.hidden) return;
    menu.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    btn.focus();
  });
  addEventListener("resize", function(){
    menu.style.maxHeight = Math.max(80, innerHeight - 16) + "px";
    const r = btn.getBoundingClientRect();
    place(r.left, r.top);
  });
})();
