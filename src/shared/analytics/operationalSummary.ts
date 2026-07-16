import { meaningfulOperationalText } from './neutralResponses';

export type OperationalStatus = 'conforme'|'atencao'|'desvio';
export interface MachineLike {
  maquina:string; pcpStatus:'sim'|'nao'; motivo?:string; skuAtual:string;
  proximoCip?:string; parada4h:'sim'|'nao'; cipRenovacao?:'sim'|'nao';
  pessoas?:string; observacoes?:string;
}
export interface ItemLike {
  status:OperationalStatus; reason:string; machine:MachineLike; machineName:string;
  turno:string; area:string; criadoEm:string;
}
export interface OperationalSummary {
  total:number; conformes:number; atencoes:number; desvios:number;
  conformidade:number; cipProximos:number; cipVencidos:number; pcpNaoSeguido:number;
  priorities:Array<{level:OperationalStatus;title:string;detail:string;machine:string;turno:string}>;
  communications:Array<{machine:string;turno:string;text:string;kind:'pessoas'|'observacao'}>;
  machineRanking:Array<{name:string;count:number}>;
  reasonRanking:Array<{name:string;count:number}>;
  executiveText:string;
}

export function classifyMachineV10(m:MachineLike, now = new Date()): {status:OperationalStatus;reason:string} {
  const next=m.proximoCip?new Date(m.proximoCip):null;
  const validNext=!!next&&!Number.isNaN(next.getTime());
  const cipVencido=validNext&&next!<now;
  const venceLogo=validNext&&next!>=now&&(next!.getTime()-now.getTime())<=12*60*60*1000;
  if(m.pcpStatus==='nao') return {status:'desvio',reason:m.motivo||'PCP não seguido'};
  if(cipVencido) return {status:'desvio',reason:'CIP vencido'};
  if(m.parada4h==='sim'&&m.cipRenovacao==='nao') return {status:'desvio',reason:'Parada ≥4h sem CIP de renovação'};
  if(venceLogo) return {status:'atencao',reason:'CIP vence em até 12h'};
  if(m.parada4h==='sim') return {status:'atencao',reason:'Parada ≥4h registrada'};
  if(meaningfulOperationalText(m.observacoes)) return {status:'atencao',reason:'Observação operacional'};
  if(meaningfulOperationalText(m.pessoas)) return {status:'atencao',reason:'Aviso de pessoas/trocas'};
  return {status:'conforme',reason:'Sem pendências'};
}

function rank(values:string[]){const map=new Map<string,number>();values.filter(Boolean).forEach(v=>map.set(v,(map.get(v)||0)+1));return [...map.entries()].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));}

export function buildOperationalSummary(items:ItemLike[]): OperationalSummary {
  const total=items.length;
  const desvios=items.filter(i=>i.status==='desvio').length;
  const atencoes=items.filter(i=>i.status==='atencao').length;
  const conformes=items.filter(i=>i.status==='conforme').length;
  const cipProximos=items.filter(i=>i.reason.includes('CIP vence')).length;
  const cipVencidos=items.filter(i=>i.reason==='CIP vencido').length;
  const pcpNaoSeguido=items.filter(i=>i.machine.pcpStatus==='nao').length;
  const priorityWeight=(i:ItemLike)=>i.reason==='CIP vencido'?100:i.reason.includes('sem CIP')?95:i.machine.pcpStatus==='nao'?80:i.reason.includes('CIP vence')?65:i.reason.includes('Observação')?45:35;
  const priorities=items.filter(i=>i.status!=='conforme').sort((a,b)=>priorityWeight(b)-priorityWeight(a)).slice(0,6).map(i=>({level:i.status,title:`${i.machineName} — ${i.reason}`,detail:`${i.area} • ${i.turno}`,machine:i.machineName,turno:i.turno}));
  const communications=items.flatMap(i=>{
    const out:Array<{machine:string;turno:string;text:string;kind:'pessoas'|'observacao'}>=[];
    const people=meaningfulOperationalText(i.machine.pessoas); if(people) out.push({machine:i.machineName,turno:i.turno,text:people,kind:'pessoas'});
    const obs=meaningfulOperationalText(i.machine.observacoes); if(obs) out.push({machine:i.machineName,turno:i.turno,text:obs,kind:'observacao'});
    return out;
  }).slice(0,8);
  const machineRanking=rank(items.filter(i=>i.status!=='conforme').map(i=>i.machineName));
  const reasonRanking=rank(items.filter(i=>i.status!=='conforme').map(i=>i.reason));
  let executiveText='Nenhum lançamento finalizado no período selecionado.';
  if(total){
    const pct=Math.round((conformes/total)*100);
    const lead=desvios?`Foram identificados ${desvios} desvio(s) e ${atencoes} ponto(s) de atenção.`:atencoes?`Não há desvios, mas existem ${atencoes} ponto(s) de atenção.`:'O período está sem pendências operacionais classificadas.';
    const top=priorities[0]?` A prioridade principal é ${priorities[0].machine}: ${priorities[0].title.split(' — ')[1]}.`:'';
    executiveText=`Conformidade de ${pct}% em ${total} registro(s). ${lead}${top}`;
  }
  return {total,conformes,atencoes,desvios,conformidade:total?Math.round((conformes/total)*100):0,cipProximos,cipVencidos,pcpNaoSeguido,priorities,communications,machineRanking,reasonRanking,executiveText};
}

export function compareOperationalSummaries(current:OperationalSummary, previous:OperationalSummary){
  return {
    conformidade:current.conformidade-previous.conformidade,
    desvios:current.desvios-previous.desvios,
    atencoes:current.atencoes-previous.atencoes,
    cipVencidos:current.cipVencidos-previous.cipVencidos,
    pcpNaoSeguido:current.pcpNaoSeguido-previous.pcpNaoSeguido
  };
}
