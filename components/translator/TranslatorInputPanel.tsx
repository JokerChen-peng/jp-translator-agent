'use client';

import type { RefObject } from 'react';
import type { PendingImage } from '@/lib/translatorTypes';

type Props = {
  input: string;
  onInputChange: (v: string) => void;
  imageInstruction: string;
  onImageInstructionChange: (v: string) => void;
  pendingImage: PendingImage | null;
  onClearPendingImage: () => void;
  onOpenPreviewLightbox: () => void;
  imageInputRef: RefObject<HTMLInputElement | null>;
  onPickImageClick: () => void;
  onImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isListening: boolean;
  onToggleListen: () => void;
  speechLang: 'ja-JP' | 'zh-CN';
  isTranslating: boolean;
  lastFromImage: boolean;
};

export function TranslatorInputPanel({
  input,
  onInputChange,
  imageInstruction,
  onImageInstructionChange,
  pendingImage,
  onClearPendingImage,
  onOpenPreviewLightbox,
  imageInputRef,
  onPickImageClick,
  onImageFileChange,
  isListening,
  onToggleListen,
  speechLang,
  isTranslating,
  lastFromImage,
}: Props) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-400">INPUT</label>
      <div
        className={`relative rounded-2xl border shadow-sm transition-colors ${pendingImage ? 'border-gray-300 bg-gray-100' : 'border-gray-200 bg-white'}`}
      >
        {pendingImage ? (
          <div className="flex min-h-[16rem] flex-col gap-2 p-4 pb-14">
            <div className="flex shrink-0 flex-col items-center gap-2">
              <button
                type="button"
                onClick={onOpenPreviewLightbox}
                className="group relative max-h-[9rem] max-w-full rounded-lg border border-gray-200 bg-white/50 shadow-sm outline-none ring-black transition hover:ring-2 focus-visible:ring-2"
                title="点击查看大图"
              >
                <img
                  src={pendingImage.previewUrl}
                  alt="待译预览"
                  className="max-h-[9rem] max-w-full rounded-lg object-contain"
                />
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 text-[10px] font-medium text-white opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
                  点击放大
                </span>
              </button>
              <p className="text-center text-[11px] text-gray-500">
                图源为待译正文 · 下方可写补充说明（可选）
              </p>
              <button
                type="button"
                className="text-xs font-medium text-gray-600 underline decoration-gray-400 underline-offset-2 hover:text-gray-900"
                onClick={onClearPendingImage}
              >
                移除图片
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-500">
                翻译说明（非原文）
              </label>
              <textarea
                className="block h-24 w-full resize-y rounded-xl border border-gray-200 bg-white/80 p-3 text-[14px] leading-relaxed text-gray-900 outline-none focus:ring-2 focus:ring-inset focus:ring-black"
                value={imageInstruction}
                onChange={(e) => onImageInstructionChange(e.target.value)}
                placeholder="例如：只翻译红框内标题；菜单保留价格数字；人名按音译…"
                disabled={isTranslating}
              />
            </div>
          </div>
        ) : (
          <textarea
            className="block h-64 min-h-[16rem] w-full resize-y rounded-2xl border-0 bg-transparent p-4 pb-12 pr-[5.25rem] text-[15px] leading-relaxed outline-none focus:ring-2 focus:ring-inset focus:ring-black"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="输入内容，或使用右下角 📷 / 🎤"
          />
        )}
        <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={onPickImageClick}
            disabled={isTranslating}
            className={`pointer-events-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg transition-all disabled:pointer-events-none disabled:opacity-40 ${isTranslating && lastFromImage
              ? 'animate-pulse bg-amber-100 text-amber-800'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            title={isTranslating && lastFromImage ? '正在识别图片…' : '选择图片'}
          >
            📷
          </button>
          <button
            type="button"
            disabled={!!pendingImage}
            onClick={onToggleListen}
            className={`pointer-events-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg transition-all disabled:cursor-not-allowed disabled:opacity-35 ${isListening
              ? 'animate-pulse bg-red-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            title={
              pendingImage
                ? '图片模式下请使用「立即翻译」'
                : `语音输入（${speechLang}）`
            }
          >
            {isListening ? '🛑' : '🎤'}
          </button>
        </div>
      </div>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onImageFileChange}
      />
    </div>
  );
}
