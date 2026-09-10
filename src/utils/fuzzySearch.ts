/**
 * Utility for Fuzzy and Predictive Matching of Community Sectors
 * Handles typos, missing accents, swapped letters, and phonetic approximations.
 */

// Normalizes text removing accents, punctuation and lowercasing
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Standard Levenshtein distance calculation
 */
export function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[bn][an];
}

/**
 * Calculate similarity ratio between 0 and 1
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeText(str1);
  const norm2 = normalizeText(str2);

  if (norm1 === norm2) return 1.0;
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const ratio = Math.min(norm1.length, norm2.length) / Math.max(norm1.length, norm2.length);
    return Math.max(0.75, ratio);
  }

  const maxLen = Math.max(norm1.length, norm2.length);
  if (maxLen === 0) return 1.0;

  const dist = levenshteinDistance(norm1, norm2);
  return Math.max(0, 1 - dist / maxLen);
}

export interface SectorMatchResult {
  sector: string;
  isExactOrPrefix: boolean;
  score: number;
}

/**
 * Predicts and finds similar community sectors based on user input
 * @param query What the user typed
 * @param sectors Master list of community sectors
 * @param maxSuggestions Maximum number of suggestions to return
 */
export function findSimilarSectors(
  query: string,
  sectors: string[],
  maxSuggestions = 6
): SectorMatchResult[] {
  const rawQuery = (query || '').trim();
  if (!rawQuery) return [];

  const normQuery = normalizeText(rawQuery);
  const queryTokens = normQuery.split(' ').filter(Boolean);

  const scored: SectorMatchResult[] = [];

  for (const sector of sectors) {
    const normSector = normalizeText(sector);
    const sectorTokens = normSector.split(' ').filter(Boolean);

    // Exact match
    if (normSector === normQuery) {
      scored.push({ sector, isExactOrPrefix: true, score: 1.0 });
      continue;
    }

    // Direct startsWith or includes
    if (normSector.startsWith(normQuery)) {
      scored.push({ sector, isExactOrPrefix: true, score: 0.95 });
      continue;
    }

    if (normSector.includes(normQuery)) {
      scored.push({ sector, isExactOrPrefix: true, score: 0.9 });
      continue;
    }

    // Token inclusion (e.g. "cumbres" matches "Altos de Las Cumbres")
    const allTokensMatch = queryTokens.length > 0 && queryTokens.every((qt) =>
      sectorTokens.some((st) => st.includes(qt) || calculateSimilarity(st, qt) >= 0.7)
    );

    if (allTokensMatch) {
      scored.push({ sector, isExactOrPrefix: true, score: 0.85 });
      continue;
    }

    // Fuzzy similarity on full string
    const fullSim = calculateSimilarity(normQuery, normSector);
    if (fullSim >= 0.5) {
      scored.push({ sector, isExactOrPrefix: false, score: fullSim });
      continue;
    }

    // Fuzzy similarity per token
    let bestTokenScore = 0;
    for (const qToken of queryTokens) {
      if (qToken.length < 3) continue;
      for (const sToken of sectorTokens) {
        const sim = calculateSimilarity(qToken, sToken);
        if (sim > bestTokenScore) bestTokenScore = sim;
      }
    }

    if (bestTokenScore >= 0.65) {
      scored.push({ sector, isExactOrPrefix: false, score: bestTokenScore * 0.8 });
    }
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxSuggestions);
}
