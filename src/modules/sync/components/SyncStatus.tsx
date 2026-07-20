import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, CloudOff, RefreshCcw, UploadCloud, X } from 'lucide-react';
import { executeSync, formatSyncDate, readSyncSnapshot } from '../services/syncStatus.service';
import type { SyncSnapshot } from '../types';

const initial: SyncSnapshot = {
  state: navigator.onLine ? 'synced' : 'offline', online: navigator.onLine,
  pendingCount: 0, failedCount: 0, lastSyncAt: null, lastError: null,
};

export function SyncStatus({ onChanged }: { onChanged?: () => void }) {
  const [snapshot, setSnapshot] = useState<SyncSnapshot>(initial);
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [flash, setFlash] = useState('');
  const syncingRef = useRef(false);

  const refresh = useCallback(async () => {
    const next = await readSyncSnapshot();
    setSnapshot(next);
    return next;
  }, []);

  const run = useCallback(async (automatic = false) => {
    if (!navigator.onLine || syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    setSnapshot((current: SyncSnapshot) => ({ ...current, state: 'syncing', online: true }));
    try {
      const next = await executeSync();
      setSnapshot(next);
      onChanged?.();
      if (!automatic) {
        setFlash(next.pendingCount === 0 ? 'Tudo atualizado.' : `${next.pendingCount} registro(s) ainda pendente(s).`);
        window.setTimeout(() => setFlash(''), 3500);
      }
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [onChanged]);

  useEffect(() => {
    let active = true;
    const update = async () => {
      const next = await readSyncSnapshot();
      if (!active) return;
      setSnapshot(next);
      if (next.online && next.pendingCount > 0 && next.failedCount === 0 && !syncingRef.current) {
        void run(true);
      }
    };
    const eventUpdate = () => { void update(); };
    void update();
    window.addEventListener('online', eventUpdate);
    window.addEventListener('offline', eventUpdate);
    window.addEventListener('dbt:sync-queue-changed', eventUpdate as EventListener);
    const timer = window.setInterval(eventUpdate, 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('online', eventUpdate);
      window.removeEventListener('offline', eventUpdate);
      window.removeEventListener('dbt:sync-queue-changed', eventUpdate as EventListener);
    };
  }, [run]);

  const label = snapshot.state === 'offline' ? 'Offline'
    : snapshot.state === 'syncing' ? 'Sincronizando'
    : snapshot.state === 'error' || snapshot.state === 'pending'
      ? `${snapshot.pendingCount} pendente${snapshot.pendingCount === 1 ? '' : 's'}`
      : 'Sincronizado';

  const Icon = snapshot.state === 'offline' ? CloudOff
    : snapshot.state === 'syncing' ? RefreshCcw
    : snapshot.state === 'error' ? AlertTriangle
    : snapshot.state === 'pending' ? UploadCloud
    : CheckCircle2;

  return <>
    <button className={`syncStatusChip ${snapshot.state}`} onClick={() => setOpen(true)} aria-label="Abrir status da sincronização">
      <Icon size={15} className={snapshot.state === 'syncing' ? 'spinIcon' : ''}/><span>{label}</span>
    </button>
    {open && <div className="syncModalBackdrop" onClick={() => setOpen(false)}>
      <section className="syncModal" onClick={(event: React.MouseEvent) => event.stopPropagation()}>
        <header><div><b>Status da sincronização</b><span>Envio automático entre este aparelho e o Supabase.</span></div><button className="iconBtn" onClick={() => setOpen(false)}><X size={20}/></button></header>
        <div className="syncStatusRows">
          <div><span>Internet</span><b className={snapshot.online ? 'positiveText' : 'negativeText'}>{snapshot.online ? 'Conectado' : 'Sem conexão'}</b></div>
          <div><span>Registros pendentes</span><b>{snapshot.pendingCount}</b></div>
          <div><span>Última sincronização</span><b>{formatSyncDate(snapshot.lastSyncAt)}</b></div>
        </div>
        {snapshot.state === 'offline' && <div className="syncInfo offline">Os registros feitos offline ficam salvos neste aparelho e serão enviados automaticamente quando a internet voltar.</div>}
        {snapshot.lastError && <div className="syncInfo error"><b>Última falha</b><span>{snapshot.lastError}</span></div>}
        {flash && <div className="syncInfo success">{flash}</div>}
        {(snapshot.pendingCount > 0 || snapshot.failedCount > 0) && snapshot.online && <button className="primary syncAction" disabled={syncing} onClick={() => void run(false)}><RefreshCcw size={18} className={syncing ? 'spinIcon' : ''}/>{syncing ? 'Sincronizando...' : 'Sincronizar pendências'}</button>}
        {snapshot.pendingCount === 0 && snapshot.online && <div className="syncAllGood"><CheckCircle2 size={20}/><div><b>Tudo sincronizado</b><span>Nenhuma ação manual é necessária.</span></div></div>}
      </section>
    </div>}
  </>;
}
