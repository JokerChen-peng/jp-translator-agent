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

const KEYWORD_MAX_GRAMS = 100;

/**
 * 字面重叠分 [0,1]：查询中的双字/三字片段与英数 token 在 chunk 中出现的比例。
 * 用于混合检索里抬升专名、缩写命中，避免单靠单字误匹配（至少 2 字起）。
 */
export function keywordOverlapScore(query: string, chunk: string): number {
  const q = query.trim();
  const c = chunk;
  if (q.length < 2 || !c.length) return 0;

  const grams: string[] = [];
  for (let i = 0; i < q.length - 1 && grams.length < KEYWORD_MAX_GRAMS; i++) {
    grams.push(q.slice(i, i + 2));
  }
  if (q.length >= 3) {
    for (let i = 0; i < q.length - 2 && grams.length < KEYWORD_MAX_GRAMS; i++) {
      grams.push(q.slice(i, i + 3));
    }
  }
  const tokens = q.match(/[a-zA-Z0-9][a-zA-Z0-9_-]{1,31}/g) ?? [];
  for (const t of tokens) {
    if (grams.length >= KEYWORD_MAX_GRAMS) break;
    if (t.length >= 2) grams.push(t);
  }

  const unique = [...new Set(grams)];
  if (unique.length === 0) return 0;
  let hits = 0;
  for (const g of unique) {
    if (c.includes(g)) hits++;
  }
  return hits / unique.length;
}

/** 乘法融合：无关键词命中时退化为纯向量分；命中时抬升但保持语义主序。 */
export function fusedMultiplicativeScore(
  cosine: number,
  keyword01: number,
  lambda: number,
): number {
  const k = Math.max(0, Math.min(1, keyword01));
  return cosine * (1 + lambda * k);
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
