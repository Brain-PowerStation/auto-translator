import type { LayoutMode, Message, SplitDirection } from '../types';
import { Moon, Sun, Type, Columns, Rows, Download, Maximize } from 'lucide-react';

interface HeaderProps {
  layoutMode: LayoutMode;
  onLayoutChange: (mode: LayoutMode) => void;
  splitDirection: SplitDirection;
  onSplitDirectionChange: (direction: SplitDirection) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  isDarkMode: boolean;
  onDarkModeToggle: () => void;
  messages: Message[];
}

export default function Header({
  layoutMode,
  onLayoutChange,
  splitDirection,
  onSplitDirectionChange,
  fontSize,
  onFontSizeChange,
  isDarkMode,
  onDarkModeToggle,
  messages
}: HeaderProps) {
  
  const handleExport = () => {
    // Generate text content
    const textContent = messages.map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.originalText} -> ${m.translatedText} (${m.targetLang})`).join('\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `대화기록_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 z-10">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white mr-4">글로벌 번역기</h1>
        
        {/* Split Direction Control */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1 space-x-1">
          <button
            onClick={() => onSplitDirectionChange('vertical')}
            className={`flex items-center px-2 py-1 text-sm font-medium rounded-md transition-colors ${
              splitDirection === 'vertical' 
                ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400' 
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
            title="세로 분할 (좌우 배치)"
          >
            <Columns className="w-4 h-4 mr-1" />
            세로
          </button>
          <button
            onClick={() => onSplitDirectionChange('horizontal')}
            className={`flex items-center px-2 py-1 text-sm font-medium rounded-md transition-colors ${
              splitDirection === 'horizontal' 
                ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400' 
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
            title="가로 분할 (상하 배치)"
          >
            <Rows className="w-4 h-4 mr-1" />
            가로
          </button>
        </div>

        {/* Layout Controls */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          {[2, 3, 4].map((mode) => (
            <button
              key={mode}
              onClick={() => onLayoutChange(mode as LayoutMode)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                layoutMode === mode 
                  ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {mode}분할
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Font Size Control */}
        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1 px-3">
          <Type className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <input 
            type="range" 
            min="12" 
            max="48" 
            value={fontSize} 
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className="w-24 h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer dark:bg-slate-600"
          />
          <span className="text-sm font-medium w-6 text-center">{fontSize}</span>
        </div>

        {/* Tools */}
        <button 
          onClick={handleExport}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          title="대화 기록 저장"
        >
          <Download className="w-5 h-5" />
        </button>

        <button 
          onClick={handleFullscreen}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          title="전체 화면"
        >
          <Maximize className="w-5 h-5" />
        </button>

        <button 
          onClick={onDarkModeToggle}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          title={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
