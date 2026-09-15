import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { Mic, Send } from 'lucide-react';
import type { Message, PaneState } from '../types';
import { SUPPORTED_LANGUAGES } from '../types';
import { translateText } from '../utils/translate';

// Declare webkitSpeechRecognition for TS
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface InputAreaProps {
  sourceLang: string;
  onSourceLangChange: (lang: string) => void;
  onNewMessage: (msg: Message) => void;
  onInterimMessage: (text: string) => void;
  panes: PaneState[];
  isListening: boolean;
  setIsListening: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function InputArea({ 
  sourceLang, 
  onSourceLangChange, 
  onNewMessage, 
  onInterimMessage, 
  panes,
  isListening,
  setIsListening
}: InputAreaProps) {
  const [text, setText] = useState('');
  const recognitionRef = useRef<any>(null);
  
  // panes의 최신 상태를 유지하기 위한 ref (클로저 문제 해결)
  const panesRef = useRef(panes);
  useEffect(() => {
    panesRef.current = panes;
  }, [panes]);

  // isListening의 최신 상태를 유지하기 위한 ref (마이크 꺼짐 동기화 해결)
  const isListeningRef = useRef(isListening);
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true; // Show results while speaking
      const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === sourceLang);
      recognition.lang = currentLang ? currentLang.locale : sourceLang;

      recognition.onresult = async (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        // 상단 분할창으로 보여주기용 임시 텍스트 전달
        if (interimTranscript) {
          onInterimMessage(interimTranscript);
        }

        // 최종 문장이 완성되었을 때
        if (finalTranscript) {
          onInterimMessage(''); // 임시 텍스트 지우기
          await processAndTranslate(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          setIsListening(false);
          alert('마이크 사용 권한이 거부되었습니다. 주소창 왼쪽의 자물쇠 아이콘을 눌러 마이크 권한을 허용해주세요.');
        } else if (event.error !== 'no-speech') {
          // 크롬에서 에러로 인해 마이크가 중단된 경우 UI 상태 동기화
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Automatically restart if it was supposed to be listening
        if (isListeningRef.current) {
          if (document.hidden) {
            // 브라우저 탭이 숨겨지면 크롬이 마이크를 강제로 끕니다. UI 상태를 꺼짐으로 동기화합니다.
            setIsListening(false);
          } else {
            // 크롬 버그 우회: onend 직후 바로 start()를 호출하면 무시되거나 에러가 날 수 있으므로 약간의 지연 추가
            setTimeout(() => {
              if (isListeningRef.current && !document.hidden) {
                try {
                  recognition.start();
                } catch(e) {
                  setIsListening(false);
                }
              }
            }, 100);
          }
        }
      };

      recognitionRef.current = recognition;

      // Start listening by default on mount if not already
      if (!isListeningRef.current) {
         startListening();
      }
    } else {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다. 구글 크롬(Chrome)을 사용해주세요.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [sourceLang]); // Re-init when source language changes

  // 브라우저 탭 활성/비활성 상태 감지하여 마이크 상태 동기화
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isListening) {
        setIsListening(false);
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch(e) {}
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isListening, setIsListening]);

  // Keep recognition state synced
  useEffect(() => {
    if (recognitionRef.current) {
      if (isListening) {
        try {
          recognitionRef.current.start();
        } catch(e: any) {
          // 이미 켜져있는 상태(InvalidStateError)가 아니라면 UI 상태 끄기
          if (e.name !== 'InvalidStateError') {
            setIsListening(false);
          }
        }
      } else {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
    }
  }, [isListening]);

  // Listen for custom toggle event and spacebar
  useEffect(() => {
    const handleToggle = () => setIsListening(prev => !prev);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'SELECT') {
          e.preventDefault();
          setIsListening(prev => !prev);
        }
      }
    };

    window.addEventListener('toggleMic', handleToggle);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('toggleMic', handleToggle);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const startListening = () => setIsListening(true);
  const toggleListening = () => setIsListening(!isListening);

  const processAndTranslate = async (rawInputText: string) => {
    if (!rawInputText.trim()) return;

    let inputText = rawInputText.trim();

    // 한국어 음성 기호 입력 스마트 변환 기능
    if (sourceLang === 'ko') {
      inputText = inputText.replace(/\s*물음표$/, '?');
      inputText = inputText.replace(/\s*느낌표$/, '!');
      inputText = inputText.replace(/\s*마침표$/, '.');
      inputText = inputText.replace(/\s*쉼표$/, ',');
    }

    // Get unique target languages to avoid duplicate API calls
    const targetLangs = Array.from(new Set(panesRef.current.map(p => p.targetLang)));
    const timestamp = Date.now();
    
    // 1. 입력 언어(sourceLang)는 번역이 필요 없으므로 0초 만에 가장 먼저 즉시 렌더링
    if (targetLangs.includes(sourceLang)) {
      onNewMessage({
        id: crypto.randomUUID(),
        originalText: inputText,
        translatedText: inputText, // 원문 그대로
        sourceLang,
        targetLang: sourceLang,
        timestamp
      });
    }

    // 2. 나머지 외국어 창들은 순차 대기 없이 '완전 병렬'로 동시에 번역 요청 (속도 4배 향상)
    const foreignLangs = targetLangs.filter(lang => lang !== sourceLang);
    
    foreignLangs.forEach(async (targetLang) => {
      const translatedText = await translateText(inputText, sourceLang, targetLang);
      
      onNewMessage({
        id: crypto.randomUUID(),
        originalText: inputText,
        translatedText,
        sourceLang,
        targetLang,
        timestamp
      });
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    const inputText = text;
    setText(''); // Clear input immediately for better UX
    await processAndTranslate(inputText);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 border-t border-slate-200 dark:border-slate-700 z-10 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
      <form onSubmit={handleSubmit} className="flex items-center space-x-4 max-w-7xl mx-auto">
        
        {/* Source Language Selector */}
        <select
          value={sourceLang}
          onChange={(e) => onSourceLangChange(e.target.value)}
          className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px] font-medium"
        >
          {SUPPORTED_LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>

        {/* Text Input */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="번역할 텍스트를 입력하거나 마이크로 말씀하세요..."
          className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!text.trim()}
          className="p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-full transition-colors flex items-center justify-center"
        >
          <Send className="w-5 h-5" />
        </button>

        {/* Google Style Mic Toggle Button */}
        <button
          type="button"
          onClick={toggleListening}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
            isListening 
              ? 'bg-[#00a1f1] scale-110 shadow-[0_0_20px_rgba(0,161,241,0.6)]' 
              : 'bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600'
          }`}
          title={isListening ? "마이크 끄기" : "마이크 켜기"}
        >
          {isListening ? (
            <div className="flex items-center justify-center space-x-[4px] relative z-10">
              <div className="w-[4px] h-[16px] bg-slate-900 rounded-full animate-eq1"></div>
              <div className="w-[4px] h-[22px] bg-slate-900 rounded-full animate-eq2"></div>
              <div className="w-[4px] h-[16px] bg-slate-900 rounded-full animate-eq3"></div>
            </div>
          ) : (
            <Mic className="w-6 h-6 text-[#4bc0e8]" strokeWidth={2} />
          )}
        </button>
      </form>
    </div>
  );
}
