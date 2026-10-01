import "../../../services/storage.js";
globalThis.searchTimer = undefined;
globalThis.searchInput= document.getElementById("searchInput");
globalThis.searchResults= document.getElementById("searchResults");
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  const q = searchInput.value.trim();
  if (!q){ searchResults.classList.remove("open"); return; }
  searchTimer = setTimeout(async () => {
    try {
      const data = await tmdb("/search/multi",{query:q, include_adult:false});
      const items = data.results.filter(r => (r.media_type==="movie"||r.media_type==="tv") && r.poster_path).slice(0,10);
      searchResults.innerHTML = items.map(item => {
        const isMusic = (item.genre_ids||[]).includes(MUSIC_GENRE_ID);
        const isKids = (item.genre_ids||[]).some(id => id===10751 || id===16) && !isMusic;
        const label = isMusic ? "Music" : (isKids ? "Kids" : (item.media_type==="movie"?"Movie":"TV"));
        return '<div class="sr-item" data-id="' + item.id + '" data-type="' + item.media_type + '">' +
          '<img src="' + posterImg(item,"w92") + '" alt="' + titleOf(item) + '">' +
          '<div><div class="sr-t">' + titleOf(item) + '</div>' +
          '<div class="sr-m">' + yearOf(item) + ' · ' + label + (item.vote_average ? " · ★ " + item.vote_average.toFixed(1) : "") + '</div></div></div>';
      }).join("") || '<div class="sr-item"><div class="sr-m">No results</div></div>';
      searchResults.classList.add("open");
      searchResults.querySelectorAll(".sr-item[data-id]").forEach(el => {
        el.onclick = () => { openModal(el.dataset.id, el.dataset.type); searchResults.classList.remove("open"); searchInput.value = ""; };
      });
    } catch(e){
      searchResults.innerHTML = '<div class="sr-item"><div class="sr-m">Search failed: ' + e.message + '</div></div>';
      searchResults.classList.add("open");
    }
  }, 300);
});
document.addEventListener("click", e => { if (!e.target.closest(".search-wrap")) searchResults.classList.remove("open"); });

/* ================= MODAL ================= */

