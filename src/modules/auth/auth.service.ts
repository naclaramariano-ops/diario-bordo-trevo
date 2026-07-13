import type { Usuario } from '../../types';
import { supabase, supabaseConfigured } from '../../infrastructure/supabase/client';
import { sha256 } from '../../utils/security';
import { put } from '../../services/localDb';

const SESSION_KEY = 'dbt_session_v8';

type LoginResult = Usuario & { session_token?: string };

function saveSession(user: LoginResult): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export async function login(usuario: string, senha: string): Promise<Usuario> {
  if (!supabaseConfigured) throw new Error('Conexão corporativa indisponível.');
  if (!navigator.onLine) throw new Error('É necessário estar online para entrar.');

  const p_usuario = String(usuario || '').trim().toLowerCase();
  const p_senha_hash = await sha256(String(senha || '').trim());

  const { data, error } = await supabase.rpc('autenticar_usuario_app_v8', {
    p_usuario,
    p_senha_hash,
  });

  if (error) {
    console.error('auth rpc failed', error);
    throw new Error('Não foi possível validar o acesso no servidor.');
  }

  const result = (Array.isArray(data) ? data[0] : data) as LoginResult | null;
  if (!result) throw new Error('Usuário ou senha inválidos.');
  if (!result.ativo) throw new Error('Usuário inativo.');

  saveSession(result);
  await put('session', { ...result, id: 'current' });
  return result;
}

export function currentUser(): LoginResult | null {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export function sessionToken(): string {
  return currentUser()?.session_token || '';
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function isAdmin(): boolean {
  return currentUser()?.perfil === 'administrador';
}
