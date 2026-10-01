import "../../../services/storage.js";
/* ================= BOOT ================= */
try { const saved = mediaStorage.getItem("goar_region"); if (saved) REGION = saved; } catch(e){}
buildRegionSelect();
buildCatBar();

window.resolveSources = resolveSources;
window.playSource = playSource;
window.destroyHls = destroyHls;
window.closePlayer = closePlayer;
window.tmdb = tmdb;

buildWispSelect();
setTimeout(() => {
  ensureLibcurl().then(() => buildWispSelect()).catch(() => {
    setTunnelChip("bad", "Relay unavailable · Retry");
    buildWispSelect();
  });
}, 200);


