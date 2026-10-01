import "../../../services/storage.js";
globalThis.paintNow = function paintNow(){
  const s=current(), p=S.prefs();
  ["#btnShuffle","#npShuffle"].forEach(id=>{
    const button=music_musicQuery(id);
    if(button){ button.classList.toggle("on",!!p.shuffle); button.setAttribute("aria-pressed",String(!!p.shuffle)); button.setAttribute("aria-label",p.shuffle?"Turn shuffle off":"Turn shuffle on"); }
  });
  ["#btnRepeat","#npRepeat"].forEach(id=>{
    const button=music_musicQuery(id);
    if(button){ button.classList.toggle("on",p.repeat!=="off"); button.setAttribute("aria-pressed",String(p.repeat!=="off")); button.setAttribute("aria-label","Repeat "+p.repeat); }
  });
  const glyph=state.playing?"❚❚":"▶";
  [music_musicQuery("#btnPlay"),music_musicQuery("#npPlay")].forEach(button=>{
    button.textContent=glyph;
    button.setAttribute("aria-label",state.playing?"Pause":"Play");
  });
  if(!s){ music_musicQuery("#nowTitle").textContent="Today's Top Picks"; music_musicQuery("#nowArtist").textContent="Open full player"; return; }
  music_musicQuery("#nowTitle").textContent=s.title; music_musicQuery("#nowArtist").textContent=s.artist||"";
  music_musicQuery("#npTitle").textContent=s.title; music_musicQuery("#npArtist").textContent=s.artist||"";
  const nowArt=music_musicQuery("#nowArt"), npArt=music_musicQuery("#npArt");
  nowArt.onerror=()=>{ nowArt.onerror=null; nowArt.src=phArt; };
  npArt.onerror=()=>{
    if(npArt.src===maxart(s.id)){ npArt.src=thumb(s.id); return; }
    npArt.onerror=null; npArt.src=phArt;
  };
  nowArt.src=thumb(s.id); npArt.src=maxart(s.id); music_musicQuery("#npBg").style.backgroundImage="url('"+maxart(s.id)+"')";
  document.title=s.title+" — goarxyz";
  if(navigator.mediaSession&&typeof MediaMetadata!=="undefined"){
    navigator.mediaSession.metadata=new MediaMetadata({title:s.title,artist:s.artist||"goarxyz",artwork:isLocal(s)?[]:[{src:thumb(s.id),sizes:"480x360",type:"image/jpeg"}]});
  }
  paintQueue(); paintSide();
}
globalThis.paintSide = function paintSide(){
  const rows=state.list.slice(0,24);
  music_musicQuery("#sideLib").innerHTML=rows.map(s=>`<button type="button" class="lib-item ${current()&&current().id===s.id?"on":""}" data-id="${esc(s.id)}" aria-label="Play ${esc(s.title)}"><img src="${thumb(s.id)}" alt=""><span class="lib-track"><b>${esc(s.title)}</b><span>${esc(s.artist||"")}</span></span></button>`).join("");
  music_musicQuery("#sideLib").querySelectorAll(".lib-item").forEach(el=>el.onclick=()=>jump(el.dataset.id,true));
}
globalThis.paintQueue = function paintQueue(){
  const box=music_musicQuery("#npQueue");
  box.innerHTML="<h3>Up next</h3>"+(state.list.length?state.list.map((s,i)=>`<button type="button" class="np-qrow ${i===state.i?"on":""}" data-i="${i}" aria-current="${i===state.i?"true":"false"}"><img src="${thumb(s.id)}" alt=""><span><span class="t-title">${esc(s.title)}</span><span class="t-sub">${esc(s.artist||"")}</span></span></button>`).join(""):'<p class="queue-empty">Choose a track to start a queue.</p>');
  box.querySelectorAll(".np-qrow").forEach(el=>el.onclick=()=>playAt(Number(el.dataset.i),true));
}
globalThis.trackRows = function trackRows(items){
  return `<table class="tracks"><thead><tr><th class="num">#</th><th>Title</th><th class="duration">Duration</th><th></th></tr></thead><tbody>
    ${items.map((s,i)=>`<tr data-id="${esc(s.id)}" tabindex="0" role="button" aria-label="Play ${esc(s.title)} by ${esc(s.artist||"unknown artist")}" class="${current()&&current().id===s.id?"on":""}"><td class="num">${i+1}</td><td><div class="track-name"><img class="t-art" src="${thumb(s.id)}" alt=""><div><div class="t-title">${esc(s.title)}</div><div class="t-sub">${esc(s.artist||"")}</div></div></div></td><td class="duration">${s.duration?fmt(s.duration):"—"}</td><td><button class="add" type="button" data-add="${esc(s.id)}" title="Save" aria-label="Save ${esc(s.title)} to library">+</button></td></tr>`).join("")}
  </tbody></table>`;
}
globalThis.albumRail = function albumRail(items){ return `<div class="rail">${items.map(s=>`<article class="album" tabindex="0" role="button" aria-label="Play ${esc(s.title)} by ${esc(s.artist||"unknown artist")}" data-id="${esc(s.id)}"><img src="${thumb(s.id)}" alt=""><b>${esc(s.title)}</b><span>${esc(s.artist||"")}</span></article>`).join("")}</div>`; }
globalThis.bindList = function bindList(root, items){
  root.querySelectorAll("[data-id]").forEach(el=>{
    el.onclick=e=>{
      if(e.target.closest("[data-add]")) return;
      const song=items.find(x=>x.id===el.dataset.id); if(!song) return;
      useList(items,song.id,true);
    };
    el.onkeydown=e=>{
      if((e.key==="Enter"||e.key===" ")&&!e.target.closest("[data-add]")){
        e.preventDefault();
        el.click();
      }
    };
  });
  root.querySelectorAll("[data-add]").forEach(btn=>btn.onclick=e=>{
    e.stopPropagation();
    const song=items.find(x=>x.id===btn.dataset.add); if(song) addSong(song);
  });
}
globalThis.useList = function useList(items, id, auto){
  state.list=items.slice();
  state.shuffleHistory=[];
  const idx=Math.max(0, state.list.findIndex(x=>x.id===id));
  playAt(idx, auto);
}
globalThis.setNav = function setNav(){
  music_musicQueryAll("[data-view]").forEach(b=>{
    const active=b.dataset.view===state.view;
    b.classList.toggle("on",active);
    if(active) b.setAttribute("aria-current","page");
    else b.removeAttribute("aria-current");
  });
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
          <p>Your tracks, one queue, and a full player. Online catalogs come from third parties and may be unavailable; local audio stays on this device.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-play" id="musicHeroPlay">Play</button>
            <button class="btn btn-ghost" id="heroOpen">Open player</button>
          </div>
        </div>
      </div>
      <div class="section"><div class="section-head"><h2>Today's Top Picks</h2><button type="button" class="see" id="seeTops">Play all</button></div>${trackRows(state.tops.slice(0,12))}</div>
      <div class="section"><div class="section-head"><h2>New Mainstream Releases</h2><button type="button" class="see" id="seeNews">Play all</button></div>${albumRail(state.news.slice(0,14))}</div>
      <div class="section"><div class="section-head"><h2>Fresh singles</h2></div>${trackRows(state.news.slice(0,10))}</div>
    </div>`;
  bindList(music_musicQuery("#stage"), state.tops.concat(state.news));
  music_musicQuery("#musicHeroPlay").onclick=()=>useList(state.tops, state.tops[0]&&state.tops[0].id, true);
  music_musicQuery("#heroOpen").onclick=()=>{ if(!current()) useList(state.tops, state.tops[0]&&state.tops[0].id, false); music_openPlayer(); };
  music_musicQuery("#seeTops").onclick=()=>useList(state.tops, state.tops[0]&&state.tops[0].id, true);
  music_musicQuery("#seeNews").onclick=()=>useList(state.news, state.news[0]&&state.news[0].id, true);
  music_musicQuery("#q").addEventListener("keydown",e=>{
    if(e.key==="Enter"){
      state.viewHistory.push(state.view);
      viewSearch(e.target.value.trim());
    }
  });
  music_musicQuery("#backBtn").onclick=goBackView;
}

