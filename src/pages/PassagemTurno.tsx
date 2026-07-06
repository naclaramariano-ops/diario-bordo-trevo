import React,{useEffect,useMemo,useState}from'react';
import{CheckCircle2,AlertTriangle,ClipboardList,Factory,FlaskConical,UsersRound,ChevronRight,Save,CalendarClock,RefreshCcw}from'lucide-react';
import{currentUser}from'../services/auth';
import{listMaquinas,listSetores,listTurnos,saveDiario}from'../services/api';
import type{Maquina,Setor,Turno}from'../types';

type Area='envase1'|'envase2'|'processo';
type PcpStatus='sim'|'nao';
type CipStatus='sim'|'nao';
type MachineEntry={
  maquina:string; pcp:PcpStatus; skuAtual:string; programado:string; produzido:string; proximosSkus:string;
  motivoNaoPcp:string; programadoOriginal:string; novaSequencia:string;
  ultimoCip:string; proximoCip:string; cipVencido:boolean; fezCip:CipStatus; motivoCip:string; observacao:string;
};
type TankEntry={
  areaProcesso:string; tanque:string; produto:string; tempoFermentacao:string; statusTanque:string;
  envasado:'sim'|'nao'; quantidadeEnvasada:string; ultimoCip:string; proximoCip:string; cipVencido:boolean; fezCip:CipStatus; motivoCip:string; observacao:string;
};
const ENVASE_FALLBACK:Record<'envase1'|'envase2',string[]>={
  envase1:['Braskop 1','Braskop 2','Braskop 3','Dmax 6','Serac 1','Serac 2'],
  envase2:['Dmax 1','Dmax 2','Dmax 3','Dmax 4','Gualapack','UHT']
};
const PROCESS_AREAS=[
  {nome:'Mistura',tanques:['Mistura 01','Mistura 02','Mistura 03']},
  {nome:'Fermentação',tanques:['TQF-01','TQF-02','TQF-03','TQF-04','TQF-05','TQF-06']},
  {nome:'Resfriamento',tanques:['Resfriamento 01','Resfriamento 02']},
  {nome:'Pulmão / Espera',tanques:['Pulmão 01','Pulmão 02','Pulmão 03']},
  {nome:'Transferência para Envase',tanques:['Linha Envase 1','Linha Envase 2']}
];
function plus48(value:string){if(!value)return {proximo:'',vencido:false};const d=new Date(value);if(Number.isNaN(d.getTime()))return {proximo:'',vencido:false};const n=new Date(d.getTime()+48*60*60*1000);return {proximo:n.toLocaleString('pt-BR'),vencido:n<new Date()};}
function makeMachineEntry(maquina:string):MachineEntry{return{maquina,pcp:'sim',skuAtual:'',programado:'',produzido:'',proximosSkus:'',motivoNaoPcp:'',programadoOriginal:'',novaSequencia:'',ultimoCip:'',proximoCip:'',cipVencido:false,fezCip:'nao',motivoCip:'',observacao:''}}
function makeTankEntry(areaProcesso:string,tanque:string):TankEntry{return{areaProcesso,tanque,produto:'',tempoFermentacao:'',statusTanque:'Fermentando',envasado:'nao',quantidadeEnvasada:'',ultimoCip:'',proximoCip:'',cipVencido:false,fezCip:'nao',motivoCip:'',observacao:''}}
function statusLabel(m:MachineEntry){if(m.cipVencido)return <span className="v6Badge bad">CIP vencido</span>;if(m.pcp==='nao')return <span className="v6Badge warn">Fora PCP</span>;if(m.skuAtual)return <span className="v6Badge ok">Conforme</span>;return <span className="v6Badge neutral">Pendente</span>}
function machineComplete(m:MachineEntry){if(!m.skuAtual||!m.programado||!m.produzido)return false;if(m.pcp==='sim'&&!m.proximosSkus)return false;if(m.pcp==='nao'&&(!m.motivoNaoPcp||!m.programadoOriginal||!m.novaSequencia))return false;if(!m.ultimoCip)return false;if(m.cipVencido&&!m.motivoCip)return false;return true;}
function tankComplete(t:TankEntry){if(!t.produto||!t.statusTanque)return false;if(t.areaProcesso==='Fermentação'&&!t.tempoFermentacao)return false;if(t.envasado==='sim'&&!t.quantidadeEnvasada)return false;if(!t.ultimoCip)return false;if(t.cipVencido&&!t.motivoCip)return false;return true;}
export default function PassagemTurno({onSaved}:{onSaved:()=>void}){
  const[area,setArea]=useState<Area>('envase1');
  const[setores,setSetores]=useState<Setor[]>([]),[maquinas,setMaquinas]=useState<Maquina[]>([]),[turnos,setTurnos]=useState<Turno[]>([]);
  const[turno,setTurno]=useState('1º Turno'),[data,setData]=useState(new Date().toISOString().slice(0,10));
  const[entries,setEntries]=useState<MachineEntry[]>(ENVASE_FALLBACK.envase1.map(makeMachineEntry));
  const[selected,setSelected]=useState(0);
  const[processArea,setProcessArea]=useState('Mistura');
  const[tanks,setTanks]=useState<TankEntry[]>(PROCESS_AREAS[0].tanques.map(t=>makeTankEntry('Mistura',t)));
  const[people,setPeople]=useState(''),[obs,setObs]=useState(''),[saving,setSaving]=useState(false),[msg,setMsg]=useState('');
  useEffect(()=>{listSetores().then(setSetores);listMaquinas().then(setMaquinas);listTurnos().then(setTurnos)},[]);
  function machinesFor(a:'envase1'|'envase2'){
    const setorNome=a==='envase1'?'Envase 1':'Envase 2';
    const setor=setores.find(s=>s.nome.toLowerCase()===setorNome.toLowerCase());
    const list=setor?maquinas.filter(m=>m.setor_id===setor.id&&m.ativo).sort((a,b)=>(a.ordem||0)-(b.ordem||0)).map(m=>m.nome):[];
    return list.length?list:ENVASE_FALLBACK[a];
  }
  function chooseArea(a:Area){setArea(a);setSelected(0);setMsg(''); if(a==='envase1'||a==='envase2')setEntries(machinesFor(a).map(makeMachineEntry));}
  function chooseProcessArea(nome:string){setProcessArea(nome);const cfg=PROCESS_AREAS.find(a=>a.nome===nome)!;setTanks(cfg.tanques.map(t=>makeTankEntry(nome,t)));}
  function updateEntry(i:number,patch:Partial<MachineEntry>){setEntries(prev=>prev.map((e,idx)=>{if(idx!==i)return e;const next={...e,...patch};if(patch.ultimoCip!==undefined){const c=plus48(patch.ultimoCip);next.proximoCip=c.proximo;next.cipVencido=c.vencido;if(!c.vencido)next.motivoCip='';}return next;}));}
  function updateTank(i:number,patch:Partial<TankEntry>){setTanks(prev=>prev.map((e,idx)=>{if(idx!==i)return e;const next={...e,...patch};if(patch.ultimoCip!==undefined){const c=plus48(patch.ultimoCip);next.proximoCip=c.proximo;next.cipVencido=c.vencido;if(!c.vencido)next.motivoCip='';}return next;}));}
  const completed=useMemo(()=>area==='processo'?tanks.filter(tankComplete).length:entries.filter(machineComplete).length,[entries,tanks,area]);
  const total=area==='processo'?tanks.length:entries.length;
  async function finalizar(){
    setMsg('');setSaving(true);
    try{
      const me=currentUser()!;const setorNome=area==='envase1'?'Envase 1':area==='envase2'?'Envase 2':'Processo';const setor=setores.find(s=>s.nome.toLowerCase()===setorNome.toLowerCase());
      const payload={versao:'V6_PASSAGEM_TURNO',area,setor:setorNome,data,turno,lider:me.nome,registros:area==='processo'?tanks:entries,pessoas:people,observacoesGerais:obs,criadoEm:new Date().toISOString()};
      await saveDiario({data,turno,setor_id:setor?.id||area,setor_nome:setorNome,lider_id:me.id,lider_nome:me.nome,status:'Finalizado',resumo:'V6_PASSAGEM_TURNO::'+JSON.stringify(payload),criado_por:me.id,editado:false} as any);
      setMsg('Passagem de turno salva. Se estiver offline, entrará na fila de sincronização.');
      setTimeout(onSaved,700);
    }catch(e:any){setMsg(e?.message||'Não foi possível salvar a passagem.');}
    finally{setSaving(false)}
  }
  return <section className="page v6Page"><div className="pageTitle"><h2>Passagem de turno</h2><p>Preenchimento simples por área, com PCP, produzido, CIP, pessoas e observações do turno.</p></div>
    <div className="v6Header card"><div><b>{data} • {turno}</b><span>{completed}/{total} itens preenchidos</span></div><div className="v6Progress"><i style={{width:`${total?completed/total*100:0}%`}}/></div><button type="button" className="primary" onClick={finalizar} disabled={saving}><Save size={18}/>{saving?' Salvando...':' Finalizar passagem'}</button></div>
    <div className="v6Filters card"><label>Data<input type="date" value={data} onChange={e=>setData(e.target.value)}/></label><label>Turno<select value={turno} onChange={e=>setTurno(e.target.value)}>{turnos.filter(t=>t.ativo).length?turnos.filter(t=>t.ativo).map(t=><option key={t.id}>{t.nome}</option>):<><option>1º Turno</option><option>2º Turno</option><option>3º Turno</option></>}</select></label></div>
    <div className="v6AreaTabs"><button className={area==='envase1'?'active':''} onClick={()=>chooseArea('envase1')}><Factory size={18}/> Envase 1</button><button className={area==='envase2'?'active':''} onClick={()=>chooseArea('envase2')}><Factory size={18}/> Envase 2</button><button className={area==='processo'?'active':''} onClick={()=>chooseArea('processo')}><FlaskConical size={18}/> Processo</button></div>
    {(area==='envase1'||area==='envase2')&&<EnvaseForm entries={entries} selected={selected} setSelected={setSelected} update={updateEntry}/>}    
    {area==='processo'&&<ProcessoForm processArea={processArea} chooseProcessArea={chooseProcessArea} tanks={tanks} update={updateTank}/>}    
    <div className="v6Two"><div className="card"><h3><UsersRound size={18}/> Pessoas / Trocas / Avisos</h3><p>Formalize combinados que antes ficavam somente falados.</p><textarea value={people} onChange={e=>setPeople(e.target.value)} placeholder="Ex.: Ana Clara pediu troca de turno com João. Vinícius ficou ciente."/></div><div className="card"><h3><ClipboardList size={18}/> Observações gerais do turno</h3><p>Resumo objetivo do que houve no turno.</p><textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Ex.: Turno com atraso inicial. Demais linhas sem ocorrência crítica."/></div></div>
    {msg&&<div className="card hint">{msg}</div>}
  </section>
}
function EnvaseForm({entries,selected,setSelected,update}:{entries:MachineEntry[];selected:number;setSelected:(i:number)=>void;update:(i:number,p:Partial<MachineEntry>)=>void}){const e=entries[selected]||entries[0];return <div className="v6Layout"><aside className="card v6List"><h3>Máquinas</h3><p>Escolha a máquina e preencha apenas os campos que se abrem conforme a resposta.</p>{entries.map((m,i)=><button key={m.maquina} className={i===selected?'selected':''} onClick={()=>setSelected(i)}><span><b>{m.maquina}</b><small>{machineComplete(m)?'Completo':'Pendente'}</small></span>{statusLabel(m)}<ChevronRight size={16}/></button>)}</aside><main className="v6Editor"><div className="card"><h3>{e.maquina}</h3><p>Programação PCP e sequência produtiva.</p><label>Seguiu conforme programação PCP?<select value={e.pcp} onChange={ev=>update(selected,{pcp:ev.target.value as PcpStatus})}><option value="sim">Sim</option><option value="nao">Não</option></select></label>{e.pcp==='sim'?<div className="v6Conditional okBlock"><div className="v6Alert ok"><CheckCircle2 size={18}/> Conforme PCP: informe SKU atual, programado, produzido e próximos SKUs.</div><label>SKU que está rodando<input value={e.skuAtual} onChange={ev=>update(selected,{skuAtual:ev.target.value})} placeholder="Ex.: Iogurte 170g Morango"/></label><div className="v6Grid2"><label>Programado do SKU<input value={e.programado} onChange={ev=>update(selected,{programado:ev.target.value})} placeholder="Ex.: 12.000 un"/></label><label>Produzido até agora<input value={e.produzido} onChange={ev=>update(selected,{produzido:ev.target.value})} placeholder="Ex.: 8.400 un"/></label></div><label>Próximos SKUs<textarea value={e.proximosSkus} onChange={ev=>update(selected,{proximosSkus:ev.target.value})} placeholder="Liste a próxima sequência programada."/></label></div>:<div className="v6Conditional warnBlock"><div className="v6Alert warn"><AlertTriangle size={18}/> Fora do PCP: informe motivo, SKU atual, programação original, produzido e nova sequência.</div><label>Motivo<select value={e.motivoNaoPcp} onChange={ev=>update(selected,{motivoNaoPcp:ev.target.value})}><option value="">Selecione</option><option>Manutenção / quebra</option><option>Falta de material</option><option>Aguardando qualidade</option><option>Setup atrasado</option><option>Reprogramação PCP</option><option>Falta de pessoas</option><option>Outro</option></select></label><label>SKU rodando no momento<input value={e.skuAtual} onChange={ev=>update(selected,{skuAtual:ev.target.value})}/></label><div className="v6Grid2"><label>O que estava programado<input value={e.programadoOriginal} onChange={ev=>update(selected,{programadoOriginal:ev.target.value})}/></label><label>Quanto produziu/tirou<input value={e.produzido} onChange={ev=>update(selected,{produzido:ev.target.value})}/></label></div><label>Como ficou a nova sequência<textarea value={e.novaSequencia} onChange={ev=>update(selected,{novaSequencia:ev.target.value})}/></label></div>}</div><CipCard value={e} update={(p)=>update(selected,p)}/><div className="card"><h3>Observação da máquina</h3><textarea value={e.observacao} onChange={ev=>update(selected,{observacao:ev.target.value})} placeholder="Registre algo relevante dessa máquina no turno."/></div></main></div>}
function CipCard({value,update}:{value:{ultimoCip:string;proximoCip:string;cipVencido:boolean;fezCip:CipStatus;motivoCip:string};update:(p:any)=>void}){return <div className="card"><h3><CalendarClock size={18}/> CIP</h3><p>O próximo CIP é calculado automaticamente: último CIP + 48 horas.</p><div className="v6Grid2"><label>Último CIP<input type="datetime-local" value={value.ultimoCip} onChange={e=>update({ultimoCip:e.target.value})}/></label><label>Próximo CIP automático<input value={value.proximoCip||'Informe o último CIP'} readOnly/></label></div><div className={value.cipVencido?'v6Alert bad':'v6Alert ok'}>{value.ultimoCip?value.cipVencido?'CIP vencido: justificativa obrigatória.':'CIP dentro do prazo.':'Informe o último CIP para calcular.'}</div><label>Fez CIP hoje?<select value={value.fezCip} onChange={e=>update({fezCip:e.target.value as CipStatus})}><option value="nao">Não</option><option value="sim">Sim</option></select></label>{value.cipVencido&&<label>{value.fezCip==='sim'?'Motivo de realizar CIP fora do prazo':'Motivo de não realizar CIP vencido'}<textarea value={value.motivoCip} onChange={e=>update({motivoCip:e.target.value})}/></label>}</div>}
function ProcessoForm({processArea,chooseProcessArea,tanks,update}:{processArea:string;chooseProcessArea:(s:string)=>void;tanks:TankEntry[];update:(i:number,p:Partial<TankEntry>)=>void}){return <div className="v6Process"><div className="card"><h3>Processo por área</h3><p>Processo não segue lógica de máquina de envase. O controle é por área e tanque.</p><div className="v6AreaPills">{PROCESS_AREAS.map(a=><button key={a.nome} className={processArea===a.nome?'active':''} onClick={()=>chooseProcessArea(a.nome)}>{a.nome}</button>)}</div></div><div className="v6TankGrid">{tanks.map((t,i)=><div className="card tankCard" key={t.tanque}><div className="tankHead"><div><h3>{t.tanque}</h3><p>{t.areaProcesso}</p></div>{tankComplete(t)?<span className="v6Badge ok">Completo</span>:<span className="v6Badge neutral">Pendente</span>}</div><label>Produto no tanque<input value={t.produto} onChange={e=>update(i,{produto:e.target.value})} placeholder="Ex.: Base Iogurte Morango"/></label>{t.areaProcesso==='Fermentação'&&<label>Tempo de fermentação<input value={t.tempoFermentacao} onChange={e=>update(i,{tempoFermentacao:e.target.value})} placeholder="Ex.: 8h30"/></label>}<label>Status do tanque<select value={t.statusTanque} onChange={e=>update(i,{statusTanque:e.target.value})}><option>Fermentando</option><option>Aguardando análise</option><option>Liberado</option><option>Envasado parcial</option><option>Envasado total</option><option>Aguardando transferência</option></select></label><div className="v6Grid2"><label>Já foi envasado?<select value={t.envasado} onChange={e=>update(i,{envasado:e.target.value as 'sim'|'nao'})}><option value="nao">Não</option><option value="sim">Sim</option></select></label>{t.envasado==='sim'&&<label>Quanto foi envasado<input value={t.quantidadeEnvasada} onChange={e=>update(i,{quantidadeEnvasada:e.target.value})} placeholder="Ex.: 4.500 L"/></label>}</div><CipCard value={t} update={(p)=>update(i,p)}/><label>Observação do tanque<textarea value={t.observacao} onChange={e=>update(i,{observacao:e.target.value})}/></label></div>)}</div></div>}
