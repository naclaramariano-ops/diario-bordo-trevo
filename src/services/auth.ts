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
    const {data,error}=await supabase
      .from('usuarios')
      .select('id,nome,usuario,senha_hash,setor,cargo,perfil,ativo,trocar_senha,criado_em,atualizado_em')
      .eq('usuario',loginUsuario)
      .maybeSingle<UsuarioLogin>();

    if(error){
      console.error('Erro ao consultar usuário:', error);
      throw new Error('Falha ao consultar usuário no Supabase. Verifique RLS/policies da tabela usuarios.');
    }

    if(!data) throw new Error('Usuário não encontrado.');
    if(!data.ativo) throw new Error('Usuário inativo.');
    if(data.senha_hash !== senha_hash){
      console.warn('Hash digitado:', senha_hash, 'Hash banco:', data.senha_hash);
      throw new Error('Senha inválida.');
    }

    const {senha_hash:_, ...u}=data;
    localStorage.setItem(SESSION_KEY,JSON.stringify(u));
    await put('session',{...u,id:'current'});
    return u as Usuario;
  }

  if(loginUsuario==='ana.peliteiro'&&senha==='admin123'){
    const u={id:'local-admin',nome:'Ana Peliteiro',usuario:'ana.peliteiro',setor:'Operações',cargo:'Administradora Geral',perfil:'administrador',ativo:true,trocar_senha:false} as Usuario;
    localStorage.setItem(SESSION_KEY,JSON.stringify(u));
    return u;
  }

  throw new Error('Não foi possível conectar ao servidor. Verifique a internet e tente novamente.');
}

export function currentUser():Usuario|null{try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}}
export function logout(){localStorage.removeItem(SESSION_KEY)}
export function isAdmin(){return currentUser()?.perfil==='administrador'}
