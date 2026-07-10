import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Inicialização resiliente do Supabase.
 * A interface nunca deve ficar branca apenas porque as variáveis do build
 * não foram recebidas. Sem configuração, o app abre em modo local/offline.
 */
const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
const key = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const supabaseConfigured = Boolean(
  url &&
  key &&
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url) &&
  !url.includes('SEU_PROJETO') &&
  !key.includes('SUA_CHAVE')
);

const safeUrl = supabaseConfigured ? url : 'https://placeholder.supabase.co';
const safeKey = supabaseConfigured ? key : 'placeholder-public-anon-key';

export const supabase: SupabaseClient = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
