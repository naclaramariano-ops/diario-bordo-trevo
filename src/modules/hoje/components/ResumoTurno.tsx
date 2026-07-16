import React from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, MessageSquareText, ShieldAlert } from 'lucide-react';
import type { OperationalSummary } from '../../../shared/analytics/operationalSummary';

export function ResumoTurno({summary}:{summary:OperationalSummary}){
  return <section className="v10SummaryCard">
    <div className="v10SummaryHeader"><div><span className="v10Eyebrow">Compilado rápido</span><h3>Resumo operacional do turno</h3></div><span className="v10SummaryPct">{summary.conformidade}% conforme</span></div>
    <p className="v10ExecutiveText">{summary.executiveText}</p>
    <div className="v10MetricGrid">
      <div><CheckCircle2/><b>{summary.conformes}</b><span>Conformes</span></div>
      <div className="warn"><AlertTriangle/><b>{summary.atencoes}</b><span>Atenções</span></div>
      <div className="danger"><ShieldAlert/><b>{summary.desvios}</b><span>Desvios</span></div>
      <div><ClipboardList/><b>{summary.total}</b><span>Registros</span></div>
    </div>
    {!!summary.priorities.length&&<div className="v10PriorityBlock"><h4>Prioridades para o próximo turno</h4>{summary.priorities.slice(0,4).map((p,i)=><div className={`v10Priority ${p.level}`} key={`${p.machine}-${p.turno}-${i}`}><span>{i+1}</span><div><b>{p.title}</b><small>{p.detail}</small></div></div>)}</div>}
    {!!summary.communications.length&&<details className="v10Communications"><summary><MessageSquareText size={18}/> Comunicações relevantes ({summary.communications.length})</summary>{summary.communications.map((c,i)=><p key={`${c.machine}-${i}`}><b>{c.machine} • {c.turno}</b><span>{c.text}</span></p>)}</details>}
  </section>
}
