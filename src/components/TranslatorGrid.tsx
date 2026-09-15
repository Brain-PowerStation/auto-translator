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
