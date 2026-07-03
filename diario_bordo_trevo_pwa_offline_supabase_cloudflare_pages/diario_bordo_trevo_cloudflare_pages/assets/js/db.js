const DBT_DB = (() => {
  const DB_NAME = 'diario_bordo_trevo_offline_db';
  const DB_VERSION = 1;
  let dbPromise = null;
  function openDB(){
    if(dbPromise) return dbPromise;
    dbPromise = new Promise((resolve,reject)=>{
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        ['usuarios','setores','maquinas','diarios','diario_maquinas','outbox','session'].forEach(store=>{
          if(!db.objectStoreNames.contains(store)) db.createObjectStore(store,{keyPath:'id'});
        });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }
  async function tx(store, mode='readonly'){
    const db = await openDB();
    return db.transaction(store, mode).objectStore(store);
  }
  async function put(store, value){ return new Promise(async (res,rej)=>{ const s=await tx(store,'readwrite'); const r=s.put(value); r.onsuccess=()=>res(value); r.onerror=()=>rej(r.error); }); }
  async function get(store, id){ return new Promise(async (res,rej)=>{ const s=await tx(store); const r=s.get(id); r.onsuccess=()=>res(r.result||null); r.onerror=()=>rej(r.error); }); }
  async function del(store, id){ return new Promise(async (res,rej)=>{ const s=await tx(store,'readwrite'); const r=s.delete(id); r.onsuccess=()=>res(true); r.onerror=()=>rej(r.error); }); }
  async function all(store){ return new Promise(async (res,rej)=>{ const s=await tx(store); const r=s.getAll(); r.onsuccess=()=>res(r.result||[]); r.onerror=()=>rej(r.error); }); }
  async function clear(store){ return new Promise(async (res,rej)=>{ const s=await tx(store,'readwrite'); const r=s.clear(); r.onsuccess=()=>res(true); r.onerror=()=>rej(r.error); }); }
  async function bulkPut(store, rows){ for(const row of rows||[]) await put(store,row); return rows; }
  return {openDB, put, get, del, all, clear, bulkPut};
})();
