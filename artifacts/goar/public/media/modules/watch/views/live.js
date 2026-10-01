import "../../../services/storage.js";
globalThis.buildWestLive = function buildWestLive(){
  const main = document.getElementById("mainContent");
  exitProvMode();
  const hero = document.getElementById("hero");
  hero.style.display = "";
  hero.style.backgroundImage = "linear-gradient(120deg,#102033,#0a0a0d)";
  hero.innerHTML = '<div class="hero-content"><div class="hero-eyebrow">LIVE</div><div class="hero-title">Western Live</div><div class="hero-overview">Only channels that publish their own stream: news, sport, business, and NASA. Played in our player. No copied playlists.</div></div>';
  main.innerHTML = "";
  const sec = document.createElement("div");
  sec.className = "section";
  sec.innerHTML = '<div class="section-head"><div><h2>On now</h2><p>Public streams from the broadcaster</p></div></div>';
  const grid = document.createElement("div");
  grid.className = "grid";
  grid.style.cssText = "padding:0 5vw 40px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px";
  WEST_LIVE.forEach(function(ch){
    const b = document.createElement("button");
    b.type = "button";
    b.style.cssText = "text-align:left;background:#14141b;border:1px solid #232330;border-radius:16px;padding:16px 16px 14px;color:#fff;cursor:pointer";
    b.innerHTML = '<b style="display:block;font-family:Space Grotesk,sans-serif;font-size:18px;margin-bottom:6px">' + ch.n + '</b><span style="color:#8b8c98;font-size:12px;letter-spacing:.06em;text-transform:uppercase">' + ch.g + '</span>';
    b.onclick = function(){ playWest(ch); };
    grid.appendChild(b);
  });
  sec.appendChild(grid);
  main.appendChild(sec);
}
globalThis.playWest = function playWest(ch){
  playerToken++;
  const overlay = document.getElementById("playerOverlay");
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
  document.getElementById("playerTitle").textContent = ch.n;
  document.getElementById("playerTag").textContent = "LIVE";
  document.getElementById("playerPicker").innerHTML = qualitySelectHtml();
  const qsel = document.getElementById("selQuality");
  if (qsel) qsel.onchange = function(){
    setQualityPref(qsel.value);
    if (playerState.hls) applyHlsQuality(playerState.hls);
  };
  const src = { name: ch.n, url: ch.u, format: "hls" };
  playerState.sources = [src];
  playerState.sourceName = ch.n;
  playerState.title = ch.n;
  setPlayerStatus("Starting " + ch.n + "…");
  playSource(src).catch(function(e){ setPlayerStatus(e.message || String(e), true); });
}

/* ================= NAV ================= */

