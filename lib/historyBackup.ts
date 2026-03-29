import type { HistoryItem } from '@/lib/historyTypes';
import { validateHistoryImportBySchema } from '@/lib/historyImportJsonSchema';

export const HISTORY_EXPORT_VERSION = 1;
export const HISTORY_MAX_ITEMS = 50;

export type HistoryExportPayload = {
  version: number;
  exportedAt: string;
  items: HistoryItem[];
};

/**
 * 解析导入 JSON，并用 JSON Schema（Ajv）校验根结构与每条记录。
 */
export function parseHistoryImportJson(
  raw: string,
): { ok: true; items: HistoryItem[] } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: '不是合法的 JSON' };
  }

  return validateHistoryImportBySchema(data);
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
