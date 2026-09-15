import { useLayoutEffect } from 'react';
import type { PaneState, LayoutMode, Message, SplitDirection } from '../types';
import Pane from './Pane';

interface TranslatorGridProps {
  panes: PaneState[];
  layoutMode: LayoutMode;
  splitDirection: SplitDirection;
  fontSize: number;
  messages: Message[];
  onPaneLangChange: (id: string, lang: string) => void;
  sourceLang: string;
  interimText: string;
  onEditMessage: (timestamp: number, newText: string) => void;
  isListening: boolean;
}

export default function TranslatorGrid({ 
  panes, 
  layoutMode, 
  splitDirection,
  fontSize, 
  messages, 
  onPaneLangChange,
  sourceLang,
  interimText,
  onEditMessage,
  isListening
}: TranslatorGridProps) {
  
  // 모든 분할 창의 동일한 메시지(timestamp 기준) 높이를 똑같이 맞춤
  useLayoutEffect(() => {
    const timestamps = new Set(messages.map(m => m.timestamp));
    
    timestamps.forEach(ts => {
      const els = document.querySelectorAll(`[data-timestamp="${ts}"]`);
      if (els.length > 0) {
        // 자연스러운 높이를 구하기 위해 먼저 minHeight 초기화
        els.forEach(el => (el as HTMLElement).style.minHeight = '0px');
        
        let maxHeight = 0;
        els.forEach(el => {
          const height = el.getBoundingClientRect().height;
          if (height > maxHeight) maxHeight = height;
        });
        
        // 구해진 최대 높이로 모든 분할창의 해당 메시지 높이를 통일
        els.forEach(el => {
          (el as HTMLElement).style.minHeight = `${maxHeight}px`;
        });
      }
    });
  }, [messages, layoutMode, fontSize, splitDirection]);

  // Define grid layout based on split direction and layout mode
  let gridClass = '';
  
  if (splitDirection === 'vertical') {
    gridClass = layoutMode === 2 ? 'grid-cols-2' 
              : layoutMode === 3 ? 'grid-cols-3' 
              : 'grid-cols-2 lg:grid-cols-4';
  } else {
    // horizontal split (rows)
    gridClass = layoutMode === 2 ? 'grid-cols-1 grid-rows-2' 
              : layoutMode === 3 ? 'grid-cols-1 grid-rows-3' 
              : 'grid-cols-1 grid-rows-4';
  }

  return (
    <div className={`grid ${gridClass} gap-4 h-full`}>
      {panes.map(pane => (
        <Pane 
          key={pane.id} 
          pane={pane} 
          messages={messages.filter(m => m.targetLang === pane.targetLang)}
          fontSize={fontSize}
          onLangChange={(newLang) => onPaneLangChange(pane.id, newLang)}
          selectedLangs={panes.map(p => p.targetLang)}
          isInputPane={pane.targetLang === sourceLang}
          interimText={interimText}
          onEditMessage={onEditMessage}
          isListening={isListening}
        />
      ))}
    </div>
  );
}
