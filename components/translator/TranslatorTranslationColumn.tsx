'use client';

import type { RefObject } from 'react';

type Props = {
  translatedText: string;
  isTranslating: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  showToolbar: boolean;
  onSaveToHistory: () => void;
  onSpeakToggle: () => void;
  isSpeaking: boolean;
  ttsSupported: boolean;
  ttsLang: 'zh-CN' | 'ja-JP';
  onAnnotate: () => void;
  isAnnotating: boolean;
};

export function TranslatorTranslationColumn({
  translatedText,
  isTranslating,
  scrollRef,
  showToolbar,
  onSaveToHistory,
  onSpeakToggle,
  isSpeaking,
  ttsSupported,
  ttsLang,
  onAnnotate,
  isAnnotating,
}: Props) {
  return (
    <div className="relative space-y-2">
      <label className="text-xs font-bold text-gray-400">TRANSLATION</label>
      <div className="flex h-64 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div
          className="relative min-h-0 flex-1 overflow-y-auto p-4"
          ref={scrollRef}
        >
          <div className="whitespace-pre-wrap text-gray-800">
            {translatedText}
            {isTranslating && (
              <span className="ml-1 inline-block h-5 w-1.5 animate-pulse bg-blue-500 align-middle" />
            )}
          </div>
          {isTranslating && !translatedText && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50">
              <p className="text-xs text-gray-400">正在翻译...</p>
            </div>
          )}
        </div>

        {showToolbar && (
          <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50 px-2 py-2">
            <div className="flex flex-wrap items-stretch justify-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={onSaveToHistory}
                title="存入历史记录"
                className="translation-action-btn"
              >
                存入
              </button>
              <button
                type="button"
                onClick={onSpeakToggle}
                disabled={!ttsSupported}
                title={
                  ttsSupported
                    ? isSpeaking
                      ? '停止朗读'
                      : `朗读译文（${ttsLang === 'zh-CN' ? '中文' : '日文'}）`
                    : '当前浏览器不支持语音合成'
                }
                className={`translation-action-btn ${isSpeaking ? 'translation-action-btn--active' : ''}`}
              >
                {isSpeaking ? '停止' : '🔊 朗读'}
              </button>
              <button
                type="button"
                onClick={onAnnotate}
                disabled={isAnnotating}
                title="为日语译文标注假名"
                className="translation-action-btn disabled:opacity-40"
              >
                {isAnnotating ? '标注中…' : '五十音'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
