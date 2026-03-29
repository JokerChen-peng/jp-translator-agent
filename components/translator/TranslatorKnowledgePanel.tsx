'use client';

type Props = {
  knowledgeBase: string;
  onKnowledgeBaseChange: (v: string) => void;
  ragEnabled: boolean;
  onRagEnabledChange: (v: boolean) => void;
  disabled: boolean;
};

export function TranslatorKnowledgePanel({
  knowledgeBase,
  onKnowledgeBaseChange,
  ragEnabled,
  onRagEnabledChange,
  disabled,
}: Props) {
  return (
    <div
      className={`mb-6 space-y-2 rounded-2xl border border-gray-200 bg-gray-50/80 p-4 transition-opacity ${disabled ? 'pointer-events-none select-none opacity-40' : ''}`}
      aria-disabled={disabled ? true : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-gray-500">
          知识库（Gemini Embedding RAG）
        </label>
        <label
          className={`flex items-center gap-2 text-xs text-gray-600 ${disabled ? '' : 'cursor-pointer'}`}
        >
          <input
            type="checkbox"
            checked={ragEnabled}
            disabled={disabled}
            onChange={(e) => onRagEnabledChange(e.target.checked)}
            className="rounded border-gray-300 disabled:cursor-not-allowed"
          />
          启用检索
        </label>
      </div>
      <textarea
        className="w-full min-h-[88px] resize-y rounded-xl border bg-white p-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-black disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
        value={knowledgeBase}
        disabled={disabled}
        onChange={(e) => onKnowledgeBaseChange(e.target.value)}
        placeholder="每段之间空一行，例如术语表、固定译法、例句。翻译时用向量检索最相关的几段注入语境。"
      />
    </div>
  );
}
