import { syncPending } from '../../../services/api';
import { getAll, getMeta } from '../../../services/localDb';
import type { SyncSnapshot } from '../types';

const EMPTY: SyncSnapshot = {
  state: navigator.onLine ? 'synced' : 'offline',
  online: navigator.onLine,
  pendingCount: 0,
  failedCount: 0,
  lastSyncAt: null,
  lastError: null,
};

export async function readSyncSnapshot(): Promise<SyncSnapshot> {
  const online = navigator.onLine;
  const queue = await getAll<any>('sync_queue').catch(() => []);
  const lastSync = await getMeta('last_sync_at').catch(() => undefined);
  const failed = queue.filter((item) => Number(item.tentativas || 0) > 0);
  const lastFailure = [...failed]
    .sort((a, b) => String(b.atualizado_em || '').localeCompare(String(a.atualizado_em || '')))[0];

  const pendingCount = queue.length;
  const failedCount = failed.length;
  const state: SyncSnapshot['state'] = !online
    ? 'offline'
    : failedCount > 0
      ? 'error'
      : pendingCount > 0
        ? 'pending'
        : 'synced';

  return {
    ...EMPTY,
    online,
    state,
    pendingCount,
    failedCount,
    lastSyncAt: lastSync?.value || null,
    lastError: lastFailure?.ultimo_erro || null,
  };
}

export async function executeSync(): Promise<SyncSnapshot> {
  if (!navigator.onLine) return readSyncSnapshot();
  await syncPending();
  return readSyncSnapshot();
}

export function formatSyncDate(value: string | null) {
  if (!value) return 'Ainda não registrada';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Ainda não registrada';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(date);
}
