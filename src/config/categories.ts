/**
 * Centralized Configuration: Case Categories (Categorías de Caso)
 * Sección 8 del prompt.
 * Lee desde el archivo centralizado catalogs.json
 */

import catalogsData from './catalogs.json';
import { Category } from '../types';

export const CATEGORIAS_SISTEMA: Category[] = catalogsData.categorias as Category[];

export function getCategoriaById(id: string): Category | undefined {
  return CATEGORIAS_SISTEMA.find(
    (c) => c.id.toLowerCase() === id.toLowerCase() || c.nombre.toLowerCase() === id.toLowerCase()
  );
}
