import { useEffect, useRef, useState } from 'react';
import type { PaneState, Message } from '../types';
import { SUPPORTED_LANGUAGES } from '../types';
import { Volume2 } from 'lucide-react';

interface PaneProps {
  pane: PaneState;
  fontSize: number;
  messages: Message[];
  onLangChange: (lang: string) => void;
  selectedLangs: string[];
  isInputPane?: boolean;
  interimText?: string;
  onEditMessage?: (timestamp: number, newText: string) => void;
  isListening?: boolean;
}

export default function Pane({ pane, fontSize, messages, onLangChange, selectedLangs, isInputPane = false, interimText = '', onEditMessage, isListening = false }: PaneProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 편집 모드 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!editingId) {
      scrollToBottom();
    }
  }, [messages, editingId]);

  const handleContainerClick = () => {
    if (isInputPane && !editingId) {
      window.dispatchEvent(new Event('toggleMic'));
    }
  };

  const handleSaveEdit = (msg: Message) => {
    if (editText.trim() && editText !== msg.translatedText && onEditMessage) {
      onEditMessage(msg.timestamp, editText.trim());
    }
    setEditingId(null);
  };

  const speak = (text: string, lang: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      
      // 기기에 내장된 딱딱한 기계음 대신, 자연스러운 고품질 클라우드 음성(Google 등) 우선 탐색
      const voices = window.speechSynthesis.getVoices();
      
      // 1순위: Google 클라우드 음성 (가장 자연스러움, 크롬 브라우저)
      // 2순위: Microsoft Online (엣지 브라우저 등 자연스러운 온라인 음성)
      // 3순위: 기기에 내장된 해당 언어의 기본 음성
      const bestVoice = 
        voices.find(v => v.lang.startsWith(lang) && v.name.includes('Google')) ||
        voices.find(v => v.lang.startsWith(lang) && v.name.includes('Online')) ||
        voices.find(v => v.lang.startsWith(lang));

      if (bestVoice) {
        utterance.voice = bestVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div 
      className={`flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors ${
        isInputPane && !editingId
          ? 'bg-amber-50/50 dark:bg-slate-800/80 cursor-pointer hover:bg-amber-100/50 dark:hover:bg-slate-800' 
          : isInputPane 
            ? 'bg-amber-50/50 dark:bg-slate-800/80'
            : 'bg-white dark:bg-slate-800/30'
      }`}
      onClick={handleContainerClick}
    >
      {/* Pane Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <select 
          value={pane.targetLang}
          onChange={(e) => onLangChange(e.target.value)}
          className={`bg-transparent font-semibold focus:outline-none cursor-pointer ${!pane.targetLang ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <option value="" disabled hidden>번역될 언어를 선택해주세요</option>
          {SUPPORTED_LANGUAGES.map(lang => {
            const isDisabled = selectedLangs.includes(lang.code) && lang.code !== pane.targetLang;
            return (
              <option 
                key={lang.code} 
                value={lang.code} 
                disabled={isDisabled}
                className={isDisabled ? 'text-slate-400 bg-slate-200 dark:text-slate-500 dark:bg-slate-800' : 'text-slate-800 dark:text-slate-200'}
              >
                {isDisabled ? `🚫 ${lang.name}` : lang.name}
              </option>
            );
          })}
        </select>
        
        {/* Listening Neon Indicator */}
        {isInputPane && isListening && (
          <div className="relative flex items-center space-x-2 mr-2 pointer-events-none px-2 py-1">
            {/* Neon Glow background encompassing text and icon */}
            <div className="absolute inset-0 bg-blue-400 dark:bg-blue-500 rounded-full blur-[8px] opacity-30 animate-[pulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
            
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 tracking-wide relative z-10 whitespace-nowrap">음성 인식 중</span>
            <div className="flex items-center justify-center space-x-[2px] relative z-10">
              <div className="w-[2px] h-[10px] bg-blue-700 dark:bg-blue-300 rounded-full animate-eq1" style={{ animationDuration: '0.7s' }}></div>
              <div className="w-[2px] h-[14px] bg-blue-700 dark:bg-blue-300 rounded-full animate-eq2" style={{ animationDuration: '0.5s' }}></div>
              <div className="w-[2px] h-[10px] bg-blue-700 dark:bg-blue-300 rounded-full animate-eq3" style={{ animationDuration: '0.8s' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Pane Content */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 relative"
        style={{ fontSize: `${fontSize}px` }}
      >
        {!pane.targetLang && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-500 font-medium">
            번역될 언어를 선택해주세요
          </div>
        )}
        
        {messages.map((msg, idx) => {
          const isLatest = idx === messages.length - 1;
          const isEditing = editingId === msg.id;
          
          return (
            <div 
              key={msg.id} 
              data-timestamp={msg.timestamp}
              className={`group flex items-start justify-between p-3 rounded-lg transition-colors ${
                isLatest ? 'bg-blue-50/80 dark:bg-blue-900/40' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className={`flex-1 whitespace-pre-wrap break-words tracking-wide ${
                isLatest 
                  ? 'text-slate-900 dark:text-white font-semibold' 
                  : 'text-slate-700 dark:text-slate-300 font-medium'
              }`}>
                {isEditing ? (
                  <textarea
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={() => handleSaveEdit(msg)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSaveEdit(msg);
                      }
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    ref={(el) => {
                      if (el) {
                        el.style.height = 'auto';
                        el.style.height = (el.scrollHeight) + 'px';
                      }
                    }}
                    className="w-full bg-white dark:bg-slate-700 border border-blue-400 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden leading-relaxed font-medium"
                    rows={1}
                  />
                ) : (
                  <span 
                    onClick={(e) => {
                      if (isInputPane) {
                        e.stopPropagation(); // 마이크 토글 방지
                        setEditingId(msg.id);
                        setEditText(msg.translatedText);
                      }
                    }}
                    className={isInputPane ? "cursor-text hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 -ml-1 transition-colors block leading-relaxed" : "leading-relaxed"}
                    title={isInputPane ? "클릭하여 수정하기" : ""}
                  >
                    {msg.translatedText}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // 입력창 클릭(마이크 토글) 방지
                  speak(msg.translatedText, pane.targetLang);
                }}
                className="ml-4 p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 shrink-0"
                title="음성으로 듣기"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          );
        })}

        {/* Interim Text (Only for Input Pane) */}
        {isInputPane && interimText && (
          <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg animate-pulse mt-2">
            <p className="text-slate-600 dark:text-slate-300 italic font-medium leading-relaxed tracking-wide">
              {interimText}
            </p>
          </div>
        )}

        {/* Auto-scroll target */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
