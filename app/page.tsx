'use client';

import { useCompletion } from '@ai-sdk/react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import TranslationHistory, { HistoryItem } from '@/components/TranslationHistory';
import {
  ImagePreviewLightbox,
  TranslatorContextBar,
  TranslatorDirectionToggle,
  TranslatorInputPanel,
  TranslatorKnowledgePanel,
  TranslatorPronunciationColumn,
  TranslatorSubmitBar,
  TranslatorTranslationColumn,
} from '@/components/translator';
import {
  downloadHistoryJson,
  mergeHistoryImportWins,
} from '@/lib/historyBackup';
import { fileToCompressedBase64 } from '@/lib/imageCompress';
import type { PendingImage } from '@/lib/translatorTypes';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useAutoScroll } from '@/hooks/useAutoScroll';

export default function TranslatorPage() {
  const [direction, setDirection] = useState<'ja-zh' | 'zh-ja'>('ja-zh');
  const [input, setInput] = useState('');
  const [currentContext, setCurrentContext] = useState('meeting');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [ragEnabled, setRagEnabled] = useState(true);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [previewLightboxOpen, setPreviewLightboxOpen] = useState(false);
  const pendingImageRef = useRef<PendingImage | null>(null);
  const imageTranslateSubmittedRef = useRef(false);
  const [lastFromImage, setLastFromImage] = useState(false);

  useEffect(() => {
    pendingImageRef.current = pendingImage;
  }, [pendingImage]);

  useEffect(() => {
    if (!pendingImage) setPreviewLightboxOpen(false);
  }, [pendingImage]);

  useEffect(() => {
    if (!previewLightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewLightboxOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewLightboxOpen]);

  const handleSpeechResult = useCallback((result: string) => {
    setInput((prev) => prev + result);
  }, []);
  const { isListening, startListening, stopListening } =
    useSpeechToText(handleSpeechResult);
  const { speak, stop: stopSpeaking, isSpeaking, supported: ttsSupported } =
    useTextToSpeech();

  const speechLang = direction === 'ja-zh' ? 'ja-JP' : 'zh-CN';
  const ttsLang = direction === 'ja-zh' ? 'zh-CN' : 'ja-JP';

  useEffect(() => {
    const saved = localStorage.getItem('translation_history');
    if (saved) setHistory(JSON.parse(saved));
    const kb = localStorage.getItem('translation_knowledge');
    if (kb) setKnowledgeBase(kb);
  }, []);

  useEffect(() => {
    localStorage.setItem('translation_knowledge', knowledgeBase);
  }, [knowledgeBase]);

  const clearPendingImage = useCallback(() => {
    setPendingImage((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  }, []);

  const { completion: translatedText, complete: translate, isLoading: isTranslating } =
    useCompletion({
      api: '/api/translate',
      body: {
        context: currentContext,
        direction,
        mode: 'translate',
        knowledgeBase: ragEnabled ? knowledgeBase : '',
      },
      streamProtocol: 'text',
      onFinish: () => {
        if (!imageTranslateSubmittedRef.current) return;
        imageTranslateSubmittedRef.current = false;
        clearPendingImage();
      },
      onError: () => {
        imageTranslateSubmittedRef.current = false;
      },
    });
  const scrolltranslatedContainerRef = useAutoScroll(translatedText);

  useEffect(() => {
    if (isTranslating) stopSpeaking();
  }, [isTranslating, stopSpeaking]);

  const { completion: annotatedText, complete: getAnnotate, isLoading: isAnnotating } =
    useCompletion({
      api: '/api/translate',
      body: { mode: 'annotate' },
      streamProtocol: 'text',
    });
  const scrollannotatedContainerRef = useAutoScroll(annotatedText);

  const handleSaveToHistory = () => {
    const sourceInput =
      input.trim() || (lastFromImage ? '（图片翻译）' : '');
    if (!sourceInput || !translatedText) return;

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      input: sourceInput,
      output: translatedText,
      direction,
      timestamp: Date.now(),
    };

    const updated = [newItem, ...history].slice(0, 50);
    setHistory(updated);
    localStorage.setItem('translation_history', JSON.stringify(updated));
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file?.type.startsWith('image/')) return;
    if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    const preview = URL.createObjectURL(file);
    try {
      const { base64, mediaType } = await fileToCompressedBase64(file);
      setPendingImage({ previewUrl: preview, base64, mediaType });
      setLastFromImage(false);
    } catch {
      URL.revokeObjectURL(preview);
      alert('图片处理失败，请换一张或缩小图片后重试');
    }
  };

  useEffect(() => {
    return () => {
      const p = pendingImageRef.current;
      if (p?.previewUrl) URL.revokeObjectURL(p.previewUrl);
    };
  }, []);

  const canSubmitTranslate = useMemo(
    () => Boolean(pendingImage?.base64) || Boolean(input.trim()),
    [pendingImage, input],
  );

  const handleMainTranslate = () => {
    if (isTranslating) return;
    if (pendingImage) {
      imageTranslateSubmittedRef.current = true;
      setLastFromImage(true);
      translate('', {
        body: {
          mode: 'translate-image',
          imageBase64: pendingImage.base64,
          imageMediaType: pendingImage.mediaType,
        },
      });
      return;
    }
    imageTranslateSubmittedRef.current = false;
    setLastFromImage(false);
    translate(input);
  };

  const submitLabel =
    isTranslating && lastFromImage
      ? '正在识别图片并翻译…'
      : isTranslating
        ? '正在分析语境并翻译...'
        : pendingImage
          ? '立即翻译（图片）'
          : '立即翻译';

  return (
    <div className="mx-auto max-w-2xl p-8">
      <ImagePreviewLightbox
        open={previewLightboxOpen}
        previewUrl={pendingImage?.previewUrl ?? null}
        onClose={() => setPreviewLightboxOpen(false)}
      />

      <TranslatorContextBar
        currentContext={currentContext}
        onContextChange={setCurrentContext}
      />

      <TranslatorDirectionToggle
        direction={direction}
        onToggle={() =>
          setDirection((d) => (d === 'ja-zh' ? 'zh-ja' : 'ja-zh'))
        }
      />

      <TranslatorKnowledgePanel
        knowledgeBase={knowledgeBase}
        onKnowledgeBaseChange={setKnowledgeBase}
        ragEnabled={ragEnabled}
        onRagEnabledChange={setRagEnabled}
        disabled={!!pendingImage}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <TranslatorInputPanel
          input={input}
          onInputChange={setInput}
          pendingImage={pendingImage}
          onClearPendingImage={clearPendingImage}
          onOpenPreviewLightbox={() => setPreviewLightboxOpen(true)}
          imageInputRef={imageInputRef}
          onPickImageClick={() => imageInputRef.current?.click()}
          onImageFileChange={handleImageFile}
          isListening={isListening}
          onToggleListen={() =>
            isListening ? stopListening() : startListening(speechLang)
          }
          speechLang={speechLang}
          isTranslating={isTranslating}
          lastFromImage={lastFromImage}
        />

        <TranslatorTranslationColumn
          translatedText={translatedText}
          isTranslating={isTranslating}
          scrollRef={scrolltranslatedContainerRef}
          showToolbar={Boolean(translatedText && !isTranslating)}
          onSaveToHistory={handleSaveToHistory}
          onSpeakToggle={() =>
            isSpeaking ? stopSpeaking() : speak(translatedText, ttsLang)
          }
          isSpeaking={isSpeaking}
          ttsSupported={ttsSupported}
          ttsLang={ttsLang}
          onAnnotate={() => getAnnotate(translatedText)}
          isAnnotating={isAnnotating}
        />

        <TranslatorPronunciationColumn
          annotatedText={annotatedText}
          isAnnotating={isAnnotating}
          scrollRef={scrollannotatedContainerRef}
        />
      </div>

      <TranslatorSubmitBar
        disabled={isTranslating || !canSubmitTranslate}
        onSubmit={handleMainTranslate}
        label={submitLabel}
      />

      <div className="h-[600px]">
        <TranslationHistory
          items={history}
          onClear={() => {
            setHistory([]);
            localStorage.removeItem('translation_history');
          }}
          onItemClick={(item) => setInput(item.input)}
          onDeleteItem={(id) => {
            const updated = history.filter((h) => h.id !== id);
            setHistory(updated);
            localStorage.setItem(
              'translation_history',
              JSON.stringify(updated),
            );
          }}
          onExport={() => downloadHistoryJson(history)}
          onImportValidated={(incoming) => {
            const merged = mergeHistoryImportWins(history, incoming);
            setHistory(merged);
            localStorage.setItem(
              'translation_history',
              JSON.stringify(merged),
            );
          }}
        />
      </div>
    </div>
  );
}
