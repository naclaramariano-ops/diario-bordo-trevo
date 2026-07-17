import React from 'react';
import { BarChart3, CalendarDays, RefreshCw } from 'lucide-react';
import type { OperationalSummary } from '../../../shared/analytics/operationalSummary';

type Comparison = {
  conformidade: number;
  desvios: number;
  atencoes: number;
  cipVencidos: number;
  pcpNaoSeguido: number;
};

function ComparisonText({ value, inverse = false, suffix = '' }: { value: number; inverse?: boolean; suffix?: string }) {
  const good = inverse ? value < 0 : value > 0;
  const bad = inverse ? value > 0 : value < 0;
  const className = good ? 'good' : bad ? 'bad' : 'same';

  if (value === 0) {
    return <span className={`v10Comparison ${className}`}>Sem variação</span>;
  }

  const sign = value > 0 ? '+' : '−';
  return (
    <span className={`v10Comparison ${className}`}>
      {sign}{Math.abs(value)}{suffix} <small>vs anterior</small>
    </span>
  );
}

function MetricCard({
  title,
  value,
  comparison,
  inverse,
  suffix,
  context,
}: {
  title: string;
  value: React.ReactNode;
  comparison: number;
  inverse?: boolean;
  suffix?: string;
  context?: string;
}) {
  return (
    <div className="v10HistoryMetricCard">
      <span className="v10MetricTitle">{title}</span>
      <b>{value}</b>
      {context && <span className="v10MetricContext">{context}</span>}
      <ComparisonText value={comparison} inverse={inverse} suffix={suffix} />
    </div>
  );
}

export function HistoricoResumo({ summary, comparison, label }: { summary: OperationalSummary; comparison: Comparison; label: string }) {
  return (
    <section className="v10HistorySummary">
      <div className="v10SummaryHeader">
        <div>
          <span className="v10Eyebrow">Análise do período</span>
          <h3>{label}</h3>
        </div>
        <BarChart3 />
      </div>

      <p className="v10ExecutiveText">{summary.executiveText}</p>

      <div className="v10HistoryMetrics">
        <MetricCard
          title="Conformidade"
          value={`${summary.conformidade}%`}
          context={`${summary.conformes} de ${summary.total} conformes`}
          comparison={comparison.conformidade}
          suffix=" p.p."
        />
        <MetricCard title="Desvios" value={summary.desvios} comparison={comparison.desvios} inverse />
        <MetricCard title="Atenções" value={summary.atencoes} comparison={comparison.atencoes} inverse />
        <MetricCard title="PCP não seguido" value={summary.pcpNaoSeguido} comparison={comparison.pcpNaoSeguido} inverse />
      </div>

      <div className="v10AnalysisGrid">
        <div>
          <h4><RefreshCw /> Maiores recorrências</h4>
          {summary.machineRanking.slice(0, 5).map((x, i) => (
            <p key={x.name}><span>{i + 1}. {x.name}</span><b>{x.count}</b></p>
          ))}
          {!summary.machineRanking.length && <small>Sem recorrências no período.</small>}
        </div>
        <div>
          <h4><CalendarDays /> Principais causas</h4>
          {summary.reasonRanking.slice(0, 5).map((x, i) => (
            <p key={x.name}><span>{i + 1}. {x.name}</span><b>{x.count}</b></p>
          ))}
          {!summary.reasonRanking.length && <small>Sem causas críticas no período.</small>}
        </div>
      </div>
    </section>
  );
}
