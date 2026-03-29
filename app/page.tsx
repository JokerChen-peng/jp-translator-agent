'use client';

import { useCompletion } from '@ai-sdk/react';
import { useState,useEffect } from 'react';
import TranslationHistory, { HistoryItem } from '@/components/TranslationHistory';
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
  const [history, setHistory] = useState<HistoryItem[]>([]);
  // 1. 初始化加载
  useEffect(() => {
    const saved = localStorage.getItem('translation_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);
 
  const { completion: translatedText, complete:translate, isLoading:isTranslating } = useCompletion({
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


  //新增：手动保存逻辑
  const handleSaveToHistory = () => {
    if (!input || !translatedText) return;

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      input: input,
      output: translatedText,
      direction: direction,
      timestamp: Date.now(),
    };

    const updated = [newItem, ...history].slice(0, 50); // 增加上限到50条
    setHistory(updated);
    localStorage.setItem('translation_history', JSON.stringify(updated));
    // 保存后可以给用户一个简单的反馈，或者让按钮置灰
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
        {/* 这是包裹翻译结果和按钮的容器，必须有 'relative' 类 */}
  <div className="w-full h-64 p-4 border rounded-2xl bg-white shadow-sm overflow-y-auto">
    {isTranslating ? (
      <span className="animate-pulse text-gray-400">正在生成...</span>
    ) : (
      translatedText
    )}

    {/* 只有在翻译出结果且不再加载时显示功能按钮 */}
    {translatedText && !isTranslating && (
      <>
        {/* ✅ 新位置 1：左下角 - 存入历史按钮 (星星) */}
        {/* 这是一个更小、独立、精致的按钮样式 */}
        <button 
          onClick={handleSaveToHistory}
          title="存入历史记录"
          className="absolute bottom-4 left-4 p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-bold flex items-center gap-1 shadow-inner"
        >
          {/* <span className="text-sm">⭐</span>  */}
          存入
        </button>

        {/* ✅ 保持原位置 2：右下角 - 显示五十音按钮 (橙色药丸) */}
        {/* 这里保持原样，没有任何修改 */}
        <button 
          onClick={() => getAnnotate(translatedText)}
          disabled={isAnnotating}
          className="absolute bottom-4 right-4 px-3 py-1 bg-orange-500 text-white text-xs rounded-full hover:bg-orange-600 transition-all shadow-md font-medium"
        >
          {isAnnotating ? '标注中...' : '显示五十音'}
        </button>
      </>
    )}
  </div>
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
          translate(input)
        } }
        className="w-full mt-4 bg-black text-white py-3 rounded-xl"
      >
        {isTranslating ? '正在分析语境并翻译...' : '立即翻译'}
      </button>
      {/* ✅ 第四列：引用独立组件 */}
        <div className="h-[600px]">
          <TranslationHistory 
           items={history} 
            onClear={() => { setHistory([]); localStorage.removeItem('translation_history'); }}
            onItemClick={(item) => {
              setInput(item.input);
              // 这里可以根据需要决定是否自动触发翻译
            }}
            onDeleteItem={(id) => {
              // 额外增加一个删除单条的功能
              const updated = history.filter(h => h.id !== id);
              setHistory(updated);
              localStorage.setItem('translation_history', JSON.stringify(updated));
            }}
          />
        </div>
    </div>
  );
}