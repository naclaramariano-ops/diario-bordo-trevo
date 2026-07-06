const DB_NAME = 'diario_bordo_trevo_offline';

/**
 * V5 Enterprise Foundation
 * - Versionamento real do banco offline.
 * - Criação automática de novas object stores.
 * - Migração automática sem orientar o usuário a limpar cache.
 * - Preserva dados existentes em upgrades normais do IndexedDB.
 */
export const OFFLINE_DB_VERSION = 10;

export const OFFLINE_STORES = [
  'meta',
  'session',
  'usuarios_cache',
  'setores_cache',
  'maquinas_cache',
  'turnos_cache',
  'diarios_cache',
  'sync_queue',
  'audit_cache',
  'config_cache',
  'conflicts_cache',
] as const;

export type OfflineStore = typeof OFFLINE_STORES[number];

function createStoreIfMissing(db: IDBDatabase, name: string) {
  if (!db.objectStoreNames.contains(name)) {
    db.createObjectStore(name, { keyPath: 'id' });
  }
}

function migrate(db: IDBDatabase) {
  OFFLINE_STORES.forEach((store) => createStoreIfMissing(db, store));
}

function openWithVersion(version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, version);

    request.onupgradeneeded = () => {
      migrate(request.result);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      console.warn('IndexedDB bloqueado por outra aba aberta. Feche outras abas do Diário de Bordo Trevo.');
    };
  });
}

async function ensureAllStores(db: IDBDatabase): Promise<IDBDatabase> {
  const missing = OFFLINE_STORES.some((store) => !db.objectStoreNames.contains(store));
  if (!missing) return db;

  const nextVersion = db.version + 1;
  db.close();

  const upgraded = await openWithVersion(nextVersion);
  const stillMissing = OFFLINE_STORES.some((store) => !upgraded.objectStoreNames.contains(store));

  if (stillMissing) {
    upgraded.close();
    throw new Error('Não foi possível migrar o banco offline automaticamente. Feche outras abas do app e atualize a página.');
  }

  return upgraded;
}

export async function openDb(): Promise<IDBDatabase> {
  const db = await openWithVersion(OFFLINE_DB_VERSION);
  const ready = await ensureAllStores(db);
  await putMeta('offline_db_version', String(ready.version));
  await putMeta('offline_db_updated_at', new Date().toISOString());
  return ready;
}

function txComplete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transação IndexedDB abortada.'));
  });
}

export async function put(store: OfflineStore | string, value: any): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).put(value);
  await txComplete(tx);
  db.close();
}

export async function get<T = any>(store: OfflineStore | string, id: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(id);
    req.onsuccess = () => { db.close(); resolve(req.result as T | undefined); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function getAll<T>(store: OfflineStore | string): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => { db.close(); resolve(req.result as T[]); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function del(store: OfflineStore | string, id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).delete(id);
  await txComplete(tx);
  db.close();
}

export async function clear(store: OfflineStore | string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).clear();
  await txComplete(tx);
  db.close();
}

export async function enqueueSync(item: {
  id?: string;
  tabela: string;
  operacao: 'upsert' | 'delete';
  payload?: any;
  chave?: string;
  criado_em?: string;
}) {
  const row = {
    id: item.id || `${item.tabela}_${item.operacao}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    tabela: item.tabela,
    operacao: item.operacao,
    payload: item.payload || null,
    chave: item.chave || item.payload?.id || null,
    tentativas: 0,
    status: 'pendente',
    criado_em: item.criado_em || new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
  };
  await put('sync_queue', row);
  return row;
}

export async function putMeta(key: string, value: string) {
  const db = await openWithVersion(OFFLINE_DB_VERSION);
  const upgraded = await ensureAllStores(db);
  const tx = upgraded.transaction('meta', 'readwrite');
  tx.objectStore('meta').put({ id: key, value, atualizado_em: new Date().toISOString() });
  await txComplete(tx);
  upgraded.close();
}

export async function getMeta(key: string) {
  return get<{ id: string; value: string }>('meta', key);
}

export async function registerConflict(conflict: any) {
  await put('conflicts_cache', {
    id: conflict.id || `conflict_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    ...conflict,
    criado_em: conflict.criado_em || new Date().toISOString(),
  });
}
