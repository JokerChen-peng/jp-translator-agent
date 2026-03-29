import type { HistoryItem } from '@/lib/historyTypes';

export const HISTORY_EXPORT_VERSION = 1;
export const HISTORY_MAX_ITEMS = 50;

export type HistoryExportPayload = {
  version: number;
  exportedAt: string;
  items: HistoryItem[];
};

function isHistoryItem(x: unknown): x is HistoryItem {
  if (typeof x !== 'object' || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    o.id.length > 0 &&
    typeof o.input === 'string' &&
    typeof o.output === 'string' &&
    (o.direction === 'ja-zh' || o.direction === 'zh-ja') &&
    typeof o.timestamp === 'number' &&
    Number.isFinite(o.timestamp)
  );
}

export function parseHistoryImportJson(
  raw: string,
): { ok: true; items: HistoryItem[] } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: '不是合法的 JSON' };
  }

  let arr: unknown[];
  if (Array.isArray(data)) {
    arr = data;
  } else if (typeof data === 'object' && data !== null && 'items' in data) {
    const items = (data as { items?: unknown }).items;
    if (!Array.isArray(items)) {
      return { ok: false, error: 'items 必须是数组' };
    }
    arr = items;
  } else {
    return { ok: false, error: '根节点须为 { items: [] } 或记录数组' };
  }

  const out: HistoryItem[] = [];
  for (let i = 0; i < arr.length; i++) {
    const row = arr[i];
    if (!isHistoryItem(row)) {
      return { ok: false, error: `第 ${i + 1} 条记录字段不合法（需 id/input/output/direction/timestamp）` };
    }
    out.push(row);
  }
  return { ok: true, items: out };
}

/**
 * 按 id Upsert：先放入本地，再写入导入项，同 id 以导入为准；按 timestamp 降序，截断条数。
 */
export function mergeHistoryImportWins(
  existing: HistoryItem[],
  imported: HistoryItem[],
  maxItems = HISTORY_MAX_ITEMS,
): HistoryItem[] {
  const map = new Map<string, HistoryItem>();
  for (const x of existing) {
    map.set(x.id, x);
  }
  for (const x of imported) {
    map.set(x.id, x);
  }
  return Array.from(map.values())
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, maxItems);
}

export function buildHistoryExport(items: HistoryItem[]): HistoryExportPayload {
  return {
    version: HISTORY_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    items,
  };
}

export function downloadHistoryJson(
  items: HistoryItem[],
  filename = 'translation-history.json',
) {
  const payload = buildHistoryExport(items);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
