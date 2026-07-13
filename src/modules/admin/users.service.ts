import type { Usuario } from '../../types';
import { supabase, assertSupabaseReady } from '../../infrastructure/supabase/client';
import { currentUser } from '../auth/auth.service';
import { sha256, uid } from '../../utils/security';
import { clear, del, getAll, put } from '../../services/localDb';

const SAFE_COLUMNS = 'id,nome,usuario,setor,cargo,perfil,ativo,trocar_senha,criado_em,atualizado_em';
const DEFAULT_PASSWORD_HASH = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';

function requireAdmin(): void {
  if (currentUser()?.perfil !== 'administrador') throw new Error('Apenas administrador.');
}

export async function listUsuarios(): Promise<Usuario[]> {
  if (!navigator.onLine) {
    const cached = await getAll<Usuario>('usuarios_cache');
    return cached.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  await assertSupabaseReady();
  const { data, error } = await supabase
    .from('usuarios')
    .select(SAFE_COLUMNS)
    .order('nome', { ascending: true });

  if (error) {
    console.error('Falha ao listar usuários no Supabase', error);
    throw new Error(`Não foi possível carregar os usuários: ${error.message}`);
  }

  const users = (data || []) as Usuario[];
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

  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    id: input.id || uid(),
    nome: input.nome?.trim(),
    usuario: input.usuario?.toLowerCase().trim(),
    setor: input.setor?.trim(),
    cargo: input.cargo?.trim(),
    perfil: input.perfil || 'usuario',
    ativo: input.ativo ?? true,
    trocar_senha: input.trocar_senha ?? !input.id,
    atualizado_em: now,
  };

  if (!input.id) payload.criado_em = now;
  if (input.senha) payload.senha_hash = await sha256(input.senha);
  else if (!input.id) payload.senha_hash = DEFAULT_PASSWORD_HASH;

  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

  const { data, error } = await supabase
    .from('usuarios')
    .upsert(payload, { onConflict: 'id' })
    .select(SAFE_COLUMNS)
    .single();

  if (error) {
    console.error('Falha ao salvar usuário no Supabase', error);
    throw new Error(`Não foi possível salvar o usuário: ${error.message}`);
  }

  const saved = data as Usuario;
  await put('usuarios_cache', saved);
  return saved;
}

export async function deleteUsuario(id: string): Promise<void> {
  await assertSupabaseReady();
  requireAdmin();
  if (currentUser()?.id === id) throw new Error('Não é permitido excluir o próprio usuário.');

  const { error } = await supabase.from('usuarios').delete().eq('id', id);
  if (error) throw new Error(`Não foi possível excluir o usuário: ${error.message}`);
  await del('usuarios_cache', id);
}
