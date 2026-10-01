import "../../../services/storage.js";
globalThis.viewLibrary = function viewLibrary(){
  state.view="library"; setNav();
  const saved=S.list();
  music_musicQuery("#stage").innerHTML=`<div class="topbar"><button class="circle" type="button" id="backBtn">←</button></div>
    <div class="page"><div class="hero"><div class="hero-art" style="display:grid;place-items:center;background:linear-gradient(135deg,#a855f7,#5b8def);font-size:64px">♪</div>
    <div><div class="kicker">Playlist</div><h1>Your Library</h1><p>${saved.length?saved.length+" saved tracks":"Save a pick or drop local files."}</p>
    <div style="display:flex;gap:10px"><button class="btn btn-play" id="libPlay">Play</button><button class="btn btn-ghost" id="libFiles">Add files</button></div></div></div>
    ${saved.length?trackRows(saved):'<div class="empty">Nothing saved yet. Use + on a track or add files.</div>'}</div>`;
  bindList(music_musicQuery("#stage"), saved);
  music_musicQuery("#libPlay").onclick=()=>{ if(saved.length) useList(saved, saved[0].id, true); };
  music_musicQuery("#libFiles").onclick=()=>music_musicQuery("#filePick").click();
  music_musicQuery("#backBtn").onclick=viewHome;
}
globalThis.viewSearch = function viewSearch(q0=""){
  state.view="search"; setNav();
  music_musicQuery("#stage").innerHTML=`<div class="topbar"><button class="circle" type="button" id="backBtn">←</button>
    <div class="search"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>
    <input id="q" value="${esc(q0)}" placeholder="Song, artist, or link" autofocus></div></div>
    <div class="page"><div id="sres" class="empty">Type a query and press Enter.</div></div>`;
  music_musicQuery("#backBtn").onclick=viewHome;
  const run=async()=>{
    const q=music_musicQuery("#q").value.trim(), box=music_musicQuery("#sres"), id=parseVideoId(q);
    if(!q){ box.className="empty"; box.textContent="Type a query and press Enter."; return; }
    box.className="empty"; box.textContent="Searching…";
    try{
      let items=id?[{id,title:id,artist:"YouTube"}]:await searchSongs(q);
      if(id){ try{ const meta=await invGet("/api/v1/videos/"+id+"?region=US"); items=[{id,title:meta.title||id,artist:meta.author||"YouTube"}]; }catch{} }
      if(!items.length){ box.textContent="No results. Tunnel may still be connecting — try again."; return; }
      box.className=""; box.innerHTML=trackRows(items); bindList(box, items);
    }catch(e){ box.textContent=e.message||"Search failed"; }
  };
  music_musicQuery("#q").addEventListener("keydown", e=>{ if(e.key==="Enter") run(); });
  if(q0) run();
}


