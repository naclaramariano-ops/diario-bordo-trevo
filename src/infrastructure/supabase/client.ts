import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { appEnv } from '../../core/env';

const placeholderUrl = 'https://placeholder.supabase.co';
const placeholderKey = 'placeholder-public-key-not-used';

export const supabaseConfigured = appEnv.configured;

export const supabase: SupabaseClient = createClient(
  supabaseConfigured ? appEnv.supabaseUrl : placeholderUrl,
  supabaseConfigured ? appEnv.supabaseKey : placeholderKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { 'x-client-info': 'diario-bordo-trevo-v8' },
    },
  },
);

export async function assertSupabaseReady(): Promise<void> {
  if (!supabaseConfigured) {
    throw new Error('A conexão corporativa não foi carregada no aplicativo.');
  }
  if (!navigator.onLine) {
    throw new Error('Sem conexão com a internet.');
  }

  const { error } = await supabase.from('usuarios').select('id', { head: true, count: 'exact' }).limit(1);
  if (error) throw new Error(`Servidor indisponível: ${error.message}`);
}
