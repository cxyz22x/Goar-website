import "../../../services/storage.js";
globalThis.isTvDevice = function isTvDevice(){
  try {
    const q = new URLSearchParams(location.search);
    if (q.get("tv") === "1" || q.get("tv") === "true") return true;
  } catch(e){}
  const ua = navigator.userAgent || "";
  if (/SmartTV|SMART-TV|Smart-TV|Tizen|Web0S|WebOS|NetCast|BRAVIA|AFT[A-Z]|CrKey|TV Safari|HbbTV|Viera|Hisense|VIDAA|PlayStation|Xbox|AppleTV|GoogleTV|FireTV|Android TV/i.test(ua)) return true;
  try {
    if (window.matchMedia("(min-width: 1280px) and (pointer: coarse)").matches) return true;
    if (window.matchMedia("(min-width: 1920px) and (hover: none)").matches) return true;
  } catch(e){}
  return false;
}
globalThis.tvFocusables = function tvFocusables(){
  return [...document.getElementById("view-watch").querySelectorAll(".card, .top10-item, .provider-app, .btn, nav a, .cat-chip, .see-all, .p-close, .player-picker select")].filter(el => {
    if (!(el instanceof HTMLElement)) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && el.offsetParent !== null;
  });
}
globalThis.setupTvMode = function setupTvMode(){
  if (!isTvDevice()) return;
  document.body.classList.add("tv");
  document.documentElement.style.cursor = "none";
  document.addEventListener("keydown", (e) => {
    if (!document.getElementById("view-watch").classList.contains("on")) return;
    const keys = { ArrowLeft:-1, ArrowRight:1, ArrowUp:-2, ArrowDown:2 };
    if (!(e.key in keys) && e.key !== "Enter" && e.key !== "Go" && e.key !== "Select") return;
    const overlay = document.getElementById("playerOverlay");
    if (overlay && overlay.classList.contains("open") && (e.key === "Backspace" || e.key === "Escape")) return;
    if (e.key === "Enter" || e.key === "Go" || e.key === "Select"){
      const a = document.activeElement;
      if (a && a !== document.body){ a.click(); e.preventDefault(); }
      return;
    }
    e.preventDefault();
    const items = tvFocusables();
    if (!items.length) return;
    const cur = document.activeElement;
    let idx = items.indexOf(cur);
    if (idx < 0){ items[0].focus(); return; }
    const dir = keys[e.key];
    const cr = cur.getBoundingClientRect();
    const cx = cr.left + cr.width/2, cy = cr.top + cr.height/2;
    let best = null, bestScore = Infinity;
    items.forEach((el, i) => {
      if (i === idx) return;
      const r = el.getBoundingClientRect();
      const x = r.left + r.width/2, y = r.top + r.height/2;
      const dx = x - cx, dy = y - cy;
      if (dir === 1 && dx <= 8) return;
      if (dir === -1 && dx >= -8) return;
      if (dir === 2 && dy <= 8) return;
      if (dir === -2 && dy >= -8) return;
      const primary = (dir === 1 || dir === -1) ? Math.abs(dx) : Math.abs(dy);
      const secondary = (dir === 1 || dir === -1) ? Math.abs(dy) : Math.abs(dx);
      const score = primary + secondary * 2.2;
      if (score < bestScore){ bestScore = score; best = el; }
    });
    if (best){
      best.focus();
      best.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }
  });
  setTimeout(() => {
    if (!document.getElementById("view-watch").classList.contains("on")) return;
    const first = document.getElementById("watchHeroPlay") || tvFocusables()[0];
    if (first) first.focus();
  }, 800);
}
document.addEventListener("DOMContentLoaded", setupTvMode);
if (document.readyState !== "loading") setupTvMode();

/* ================= TMDB API ================= */

