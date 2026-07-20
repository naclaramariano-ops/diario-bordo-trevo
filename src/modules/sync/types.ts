export type SyncState = 'offline' | 'synced' | 'pending' | 'syncing' | 'error';

export interface SyncSnapshot {
  state: SyncState;
  online: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncAt: string | null;
  lastError: string | null;
}
