import { useState, useEffect } from 'react';
import CardPanel from '@/components/editor/CardPanel';
import Canvas from '@/components/editor/Canvas';
import PropertyPanel from '@/components/editor/PropertyPanel';
import NarrativeGuide from '@/components/guide/NarrativeGuide';
import ModeToggle from '@/components/common/ModeToggle';
import { useStoryStore } from '@/store/useStoryStore';

export default function EditorPage() {
  const [showGuide, setShowGuide] = useState(true);
  const { cards } = useStoryStore();

  useEffect(() => {
    if (cards.length === 0) {
      setShowGuide(true);
    }
  }, [cards.length]);

  return (
    <div className="h-screen flex flex-col bg-horror-bg overflow-hidden">
      <ModeToggle />
      
      <div className="flex-1 flex overflow-hidden pt-16">
        <CardPanel />
        
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="absolute top-4 right-4 z-30">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="horror-btn text-xs"
            >
              {showGuide ? '隐藏引导' : '显示引导'}
            </button>
          </div>
          
          <div className="flex-1 flex overflow-hidden">
            <Canvas />
            <PropertyPanel />
            
            {showGuide && (
              <div className="absolute right-80 top-0 bottom-0 w-72 z-20">
                <NarrativeGuide />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="noise-overlay" />
      
      <svg className="corner-web top-0 left-0" viewBox="0 0 100 100">
        <path d="M0,0 L50,50 M0,20 L40,50 M0,40 L30,50 M20,0 L50,40 M40,0 L50,30" 
              stroke="currentColor" fill="none" strokeWidth="0.5" className="text-horror-textMuted" />
      </svg>
      <svg className="corner-web top-0 right-0 rotate-90" viewBox="0 0 100 100">
        <path d="M0,0 L50,50 M0,20 L40,50 M0,40 L30,50 M20,0 L50,40 M40,0 L50,30" 
              stroke="currentColor" fill="none" strokeWidth="0.5" className="text-horror-textMuted" />
      </svg>
    </div>
  );
}
