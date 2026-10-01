import "../../../services/storage.js";
globalThis.paintNow = function paintNow(){
  const s=current(), p=S.prefs();
  ["#btnShuffle","#npShuffle"].forEach(id=>music_musicQuery(id)&&music_musicQuery(id).classList.toggle("on",!!p.shuffle));
  ["#btnRepeat","#npRepeat"].forEach(id=>music_musicQuery(id)&&music_musicQuery(id).classList.toggle("on",p.repeat!=="off"));
  const glyph=state.playing?"❚❚":"▶";
  music_musicQuery("#btnPlay").textContent=glyph; music_musicQuery("#npPlay").textContent=glyph;
  if(!s){ music_musicQuery("#nowTitle").textContent="Today's Top Picks"; music_musicQuery("#nowArtist").textContent="Open full player"; return; }
  music_musicQuery("#nowTitle").textContent=s.title; music_musicQuery("#nowArtist").textContent=s.artist||"";
  music_musicQuery("#npTitle").textContent=s.title; music_musicQuery("#npArtist").textContent=s.artist||"";
  music_musicQuery("#nowArt").src=thumb(s.id); music_musicQuery("#npArt").src=maxart(s.id); music_musicQuery("#npBg").style.backgroundImage="url('"+maxart(s.id)+"')";
  document.title=s.title+" — goarxyz";
  if(navigator.mediaSession) navigator.mediaSession.metadata=new MediaMetadata({title:s.title,artist:s.artist||"goarxyz",artwork:isLocal(s)?[]:[{src:thumb(s.id),sizes:"480x360",type:"image/jpeg"}]});
  paintQueue(); paintSide();
}
globalThis.paintSide = function paintSide(){
  const rows=state.list.slice(0,24);
  music_musicQuery("#sideLib").innerHTML=rows.map(s=>`<div class="lib-item ${current()&&current().id===s.id?"on":""}" data-id="${esc(s.id)}"><img src="${thumb(s.id)}" alt=""><div><b>${esc(s.title)}</b><span>${esc(s.artist||"")}</span></div></div>`).join("");
  music_musicQuery("#sideLib").querySelectorAll(".lib-item").forEach(el=>el.onclick=()=>jump(el.dataset.id,true));
}
globalThis.paintQueue = function paintQueue(){
  const box=music_musicQuery("#npQueue");
  box.innerHTML="<h3>Up next</h3>"+state.list.map((s,i)=>`<div class="np-qrow ${i===state.i?"on":""}" data-i="${i}"><img src="${thumb(s.id)}" alt=""><div><div class="t-title">${esc(s.title)}</div><div class="t-sub">${esc(s.artist||"")}</div></div></div>`).join("");
  box.querySelectorAll(".np-qrow").forEach(el=>el.onclick=()=>playAt(Number(el.dataset.i),true));
}
globalThis.trackRows = function trackRows(items){
  return `<table class="tracks"><thead><tr><th class="num">#</th><th>Title</th><th></th></tr></thead><tbody>
    ${items.map((s,i)=>`<tr data-id="${esc(s.id)}" class="${current()&&current().id===s.id?"on":""}"><td class="num">${i+1}</td><td><div style="display:flex;gap:10px;align-items:center"><img class="t-art" src="${thumb(s.id)}" alt=""><div><div class="t-title">${esc(s.title)}</div><div class="t-sub">${esc(s.artist||"")}</div></div></div></td><td><button class="add" data-add="${esc(s.id)}" title="Save">+</button></td></tr>`).join("")}
  </tbody></table>`;
}
globalThis.albumRail = function albumRail(items){ return `<div class="rail">${items.map(s=>`<article class="album" data-id="${esc(s.id)}"><img src="${thumb(s.id)}" alt=""><b>${esc(s.title)}</b><span>${esc(s.artist||"")}</span></article>`).join("")}</div>`; }
globalThis.bindList = function bindList(root, items){
  root.querySelectorAll("[data-id]").forEach(el=>el.onclick=e=>{
    if(e.target.closest("[data-add]")) return;
    const song=items.find(x=>x.id===el.dataset.id); if(!song) return;
    useList(items, song.id, true);
  });
  root.querySelectorAll("[data-add]").forEach(btn=>btn.onclick=e=>{
    e.stopPropagation();
    const song=items.find(x=>x.id===btn.dataset.add); if(song) addSong(song);
  });
}
globalThis.useList = function useList(items, id, auto){
  state.list=items.slice();
  const idx=Math.max(0, state.list.findIndex(x=>x.id===id));
  playAt(idx, auto);
}
globalThis.setNav = function setNav(){
  music_musicQueryAll("[data-view]").forEach(b=>b.classList.toggle("on", b.dataset.view===state.view));
}

globalThis.viewHome = function viewHome(){
  state.view="home"; setNav();
  const feat=state.tops[0]||TOP_SEED[0];
  music_musicQuery("#stage").innerHTML=`
    <div class="topbar">
      <button class="circle" type="button" id="backBtn">←</button>
      <div class="search"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>
        <input id="q" placeholder="Search today's hits or paste a link"></div>
    </div>
    <div class="page">
      <div class="hero">
        <img class="hero-art" src="${thumb(feat.id)}" alt="">
        <div>
          <div class="kicker">Today · ${new Date().toLocaleDateString(undefined,{weekday:"long",month:"short",day:"numeric"})}</div>
          <h1>Top Picks</h1>
          <p>Own player. Audio first through WISP + libcurl. Stretch the dock for the full screen.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-play" id="musicHeroPlay">Play</button>
            <button class="btn btn-ghost" id="heroOpen">Open player</button>
          </div>
        </div>
      </div>
      <div class="section"><div class="section-head"><h2>Today's Top Picks</h2><span class="see" id="seeTops">Play all</span></div>${trackRows(state.tops.slice(0,12))}</div>
      <div class="section"><div class="section-head"><h2>New Mainstream Releases</h2><span class="see" id="seeNews">Play all</span></div>${albumRail(state.news.slice(0,14))}</div>
      <div class="section"><div class="section-head"><h2>Fresh singles</h2></div>${trackRows(state.news.slice(0,10))}</div>
    </div>`;
  bindList(music_musicQuery("#stage"), state.tops.concat(state.news));
  music_musicQuery("#musicHeroPlay").onclick=()=>useList(state.tops, state.tops[0]&&state.tops[0].id, true);
  music_musicQuery("#heroOpen").onclick=()=>{ if(!current()) useList(state.tops, state.tops[0]&&state.tops[0].id, false); music_openPlayer(); };
  music_musicQuery("#seeTops").onclick=()=>useList(state.tops, state.tops[0]&&state.tops[0].id, true);
  music_musicQuery("#seeNews").onclick=()=>useList(state.news, state.news[0]&&state.news[0].id, true);
  music_musicQuery("#q").addEventListener("keydown", e=>{ if(e.key==="Enter") viewSearch(e.target.value.trim()); });
  music_musicQuery("#backBtn").onclick=()=>viewHome();
}

