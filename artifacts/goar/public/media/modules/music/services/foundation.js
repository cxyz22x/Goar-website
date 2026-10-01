import "../../../services/storage.js";
globalThis.STORE="gxm5_";
globalThis.S={
  get(k,f){ try{ const v=JSON.parse(mediaStorage.getItem(STORE+k)); return v==null?f:v;}catch{return f;} },
  set(k,v){ try{ mediaStorage.setItem(STORE+k,JSON.stringify(v)); }catch{} },
  list(){ return this.get("pl",[]); },
  save(l){ this.set("pl",l); },
  prefs(){ return Object.assign({repeat:"off",shuffle:false,vol:80,wisp:music_DEFAULT_WISP_URLS[0]}, this.get("prefs",{})); },
  setPrefs(p){ this.set("prefs", Object.assign(this.prefs(),p)); }
};
globalThis.music_MUSIC_ROOT= document.getElementById("view-music");
globalThis.music_musicQuery=(s,c)=>s==="#filePick"?document.querySelector(s):(c||music_MUSIC_ROOT).querySelector(s);
globalThis.music_musicQueryAll=(s,c)=>[...(c||music_MUSIC_ROOT).querySelectorAll(s)];
globalThis.esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
globalThis.phArt="data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="8" fill="#17171e"/><text x="40" y="46" text-anchor="middle" fill="#c084fc" font-size="18" font-family="sans-serif">♪</text></svg>');
globalThis.thumb=id=>String(id).startsWith("local_")?phArt:"https://i.ytimg.com/vi/"+id+"/hqdefault.jpg";
globalThis.maxart=id=>String(id).startsWith("local_")?phArt:"https://i.ytimg.com/vi/"+id+"/maxresdefault.jpg";
globalThis.fmt=s=>{
  s=Math.max(0,Math.floor(s||0));
  const seconds=String(s%60).padStart(2,"0");
  const minutes=Math.floor(s/60);
  return minutes>=60?Math.floor(minutes/60)+":"+String(minutes%60).padStart(2,"0")+":"+seconds:minutes+":"+seconds;
};
globalThis.music_toast = function music_toast(msg){ music_musicQueryAll(".toast").forEach(t=>t.remove()); const t=document.createElement("div"); t.className="toast"; t.textContent=msg; music_MUSIC_ROOT.appendChild(t); setTimeout(()=>t.remove(),2400); }

