'use client';

import { CONTEXTS } from './constants';

type Props = {
  currentContext: string;
  onContextChange: (id: string) => void;
};

export function TranslatorContextBar({
  currentContext,
  onContextChange,
}: Props) {
  return (
    <div className="mb-6 flex justify-center gap-2">
      {CONTEXTS.map((ctx) => (
        <button
          key={ctx.id}
          type="button"
          onClick={() => onContextChange(ctx.id)}
          className={`rounded-full px-4 py-2 text-sm transition-all ${currentContext === ctx.id
            ? `${ctx.color} scale-105 text-white shadow-lg`
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          {ctx.label}
        </button>
      ))}
    </div>
  );
}
