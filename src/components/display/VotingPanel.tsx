import { useState } from 'react';
import { Vote, Users, RotateCcw } from 'lucide-react';
import { useStoryStore } from '@/store/useStoryStore';
import type { ChoiceCard } from '@/types/story';

interface VotingPanelProps {
  choices: ChoiceCard[];
  onVoteComplete?: (winningChoice: ChoiceCard) => void;
}

export default function VotingPanel({ choices, onVoteComplete }: VotingPanelProps) {
  const { votes, castVote, resetVotes, votingEnabled, setVotingEnabled } = useStoryStore();
  const [voterId, setVoterId] = useState('');
  const [hasVoted, setHasVoted] = useState(false);

  const totalVotes = choices.reduce((sum, choice) => {
    return sum + (votes[choice.id]?.count || 0);
  }, 0);

  const handleVote = (choiceId: string) => {
    if (!voterId.trim()) {
      alert('请输入你的名字/学号');
      return;
    }
    if (hasVoted) {
      alert('你已经投过票了');
      return;
    }
    
    castVote(choiceId, voterId.trim());
    setHasVoted(true);
  };

  const getWinningChoice = () => {
    let maxVotes = -1;
    let winner = choices[0];
    choices.forEach(choice => {
      const count = votes[choice.id]?.count || 0;
      if (count > maxVotes) {
        maxVotes = count;
        winner = choice;
      }
    });
    return winner;
  };

  return (
    <div className="bg-horror-surface/95 backdrop-blur-sm rounded-xl border border-horror-border p-6 shadow-haunt animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-gothic text-xl text-horror-text flex items-center gap-2">
          <Vote size={20} className="text-horror-bloodLight" />
          课堂投票
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-horror-textMuted flex items-center gap-1">
            <Users size={14} />
            {totalVotes} 人已投票
          </span>
          <button
            onClick={() => {
              setVotingEnabled(!votingEnabled);
              if (!votingEnabled) {
                resetVotes();
                setHasVoted(false);
              }
            }}
            className="horror-btn text-xs"
          >
            {votingEnabled ? '结束投票' : '开始投票'}
          </button>
          <button
            onClick={() => {
              resetVotes();
              setHasVoted(false);
            }}
            className="p-2 hover:bg-horror-blood/20 rounded transition-colors"
            title="重置投票"
          >
            <RotateCcw size={16} className="text-horror-textMuted" />
          </button>
        </div>
      </div>

      {votingEnabled && !hasVoted && (
        <div className="mb-4">
          <input
            type="text"
            className="horror-input text-sm"
            placeholder="输入你的名字/学号..."
            value={voterId}
            onChange={(e) => setVoterId(e.target.value)}
          />
        </div>
      )}

      <div className="space-y-3">
        {choices.map((choice, index) => {
          const voteCount = votes[choice.id]?.count || 0;
          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
          const isWinning = voteCount > 0 && voteCount === Math.max(...choices.map(c => votes[c.id]?.count || 0));

          return (
            <div key={choice.id} className="relative">
              <button
                onClick={() => votingEnabled && handleVote(choice.id)}
                disabled={!votingEnabled || hasVoted}
                className={`w-full text-left p-4 rounded-lg border transition-all duration-300 relative overflow-hidden
                  ${isWinning ? 'border-horror-bloodLight bg-horror-blood/10' : 'border-horror-border bg-horror-bg'}
                  ${votingEnabled && !hasVoted ? 'hover:border-horror-blood cursor-pointer' : 'cursor-default'}
                  ${hasVoted && votes[choice.id]?.voters.includes(voterId.trim()) ? 'ring-2 ring-horror-accent' : ''}`}
              >
                {totalVotes > 0 && (
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-horror-blood/30 to-transparent transition-all duration-1000"
                    style={{ width: `${percentage}%` }}
                  />
                )}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <span className="font-gothic text-horror-accent font-bold">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className="text-horror-text">{choice.text}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`font-gothic text-xl ${isWinning ? 'text-horror-bloodLight' : 'text-horror-textMuted'}`}>
                      {voteCount}
                    </span>
                    {totalVotes > 0 && (
                      <span className="text-xs text-horror-textMuted">
                        ({percentage.toFixed(0)}%)
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {!votingEnabled && totalVotes > 0 && (
        <div className="mt-4 pt-4 border-t border-horror-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-horror-textMuted">
              投票结果：<span className="text-horror-bloodLight font-semibold">{getWinningChoice().text}</span> 胜出
            </p>
            <button
              onClick={() => onVoteComplete?.(getWinningChoice())}
              className="horror-btn-primary text-sm"
            >
              继续剧情
            </button>
          </div>
        </div>
      )}

      {hasVoted && votingEnabled && (
        <p className="text-center text-sm text-horror-accent mt-4">
          ✓ 你已投票，请等待其他同学完成投票
        </p>
      )}
    </div>
  );
}
