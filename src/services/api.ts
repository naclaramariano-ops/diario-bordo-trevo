import { supabase, supabaseConfigured } from './supabase';
import { currentUser } from './auth';
import { sha256, uid } from '../utils/security';
import type { Usuario, Setor, Maquina, Diario, Turno, AuditLog } from '../types';
import { clear, del, enqueueSync, getAll, put, putMeta, registerConflict } from './localDb';

async function cacheList<T>(store:string, online:()=>Promise<T[]>, authoritative=false){
  if(supabaseConfigured&&navigator.onLine){
    try{
      const data=await online();
      await clear(store);
      for(const x of data as any[]) await put(store,x);
      return data;
    }catch(e:any){
      console.error('Falha ao carregar do Supabase',store,e);
      if(authoritative) throw new Error(e?.message||`Não foi possível carregar ${store} do servidor.`);
    }
  }
  return getAll<T>(store)
}
function requireOnlineAdmin(){
  ensureAdmin();
  if(!supabaseConfigured) throw new Error('Supabase não configurado.');
  if(!navigator.onLine) throw new Error('É necessário estar online para alterar cadastros administrativos.');
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
async function upsertOnlineOrQueue(tabela:string,row:any,cacheStore:string,strict=false){
  const now=new Date().toISOString();
  row.atualizado_em=row.atualizado_em||now;
  if(supabaseConfigured&&navigator.onLine){
    const {error}=await supabase.from(tabela).upsert(row,{onConflict:'id'});
    if(error){
      if(strict) throw error;
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
async function deleteOnlineOrQueue(tabela:string,id:string,cacheStore:string,strict=false){
  if(supabaseConfigured&&navigator.onLine){
    const {error}=await supabase.from(tabela).delete().eq('id',id);
    if(error){if(strict)throw error;await enqueueSync({tabela,operacao:'delete',chave:id});}
  }else await enqueueSync({tabela,operacao:'delete',chave:id});
  await del(cacheStore,id);
}

export const listUsuarios=()=>cacheList<Usuario>('usuarios_cache',async()=>{const {data,error}=await supabase.from('usuarios').select('id,nome,usuario,email,setor,cargo,perfil,ativo,trocar_senha,foto_url,criado_em,atualizado_em').order('nome');if(error)throw error;return data||[]},true);
const DEFAULT_USER_PASSWORD_HASH='8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'; // senha provisória: 123456
export async function saveUsuario(input:Partial<Usuario>&{senha?:string}){
  const me=currentUser();
  if(!me) throw new Error('Sessão expirada');
  const selfUpdate=input.id===me.id;
  if(me.perfil!=='administrador'&&!selfUpdate) throw new Error('Apenas administrador pode cadastrar usuários');

  // Atualizações do próprio perfil nunca usam upsert incompleto. Isso evita que o
  // PostgreSQL tente criar uma nova linha sem os campos obrigatórios do usuário.
  if(selfUpdate){
    if(!supabaseConfigured||!navigator.onLine) throw new Error('Conecte-se à internet para atualizar o perfil.');
    const patch:any={atualizado_em:new Date().toISOString()};
    if(input.foto_url!==undefined) patch.foto_url=input.foto_url;
    if(input.senha) patch.senha_hash=await sha256(input.senha);
    if(input.trocar_senha!==undefined) patch.trocar_senha=input.trocar_senha;
    const {data,error}=await supabase
      .from('usuarios')
      .update(patch)
      .eq('id',me.id)
      .select('id,nome,usuario,email,setor,cargo,perfil,ativo,trocar_senha,foto_url,criado_em,atualizado_em')
      .single();
    if(error) throw error;
    const saved={...me,...data} as Usuario;
    await put('usuarios_cache',saved);
    await audit('usuarios',me.id,'editar_perfil',{foto_alterada:input.foto_url!==undefined,senha_alterada:!!input.senha});
    return saved;
  }

  requireOnlineAdmin();
  const isNew=!input.id;
  const row:any={...input,usuario:input.usuario?.toLowerCase().trim(),ativo:input.ativo??true,atualizado_em:new Date().toISOString()};
  if(input.senha) row.senha_hash=await sha256(input.senha);
  if(isNew){row.id=uid();row.senha_hash=row.senha_hash||DEFAULT_USER_PASSWORD_HASH;row.trocar_senha=true;}
  else if(!row.senha_hash) delete row.senha_hash;
  delete row.senha;
  cleanUndefined(row);
  const saved=await upsertOnlineOrQueue('usuarios',row,'usuarios_cache',true);
  await audit('usuarios',row.id,input.id?'editar':'cadastrar',{usuario:row.usuario,nome:row.nome,perfil:row.perfil,ativo:row.ativo});
  return saved;
}
export async function deleteUsuario(id:string){requireOnlineAdmin(); await deleteOnlineOrQueue('usuarios',id,'usuarios_cache',true); await audit('usuarios',id,'excluir',{}); return true}

export const listSetores=()=>cacheList<Setor>('setores_cache',async()=>{const {data,error}=await supabase.from('setores').select('*').order('nome');if(error)throw error;return data||[]},true);
export async function saveSetor(input:Partial<Setor>){requireOnlineAdmin(); const row={id:input.id||uid(),nome:input.nome,tipo:input.tipo||'',ativo:input.ativo??true,atualizado_em:new Date().toISOString()}; const saved=await upsertOnlineOrQueue('setores',row,'setores_cache',true); await audit('setores',row.id,input.id?'editar':'cadastrar',row); return saved}
export async function deleteSetor(id:string){requireOnlineAdmin(); await deleteOnlineOrQueue('setores',id,'setores_cache',true); await audit('setores',id,'excluir',{}); return true}

export const listMaquinas=()=>cacheList<Maquina>('maquinas_cache',async()=>{const {data,error}=await supabase.from('maquinas').select('*').order('ordem').order('nome');if(error)throw error;return data||[]},true);
export async function saveMaquina(input:Partial<Maquina>){requireOnlineAdmin(); const row={id:input.id||uid(),setor_id:input.setor_id,nome:input.nome,codigo:input.codigo||'',ordem:input.ordem||0,ativo:input.ativo??true,atualizado_em:new Date().toISOString()}; const saved=await upsertOnlineOrQueue('maquinas',row,'maquinas_cache',true); await audit('maquinas',row.id,input.id?'editar':'cadastrar',row); return saved}
export async function deleteMaquina(id:string){requireOnlineAdmin(); await deleteOnlineOrQueue('maquinas',id,'maquinas_cache',true); await audit('maquinas',id,'excluir',{}); return true}

export const listTurnos=()=>cacheList<Turno>('turnos_cache',async()=>{const {data,error}=await supabase.from('turnos').select('*').order('nome');if(error)throw error;return data||[]},true);
export async function saveTurno(input:Partial<Turno>){
  requireOnlineAdmin();
  const nome=(input.nome||'').trim();
  let id=input.id||'';
  if(!id&&supabaseConfigured&&navigator.onLine&&nome){
    const {data}=await supabase.from('turnos').select('id').ilike('nome',nome).maybeSingle();
    if(data?.id) id=data.id;
  }
  const row={id:id||uid(),nome,inicio:input.inicio||'00:00',fim:input.fim||'00:00',ativo:input.ativo??true,atualizado_em:new Date().toISOString()};
  const saved=await upsertOnlineOrQueue('turnos',row,'turnos_cache',true);
  await audit('turnos',row.id,input.id||id?'editar':'cadastrar',row);
  return saved;
}
export async function deleteTurno(id:string){requireOnlineAdmin(); await deleteOnlineOrQueue('turnos',id,'turnos_cache',true); await audit('turnos',id,'excluir',{}); return true}

export const listAudit=()=>cacheList<AuditLog>('audit_cache',async()=>{const {data,error}=await supabase.from('audit_logs').select('*').order('criado_em',{ascending:false}).limit(200);if(error)throw error;return data||[]});
export const listDiarios=()=>cacheList<Diario>('diarios_cache',async()=>{const {data,error}=await supabase.from('diarios').select('*').order('criado_em',{ascending:false}).limit(200);if(error)throw error;return data||[]});

async function registerServerDiarioConflict(payload:any){
  if(!supabaseConfigured||!navigator.onLine)return;
  const me=currentUser();
  try{
    await supabase.rpc('register_diario_sync_conflict_v11_2',{p_payload:{
      ...payload,
      detected_by:me?.id||null,
      detected_by_name:me?.nome||'Sistema'
    }});
  }catch(e){console.warn('Não foi possível registrar o conflito no servidor',e)}
}

export async function findOfficialDiario(data:string,turno:string,setor_nome:string,excludeId?:string){
  const normalized=(v:string)=>String(v||'').trim().toLowerCase();
  if(supabaseConfigured&&navigator.onLine){
    let query=supabase.from('diarios').select('*')
      .eq('data',data)
      .ilike('turno',turno)
      .ilike('setor_nome',setor_nome)
      .in('status',['Finalizado','Finalizada','finalizado','finalizada'])
      .order('finalizada_em',{ascending:false,nullsFirst:false})
      .order('atualizado_em',{ascending:false,nullsFirst:false})
      .limit(1);
    if(excludeId)query=query.neq('id',excludeId);
    const{data:rows,error}=await query;
    if(error)throw error;
    return (rows?.[0]||null) as Diario|null;
  }
  const cached=await getAll<Diario>('diarios_cache');
  return cached.find(d=>d.id!==excludeId&&d.data===data&&normalized(d.turno)===normalized(turno)&&normalized(d.setor_nome||'')===normalized(setor_nome)&&['finalizado','finalizada'].includes(normalized(d.status)))||null;
}

export async function saveDiarioDraft(input:Partial<Diario>){
  const me=currentUser(); if(!me) throw new Error('Sessão expirada');
  const now=new Date().toISOString();
  const row:any={...input,id:input.id||uid(),status:'Em preenchimento',criado_por:input.criado_por||me.id,lider_id:input.lider_id||me.id,lider_nome:input.lider_nome||me.nome,criado_em:input.criado_em||now,atualizado_em:now,editado:false};
  if(supabaseConfigured&&navigator.onLine){
    const {data,error}=await supabase.rpc('claim_diario_draft_v11_2',{
      p_id:row.id,p_data:row.data,p_turno:row.turno,p_setor_nome:row.setor_nome,
      p_lider_id:row.lider_id,p_lider_nome:row.lider_nome,p_criado_por:row.criado_por,
      p_resumo:row.resumo,p_criado_em:row.criado_em
    });
    if(error){
      const message=error.message||'Não foi possível reservar a passagem.';
      if(message.includes('PASSAGEM_EM_USO')) throw new Error('Esta passagem já está sendo preenchida por outro usuário.');
      if(message.includes('PASSAGEM_JA_FINALIZADA')) throw new Error('Esta passagem já foi finalizada. Abra o registro existente em Hoje ou Histórico.');
      throw error;
    }
    const saved=(Array.isArray(data)?data[0]:data)||row;
    saved.sync_status='sincronizado';
    await put('diarios_cache',saved);
    return saved as Diario;
  }
  await enqueueSync({tabela:'diarios',operacao:'upsert',payload:row});
  row.sync_status='pendente';
  await put('diarios_cache',row);
  return row as Diario;
}
export async function assumeDiarioDraft(input:Diario){
  const me=ensureAdmin();
  const now=new Date().toISOString();
  const row:any={...input,criado_por:me.id,lider_id:me.id,lider_nome:me.nome,atualizado_em:now,ultima_edicao_por:me.nome,ultima_edicao_em:now};
  const saved=await upsertOnlineOrQueue('diarios',row,'diarios_cache',true);
  await audit('diarios',row.id,'assumir_rascunho',{responsavel_anterior:input.lider_nome,responsavel_novo:me.nome});
  return saved;
}


export async function deleteDiarioDraft(input:Diario){
  const me=currentUser(); if(!me) throw new Error('Sessão expirada');
  const inProgress=['rascunho','em preenchimento'].includes(String(input.status||'').toLowerCase());
  if(!inProgress) throw new Error('Somente passagens em andamento podem ser canceladas.');
  if(input.criado_por!==me.id&&me.perfil!=='administrador') throw new Error('Você só pode cancelar seus próprios rascunhos.');
  await deleteOnlineOrQueue('diarios',input.id,'diarios_cache',supabaseConfigured&&navigator.onLine);
  await audit('diarios',input.id,'cancelar_rascunho',{data:input.data,turno:input.turno,setor:input.setor_nome,responsavel:input.lider_nome});
  return true;
}

export async function cleanupDraftsAfterPublication(params:{keepId:string;data:string;turno:string;setor_nome?:string;criado_por:string}){
  const drafts=await getAll<Diario>('diarios_cache');
  const stale=drafts.filter(d=>d.id!==params.keepId&&d.data===params.data&&d.turno===params.turno&&(d.setor_nome||'')===(params.setor_nome||'')&&d.criado_por===params.criado_por&&['rascunho','em preenchimento'].includes(String(d.status||'').toLowerCase()));
  for(const d of stale){
    try{
      if(supabaseConfigured&&navigator.onLine){
        const {error}=await supabase.from('diarios').delete().eq('id',d.id);
        if(error) throw error;
      }else await enqueueSync({tabela:'diarios',operacao:'delete',chave:d.id});
      await del('diarios_cache',d.id);
    }catch(e){console.warn('Não foi possível remover rascunho duplicado',d.id,e)}
  }
  return stale.length;
}

export async function saveDiario(input:Partial<Diario>){
  const me=currentUser(); if(!me) throw new Error('Sessão expirada');
  const now=new Date().toISOString(); const existing=input.id;
  const row:any={...input,id:input.id||uid(),criado_por:input.criado_por||me.id,criado_em:input.criado_em||now,atualizado_em:now};
  if(existing){row.editado=true;row.ultima_edicao_por=me.nome;row.ultima_edicao_em=now}
  const isFinal=['finalizado','finalizada'].includes(String(row.status||'').trim().toLowerCase());
  let saved:any;
  if(isFinal&&supabaseConfigured&&navigator.onLine){
    const{data,error}=await supabase.rpc('save_diario_final_v11_2',{p_payload:row});
    if(error){
      const message=error.message||'Não foi possível finalizar a passagem.';
      if(message.includes('PASSAGEM_JA_EXISTE')){
        await registerServerDiarioConflict({diario_id:row.id,conflict_type:'passagem_duplicada',conflict_key:`${row.data}|${row.turno}|${row.setor_nome||''}`,local_payload:row});
        throw new Error('Já existe uma passagem finalizada para esta data, turno e envase. O registro existente não foi sobrescrito.');
      }
      if(message.includes('CONFLITO_VERSAO')){
        await registerServerDiarioConflict({diario_id:row.id,conflict_type:'versao_desatualizada',conflict_key:`${row.data}|${row.turno}|${row.setor_nome||''}`,local_payload:row});
        throw new Error('Esta passagem foi alterada em outro dispositivo. Atualize a tela antes de salvar novamente.');
      }
      throw error;
    }
    saved=(Array.isArray(data)?data[0]:data)||row;
    saved.sync_status='sincronizado';
    await put('diarios_cache',saved);
  }else saved=await upsertOnlineOrQueue('diarios',row,'diarios_cache');
  await audit('diarios',row.id,existing?'editar':'cadastrar',{data:row.data,turno:row.turno,setor:row.setor_nome});
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

  if(tabela==='diarios'){
    const status=String(payload.status||'').trim().toLowerCase();
    const conflictKey=`${payload.data||''}|${payload.turno||''}|${payload.setor_nome||''}`;
    if(['finalizado','finalizada'].includes(status)){
      const{error}=await supabase.rpc('save_diario_final_v11_2',{p_payload:payload});
      if(error){
        const msg=String(error.message||'');
        if(msg.includes('PASSAGEM_JA_EXISTE')||msg.includes('CONFLITO_VERSAO')){
          const tipo=msg.includes('CONFLITO_VERSAO')?'versao_desatualizada':'passagem_duplicada';
          const motivo=tipo==='versao_desatualizada'?'O servidor possui uma versão mais recente da passagem.':'Já existe passagem oficial para a mesma data, turno e envase.';
          await registerConflict({tabela,registro_id:payload.id,tipo,payload,motivo});
          await registerServerDiarioConflict({diario_id:payload.id,conflict_type:tipo,conflict_key:conflictKey,local_payload:payload});
          return;
        }
        throw error;
      }
      return;
    }
    if(['rascunho','em preenchimento'].includes(status)){
      const{error}=await supabase.rpc('claim_diario_draft_v11_2',{
        p_id:payload.id,p_data:payload.data,p_turno:payload.turno,p_setor_nome:payload.setor_nome,
        p_lider_id:payload.lider_id,p_lider_nome:payload.lider_nome,p_criado_por:payload.criado_por,
        p_resumo:payload.resumo,p_criado_em:payload.criado_em
      });
      if(error){
        const msg=String(error.message||'');
        if(msg.includes('PASSAGEM_EM_USO')||msg.includes('PASSAGEM_JA_FINALIZADA')){
          const tipo=msg.includes('PASSAGEM_JA_FINALIZADA')?'passagem_ja_finalizada':'passagem_em_uso';
          await registerConflict({tabela,registro_id:payload.id,tipo,payload,motivo:'O rascunho offline não foi enviado porque a combinação já está ocupada no servidor.'});
          await registerServerDiarioConflict({diario_id:payload.id,conflict_type:tipo,conflict_key:conflictKey,local_payload:payload});
          return;
        }
        throw error;
      }
      return;
    }
  }
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
  await putMeta('last_sync_at',new Date().toISOString());
  window.dispatchEvent(new CustomEvent('dbt:sync-queue-changed'));
  return ok;
}
