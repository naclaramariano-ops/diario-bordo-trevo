import type { Usuario } from '../../types';
import { supabase, assertSupabaseReady } from '../../infrastructure/supabase/client';
import { sha256 } from '../../utils/security';
import { put } from '../../services/localDb';

const SESSION_KEY = 'dbt_session_v9';

type LoginResult = Usuario;

function saveSession(user: LoginResult): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export async function login(usuario: string, senha: string): Promise<Usuario> {
  await assertSupabaseReady();

  const normalizedUser = String(usuario || '').trim().toLowerCase();
  const passwordHash = await sha256(String(senha || '').trim());

  // Caminho preferencial: RPC sem expor senha_hash no retorno.
  const rpc = await supabase.rpc('autenticar_usuario_app_v9', {
    p_usuario: normalizedUser,
    p_senha_hash: passwordHash,
  });

  let data: Usuario | null = null;
  if (!rpc.error) {
    data = (Array.isArray(rpc.data) ? rpc.data[0] : rpc.data) as Usuario | null;
  } else if (String(rpc.error.message || '').toLowerCase().includes('function')) {
    // Compatibilidade durante a implantação inicial: a função pode ainda não ter sido executada.
    const fallback = await supabase
      .from('usuarios')
      .select('id,nome,usuario,setor,cargo,perfil,ativo,trocar_senha,criado_em,atualizado_em')
      .eq('usuario', normalizedUser)
      .eq('senha_hash', passwordHash)
      .maybeSingle();
    if (fallback.error) throw new Error(`Não foi possível validar o acesso: ${fallback.error.message}`);
    data = fallback.data as Usuario | null;
  } else {
    console.error('Falha no login Supabase', rpc.error);
    throw new Error(`Não foi possível validar o acesso: ${rpc.error.message}`);
  }

  if (!data) throw new Error('Usuário ou senha inválidos.');
  if (!data.ativo) throw new Error('Usuário inativo.');

  const result = data as Usuario;
  saveSession(result);
  await put('session', { ...result, id: 'current' });
  return result;
}

export function currentUser(): LoginResult | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as LoginResult;

    // Migração transparente de sessões antigas.
    const legacy = localStorage.getItem('dbt_session_v8');
    if (legacy) {
      const parsed = JSON.parse(legacy) as LoginResult;
      saveSession(parsed);
      localStorage.removeItem('dbt_session_v8');
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function sessionToken(): string {
  return currentUser()?.id || '';
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('dbt_session_v8');
}

export function isAdmin(): boolean {
  return currentUser()?.perfil === 'administrador';
}
