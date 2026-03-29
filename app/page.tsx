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
  const [pronunciation, setPronunciation] = useState('');

  const { completion: translatedText, complete, isLoading } = useCompletion({
    api: '/api/translate',
    body: { context: currentContext,direction,mode: 'translate' },
    streamProtocol: 'text',
  });
  // 新增：标注钩子
  const { complete: getAnnotate, isLoading: isAnnotating } = useCompletion({
    api: '/api/translate',
    body: { mode: 'annotate' }, 
    streamProtocol: 'text',
    onFinish: (prompt, result) => setPronunciation(result),
  });
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        
        {/* 第一列：输入框 */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400">INPUT</label>
          <textarea 
            className="w-full h-64 p-4 border rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-black"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入内容..."
          />
        </div>

        {/* 第二列：翻译结果 */}
        <div className="space-y-2 relative">
          <label className="text-xs font-bold text-gray-400">TRANSLATION</label>
          <div className="w-full h-64 p-4 border rounded-2xl bg-white shadow-sm overflow-y-auto">
            {translatedText}
          </div>
          
          {/* ✅ 标注按钮：仅在中翻日且有结果时显示 */}
          {direction === 'zh-ja' && translatedText && (
            <button 
              onClick={() => getAnnotate(translatedText)}
              disabled={isAnnotating}
              className="absolute bottom-4 right-4 px-3 py-1 bg-orange-500 text-white text-xs rounded-full hover:bg-orange-600 transition-all shadow-md"
            >
              {isAnnotating ? '标注中...' : '显示五十音'}
            </button>
          )}
        </div>

        {/* 第三列：五十音/罗马音（对应你画的红框） */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400">PRONUNCIATION</label>
          <div className="w-full h-64 p-4 border border-dashed border-orange-200 rounded-2xl bg-orange-50/30 overflow-y-auto">
            <p className="text-sm leading-loose whitespace-pre-wrap text-orange-900 font-medium">
              {pronunciation || (isAnnotating ? "正在努力标注..." : "点击左侧按钮获取读音")}
            </p>
          </div>
        </div>
      </div> 
      <button 
        onClick={() =>{
          setPronunciation('');
          complete(input)
        } }
        className="w-full mt-4 bg-black text-white py-3 rounded-xl"
      >
        {isLoading ? '正在分析语境并翻译...' : '立即翻译'}
      </button>
    </div>
  );
}