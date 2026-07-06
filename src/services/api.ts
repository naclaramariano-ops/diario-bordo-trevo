import { supabase, supabaseConfigured } from './supabase';
import { currentUser } from './auth';
import { sha256, uid } from '../utils/security';
import type { Usuario, Setor, Maquina, Diario, Turno, AuditLog } from '../types';
import { getAll, put } from './localDb';

async function cacheList<T>(store:string, online:()=>Promise<T[]>){
  if(supabaseConfigured&&navigator.onLine){
    try{const data=await online();for(const x of data as any[]) await put(store,x);return data}catch(e){console.warn('cache fallback',store,e)}
  }
  return getAll<T>(store)
}
async function audit(entidade:string, entidade_id:string, acao:string, detalhes:any={}){
  const me=currentUser();
  const row:Partial<AuditLog>={id:uid(),entidade,entidade_id,acao,usuario_id:me?.id,usuario_nome:me?.nome||'Sistema',detalhes,criado_em:new Date().toISOString()};
  if(supabaseConfigured&&navigator.onLine){try{await supabase.from('audit_logs').insert(row)}catch(e){console.warn('audit error',e)}}
  await put('audit_cache',row);
}
function ensureAdmin(){const me=currentUser(); if(me?.perfil!=='administrador') throw new Error('Apenas administrador'); return me}

export const listUsuarios=()=>cacheList<Usuario>('usuarios_cache',async()=>{const {data,error}=await supabase.from('usuarios').select('*').order('nome');if(error)throw error;return data||[]});
const DEFAULT_USER_PASSWORD_HASH='8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'; // senha provisória: 123456
function cleanUndefined(obj:any){Object.keys(obj).forEach(k=>{if(obj[k]===undefined||obj[k]===null||obj[k]==='') delete obj[k]}); return obj}

export async function saveUsuario(input:Partial<Usuario>&{senha?:string}){
  const me=currentUser(); if(!me) throw new Error('Sessão expirada');
  const selfUpdate=input.id===me.id;
  if(me.perfil!=='administrador'&&!selfUpdate) throw new Error('Apenas administrador pode cadastrar usuários');
  let row:any;

  if(me.perfil!=='administrador'&&selfUpdate){
    row={id:me.id};
    if(input.senha) row.senha_hash=await sha256(input.senha);
    if(input.trocar_senha!==undefined) row.trocar_senha=input.trocar_senha;
  } else {
    const isNew=!input.id;
    row={...input,usuario:input.usuario?.toLowerCase().trim(),ativo:input.ativo??true,atualizado_em:new Date().toISOString()};
    if(input.senha) row.senha_hash=await sha256(input.senha);
    if(isNew){
      row.id=uid();
      row.senha_hash=row.senha_hash||DEFAULT_USER_PASSWORD_HASH;
      row.trocar_senha=true;
    } else {
      // Em edição administrativa, se a senha não foi informada, NÃO envia senha_hash nulo para o banco.
      if(!row.senha_hash) delete row.senha_hash;
    }
  }
  delete row.senha;
  cleanUndefined(row);
  if(supabaseConfigured&&navigator.onLine){const {error}=await supabase.from('usuarios').upsert(row,{onConflict:'id'}); if(error) throw error;}
  await put('usuarios_cache',row); await audit('usuarios',row.id,input.id?'editar':'cadastrar',{usuario:row.usuario,nome:row.nome,perfil:row.perfil,ativo:row.ativo}); return row
}
export async function deleteUsuario(id:string){ensureAdmin(); if(supabaseConfigured&&navigator.onLine){const {error}=await supabase.from('usuarios').delete().eq('id',id); if(error) throw error;} await audit('usuarios',id,'excluir',{}); return true}

export const listSetores=()=>cacheList<Setor>('setores_cache',async()=>{const {data,error}=await supabase.from('setores').select('*').order('nome');if(error)throw error;return data||[]});
export async function saveSetor(input:Partial<Setor>){ensureAdmin(); const row={id:input.id||uid(),nome:input.nome,tipo:input.tipo||'',ativo:input.ativo??true,atualizado_em:new Date().toISOString()}; if(supabaseConfigured&&navigator.onLine){const {error}=await supabase.from('setores').upsert(row,{onConflict:'id'}); if(error) throw error;} await put('setores_cache',row); await audit('setores',row.id,input.id?'editar':'cadastrar',row); return row}
export async function deleteSetor(id:string){ensureAdmin(); if(supabaseConfigured&&navigator.onLine){const {error}=await supabase.from('setores').delete().eq('id',id); if(error) throw error;} await audit('setores',id,'excluir',{}); return true}

