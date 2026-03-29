'use client';

import React from 'react';

export interface HistoryItem {
  id: string;
  input: string;
  output: string;
  direction: 'ja-zh' | 'zh-ja';
  timestamp: number;
}

export interface HistoryProps {
  /** 存储在本地的翻译记录列表 */
  items: HistoryItem[];
  /** 清空所有历史记录 */
  onClear: () => void;
  /** 点击历史项回填输入框 */
  onItemClick: (item: HistoryItem) => void;
  /** 删除特定的历史记录项 */
  onDeleteItem: (id: string) => void;
}

export default function TranslationHistory({ items, onClear, onItemClick, onDeleteItem }: HistoryProps) {
  return (
    <div className="flex flex-col h-full bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-black text-gray-800 tracking-tight uppercase">Saved Records</h3>
        {items.length > 0 && (
          <button onClick={onClear} className="text-[10px] text-gray-400 hover:text-red-500 uppercase tracking-tighter font-bold">
            Clear All
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-300">
            <p className="text-xs italic">点击翻译下方的 ⭐ 存入</p>
          </div>
        ) : (
          items.map((item) => (
            <div 
              key={item.id}
              className="group relative bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
              onClick={() => onItemClick(item)}
            >
              {/* 删除小叉号 - 仅在悬停时显示 */}
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // 防止触发点击回填
                  onDeleteItem(item.id);
                }}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                ×
              </button>

              <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] font-bold bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded uppercase">
                  {item.direction === 'ja-zh' ? 'JP → CN' : 'CN → JP'}
                </span>
                <span className="text-[9px] text-gray-400 font-mono">
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
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