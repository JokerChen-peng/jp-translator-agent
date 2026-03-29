'use client';

type Props = {
  direction: 'ja-zh' | 'zh-ja';
  onToggle: () => void;
};

export function TranslatorDirectionToggle({ direction, onToggle }: Props) {
  return (
    <div className="mb-4 flex justify-end">
      <button
        type="button"
        onClick={onToggle}
        className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
      >
        {direction === 'ja-zh' ? '🇯🇵 日 → 🇨🇳 中' : '🇨🇳 中 → 🇯🇵 日'}
      </button>
    </div>
  );
}
