'use client';

import { useCompletion } from '@ai-sdk/react';
import { useState } from 'react';

const CONTEXTS = [
  { id: 'meeting', label: '🏫 组会', color: 'bg-blue-500' },
  { id: 'business', label: '💼 商务', color: 'bg-green-600' },
  { id: 'friend', label: '🍺 朋友', color: 'bg-orange-500' }
];

export default function TranslatorPage() {
  const [currentContext, setCurrentContext] = useState('meeting');
  const [input, setInput] = useState('');

  const { completion, complete, isLoading } = useCompletion({
    api: '/api/translate',
    body: { context: currentContext },
  });

  return (
    <main className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          JP-ZH Translation Agent
        </h1>

        {/* 语境切换器 */}
        <div className="flex gap-4 mb-6 justify-center">
          {CONTEXTS.map((ctx) => (
            <button
              key={ctx.id}
              onClick={() => setCurrentContext(ctx.id)}
              className={`px-4 py-2 rounded-full transition-all ${
                currentContext === ctx.id 
                ? `${ctx.color} text-white shadow-md scale-105` 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {ctx.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <textarea
            className="w-full h-48 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            placeholder="请输入日语原文..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          
          <div className="w-full h-48 p-4 border rounded-lg bg-gray-50 overflow-y-auto">
            <div className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
              {currentContext} 翻译结果:
            </div>
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
              {completion}
            </p>
          </div>
        </div>

        <button
          onClick={() => complete(input)}
          disabled={isLoading || !input}
          className="w-full mt-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-300 transition-colors"
        >
          {isLoading ? 'Agent 正在翻译中...' : '开始翻译'}
        </button>
      </div>
    </main>
  );
}