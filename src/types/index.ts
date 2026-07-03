export type Perfil='administrador'|'usuario';
export type StatusSync='sincronizado'|'pendente'|'offline';
export interface Usuario{ id:string; nome:string; usuario:string; setor:string; cargo:string; perfil:Perfil; ativo:boolean; trocar_senha:boolean; criado_em?:string; atualizado_em?:string }
export interface Setor{ id:string; nome:string; tipo?:string; ativo:boolean; criado_em?:string }
export interface Maquina{ id:string; setor_id:string; nome:string; ativo:boolean; criado_em?:string }
export interface Diario{ id:string; data:string; turno:string; setor_id:string; setor_nome?:string; lider_id:string; lider_nome?:string; status:string; resumo:string; criado_por:string; criado_em:string; atualizado_em?:string; editado:boolean; ultima_edicao_por?:string; ultima_edicao_em?:string; sync_status?:StatusSync }
export interface AuditLog{ id:string; entidade:string; entidade_id:string; acao:string; usuario_id:string; usuario_nome:string; detalhes:any; criado_em:string }
