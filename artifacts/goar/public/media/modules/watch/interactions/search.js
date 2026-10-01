import "../../../services/storage.js";

globalThis.searchTimer = undefined;
globalThis.searchToken = 0;
globalThis.searchInput = document.getElementById("searchInput");
globalThis.searchResults = document.getElementById("searchResults");

function showSearchMessage(message, isError = false, retryAction = null) {
  searchResults.replaceChildren();
  const row = document.createElement("div");
  row.className = "sr-message" + (isError ? " err" : "");
  row.setAttribute("role", isError ? "alert" : "status");
  row.textContent = message;
  if (retryAction) {
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "btn btn-ghost";
    retry.textContent = "Retry search";
    retry.onclick = retryAction;
    row.appendChild(retry);
  }
  searchResults.appendChild(row);
  searchResults.classList.add("open");
  searchInput.setAttribute("aria-expanded", "true");
}

function closeSearchResults() {
  clearTimeout(searchTimer);
  searchToken++;
  searchResults.classList.remove("open");
  searchInput.setAttribute("aria-expanded", "false");
}

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  const query = searchInput.value.trim();
  const token = ++searchToken;
  if (!query) {
    searchResults.replaceChildren();
    closeSearchResults();
    return;
  }
  showSearchMessage("Searching…");
  searchTimer = setTimeout(async () => {
    try {
      const data = await tmdb("/search/multi", { query, include_adult: false });
      if (token !== searchToken || query !== searchInput.value.trim()) return;
      const items = (data.results || []).filter(item =>
        (item.media_type === "movie" || item.media_type === "tv") && item.poster_path
      ).slice(0, 10);
      searchResults.replaceChildren();
      if (!items.length) {
        showSearchMessage("No matching titles. Try another search.");
        return;
      }
      items.forEach(item => {
        const isMusic = (item.genre_ids || []).includes(MUSIC_GENRE_ID);
        const isKids = (item.genre_ids || []).some(id => id === 10751 || id === 16) && !isMusic;
        const label = isMusic ? "Music" : (isKids ? "Kids" : (item.media_type === "movie" ? "Movie" : "TV"));
        const result = document.createElement("button");
        result.type = "button";
        result.className = "sr-item";
        result.setAttribute("role", "option");
        result.setAttribute("aria-label", `${titleOf(item)}, ${label}, ${yearOf(item)}`);
        const image = document.createElement("img");
        image.src = posterImg(item, "w92");
        image.alt = "";
        image.loading = "lazy";
        const details = document.createElement("span");
        details.className = "sr-copy";
        const title = document.createElement("span");
        title.className = "sr-t";
        title.textContent = titleOf(item);
        const meta = document.createElement("span");
        meta.className = "sr-m";
        meta.textContent = `${yearOf(item)} · ${label}${item.vote_average ? " · ★ " + item.vote_average.toFixed(1) : ""}`;
        details.append(title, meta);
        result.append(image, details);
        result.onclick = () => {
          searchInput.focus();
          openModal(item.id, item.media_type);
          closeSearchResults();
          searchInput.value = "";
        };
        searchResults.appendChild(result);
      });
      searchResults.classList.add("open");
      searchInput.setAttribute("aria-expanded", "true");
    } catch {
      if (token !== searchToken) return;
      showSearchMessage("Search is unavailable right now. Check your connection and retry.", true, () => {
        if (query === searchInput.value.trim()) searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
  }, 300);
});

searchInput.addEventListener("keydown", event => {
  if (event.key === "Escape") closeSearchResults();
});
document.addEventListener("click", event => {
  if (!event.target.closest(".search-wrap")) closeSearchResults();
});