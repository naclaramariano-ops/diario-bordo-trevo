import React from 'react';
import { ArrowDown, ArrowRight, ArrowUp, BarChart3, CalendarDays, RefreshCw } from 'lucide-react';
import type { OperationalSummary } from '../../../shared/analytics/operationalSummary';

type Comparison={conformidade:number;desvios:number;atencoes:number;cipVencidos:number;pcpNaoSeguido:number};
function Delta({value,inverse=false,suffix=''}:{value:number;inverse?:boolean;suffix?:string}){const good=inverse?value<0:value>0;const bad=inverse?value>0:value<0;return <span className={`v10Delta ${good?'good':bad?'bad':'same'}`}>{value>0?<ArrowUp/>:value<0?<ArrowDown/>:<ArrowRight/>}{Math.abs(value)}{suffix}</span>}
export function HistoricoResumo({summary,comparison,label}:{summary:OperationalSummary;comparison:Comparison;label:string}){
 return <section className="v10HistorySummary"><div className="v10SummaryHeader"><div><span className="v10Eyebrow">Análise do período</span><h3>{label}</h3></div><BarChart3/></div><p className="v10ExecutiveText">{summary.executiveText}</p>
 <div className="v10HistoryMetrics"><div><span>Conformidade</span><b>{summary.conformidade}%</b><Delta value={comparison.conformidade} suffix=" p.p."/></div><div><span>Desvios</span><b>{summary.desvios}</b><Delta value={comparison.desvios} inverse/></div><div><span>Atenções</span><b>{summary.atencoes}</b><Delta value={comparison.atencoes} inverse/></div><div><span>PCP não seguido</span><b>{summary.pcpNaoSeguido}</b><Delta value={comparison.pcpNaoSeguido} inverse/></div></div>
 <div className="v10AnalysisGrid"><div><h4><RefreshCw/> Maiores recorrências</h4>{summary.machineRanking.slice(0,5).map((x,i)=><p key={x.name}><span>{i+1}. {x.name}</span><b>{x.count}</b></p>)}{!summary.machineRanking.length&&<small>Sem recorrências no período.</small>}</div><div><h4><CalendarDays/> Principais causas</h4>{summary.reasonRanking.slice(0,5).map((x,i)=><p key={x.name}><span>{i+1}. {x.name}</span><b>{x.count}</b></p>)}{!summary.reasonRanking.length&&<small>Sem causas críticas no período.</small>}</div></div>
 </section>}
