import { useState, useEffect } from 'react';
import { Vote, Users, RotateCcw, Clock } from 'lucide-react';
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
  const [countdown, setCountdown] = useState<number | null>(null);

  const totalVotes = choices.reduce((sum, choice) => {
    return sum + (votes[choice.id]?.count || 0);
  }, 0);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      handleCloseVoting();
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

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

  const handleStartCountdown = (seconds: number) => {
    setCountdown(seconds);
  };

  const handleCloseVoting = () => {
    setVotingEnabled(false);
    setCountdown(null);
    if (totalVotes > 0) {
      const winner = getWinningChoice();
      setTimeout(() => {
        onVoteComplete?.(winner);
      }, 1500);
    }
  };

  const handleCancelVoting = () => {
    setVotingEnabled(false);
    resetVotes();
    setHasVoted(false);
    setCountdown(null);
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
        </div>
      </div>

      {countdown !== null && (
        <div className="mb-4 p-3 bg-horror-blood/10 rounded-lg border border-horror-blood/30 text-center">
          <div className="flex items-center justify-center gap-2">
            <Clock size={18} className="text-horror-bloodLight animate-pulse" />
            <span className="font-gothic text-2xl text-horror-bloodLight">{countdown}</span>
            <span className="text-sm text-horror-textMuted">秒后自动结束</span>
          </div>
          <div className="h-1 bg-horror-bg rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-horror-bloodLight transition-all duration-1000"
              style={{ width: `${((30 - countdown) / 30) * 100}%` }}
            />
          </div>
        </div>
      )}

      {votingEnabled && !hasVoted && countdown === null && (
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
          const maxCount = Math.max(...choices.map(c => votes[c.id]?.count || 0), 0);
          const isWinning = voteCount > 0 && voteCount === maxCount;

          return (
            <div key={choice.id} className="relative">
              <button
                onClick={() => votingEnabled && !hasVoted && countdown !== null && handleVote(choice.id)}
                disabled={!votingEnabled || (hasVoted && countdown === null)}
                className={`w-full text-left p-4 rounded-lg border transition-all duration-300 relative overflow-hidden
                  ${isWinning && !votingEnabled ? 'border-horror-bloodLight bg-horror-blood/10' : 'border-horror-border bg-horror-bg'}
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
                    <span className={`font-gothic text-xl ${isWinning && !votingEnabled ? 'text-horror-bloodLight' : 'text-horror-textMuted'}`}>
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

      {votingEnabled && countdown === null && (
        <div className="mt-4 pt-4 border-t border-horror-border space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-horror-textMuted">投票计时：</span>
            <button onClick={() => handleStartCountdown(15)} className="horror-btn text-xs px-3 py-1">15秒</button>
            <button onClick={() => handleStartCountdown(30)} className="horror-btn text-xs px-3 py-1">30秒</button>
            <button onClick={() => handleStartCountdown(60)} className="horror-btn text-xs px-3 py-1">60秒</button>
          </div>
          <div className="flex items-center justify-between">
            <button onClick={handleCancelVoting} className="horror-btn text-sm">
              取消投票
            </button>
            <button onClick={handleCloseVoting} className="horror-btn-primary text-sm">
              立即结束
            </button>
          </div>
        </div>
      )}

      {!votingEnabled && totalVotes > 0 && (
        <div className="mt-4 pt-4 border-t border-horror-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-horror-textMuted">
              投票结果：<span className="text-horror-bloodLight font-semibold">{getWinningChoice().text}</span> 胜出
            </p>
          </div>
          <p className="text-xs text-horror-accent mt-2 text-center animate-pulse">
            即将按此选择继续剧情...
          </p>
        </div>
      )}

      {hasVoted && votingEnabled && countdown !== null && (
        <p className="text-center text-sm text-horror-accent mt-4">
          ✓ 你已投票，请等待倒计时结束
        </p>
      )}
    </div>
  );
}
