import { supabaseConfigured, requireSupabase } from './supabase';
import { sha256 } from '../utils/security';
import type { Usuario } from '../types';

const SESSION_KEY='dbt_session';
type UsuarioLogin = Usuario & { senha_hash?: string };

export async function login(usuario:string, senha:string):Promise<Usuario>{
  const loginUsuario=(usuario||'').trim().toLowerCase();
  const senha_hash=await sha256((senha||'').trim());
  if(!supabaseConfigured) throw new Error('Servidor corporativo indisponível. Tente novamente quando houver conexão.');
  if(!navigator.onLine) throw new Error('Sem conexão com a internet. O primeiro login neste aparelho precisa ser online.');

  const db=requireSupabase();
  const {data,error}=await db.from('usuarios')
    .select('id,nome,usuario,senha_hash,setor,cargo,perfil,ativo,trocar_senha,criado_em,atualizado_em')
    .ilike('usuario',loginUsuario)
    .maybeSingle<UsuarioLogin>();
  if(error) throw new Error('Não foi possível consultar o usuário no servidor.');
  if(!data) throw new Error('Usuário ou senha incorretos.');
  if(!data.ativo) throw new Error('Usuário inativo. Procure a administradora.');
  if(data.senha_hash !== senha_hash) throw new Error('Usuário ou senha incorretos.');
  const {senha_hash:_, ...u}=data;
  localStorage.setItem(SESSION_KEY,JSON.stringify(u));
  return u as Usuario;
}

export function currentUser():Usuario|null{try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}}
export function logout(){localStorage.removeItem(SESSION_KEY)}
export function isAdmin(){return currentUser()?.perfil==='administrador'}
