import { useState } from 'react';
import { History, Vote, Clock, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useStoryStore } from '@/store/useStoryStore';
import type { VoteRound } from '@/types/story';

export default function VoteHistoryPanel() {
  const { voteRounds, resetVoteRounds } = useStoryStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  if (voteRounds.length === 0) return null;

  const sorted = [...voteRounds].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="fixed bottom-20 right-4 z-30">
      {isOpen ? (
        <div className="w-80 max-h-[60vh] flex flex-col bg-horror-surface/95 backdrop-blur-sm rounded-xl border border-horror-border shadow-haunt animate-slide-up">
          <div className="flex items-center justify-between p-3 border-b border-horror-border">
            <h3 className="font-gothic text-sm text-horror-text flex items-center gap-2">
              <History size={14} className="text-horror-accent" />
              课堂投票记录 ({voteRounds.length} 轮)
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (confirm('确定清空所有投票记录吗？')) resetVoteRounds();
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
            {sorted.map((round, idx) => (
              <VoteRoundCard
                key={round.id}
                round={round}
                index={sorted.length - idx}
                expanded={expandedId === round.id}
                onToggle={() => toggleExpand(round.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="horror-btn flex items-center gap-2 text-sm shadow-lg"
        >
          <History size={14} className="text-horror-accent" />
          投票记录 ({voteRounds.length})
        </button>
      )}
    </div>
  );
}

function VoteRoundCard({
  round,
  index,
  expanded,
  onToggle,
}: {
  round: VoteRound;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const formatted = new Date(round.timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="rounded-lg border border-horror-border bg-horror-bg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-2 flex items-center justify-between hover:bg-horror-surface/50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs text-horror-text font-medium truncate">
            #{index} · {round.sceneTitle}
          </p>
          <p className="text-[10px] text-horror-textMuted flex items-center gap-1 mt-0.5">
            <Clock size={10} />
            {formatted} · {round.totalVotes} 人
          </p>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-horror-textMuted shrink-0 ml-2" />
        ) : (
          <ChevronDown size={14} className="text-horror-textMuted shrink-0 ml-2" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-horror-border p-2 space-y-1 animate-fade-in">
          {round.options.map(opt => {
            const isWinner = opt.choiceId === round.winningChoiceId;
            const percent = round.totalVotes > 0 ? (opt.count / round.totalVotes) * 100 : 0;
            return (
              <div key={opt.choiceId} className="relative">
                <div
                  className={`p-2 rounded text-xs ${
                    isWinner ? 'bg-horror-blood/10 border border-horror-blood/30' : 'bg-horror-surface/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`${isWinner ? 'text-horror-bloodLight font-semibold' : 'text-horror-text'} truncate pr-2`}>
                      {opt.choiceText.length > 20 ? opt.choiceText.slice(0, 20) + '…' : opt.choiceText}
                      {isWinner && <span className="ml-1 text-[10px] text-horror-accent">✓胜出</span>}
                    </span>
                    <span className="text-[10px] text-horror-textMuted shrink-0">
                      {opt.count}/{round.totalVotes} ({percent.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-1 bg-horror-card rounded-full overflow-hidden">
                    <div
                      className={`h-full ${isWinner ? 'bg-horror-bloodLight' : 'bg-horror-textMuted/50'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  {opt.voters.length > 0 && (
                    <p className="text-[9px] text-horror-textMuted mt-1 truncate">
                      投票者：{opt.voters.join('、')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
