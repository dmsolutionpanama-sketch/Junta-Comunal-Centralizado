import { Ticket } from '../types';

/**
 * Normalizes text by converting to lowercase, trimming,
 * and stripping accents/diacritics (e.g. 'á' -> 'a', 'é' -> 'e').
 */
export function normalizeText(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Cleans a cédula or identifier by removing hyphens, spaces, and punctuation.
 * E.g. '8-888-1234' -> '88881234'
 */
export function normalizeCedula(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '')
    .trim();
}

/**
 * Comprehensive ticket search matcher.
 * Matches across:
 * 1. Cédula del reportante (with or without hyphens)
 * 2. Nombre o apellido de la persona
 * 3. Tipo de reporte (categoría, asunto, descripción)
 * 4. Sector residencial (nombre de sector, dirección detallada)
 * 5. Número de radicado / ID del ticket
 */
export function matchesTicketSearch(ticket: Ticket, rawQuery: string): boolean {
  if (!rawQuery || rawQuery.trim() === '') return true;

  const qRaw = rawQuery.trim();
  const qNorm = normalizeText(qRaw);
  const qCedula = normalizeCedula(qRaw);

  // 1. Match by Cédula
  const ticketCedulaNorm = normalizeText(ticket.reportante?.cedula);
  const ticketCedulaClean = normalizeCedula(ticket.reportante?.cedula);

  if (ticketCedulaNorm && ticketCedulaNorm.includes(qNorm)) return true;
  if (qCedula.length >= 3 && ticketCedulaClean && ticketCedulaClean.includes(qCedula)) return true;

  // 2. Match by Nombre o Apellido
  const ticketNombreNorm = normalizeText(ticket.reportante?.nombre);
  if (ticketNombreNorm) {
    if (ticketNombreNorm.includes(qNorm)) return true;
    // Multi-word search: every word in query must appear in the name
    const queryWords = qNorm.split(/\s+/).filter(Boolean);
    if (queryWords.length > 1 && queryWords.every((word) => ticketNombreNorm.includes(word))) {
      return true;
    }
  }

  // 3. Match by Tipo de Reporte (Categoría, Asunto, Descripción)
  const catNombreNorm = normalizeText(ticket.categoriaNombre);
  const catIdNorm = normalizeText(ticket.categoriaId);
  const asuntoNorm = normalizeText(ticket.asunto);
  const descNorm = normalizeText(ticket.descripcion);

  if (catNombreNorm && catNombreNorm.includes(qNorm)) return true;
  if (catIdNorm && catIdNorm.includes(qNorm)) return true;
  if (asuntoNorm && asuntoNorm.includes(qNorm)) return true;
  if (descNorm && descNorm.includes(qNorm)) return true;

  // 4. Match by Sector Residencial
  const sectorNombreNorm = normalizeText(ticket.sectorNombre);
  const sectorIdNorm = normalizeText(ticket.sectorId);
  const repSectorNorm = normalizeText(ticket.reportante?.sector);
  const direccionNorm = normalizeText(ticket.direccionDetallada);

  if (sectorNombreNorm && sectorNombreNorm.includes(qNorm)) return true;
  if (sectorIdNorm && sectorIdNorm.includes(qNorm)) return true;
  if (repSectorNorm && repSectorNorm.includes(qNorm)) return true;
  if (direccionNorm && direccionNorm.includes(qNorm)) return true;

  // 5. Match by Número de Registro / ID
  const numRegNorm = normalizeText(ticket.numeroRegistro);
  const idNorm = normalizeText(ticket.id);
  const numClean = normalizeCedula(ticket.numeroRegistro);

  if (numRegNorm && numRegNorm.includes(qNorm)) return true;
  if (idNorm && idNorm.includes(qNorm)) return true;
  if (qCedula.length >= 3 && numClean && numClean.includes(qCedula)) return true;

  // 6. Match by Canal (WhatsApp, Web, etc.)
  const canalIntakeNorm = normalizeText(ticket.canalIntake);
  const canalRadNorm = normalizeText(ticket.canalRadicacion);
  const lugarNorm = normalizeText(ticket.lugarRegistro);

  if (canalIntakeNorm && canalIntakeNorm.includes(qNorm)) return true;
  if (canalRadNorm && canalRadNorm.includes(qNorm)) return true;
  if (lugarNorm && lugarNorm.includes(qNorm)) return true;

  return false;
}

/**
 * Returns a human-friendly description of why a ticket matched the search query.
 */
export function getTicketMatchReason(ticket: Ticket, rawQuery: string): { label: string; detail: string } {
  if (!rawQuery) return { label: 'Ticket', detail: ticket.numeroRegistro };

  const qNorm = normalizeText(rawQuery);
  const qCedula = normalizeCedula(rawQuery);

  const ticketCedulaNorm = normalizeText(ticket.reportante?.cedula);
  const ticketCedulaClean = normalizeCedula(ticket.reportante?.cedula);
  if (
    (ticketCedulaNorm && ticketCedulaNorm.includes(qNorm)) ||
    (qCedula.length >= 3 && ticketCedulaClean && ticketCedulaClean.includes(qCedula))
  ) {
    return { label: 'Cédula', detail: ticket.reportante.cedula };
  }

  const ticketNombreNorm = normalizeText(ticket.reportante?.nombre);
  if (ticketNombreNorm && ticketNombreNorm.includes(qNorm)) {
    return { label: 'Nombre', detail: ticket.reportante.nombre };
  }

  const catNombreNorm = normalizeText(ticket.categoriaNombre);
  if (catNombreNorm && catNombreNorm.includes(qNorm)) {
    return { label: 'Tipo de Reporte', detail: ticket.categoriaNombre };
  }

  const sectorNombreNorm = normalizeText(ticket.sectorNombre);
  if (sectorNombreNorm && sectorNombreNorm.includes(qNorm)) {
    return { label: 'Sector Residencial', detail: ticket.sectorNombre };
  }

  const numRegNorm = normalizeText(ticket.numeroRegistro);
  if (numRegNorm && numRegNorm.includes(qNorm)) {
    return { label: 'Radicado', detail: ticket.numeroRegistro };
  }

  if (normalizeText(ticket.asunto).includes(qNorm)) {
    return { label: 'Asunto', detail: ticket.asunto };
  }

  return { label: 'Coincidencia', detail: ticket.numeroRegistro };
}
