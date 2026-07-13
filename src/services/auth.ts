import { supabase, supabaseConfigured } from './supabase';
import { sha256 } from '../utils/security';
import type { Usuario } from '../types';
import { put } from './localDb';

const SESSION_KEY='dbt_session';

type UsuarioLogin = Usuario & { senha_hash?: string };

export async function login(usuario:string, senha:string):Promise<Usuario>{
  const loginUsuario=(usuario||'').trim().toLowerCase();
  const senha_hash=await sha256((senha||'').trim());

  if(supabaseConfigured){
    const {data,error}=await supabase.rpc('autenticar_usuario_app',{
      p_usuario:loginUsuario,
      p_senha_hash:senha_hash,
    });

    if(error){
      console.error('Erro ao autenticar no Supabase:',error);
      throw new Error('Não foi possível validar o acesso no servidor.');
    }

    const u=Array.isArray(data)?data[0]:data;
    if(!u) throw new Error('Usuário ou senha inválidos.');
    if(!u.ativo) throw new Error('Usuário inativo.');

    localStorage.setItem(SESSION_KEY,JSON.stringify(u));
    await put('session',{...u,id:'current'});
    return u as Usuario;
  }

  throw new Error('Não foi possível conectar ao servidor. Verifique a internet e tente novamente.');
}

export function currentUser():Usuario|null{try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}}
export function logout(){localStorage.removeItem(SESSION_KEY)}
export function isAdmin(){return currentUser()?.perfil==='administrador'}
