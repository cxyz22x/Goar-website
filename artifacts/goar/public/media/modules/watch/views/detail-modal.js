import "../../../services/storage.js";
globalThis.modalBackdrop= document.getElementById("modalBackdrop");
globalThis.modalContent= document.getElementById("modalContent");
globalThis.miniCard = function miniCard(item, idx, type){
  return '<div class="mini-card anim-up" style="animation-delay:' + (idx*35) + 'ms" data-id="' + item.id + '" data-type="' + type + '">' +
    '<div class="mc-img"><img loading="lazy" src="' + posterImg(item,"w342") + '" alt=""><div class="mc-rating">★ ' + ratingOf(item) + '</div></div>' +
    '<div class="mc-title">' + titleOf(item) + '</div></div>';
}
globalThis.modalToken= 0;
globalThis.openModal = async function openModal(id, type, focusWatch=false){
  const myToken = ++modalToken;
  modalBackdrop.classList.add("open");
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
      '<button class="btn-icon ' + (saved?'saved':'') + '" id="modalSave">' + bookmarkSvg(saved) + '</button>' +
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
      mb.classList.toggle("saved", s); mb.innerHTML = bookmarkSvg(s);
    };
    const trBtn = document.getElementById("modalTrailer");
    if (trBtn && trailer) trBtn.onclick = () => window.open("https://www.youtube.com/watch?v=" + trailer.key, "_blank");
    modalContent.querySelectorAll(".mini-card").forEach(mc => {
      mc.onclick = () => { closeModal(); setTimeout(() => openModal(mc.dataset.id, mc.dataset.type), 100); };
    });
  } catch(e){
    if (myToken !== modalToken) return;
    modalContent.innerHTML = '<div class="loader err">Couldn\'t load details.<br><code>' + e.message + '</code><br><button class="btn btn-ghost" id="modalCloseBtn2" style="margin-top:10px;">Close</button></div>';
    document.getElementById("modalCloseBtn2").onclick = closeModal;
  }
}
globalThis.closeModal = function closeModal(){ modalBackdrop.classList.remove("open"); modalContent.innerHTML = ""; }
modalBackdrop.addEventListener("click", e => { if (e.target === modalBackdrop) closeModal(); });
document.addEventListener("keydown", e => {
  if (!document.getElementById("view-watch").classList.contains("on")) return;
  if (e.key === "Escape"){
    if (document.getElementById("playerOverlay").classList.contains("open")) closePlayer();
    else closeModal();
  }
  if (e.key === "/" && !e.target.matches("input,select,textarea")){ e.preventDefault(); searchInput.focus(); }
});


