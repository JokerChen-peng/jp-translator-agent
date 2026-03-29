'use client';

import type { RefObject } from 'react';

type Props = {
  annotatedText: string;
  isAnnotating: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
};

export function TranslatorPronunciationColumn({
  annotatedText,
  isAnnotating,
  scrollRef,
}: Props) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-400">PRONUNCIATION</label>
      <div
        className="relative h-64 w-full overflow-y-auto rounded-2xl border border-dashed border-orange-200 bg-orange-50/30 p-4"
        ref={scrollRef}
      >
        <div className="whitespace-pre-wrap text-gray-800">
          {annotatedText}
          {isAnnotating && (
            <span className="ml-1 inline-block h-5 w-1.5 animate-pulse bg-blue-500 align-middle" />
          )}
        </div>
        {isAnnotating && !annotatedText && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50">
            <p className="text-xs text-gray-400">正在标注...</p>
          </div>
        )}
      </div>
    </div>
  );
}
