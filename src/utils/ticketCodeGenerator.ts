/**
 * Ticket Code Generator Utility - Junta Comunal
 * Generates formatted sequence codes with category initials instead of generic prefix
 * Example: ALU-2025-001 (Alumbrado), AGU-2025-002 (Agua), POD-2025-003 (Poda)
 */

export function getCategoryPrefix(
  categoryName?: string,
  categoryId?: string,
  customPrefix?: string
): string {
  if (customPrefix && customPrefix.trim().length > 0) {
    return customPrefix.trim().toUpperCase().substring(0, 4);
  }

  const combined = `${categoryName || ''} ${categoryId || ''}`.toLowerCase();

  if (combined.includes('alum') || combined.includes('elect') || combined.includes('luz')) {
    return 'ALU';
  }
  if (combined.includes('agua') || combined.includes('hidr') || combined.includes('pluv') || combined.includes('tuber')) {
    return 'AGU';
  }
  if (combined.includes('arbol') || combined.includes('poda') || combined.includes('tala') || combined.includes('rama')) {
    return 'POD';
  }
  if (combined.includes('social') || combined.includes('ayuda') || combined.includes('asist') || combined.includes('subsid')) {
    return 'SOC';
  }
  if (combined.includes('cert') || (combined.includes('perm') && !combined.includes('dep'))) {
    return 'CER';
  }
  if (combined.includes('dep') || combined.includes('liga') || combined.includes('cancha') || combined.includes('torneo')) {
    return 'DEP';
  }
  if (combined.includes('obr') || combined.includes('vial') || combined.includes('calle') || combined.includes('bacheo')) {
    return 'OBR';
  }
  if (combined.includes('aseo') || combined.includes('basura') || combined.includes('desecho') || combined.includes('recol')) {
    return 'ASE';
  }
  if (combined.includes('seg') || combined.includes('camara') || combined.includes('polic') || combined.includes('vigil')) {
    return 'SEG';
  }

  // Fallback: extract first 3 valid letters from the name
  const letters = (categoryName || categoryId || 'REP').replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
  return letters.length >= 2 ? letters : 'REP';
}

export function formatTicketSequenceNumber(
  prefix: string,
  sequence: number,
  year: number = new Date().getFullYear()
): string {
  const cleanPrefix = (prefix || 'REP').toUpperCase();
  const paddedSeq = String(sequence).padStart(3, '0');
  return `${cleanPrefix}-${year}-${paddedSeq}`;
}
