/** Split user knowledge text into chunks for embedding (paragraphs, then fixed width). */
export function splitKnowledge(raw: string, maxChunks = 32): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);

  const pieces: string[] = [];
  const maxPiece = 600;
  for (const p of paragraphs) {
    if (p.length <= maxPiece) {
      pieces.push(p);
      continue;
    }
    for (let i = 0; i < p.length; i += 500) {
      pieces.push(p.slice(i, i + 500));
    }
  }

  return pieces.slice(0, maxChunks);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

/**
 * Descending by score, keep only items with score >= minScore, then take at most k.
 * minScore default -Infinity keeps previous “top k only” behavior.
 */
export function topKBySimilarity<T>(
  items: T[],
  scores: number[],
  k: number,
  minScore = -Infinity,
): T[] {
  const idx = items.map((_, i) => i);
  idx.sort((i, j) => scores[j]! - scores[i]!);
  const above = idx.filter((i) => (scores[i] ?? 0) >= minScore);
  return above.slice(0, k).map((i) => items[i]!);
}
