const NEUTRAL_PATTERNS = new Set([
  '', '-', 'sem observacao', 'sem observacoes', 'sem observacoes gerais',
  'sem aviso', 'sem avisos', 'sem troca aviso', 'sem trocas avisos',
  'sem troca avisos', 'sem trocas aviso', 'nao houve avisos',
  'nenhuma observacao', 'nenhum aviso', 'nada a relatar', 'nao se aplica'
]);

export function normalizeOperationalText(value?: string | null): string {
  return String(value ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[._,;:!?()[\]{}]/g, ' ')
    .replace(/[\\/|–—-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export function isNeutralOperationalText(value?: string | null): boolean {
  const normalized = normalizeOperationalText(value);
  if (NEUTRAL_PATTERNS.has(normalized)) return true;
  return /^(sem|nenhum|nenhuma|nao houve)\s+(observacao|observacoes|aviso|avisos|troca|trocas)(\s+gerais|\s+de pessoas|\s+avisos?)?$/.test(normalized);
}

export function meaningfulOperationalText(value?: string | null): string | null {
  if (isNeutralOperationalText(value)) return null;
  const trimmed = String(value ?? '').trim();
  return trimmed || null;
}
