import { useState, useEffect } from 'react';
import CardPanel from '@/components/editor/CardPanel';
import Canvas from '@/components/editor/Canvas';
import PropertyPanel from '@/components/editor/PropertyPanel';
import NarrativeGuide from '@/components/guide/NarrativeGuide';
import StructureCheck from '@/components/editor/StructureCheck';
import ModeToggle from '@/components/common/ModeToggle';
import { useStoryStore } from '@/store/useStoryStore';
import { CheckSquare, BookOpen } from 'lucide-react';

export default function EditorPage() {
  const [rightPanel, setRightPanel] = useState<'edit' | 'guide' | 'structure'>('edit');
  const { cards } = useStoryStore();

  useEffect(() => {
    if (cards.length === 0) {
      setRightPanel('edit');
    }
  }, [cards.length]);

  return (
    <div className="h-screen flex flex-col bg-horror-bg overflow-hidden">
      <ModeToggle />
      
      <div className="flex-1 flex overflow-hidden pt-16">
        <CardPanel />
        
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="absolute top-4 right-4 z-30 flex items-center gap-1">
            <button
              onClick={() => setRightPanel('edit')}
              className={`horror-btn text-xs flex items-center gap-1 ${rightPanel === 'edit' ? 'ring-1 ring-horror-accent' : ''}`}
            >
              ✏️ 编辑
            </button>
            <button
              onClick={() => setRightPanel('structure')}
              className={`horror-btn text-xs flex items-center gap-1 ${rightPanel === 'structure' ? 'ring-1 ring-horror-accent' : ''}`}
            >
              <CheckSquare size={12} />
              结构检查
            </button>
            <button
              onClick={() => setRightPanel('guide')}
              className={`horror-btn text-xs flex items-center gap-1 ${rightPanel === 'guide' ? 'ring-1 ring-horror-accent' : ''}`}
            >
              <BookOpen size={12} />
              叙事引导
            </button>
          </div>
          
          <div className="flex-1 flex overflow-hidden">
            <Canvas />
            
            <div className="w-80 bg-horror-surface border-l border-horror-border overflow-y-auto">
              {rightPanel === 'edit' && <PropertyPanel />}
              {rightPanel === 'structure' && <StructureCheck />}
              {rightPanel === 'guide' && (
                <div className="p-4">
                  <NarrativeGuide />
                </div>
              )}
            </div>
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
