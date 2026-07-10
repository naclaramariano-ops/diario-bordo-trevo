import { supabase, supabaseConfigured } from './supabase';
import { currentUser } from './auth';
import { sha256, uid } from '../utils/security';
import type { Usuario, Setor, Maquina, Diario, Turno, AuditLog } from '../types';
import { del, enqueueSync, get, getAll, put, registerConflict } from './localDb';

async function cacheList<T>(store:string, online:()=>Promise<T[]>){
  if(supabaseConfigured&&navigator.onLine){
    try{const data=await online();for(const x of data as any[]) await put(store,x);return data}catch(e){console.warn('cache fallback',store,e)}
  }
  return getAll<T>(store)
}
async function audit(entidade:string, entidade_id:string, acao:string, detalhes:any={}){
  const me=currentUser();
  const row:Partial<AuditLog>={id:uid(),entidade,entidade_id,acao,usuario_id:me?.id||'sistema',usuario_nome:me?.nome||'Sistema',detalhes,criado_em:new Date().toISOString()};
  if(supabaseConfigured&&navigator.onLine){try{await supabase.from('audit_logs').insert(row)}catch(e){console.warn('audit error',e);await enqueueSync({tabela:'audit_logs',operacao:'upsert',payload:row})}}
  else await enqueueSync({tabela:'audit_logs',operacao:'upsert',payload:row});
  await put('audit_cache',row);
}
function ensureAdmin(){const me=currentUser(); if(me?.perfil!=='administrador') throw new Error('Apenas administrador'); return me}
function cleanUndefined(obj:any){Object.keys(obj).forEach(k=>{if(obj[k]===undefined||obj[k]===null||obj[k]==='') delete obj[k]}); return obj}
async function upsertOnlineOrQueue(tabela:string,row:any,cacheStore:string){
  const now=new Date().toISOString();
  row.atualizado_em=row.atualizado_em||now;
  if(supabaseConfigured&&navigator.onLine){
    const {error}=await supabase.from(tabela).upsert(row,{onConflict:'id'});
    if(error){
      await enqueueSync({tabela,operacao:'upsert',payload:row});
      row.sync_status='pendente';
    }else row.sync_status='sincronizado';
  }else{
    await enqueueSync({tabela,operacao:'upsert',payload:row});
    row.sync_status='pendente';
  }
  await put(cacheStore,row);
  return row;
}
async function deleteOnlineOrQueue(tabela:string,id:string,cacheStore:string){
  if(supabaseConfigured&&navigator.onLine){
    const {error}=await supabase.from(tabela).delete().eq('id',id);
    if(error) await enqueueSync({tabela,operacao:'delete',chave:id});
  }else await enqueueSync({tabela,operacao:'delete',chave:id});
  await del(cacheStore,id);
}

export const listUsuarios=()=>cacheList<Usuario>('usuarios_cache',async()=>{const {data,error}=await supabase.from('usuarios').select('*').order('nome');if(error)throw error;return data||[]});
const DEFAULT_USER_PASSWORD_HASH='8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'; // senha provisória: 123456
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
    if(isNew){row.id=uid();row.senha_hash=row.senha_hash||DEFAULT_USER_PASSWORD_HASH;row.trocar_senha=true;}
    else if(!row.senha_hash) delete row.senha_hash;
  }
  delete row.senha; cleanUndefined(row);
  const saved=await upsertOnlineOrQueue('usuarios',row,'usuarios_cache');
  await audit('usuarios',row.id,input.id?'editar':'cadastrar',{usuario:row.usuario,nome:row.nome,perfil:row.perfil,ativo:row.ativo});
  return saved;
}
export async function deleteUsuario(id:string){ensureAdmin(); await deleteOnlineOrQueue('usuarios',id,'usuarios_cache'); await audit('usuarios',id,'excluir',{}); return true}

export const listSetores=()=>cacheList<Setor>('setores_cache',async()=>{const {data,error}=await supabase.from('setores').select('*').order('nome');if(error)throw error;return data||[]});
export async function saveSetor(input:Partial<Setor>){ensureAdmin(); const row={id:input.id||uid(),nome:input.nome,tipo:input.tipo||'',ativo:input.ativo??true,atualizado_em:new Date().toISOString()}; const saved=await upsertOnlineOrQueue('setores',row,'setores_cache'); await audit('setores',row.id,input.id?'editar':'cadastrar',row); return saved}
export async function deleteSetor(id:string){ensureAdmin(); await deleteOnlineOrQueue('setores',id,'setores_cache'); await audit('setores',id,'excluir',{}); return true}

