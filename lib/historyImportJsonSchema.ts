import Ajv, { type ErrorObject } from 'ajv';
import schema from '@/lib/schemas/translation-history-import.schema.json';
import type { HistoryItem } from '@/lib/historyTypes';

let validateRoot: ReturnType<Ajv['compile']> | null = null;

function getValidator() {
  if (!validateRoot) {
    const ajv = new Ajv({ allErrors: true, verbose: true, strict: false });
    validateRoot = ajv.compile(schema);
  }
  return validateRoot;
}

function formatSchemaErrors(
  errors: ErrorObject[] | null | undefined,
): string {
  if (!errors?.length) return '数据不符合 JSON Schema';
  const lines = errors.slice(0, 6).map((e) => {
    const path = e.instancePath?.length ? e.instancePath : '（根）';
    return `${path}：${e.message ?? '校验失败'}`;
  });
  return `JSON Schema 校验未通过：${lines.join('；')}`;
}

function extractItems(data: unknown): HistoryItem[] {
  if (Array.isArray(data)) return data as HistoryItem[];
  const o = data as { items: HistoryItem[] };
  return o.items;
}

/**
 * 使用标准 JSON Schema（见 lib/schemas/translation-history-import.schema.json）校验导入根结构及每条记录。
 */
export function validateHistoryImportBySchema(
  data: unknown,
): { ok: true; items: HistoryItem[] } | { ok: false; error: string } {
  const validate = getValidator();
  if (!validate(data)) {
    return {
      ok: false,
      error: formatSchemaErrors(validate.errors),
    };
  }
  return { ok: true, items: extractItems(data) };
}