export const listMaquinas=()=>cacheList<Maquina>('maquinas_cache',async()=>{const {data,error}=await supabase.from('maquinas').select('*').order('ordem').order('nome');if(error)throw error;return data||[]});
export async function saveMaquina(input:Partial<Maquina>){ensureAdmin(); const row={id:input.id||uid(),setor_id:input.setor_id,nome:input.nome,codigo:input.codigo||'',ordem:input.ordem||0,ativo:input.ativo??true,atualizado_em:new Date().toISOString()}; if(supabaseConfigured&&navigator.onLine){const {error}=await supabase.from('maquinas').upsert(row,{onConflict:'id'}); if(error) throw error;} await put('maquinas_cache',row); await audit('maquinas',row.id,input.id?'editar':'cadastrar',row); return row}
export async function deleteMaquina(id:string){ensureAdmin(); if(supabaseConfigured&&navigator.onLine){const {error}=await supabase.from('maquinas').delete().eq('id',id); if(error) throw error;} await audit('maquinas',id,'excluir',{}); return true}

export const listTurnos=()=>cacheList<Turno>('turnos_cache',async()=>{const {data,error}=await supabase.from('turnos').select('*').order('nome');if(error)throw error;return data||[]});
export async function saveTurno(input:Partial<Turno>){
  ensureAdmin();
  const nome=(input.nome||'').trim();
  let id=input.id||'';
  if(!id&&supabaseConfigured&&navigator.onLine&&nome){
    const {data}=await supabase.from('turnos').select('id').ilike('nome',nome).maybeSingle();
    if(data?.id) id=data.id;
  }
  const row={id:id||uid(),nome,inicio:input.inicio||'00:00',fim:input.fim||'00:00',ativo:input.ativo??true,atualizado_em:new Date().toISOString()};
  if(supabaseConfigured&&navigator.onLine){const {error}=await supabase.from('turnos').upsert(row,{onConflict:'id'}); if(error) throw error;}
  await put('turnos_cache',row); await audit('turnos',row.id,input.id||id?'editar':'cadastrar',row); return row
}
export async function deleteTurno(id:string){ensureAdmin(); if(supabaseConfigured&&navigator.onLine){const {error}=await supabase.from('turnos').delete().eq('id',id); if(error) throw error;} await audit('turnos',id,'excluir',{}); return true}

export const listAudit=()=>cacheList<AuditLog>('audit_cache',async()=>{const {data,error}=await supabase.from('audit_logs').select('*').order('criado_em',{ascending:false}).limit(200);if(error)throw error;return data||[]});

export const listDiarios=()=>cacheList<Diario>('diarios_cache',async()=>{const {data,error}=await supabase.from('diarios').select('*').order('criado_em',{ascending:false}).limit(200);if(error)throw error;return data||[]});
export async function saveDiario(input:Partial<Diario>){const me=currentUser(); if(!me) throw new Error('Sessão expirada'); const now=new Date().toISOString(); const existing=input.id; const row:any={...input,id:input.id||uid(),criado_por:input.criado_por||me.id,criado_em:input.criado_em||now,atualizado_em:now}; if(existing){row.editado=true;row.ultima_edicao_por=me.nome;row.ultima_edicao_em=now} if(supabaseConfigured&&navigator.onLine){const {error}=await supabase.from('diarios').upsert(row); if(error){await put('sync_queue',{id:uid(),tipo:'diario',payload:row,criado_em:now}); row.sync_status='pendente'} else row.sync_status='sincronizado'}else{await put('sync_queue',{id:uid(),tipo:'diario',payload:row,criado_em:now}); row.sync_status='pendente'} await put('diarios_cache',row); await audit('diarios',row.id,existing?'editar':'cadastrar',{data:row.data,turno:row.turno,setor:row.setor_nome}); return row}
export async function syncPending(){if(!supabaseConfigured||!navigator.onLine)return 0; const q=await getAll<any>('sync_queue'); let ok=0; for(const item of q){if(item.tipo==='diario'){const {error}=await supabase.from('diarios').upsert(item.payload); if(!error){ok++}}} return ok}
