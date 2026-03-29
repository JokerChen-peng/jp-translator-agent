'use client';

import { useCompletion } from '@ai-sdk/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import TranslationHistory, { HistoryItem } from '@/components/TranslationHistory';
import {
  downloadHistoryJson,
  mergeHistoryImportWins,
} from '@/lib/historyBackup';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useAutoScroll } from '@/hooks/useAutoScroll';

/** 缩放并转为 JPEG，控制体积与 Edge 请求上限 */
function fileToCompressedBase64(
  file: File,
  maxWidth = 1280,
  quality = 0.82,
): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64 = dataUrl.split(',')[1] ?? '';
      if (!base64) {
        reject(new Error('encode'));
        return;
      }
      resolve({ base64, mediaType: 'image/jpeg' });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片无法加载'));
    };
    img.src = url;
  });
}

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
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [ragEnabled, setRagEnabled] = useState(true);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [lastFromImage, setLastFromImage] = useState(false);

  // ✅ 集成语音功能
  const handleSpeechResult = useCallback((result: string) => {
    setInput(prev => prev + result);
  }, []);
  const { isListening, startListening, stopListening } = useSpeechToText(handleSpeechResult);
  const { speak, stop: stopSpeaking, isSpeaking, supported: ttsSupported } =
    useTextToSpeech();

  const speechLang = direction === 'ja-zh' ? 'ja-JP' : 'zh-CN';
  /** 译文语言：日译中 → 中文朗读，中译日 → 日文朗读 */
  const ttsLang = direction === 'ja-zh' ? 'zh-CN' : 'ja-JP';
  // 1. 初始化加载
  useEffect(() => {
    const saved = localStorage.getItem('translation_history');
    if (saved) setHistory(JSON.parse(saved));
    const kb = localStorage.getItem('translation_knowledge');
    if (kb) setKnowledgeBase(kb);
  }, []);

  useEffect(() => {
    localStorage.setItem('translation_knowledge', knowledgeBase);
  }, [knowledgeBase]);

  const { completion: translatedText, complete: translate, isLoading: isTranslating } = useCompletion({
    api: '/api/translate',
    body: {
      context: currentContext,
      direction,
      mode: 'translate',
      knowledgeBase: ragEnabled ? knowledgeBase : '',
    },
    streamProtocol: 'text',
  });
  const scrolltranslatedContainerRef = useAutoScroll(translatedText);

  useEffect(() => {
    if (isTranslating) stopSpeaking();
  }, [isTranslating, stopSpeaking]);

  // 新增：标注钩子
  const { completion: annotatedText, complete: getAnnotate, isLoading: isAnnotating } = useCompletion({
    api: '/api/translate',
    body: { mode: 'annotate' },
    streamProtocol: 'text',
  });
  const scrollannotatedContainerRef = useAutoScroll(annotatedText);

  //新增：手动保存逻辑
  const handleSaveToHistory = () => {
    const sourceInput = input.trim() || (lastFromImage ? '（图片翻译）' : '');
    if (!sourceInput || !translatedText) return;

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      input: sourceInput,
      output: translatedText,
      direction: direction,
      timestamp: Date.now(),
    };

    const updated = [newItem, ...history].slice(0, 50); // 增加上限到50条
    setHistory(updated);
    localStorage.setItem('translation_history', JSON.stringify(updated));
    // 保存后可以给用户一个简单的反馈，或者让按钮置灰
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file?.type.startsWith('image/')) return;
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    const preview = URL.createObjectURL(file);
    setImagePreviewUrl(preview);
    setLastFromImage(true);
    try {
      const { base64, mediaType } = await fileToCompressedBase64(file);
      await translate('', {
        body: {
          mode: 'translate-image',
          imageBase64: base64,
          imageMediaType: mediaType,
        },
      });
    } catch {
      setLastFromImage(false);
      URL.revokeObjectURL(preview);
      setImagePreviewUrl(null);
      alert('图片翻译失败，请换一张或缩小图片后重试');
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  return (
    <div className="max-w-2xl mx-auto p-8">
      {/* 1. 语境选择栏 */}
      <div className="flex gap-2 mb-6 justify-center">
        {CONTEXTS.map((ctx) => (
          <button
            key={ctx.id}
            onClick={() => setCurrentContext(ctx.id)}
            className={`px-4 py-2 rounded-full text-sm transition-all ${currentContext === ctx.id
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

      {/* RAG 知识库 */}
      <div className="mb-6 p-4 rounded-2xl border border-gray-200 bg-gray-50/80 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-bold text-gray-500">知识库（Gemini Embedding RAG）</label>
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={ragEnabled}
              onChange={(e) => setRagEnabled(e.target.checked)}
              className="rounded border-gray-300"
            />
            启用检索
          </label>
        </div>
        <textarea
          className="w-full min-h-[88px] p-3 text-sm border rounded-xl bg-white shadow-sm outline-none focus:ring-2 focus:ring-black resize-y"
          value={knowledgeBase}
          onChange={(e) => setKnowledgeBase(e.target.value)}
          placeholder="每段之间空一行，例如术语表、固定译法、例句。翻译时用向量检索最相关的几段注入语境。"
        />
      </div>

      {/* 3. 输入/输出框 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        {/* 第一列：输入框 */}
        <div className="space-y-2 relative">
          <label className="text-xs font-bold text-gray-400">INPUT</label>
          <textarea
            className="w-full h-64 p-4 border rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-black"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入内容..."
          />
          {/* ✅ 语音输入按钮 */}
          <button
            onClick={() => isListening ? stopListening() : startListening(speechLang)}
            className={`absolute bottom-4 right-4 p-3 rounded-full transition-all ${isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            title="点击语音输入"
          >
            {isListening ? '🛑' : '🎤'}
          </button>
        </div>

        {/* 第二列：翻译结果 */}
        <div className="space-y-2 relative">
          <label className="text-xs font-bold text-gray-400">TRANSLATION</label>
          <div className="flex flex-col h-64 border rounded-2xl bg-white shadow-sm overflow-hidden">
            <div
              className="flex-1 min-h-0 overflow-y-auto p-4 relative"
              ref={scrolltranslatedContainerRef}
            >
              <div className="whitespace-pre-wrap text-gray-800">
                {translatedText}
                {isTranslating && (
                  <span className="inline-block w-1.5 h-5 ml-1 bg-blue-500 animate-pulse align-middle" />
                )}
              </div>
              {isTranslating && !translatedText && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                  <p className="text-xs text-gray-400">正在翻译...</p>
                </div>
              )}
            </div>

            {translatedText && !isTranslating && (
              <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50 px-2 py-2">
                <div className="flex flex-wrap items-stretch justify-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={handleSaveToHistory}
                    title="存入历史记录"
                    className="translation-action-btn"
                  >
                    存入
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      isSpeaking
                        ? stopSpeaking()
                        : speak(translatedText, ttsLang)
                    }
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
                    onClick={() => getAnnotate(translatedText)}
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

        {/* 第三列：五十音/罗马音（对应你画的红框） */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400">PRONUNCIATION</label>
          <div className="w-full h-64 p-4 border border-dashed border-orange-200 rounded-2xl bg-orange-50/30 overflow-y-auto relative" ref={scrollannotatedContainerRef}>
            {/* 1. 只要 translatedText 有内容就实时显示，哪怕正在加载中 */}
            <div className="whitespace-pre-wrap text-gray-800">
              {annotatedText}

              {/* 2. 只有在加载中且内容还没出全时，显示一个打字机光标 */}
              {isAnnotating && (
                <span className="inline-block w-1.5 h-5 ml-1 bg-blue-500 animate-pulse align-middle" />
              )}
            </div>
            {/* 3. 如果完全没内容且正在加载，可以显示大 Loading */}
            {isAnnotating && !annotatedText && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                <p className="text-xs text-gray-400">正在标注...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFile}
      />

      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <button
          type="button"
          disabled={isTranslating}
          onClick={() => {
            setLastFromImage(false);
            translate(input);
          }}
          className="flex-1 bg-black text-white py-3 rounded-xl disabled:opacity-50"
        >
          {isTranslating && !lastFromImage
            ? '正在分析语境并翻译...'
            : '立即翻译'}
        </button>
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={isTranslating}
          className="flex-1 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50"
        >
          {isTranslating && lastFromImage ? '正在识别图片并翻译…' : '📷 图片翻译'}
        </button>
      </div>

      {imagePreviewUrl && (
        <div className="mt-3 flex items-center gap-3">
          <img
            src={imagePreviewUrl}
            alt="待译预览"
            className="h-16 w-auto max-w-[120px] rounded-lg border object-cover"
          />
          <button
            type="button"
            className="text-xs text-gray-500 underline"
            onClick={() => {
              if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
              setImagePreviewUrl(null);
            }}
          >
            清除预览
          </button>
        </div>
      )}
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
          onExport={() => downloadHistoryJson(history)}
          onImportValidated={(incoming) => {
            const merged = mergeHistoryImportWins(history, incoming);
            setHistory(merged);
            localStorage.setItem('translation_history', JSON.stringify(merged));
          }}
        />
      </div>
    </div>
  );
}