(function(){
  const params = new URLSearchParams(location.search);
  const frame = document.getElementById("shellFrame");
  const cover = document.getElementById("shellCover");
  const coverText = document.getElementById("shellCoverText");
  const statusEl = document.getElementById("shellStatus");
  const retryBtn = document.getElementById("shellRetry");
  const titleEl = document.getElementById("shellTitle");
  const ALLOWED_HOSTS = ["cdn-factory.marketjs.com", "cdn-consumer.marketjs.com"];
  let gameUrl = "", session = 0, timer = 0;

  function gameUrlFromParams(){
    const raw = params.get("src") || "";
    try {
      const url = new URL(raw);
      if (url.protocol !== "https:" || !ALLOWED_HOSTS.includes(url.hostname)) return "";
      if (url.hostname === "cdn-consumer.marketjs.com" && /^\/game\/[^/]+$/.test(url.pathname)) url.pathname += "/";
      return url.href;
    } catch (_) { return ""; }
  }
  function setStatus(text){ statusEl.textContent = text; coverText.textContent = text; document.title = "goarxyz — " + text; }
  function reveal(){
    frame.classList.add("ready");
    cover.classList.add("off");
    setStatus(params.get("title") || "Playing");
  }
  function fail(message){
    cover.classList.remove("off");
    frame.classList.remove("ready");
    retryBtn.hidden = false;
    setStatus(message);
  }
  function load(){
    const id = ++session;
    window.clearTimeout(timer);
    retryBtn.hidden = true;
    frame.classList.remove("ready");
    cover.classList.remove("off");
    const title = params.get("title");
    titleEl.textContent = title || "Game";
    document.title = "goarxyz — " + (title || "Play");
    if (!gameUrl){ fail("This game has no valid source."); return; }
    setStatus("Loading game…");
    frame.onload = function(){
      if (id !== session) return;
      window.clearTimeout(timer);
      reveal();
    };
    frame.onerror = function(){
      if (id !== session) return;
      window.clearTimeout(timer);
      fail("Could not load this game.");
    };
    frame.src = gameUrl;
    timer = window.setTimeout(function(){
      if (id === session) fail("The game is taking longer than expected. Retry or check your connection.");
    }, 25000);
  }
  retryBtn.onclick = load;
  gameUrl = gameUrlFromParams();
  load();
})();
