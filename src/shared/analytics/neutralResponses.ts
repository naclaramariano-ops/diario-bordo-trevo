const NEUTRAL_PATTERNS = new Set([
  '', '-', 'sem observacao', 'sem observacoes', 'sem observacao geral', 'sem observacoes gerais',
  'sem aviso', 'sem avisos', 'sem troca aviso', 'sem trocas avisos',
  'sem troca avisos', 'sem trocas aviso', 'sem troca', 'sem trocas',
  'nao houve aviso', 'nao houve avisos', 'nao houve troca', 'nao houve trocas',
  'nenhuma observacao', 'nenhuma observacoes', 'nenhum aviso', 'nenhum avisos',
  'nada a relatar', 'nao se aplica'
]);

export function normalizeOperationalText(value?: string | null): string {
  return String(value ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isNeutralOperationalText(value?: string | null): boolean {
  const normalized = normalizeOperationalText(value);
  if (!normalized || NEUTRAL_PATTERNS.has(normalized)) return true;

  // Respostas-padrão dos botões rápidos devem ser sempre neutras,
  // mesmo que tenham pequenas diferenças de pontuação ou espaçamento.
  if (/^sem\s+(qualquer\s+)?observac(ao|oes)(\s+geral|\s+gerais)?$/.test(normalized)) return true;
  if (/^sem\s+(troca|trocas)(\s+e)?\s*(aviso|avisos)?$/.test(normalized)) return true;
  if (/^sem\s+(aviso|avisos)(\s+de\s+pessoas)?$/.test(normalized)) return true;
  if (/^(nenhum|nenhuma|nao\s+houve)\s+(observacao|observacoes|aviso|avisos|troca|trocas)(\s+geral|\s+gerais|\s+de\s+pessoas)?$/.test(normalized)) return true;

  return false;
}

export function meaningfulOperationalText(value?: string | null): string | null {
  if (isNeutralOperationalText(value)) return null;
  const trimmed = String(value ?? '').trim();
  return trimmed || null;
}
