import "../../../services/storage.js";
globalThis.searchSongs = async function searchSongs(q){
  try{ const rows=uniqSongs(await invGet("/api/v1/search?type=video&region=US&q="+encodeURIComponent(q))); if(rows.length) return rows.slice(0,24); }catch{}
  const yt=await ytMusicSearch(q); if(yt.length) return yt.slice(0,24);
  for(const base of PIPED){
    try{ const r=await fetchAny(base+"/search?q="+encodeURIComponent(q)+"&filter=videos"); if(!r||!r.ok) continue; const j=await r.json(); const rows=uniqSongs(Array.isArray(j)?j:(j.items||[])); if(rows.length) return rows.slice(0,24); }catch{}
  }
  return [];
}
globalThis.loadLiveCatalog = async function loadLiveCatalog(){
  const tops=[], news=[];
  for(const pid of TOP_PLAYLISTS){ const rows=await playlistSongs(pid); tops.push(...rows); if(uniqSongs(tops).length>=16) break; }
  try{ const tr=await invGet("/api/v1/trending?type=music&region=US"); tops.push(...uniqSongs(Array.isArray(tr)?tr:[])); }catch{}
  for(const pid of NEW_PLAYLISTS){ const rows=await playlistSongs(pid); news.push(...rows); }
  try{ news.push(...await searchSongs("official music video 2026")); }catch{}
  const t=uniqSongs(tops.concat(TOP_SEED));
  const n=uniqSongs(news.concat(NEW_SEED));
  if(t.length){ state.tops=t.slice(0,40); S.set("tops",state.tops); }
  if(n.length){ state.news=n.slice(0,40); S.set("news",state.news); }
  if(!S.list().length) state.list=state.tops.slice();
}


