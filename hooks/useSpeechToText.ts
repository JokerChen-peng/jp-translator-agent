'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export const useSpeechToText = (onResult: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      
      // ✅ 关键设置 1：开启连续识别
      // 设为 true 后，即便你中间换气停顿，它也不会自动关闭
      rec.continuous = true; 

      // ✅ 关键设置 2：开启临时结果
      // 设为 true 可以让你在说话的过程中就能看到文字变动，体验更好
      rec.interimResults = true; 

      rec.onresult = (event: any) => {
        let finalTranscript = '';
        
        // continuous 模式下，结果是一个数组，我们需要遍历它
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          onResult(finalTranscript);
        }
      };

      rec.onend = () => {
        // 只有当我们没有手动停止，且它意外结束时（比如网络抖动），才重置状态
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [onResult]);

  const startListening = useCallback((lang: 'ja-JP' | 'zh-CN') => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return { isListening, startListening, stopListening };
};