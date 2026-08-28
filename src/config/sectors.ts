/**
 * Centralized Configuration: Sectores de Residencia
 * Sección 9 del prompt.
 * Lee desde el archivo centralizado catalogs.json
 */

import catalogsData from './catalogs.json';

export const SECTORES_RESIDENCIA: string[] = catalogsData.sectores;
