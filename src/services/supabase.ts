import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Inicialização resiliente do Supabase.
 * A interface nunca deve ficar branca apenas porque as variáveis do build
 * não foram recebidas. Sem configuração, o app abre em modo local/offline.
 */
const rawUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Aceita a URL do projeto com ou sem barra final e remove, por segurança,
// um eventual /rest/v1 informado na configuração. A versão anterior usava
// uma validação excessivamente restritiva e podia colocar o app em modo local
// mesmo com as variáveis corretas configuradas no Cloudflare.
const url = rawUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/$/, '');
const key = rawKey;

export const supabaseConfigured = Boolean(
  url.startsWith('https://') &&
  url.includes('.supabase.co') &&
  key.length > 20 &&
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
