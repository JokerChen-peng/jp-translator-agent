'use client';

import { useCompletion } from '@ai-sdk/react';
import { useState } from 'react';

const CONTEXTS = [
  { id: 'meeting', label: '🏫 组会', color: 'bg-blue-500' },
  { id: 'business', label: '💼 商务', color: 'bg-green-600' },
  { id: 'friend', label: '🍺 朋友', color: 'bg-orange-500' }
];

export default function TranslatorPage() {
 // 增加翻译方向：'ja-zh' (日翻中) 或 'zh-ja' (中翻日)
  const [direction, setDirection] = useState<'ja-zh' | 'zh-ja'>('ja-zh');
  const [input, setInput] = useState('');
  const [currentContext, setCurrentContext] = useState('meeting');


  const { completion, complete, isLoading } = useCompletion({
    api: '/api/translate',
    body: { context: currentContext,direction },
    streamProtocol: 'text',
  });
  // 切换方向的函数
  const toggleDirection = () => {
    setDirection(prev => prev === 'ja-zh' ? 'zh-ja' : 'ja-zh');
    setInput(''); // 切换时建议清空，防止语境混乱
  };

  return (
  <div className="max-w-2xl mx-auto p-8">
      {/* 1. 语境选择栏 */}
      <div className="flex gap-2 mb-6 justify-center">
        {CONTEXTS.map((ctx) => (
          <button
            key={ctx.id}
            onClick={() => setCurrentContext(ctx.id)}
            className={`px-4 py-2 rounded-full text-sm transition-all ${
              currentContext === ctx.id 
                ? `${ctx.color} text-white shadow-lg scale-105` 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {ctx.label}
          </button>
        ))}
      </div>

      {/* 2. 中日切换栏 */}
      <div className="flex justify-end mb-4">
         <button onClick={() => setDirection(d => d === 'ja-zh' ? 'zh-ja' : 'ja-zh')} className="...">
            {direction === 'ja-zh' ? '🇯🇵 日 → 🇨🇳 中' : '🇨🇳 中 → 🇯🇵 日'}
         </button>
      </div>

      {/* 3. 输入/输出框 */}
      <div className="grid grid-cols-1 gap-4">
        <textarea 
          className="border p-4 rounded-xl h-40"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入文字..."
        />
        <div className="border p-4 rounded-xl h-40 bg-gray-50 whitespace-pre-wrap">
          {completion}
        </div>
      </div>

      <button 
        onClick={() => complete(input)}
        className="w-full mt-4 bg-black text-white py-3 rounded-xl"
      >
        {isLoading ? '正在分析语境并翻译...' : '立即翻译'}
      </button>
    </div>
  );
}