export const listMaquinas=()=>cacheList<Maquina>('maquinas_cache',async()=>{const {data,error}=await supabase.from('maquinas').select('*').order('ordem').order('nome');if(error)throw error;return data||[]});
export async function saveMaquina(input:Partial<Maquina>){ensureAdmin(); const row={id:input.id||uid(),setor_id:input.setor_id,nome:input.nome,codigo:input.codigo||'',ordem:input.ordem||0,ativo:input.ativo??true,atualizado_em:new Date().toISOString()}; const saved=await upsertOnlineOrQueue('maquinas',row,'maquinas_cache'); await audit('maquinas',row.id,input.id?'editar':'cadastrar',row); return saved}
export async function deleteMaquina(id:string){ensureAdmin(); await deleteOnlineOrQueue('maquinas',id,'maquinas_cache'); await audit('maquinas',id,'excluir',{}); return true}

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
  const saved=await upsertOnlineOrQueue('turnos',row,'turnos_cache');
  await audit('turnos',row.id,input.id||id?'editar':'cadastrar',row);
  return saved;
}
export async function deleteTurno(id:string){ensureAdmin(); await deleteOnlineOrQueue('turnos',id,'turnos_cache'); await audit('turnos',id,'excluir',{}); return true}

export const listAudit=()=>cacheList<AuditLog>('audit_cache',async()=>{const {data,error}=await supabase.from('audit_logs').select('*').order('criado_em',{ascending:false}).limit(200);if(error)throw error;return data||[]});
export const listDiarios=()=>cacheList<Diario>('diarios_cache',async()=>{const {data,error}=await supabase.from('diarios').select('*').order('criado_em',{ascending:false}).limit(200);if(error)throw error;return data||[]});
export async function saveDiario(input:Partial<Diario>){
  const me=currentUser(); if(!me) throw new Error('Sessão expirada');
  const now=new Date().toISOString(); const existing=input.id;
  let original:Diario|undefined;
  if(existing){
    if(supabaseConfigured&&navigator.onLine){
      const {data,error}=await supabase.from('diarios').select('*').eq('id',existing).maybeSingle();
      if(!error&&data) original=data as Diario;
    }
    original=original||await get<Diario>('diarios_cache',existing);
    if(!original) throw new Error('Lançamento não encontrado para edição.');
    const owner=original.criado_por===me.id||original.lider_id===me.id;
    if(me.perfil!=='administrador'&&!owner) throw new Error('Você pode editar somente os seus próprios lançamentos.');
  }
  const row:any={...input,id:input.id||uid(),criado_por:original?.criado_por||input.criado_por||me.id,criado_em:original?.criado_em||input.criado_em||now,atualizado_em:now};
  if(existing){row.editado=true;row.ultima_edicao_por=me.nome;row.ultima_edicao_em=now}
  const saved=await upsertOnlineOrQueue('diarios',row,'diarios_cache');
  await audit('diarios',row.id,existing?'editar':'cadastrar',{data:row.data,turno:row.turno,setor:row.setor_nome,ultima_edicao_por:existing?me.nome:undefined,ultima_edicao_em:existing?now:undefined});
  return saved;
}

async function processQueueItem(item:any){
  const tabela=item.tabela || (item.tipo==='diario'?'diarios':item.tipo);
  if(!tabela) throw new Error('Item de sincronização sem tabela.');
  if(item.operacao==='delete'){
    const {error}=await supabase.from(tabela).delete().eq('id',item.chave);
    if(error) throw error;
    return;
  }
  const payload=item.payload;
  if(!payload?.id) throw new Error('Item de sincronização sem payload/id.');

  // Conflito simples: se o servidor tiver atualizado_em mais recente que o payload local, registra conflito.
  try{
    const {data:server}=await supabase.from(tabela).select('id,atualizado_em').eq('id',payload.id).maybeSingle();
    if(server?.atualizado_em && payload?.atualizado_em && new Date(server.atualizado_em)>new Date(payload.atualizado_em)){
      await registerConflict({tabela,registro_id:payload.id,servidor_atualizado_em:server.atualizado_em,local_atualizado_em:payload.atualizado_em,payload});
      // Política atual: último envio local não sobrescreve servidor mais novo. O conflito fica registrado.
      return;
    }
  }catch(e){console.warn('conflict check skipped',e)}

  const {error}=await supabase.from(tabela).upsert(payload,{onConflict:'id'});
  if(error) throw error;
}

export async function syncPending(){
  if(!supabaseConfigured||!navigator.onLine)return 0;
  const q=await getAll<any>('sync_queue');
  let ok=0;
  for(const item of q){
    try{
      await processQueueItem(item);
      await del('sync_queue',item.id);
      ok++;
    }catch(e:any){
      console.warn('sync item failed',e);
      await put('sync_queue',{...item,tentativas:(item.tentativas||0)+1,ultimo_erro:e?.message||String(e),atualizado_em:new Date().toISOString()});
    }
  }
  return ok;
}
