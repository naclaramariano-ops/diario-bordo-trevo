import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/,'');
const key = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const supabaseConfigured = Boolean(
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) &&
  key.length > 20 &&
  !url.includes('SEU_PROJETO') &&
  !key.includes('SUA_CHAVE')
);

const safeUrl = supabaseConfigured ? url : 'https://placeholder.supabase.co';
const safeKey = supabaseConfigured ? key : 'placeholder-public-anon-key';

export const supabase: SupabaseClient = createClient(safeUrl, safeKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { headers: { 'X-Client-Info': 'diario-bordo-trevo/6.7.10' } },
});

export function requireSupabase(){
  if(!supabaseConfigured) throw new Error('Conexão corporativa indisponível. Verifique as variáveis do Supabase no Cloudflare.');
  return supabase;
}
