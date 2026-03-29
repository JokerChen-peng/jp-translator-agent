'use client';

import React, { useRef } from 'react';
import { parseHistoryImportJson } from '@/lib/historyBackup';
import type { HistoryItem } from '@/lib/historyTypes';

export type { HistoryItem };

export interface HistoryProps {
  /** 存储在本地的翻译记录列表 */
  items: HistoryItem[];
  /** 清空所有历史记录 */
  onClear: () => void;
  /** 点击历史项回填输入框 */
  onItemClick: (item: HistoryItem) => void;
  /** 删除特定的历史记录项 */
  onDeleteItem: (id: string) => void;
  /** 导出当前列表为 JSON 文件 */
  onExport: () => void;
  /** 校验通过的导入记录；由父组件与本地合并（导入优先） */
  onImportValidated: (items: HistoryItem[]) => void;
}

export default function TranslationHistory({
  items,
  onClear,
  onItemClick,
  onDeleteItem,
  onExport,
  onImportValidated,
}: HistoryProps) {
  const importRef = useRef<HTMLInputElement>(null);

  const handleImportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const result = parseHistoryImportJson(text);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      onImportValidated(result.items);
    } catch {
      alert('无法读取文件');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImportChange}
      />
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex justify-between items-center gap-2">
          <h3 className="text-sm font-black text-gray-800 tracking-tight uppercase shrink-0">
            Saved Records
          </h3>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={onExport}
              className="text-[10px] px-2 py-1 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 font-bold"
            >
              导出 JSON
            </button>
            <button
              type="button"
              onClick={() => importRef.current?.click()}
              className="text-[10px] px-2 py-1 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 font-bold"
            >
              导入
            </button>
            {items.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="text-[10px] text-gray-400 hover:text-red-500 uppercase tracking-tighter font-bold px-1"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
        <p className="text-[9px] text-gray-400 leading-snug">
          导入 JSON 经 Schema（Ajv）校验后按 id 合并，同 id 以文件为准，最多保留 50 条。
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-300">
            <p className="text-xs italic">点击翻译下方的按钮存入</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="group relative cursor-pointer rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
              onClick={() => onItemClick(item)}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="text-[9px] font-bold bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded uppercase">
                  {item.direction === 'ja-zh' ? 'JP → CN' : 'CN → JP'}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="text-[9px] text-gray-400 font-mono">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold leading-none text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-red-600"
                    aria-label="删除此条"
                  >
                    ×
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-800 font-bold line-clamp-1 mb-1">{item.input}</p>
              <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed italic border-l-2 border-blue-100 pl-2">
                {item.output}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}