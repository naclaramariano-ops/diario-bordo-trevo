export type AppEnvironment = {
  supabaseUrl: string;
  supabaseKey: string;
  configured: boolean;
};

function normalizeUrl(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/$/, '');
}

const supabaseUrl = normalizeUrl(import.meta.env.VITE_SUPABASE_URL);
const supabaseKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

export const appEnv: AppEnvironment = Object.freeze({
  supabaseUrl,
  supabaseKey,
  configured:
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl) &&
    supabaseKey.length > 20 &&
    !supabaseKey.includes('SUA_CHAVE') &&
    !supabaseUrl.includes('SEU_PROJETO'),
});
