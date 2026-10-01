import "../../../services/storage.js";
globalThis.IDB_NAME="goarxyz-media-music",globalThis.IDB_LEGACY_NAME="goarxyz-music",globalThis.IDB_STORE="tracks";
globalThis.idbOpen = function idbOpen(name=IDB_NAME){
  if(!globalThis.indexedDB) return Promise.reject(new Error("This browser does not support local music storage."));
  return new Promise((res,rej)=>{
    const req=indexedDB.open(name,1);
    req.onupgradeneeded=()=>{ if(!req.result.objectStoreNames.contains(IDB_STORE)) req.result.createObjectStore(IDB_STORE); };
    req.onsuccess=()=>res(req.result);
    req.onerror=()=>rej(req.error||new Error("Could not open local music storage."));
    req.onblocked=()=>rej(new Error("Local music storage is blocked by another browser tab."));
  });
}
globalThis.idbPut = async function idbPut(id,blob){
  const db=await idbOpen();
  try{
    await new Promise((res,rej)=>{
      const tx=db.transaction(IDB_STORE,"readwrite");
      tx.objectStore(IDB_STORE).put(blob,id);
      tx.oncomplete=res;
      tx.onabort=()=>rej(tx.error||new Error("Could not save this audio file."));
      tx.onerror=()=>rej(tx.error||new Error("Could not save this audio file."));
    });
  }finally{ db.close(); }
}
globalThis.idbRead = async function idbRead(id,name=IDB_NAME){
  const db=await idbOpen(name);
  try{
    return await new Promise((res,rej)=>{
      const tx=db.transaction(IDB_STORE,"readonly"), req=tx.objectStore(IDB_STORE).get(id);
      req.onsuccess=()=>res(req.result||null);
      req.onerror=()=>rej(req.error||new Error("Could not read this audio file."));
    });
  }finally{ db.close(); }
}
globalThis.idbGet = async function idbGet(id){
  const current=await idbRead(id);
  if(current) return current;
  try{
    const previous=await idbRead(id,IDB_LEGACY_NAME);
    if(previous){ await idbPut(id,previous); return previous; }
  }catch(e){
    if(e&&e.name!=="NotFoundError") throw e;
  }
  return null;
}
globalThis.inspectAudioFile = function inspectAudioFile(file,timeout=5000){
  return new Promise(resolve=>{
    const audio=new Audio(), url=URL.createObjectURL(file);
    let done=false;
    const finish=duration=>{
      if(done) return;
      done=true; clearTimeout(timer);
      audio.removeAttribute("src"); audio.load(); URL.revokeObjectURL(url);
      resolve(Number.isFinite(duration)&&duration>0?duration:0);
    };
    const timer=setTimeout(()=>finish(0),timeout);
    audio.preload="metadata";
    audio.onloadedmetadata=()=>finish(audio.duration);
    audio.onerror=()=>finish(0);
    audio.src=url;
    audio.load();
  });
}
globalThis.isLocal = function isLocal(s){ return !!(s&&(s.local||String(s.id||"").startsWith("local_"))); }


