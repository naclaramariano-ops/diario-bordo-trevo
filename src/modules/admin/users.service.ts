import type { Usuario } from '../../types';
import { supabase, assertSupabaseReady } from '../../infrastructure/supabase/client';
import { currentUser, sessionToken } from '../auth/auth.service';
import { sha256, uid } from '../../utils/security';
import { clear, del, put } from '../../services/localDb';

const SAFE_COLUMNS = 'id,nome,usuario,setor,cargo,perfil,ativo,trocar_senha,criado_em,atualizado_em';
const DEFAULT_PASSWORD_HASH = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';

function requireAdmin(): void {
  if (currentUser()?.perfil !== 'administrador') throw new Error('Apenas administrador.');
}

export async function listUsuarios(): Promise<Usuario[]> {
  await assertSupabaseReady();

  // Fonte oficial única: Supabase. O IndexedDB é somente uma fotografia de leitura offline.
  const { data, error } = await supabase.rpc('listar_usuarios_app_v8', {
    p_session_token: sessionToken(),
  });

  if (error) {
    console.error('list users rpc failed', error);
    throw new Error(`Não foi possível carregar os usuários do servidor: ${error.message}`);
  }

  const users = ((data || []) as Usuario[]).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  await clear('usuarios_cache');
  for (const user of users) await put('usuarios_cache', user);
  return users;
}

export async function saveUsuario(input: Partial<Usuario> & { senha?: string }): Promise<Usuario> {
  await assertSupabaseReady();
  const me = currentUser();
  if (!me) throw new Error('Sessão expirada.');
  const selfUpdate = Boolean(input.id && input.id === me.id);
  if (!selfUpdate) requireAdmin();

  const row: Record<string, unknown> = {
    id: input.id || uid(),
    nome: input.nome,
    usuario: input.usuario?.toLowerCase().trim(),
    setor: input.setor,
    cargo: input.cargo,
    perfil: input.perfil,
    ativo: input.ativo ?? true,
    trocar_senha: input.trocar_senha ?? !input.id,
    atualizado_em: new Date().toISOString(),
  };

  if (input.senha) row.senha_hash = await sha256(input.senha);
  else if (!input.id) row.senha_hash = DEFAULT_PASSWORD_HASH;

  Object.keys(row).forEach((key) => row[key] === undefined && delete row[key]);

  const { data, error } = await supabase.rpc('salvar_usuario_app_v8', {
    p_session_token: sessionToken(),
    p_payload: row,
  });
  if (error) throw new Error(error.message);

  const saved = (Array.isArray(data) ? data[0] : data) as Usuario;
  await put('usuarios_cache', saved);
  return saved;
}

export async function deleteUsuario(id: string): Promise<void> {
  await assertSupabaseReady();
  requireAdmin();
  const { error } = await supabase.rpc('excluir_usuario_app_v8', {
    p_session_token: sessionToken(),
    p_usuario_id: id,
  });
  if (error) throw new Error(error.message);
  await del('usuarios_cache', id);
}
