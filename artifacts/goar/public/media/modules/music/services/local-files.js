import "../../../services/storage.js";
globalThis.IDB_NAME="goarxyz-media-music",globalThis.IDB_STORE="tracks";
globalThis.idbOpen = function idbOpen(){ return new Promise((res,rej)=>{ const req=indexedDB.open(IDB_NAME,1); req.onupgradeneeded=()=>req.result.createObjectStore(IDB_STORE); req.onsuccess=()=>res(req.result); req.onerror=()=>rej(req.error); }); }
globalThis.idbPut = async function idbPut(id,blob){ const db=await idbOpen(); await new Promise((res,rej)=>{ const tx=db.transaction(IDB_STORE,"readwrite"); tx.objectStore(IDB_STORE).put(blob,id); tx.oncomplete=res; tx.onerror=()=>rej(tx.error); }); }
globalThis.idbGet = async function idbGet(id){ const db=await idbOpen(); return new Promise((res,rej)=>{ const tx=db.transaction(IDB_STORE,"readonly"); const req=tx.objectStore(IDB_STORE).get(id); req.onsuccess=()=>res(req.result||null); req.onerror=()=>rej(req.error); }); }
globalThis.isLocal = function isLocal(s){ return !!(s&&(s.local||String(s.id||"").startsWith("local_"))); }


