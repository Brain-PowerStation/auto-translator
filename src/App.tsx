import { useState, useEffect } from 'react';
import Header from './components/Header';
import TranslatorGrid from './components/TranslatorGrid';
import InputArea from './components/InputArea';
import type { PaneState, LayoutMode, Message, SplitDirection } from './types';

function App() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(4);
  const [splitDirection, setSplitDirection] = useState<SplitDirection>('vertical');
  const [fontSize, setFontSize] = useState<number>(18);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [panes, setPanes] = useState<PaneState[]>(() => {
    const saved = localStorage.getItem('translator_panes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // parsing error fallback
      }
    }
    return [
      { id: '1', targetLang: 'ko' },
      { id: '2', targetLang: 'mn' },
      { id: '3', targetLang: 'my' },
      { id: '4', targetLang: '' },
    ];
  });

  // 언어 설정이 바뀔 때마다 브라우저에 저장
  useEffect(() => {
    localStorage.setItem('translator_panes', JSON.stringify(panes));
  }, [panes]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sourceLang, setSourceLang] = useState<string>('ko');
  const [interimText, setInterimText] = useState<string>('');

  const [isListening, setIsListening] = useState<boolean>(false);

  // Handle dark mode toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLayoutChange = (mode: LayoutMode) => {
    setLayoutMode(mode);
  };

  const handlePaneLangChange = (id: string, newLang: string) => {
    setPanes(prev => prev.map(p => p.id === id ? { ...p, targetLang: newLang } : p));
    
    // 최근 10개의 고유한 발화(문장) 추출
    const uniqueUtterances: { originalText: string, sourceLang: string, timestamp: number }[] = [];
    const seenTimestamps = new Set();
    
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (!seenTimestamps.has(msg.timestamp)) {
        seenTimestamps.add(msg.timestamp);
        uniqueUtterances.push({
          originalText: msg.originalText,
          sourceLang: msg.sourceLang,
          timestamp: msg.timestamp
        });
        if (uniqueUtterances.length === 10) break;
      }
    }
    
    uniqueUtterances.reverse(); // 시간순 정렬
    
    if (uniqueUtterances.length > 0) {
      const translateRecent = async () => {
        // App.tsx에서 translateText를 사용하기 위해 동적 임포트 사용 (상단 임포트 꼬임 방지)
        const { translateText } = await import('./utils/translate');
        
        for (const utterance of uniqueUtterances) {
          const translatedText = await translateText(utterance.originalText, utterance.sourceLang, newLang);
          const newMsg: Message = {
            id: crypto.randomUUID(),
            originalText: utterance.originalText,
            translatedText,
            sourceLang: utterance.sourceLang,
            targetLang: newLang,
            timestamp: utterance.timestamp
          };
          setMessages(prev => {
            // 혹시 이미 번역된 문장이 있다면 중복 추가 방지
            if (prev.some(m => m.timestamp === newMsg.timestamp && m.targetLang === newMsg.targetLang)) {
              return prev;
            }
            return [...prev, newMsg];
          });
          // 과부하 방지 딜레이
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      };
      
      translateRecent();
    }
  };

  const handleNewMessage = (msg: Message) => {
    setMessages(prev => [...prev, msg]);
  };

  const handleEditMessage = async (timestamp: number, newText: string) => {
    // 1. 임시로 원문 먼저 업데이트 (빠른 UI 반응)
    setMessages(prev => prev.map(m => 
      m.timestamp === timestamp ? { ...m, originalText: newText, translatedText: m.sourceLang === m.targetLang ? newText : m.translatedText } : m
    ));

    // 2. 백그라운드에서 다시 번역 수행
    const msgsToUpdate = messages.filter(m => m.timestamp === timestamp);
    if (msgsToUpdate.length === 0) return;
    
    const { translateText } = await import('./utils/translate');
    const sourceLang = msgsToUpdate[0].sourceLang;

    for (const msg of msgsToUpdate) {
      if (msg.targetLang !== sourceLang) {
        const translatedText = await translateText(newText, sourceLang, msg.targetLang);
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, translatedText } : m));
        await new Promise(resolve => setTimeout(resolve, 100)); // 과부하 방지
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Header
        layoutMode={layoutMode}
        onLayoutChange={handleLayoutChange}
        splitDirection={splitDirection}
        onSplitDirectionChange={setSplitDirection}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        isDarkMode={isDarkMode}
        onDarkModeToggle={() => setIsDarkMode(prev => !prev)}
        messages={messages}
      />
      
      <main className="flex-1 overflow-hidden p-4">
        <TranslatorGrid 
          panes={panes.slice(0, layoutMode)} 
          layoutMode={layoutMode}
          splitDirection={splitDirection}
          fontSize={fontSize}
          messages={messages}
          onPaneLangChange={handlePaneLangChange}
          sourceLang={sourceLang}
          interimText={interimText}
          onEditMessage={handleEditMessage}
          isListening={isListening}
        />
      </main>

      <InputArea 
        sourceLang={sourceLang}
        onSourceLangChange={setSourceLang}
        onNewMessage={handleNewMessage}
        onInterimMessage={setInterimText}
        panes={panes.slice(0, layoutMode)}
        isListening={isListening}
        setIsListening={setIsListening}
      />
    </div>
  );
}

export default App;
