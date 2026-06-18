import { useState } from 'react';
import { Play, X, ChevronRight, Vote, MousePointer2, History, Trash2, Route } from 'lucide-react';
import { useStoryStore } from '@/store/useStoryStore';
import type { ClassroomPath } from '@/types/story';

interface Props {
  onStartPlayback?: (path: ClassroomPath) => void;
}

export default function PlaybackPanel({ onStartPlayback }: Props) {
  const { classroomPaths, deleteClassroomPath, resetClassroomPaths } = useStoryStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (classroomPaths.length === 0) return null;

  const selected = classroomPaths.find(p => p.id === selectedId);
  const sorted = [...classroomPaths].sort((a, b) => b.startedAt - a.startedAt);

  const handlePlay = (path: ClassroomPath) => {
    setIsOpen(false);
    onStartPlayback?.(path);
  };

  const formatTime = (ms: number) => {
    if (!ms) return '';
    const d = new Date(ms);
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed bottom-20 left-4 z-30">
      {isOpen ? (
        <div className="w-80 max-h-[65vh] flex flex-col bg-horror-surface/95 backdrop-blur-sm rounded-xl border border-horror-border shadow-haunt animate-slide-up">
          <div className="flex items-center justify-between p-3 border-b border-horror-border">
            <h3 className="font-gothic text-sm text-horror-text flex items-center gap-2">
              <History size={14} className="text-purple-400" />
              课堂回放 ({classroomPaths.length} 条)
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (confirm('确定清空所有课堂记录吗？')) resetClassroomPaths();
                }}
                className="p-1 hover:bg-horror-blood/20 rounded transition-colors"
                title="清空记录"
              >
                <Trash2 size={12} className="text-horror-textMuted" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-horror-bg rounded transition-colors"
              >
                <X size={14} className="text-horror-textMuted" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {sorted.map((path, idx) => (
              <div key={path.id} className="rounded-lg border border-horror-border bg-horror-bg overflow-hidden">
                <button
                  onClick={() => setSelectedId(selectedId === path.id ? null : path.id)}
                  className="w-full p-2 flex items-center justify-between hover:bg-horror-surface/50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <Route size={12} className="text-horror-accent shrink-0" />
                      <p className="text-xs text-horror-text font-medium truncate">
                        路线 #{sorted.length - idx}
                        {path.endingTitle && (
                          <span className="text-horror-textMuted ml-1 font-normal">
                            → {path.endingTitle.length > 10 ? path.endingTitle.slice(0, 10) + '…' : path.endingTitle}
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="text-[10px] text-horror-textMuted mt-0.5 flex items-center gap-2">
                      {formatTime(path.startedAt)}
                      <span className="text-horror-border">·</span>
                      {path.steps.length} 步
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    className={`text-horror-textMuted shrink-0 transition-transform ${selectedId === path.id ? 'rotate-90' : ''}`}
                  />
                </button>

                {selectedId === path.id && (
                  <div className="border-t border-horror-border p-2 space-y-1 animate-fade-in">
                    {path.steps.map((step, si) => {
                      const card = path.cardTitles[step.cardId] || step.cardId.slice(0, 8);
                      return (
                        <div key={si} className="flex items-center gap-2 text-xs p-1.5 bg-horror-surface/40 rounded">
                          {step.source === 'vote' ? (
                            <Vote size={11} className="text-horror-bloodLight shrink-0" />
                          ) : (
                            <MousePointer2 size={11} className="text-blue-400 shrink-0" />
                          )}
                          <span className={`truncate ${step.source === 'vote' ? 'text-horror-bloodLight' : 'text-horror-text'}`}>
                            {card.length > 18 ? card.slice(0, 18) + '…' : card}
                          </span>
                          <span className="ml-auto text-[9px] text-horror-textMuted shrink-0">
                            {step.source === 'vote' ? '投票' : '手点'}
                          </span>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => handlePlay(path)}
                      className="w-full mt-2 horror-btn-primary text-xs flex items-center justify-center gap-1 py-1.5"
                    >
                      <Play size={12} />
                      开始回放
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('删除此条记录？')) deleteClassroomPath(path.id);
                      }}
                      className="w-full mt-1 horror-btn text-xs py-1 opacity-70"
                    >
                      删除此条
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="horror-btn flex items-center gap-2 text-sm shadow-lg"
        >
          <Play size={14} className="text-purple-400" />
          课堂回放 ({classroomPaths.length})
        </button>
      )}
    </div>
  );
}
