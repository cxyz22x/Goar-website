import "../../../services/storage.js";
globalThis.modalBackdrop= document.getElementById("modalBackdrop");
globalThis.modalContent= document.getElementById("modalContent");
let modalReturnFocus = null;
globalThis.miniCard = function miniCard(item, idx, type){
  return '<button type="button" class="mini-card anim-up" style="animation-delay:' + (idx*35) + 'ms" data-id="' + item.id + '" data-type="' + type + '">' +
    '<span class="mc-img"><img loading="lazy" src="' + posterImg(item,"w342") + '" alt=""><span class="mc-rating">★ ' + ratingOf(item) + '</span></span>' +
    '<span class="mc-title">' + titleOf(item) + '</span></button>';
}
globalThis.modalToken= 0;
globalThis.openModal = async function openModal(id, type, focusWatch=false){
  if (!modalBackdrop.classList.contains("open")) modalReturnFocus = document.activeElement;
  const myToken = ++modalToken;
  modalBackdrop.classList.add("open");
  modalBackdrop.setAttribute("aria-hidden", "false");
  modalContent.innerHTML = '<div class="loader">Loading details…</div>';
  try {
    const data = await tmdb("/" + type + "/" + id, {append_to_response:"credits,videos,external_ids,similar,recommendations"});
    if (myToken !== modalToken) return;
    const imdbId = data.external_ids && data.external_ids.imdb_id;
    const videos = (data.videos && data.videos.results || []).filter(v => v.site==="YouTube").slice(0,6);
    const trailer = videos.find(v => v.type==="Trailer");
    const runtime = data.runtime ? (data.runtime + " min") : (data.episode_run_time && data.episode_run_time[0] ? (data.episode_run_time[0] + " min/ep") : (data.number_of_seasons ? (data.number_of_seasons + " season" + (data.number_of_seasons>1?'s':'')) : ""));
    const cast = ((data.credits && data.credits.cast) || []).filter(c => c.profile_path).slice(0,14);
    const similar = ((data.similar && data.similar.results) || []).filter(r => r.poster_path).slice(0,10);
    const recs = ((data.recommendations && data.recommendations.results) || []).filter(r => r.poster_path).slice(0,10);
    const saved = isSaved(id, type);
    modalContent.innerHTML =
      '<div class="modal-hero" style="background-image:url(' + backdropImg(data) + ')"><button class="modal-close" id="modalCloseBtn">✕</button></div>' +
      '<div class="modal-body">' +
      '<h2>' + titleOf(data) + '</h2>' +
      (data.tagline ? '<div class="modal-tagline">' + data.tagline + '</div>' : '') +
      '<div class="modal-meta">' +
      '<span style="color:var(--accent); font-weight:700;">★ ' + ratingOf(data) + '</span>' +
      '<span>' + yearOf(data) + '</span>' +
      (runtime ? '<span>' + runtime + '</span>' : '') +
      '<span>' + (type==="movie" ? "Movie" : "TV Show") + '</span>' +
      '</div>' +
      '<div class="modal-genres">' + (data.genres||[]).map(g => '<span>' + g.name + '</span>').join("") + '</div>' +
      '<div class="modal-overview">' + (data.overview || "No overview available.") + '</div>' +
      '<div class="modal-watch">' +
      '<button class="btn btn-play" id="modalPlay">▶ Watch Now</button>' +
      '<button type="button" class="btn-icon ' + (saved?'saved':'') + '" id="modalSave" aria-pressed="' + saved + '" aria-label="' + (saved ? "Remove from My List" : "Add to My List") + '">' + bookmarkSvg(saved) + '</button>' +
      (trailer ? '<button class="btn btn-ghost" id="modalTrailer">▶ Trailer</button>' : '') +
      '<span class="modal-watch-note">' + (type==="tv" ? "Starts at Season 1, Episode 1." : "Plays through encrypted WISP tunnel.") + '</span></div>' +
      (cast.length ? '<div class="modal-section"><div class="modal-section-title">Top Cast</div><div class="cast-rail">' +
        cast.map(c => '<div class="cast-card"><img class="cast-img" loading="lazy" src="' + profileImg(c.profile_path) + '" alt=""><div class="cast-name">' + c.name + '</div><div class="cast-role">' + (c.character||"") + '</div></div>').join("") +
        '</div></div>' : '') +
      (similar.length ? '<div class="modal-section"><div class="modal-section-title">Similar</div><div class="mini-rail">' + similar.map((r,i)=>miniCard(r,i,type)).join("") + '</div></div>' : '') +
      (recs.length ? '<div class="modal-section"><div class="modal-section-title">You Might Also Like</div><div class="mini-rail">' + recs.map((r,i)=>miniCard(r,i,type)).join("") + '</div></div>' : '') +
      '<div class="modal-links" style="margin-top:26px;">' +
      '<a class="btn btn-ghost" target="_blank" rel="noopener" href="https://www.themoviedb.org/' + type + '/' + id + '">TMDB</a>' +
      (imdbId ? '<a class="btn btn-ghost" target="_blank" rel="noopener" href="https://www.imdb.com/title/' + imdbId + '/">IMDb</a>' : '') +
      '</div></div>';

    document.getElementById("modalCloseBtn").onclick = closeModal;
    document.getElementById("modalPlay").onclick = () => openPlayer(id, type, titleOf(data), data);
    document.getElementById("modalSave").onclick = () => {
      toggleSave(data, type);
      const s = isSaved(id, type);
      const mb = document.getElementById("modalSave");
      mb.classList.toggle("saved", s);
      mb.setAttribute("aria-pressed", String(s));
      mb.setAttribute("aria-label", s ? "Remove from My List" : "Add to My List");
      mb.innerHTML = bookmarkSvg(s);
    };
    const trBtn = document.getElementById("modalTrailer");
    if (trBtn && trailer) trBtn.onclick = () => window.open("https://www.youtube.com/watch?v=" + trailer.key, "_blank", "noopener,noreferrer");
    modalContent.querySelectorAll(".mini-card").forEach(mc => {
      mc.onclick = () => { closeModal(); setTimeout(() => openModal(mc.dataset.id, mc.dataset.type), 100); };
    });
    document.getElementById("modalCloseBtn").focus();
  } catch(e){
    if (myToken !== modalToken) return;
    modalContent.replaceChildren();
    const error = document.createElement("div");
    error.className = "loader err";
    error.setAttribute("role", "alert");
    error.textContent = "Could not load title details. Check your connection and retry.";
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "btn btn-ghost";
    retry.textContent = "Retry";
    retry.onclick = () => openModal(id, type, focusWatch);
    const close = document.createElement("button");
    close.type = "button";
    close.className = "btn btn-ghost";
    close.textContent = "Close";
    close.onclick = closeModal;
    error.append(retry, close);
    modalContent.appendChild(error);
    retry.focus();
  }
}
globalThis.closeModal = function closeModal(){
  modalToken++;
  modalBackdrop.classList.remove("open");
  modalBackdrop.setAttribute("aria-hidden", "true");
  modalContent.innerHTML = "";
  if (modalReturnFocus && modalReturnFocus.isConnected) modalReturnFocus.focus();
  else document.querySelector("#view-watch nav a.active")?.focus();
  modalReturnFocus = null;
}
modalBackdrop.addEventListener("click", e => { if (e.target === modalBackdrop) closeModal(); });
document.addEventListener("keydown", e => {
  if (!document.getElementById("view-watch").classList.contains("on")) return;
  if (e.key === "Escape"){
    if (document.getElementById("playerOverlay").classList.contains("open")) closePlayer();
    else if (modalBackdrop.classList.contains("open")) closeModal();
  }
  if (e.key === "/" && !e.target.matches("input,select,textarea")){ e.preventDefault(); searchInput.focus(); }
});


