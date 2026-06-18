import { useState, useEffect, useRef } from 'react';
import { Vote, Users, RotateCcw, Clock, CheckCircle2, UserPlus } from 'lucide-react';
import { useStoryStore } from '@/store/useStoryStore';
import type { ChoiceCard } from '@/types/story';

interface VotingPanelProps {
  choices: ChoiceCard[];
  sceneId: string;
  sceneTitle: string;
  onVoteComplete?: (winningChoice: ChoiceCard) => void;
}

export default function VotingPanel({ choices, sceneId, sceneTitle, onVoteComplete }: VotingPanelProps) {
  const {
    votes,
    castVote,
    resetVotes,
    votingEnabled,
    setVotingEnabled,
    startVoteRound,
    closeVoteRound,
    hasVoterInCurrentRound,
  } = useStoryStore();

  const [voterId, setVoterId] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(30);
  const [justVoted, setJustVoted] = useState<string | null>(null);
  const voteInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      startVoteRound(sceneId, sceneTitle, choices);
    }
  }, [sceneId, sceneTitle, choices, startVoteRound]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      handleCloseVoting();
      return;
    }
    const timer = setTimeout(() => setCountdown(c => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (justVoted) {
      const t = setTimeout(() => setJustVoted(null), 1500);
      return () => clearTimeout(t);
    }
  }, [justVoted]);

  const totalVotes = choices.reduce((sum, choice) => {
    return sum + (votes[choice.id]?.count || 0);
  }, 0);

  const handleVote = (choiceId: string) => {
    if (!votingEnabled) return;
    const trimmed = voterId.trim();
    if (!trimmed) {
      alert('请输入名字/学号后再投票');
      voteInputRef.current?.focus();
      return;
    }
    if (hasVoterInCurrentRound(trimmed)) {
      alert('这个名字/学号已经投过票了');
      return;
    }
    const ok = castVote(choiceId, trimmed);
    if (ok) {
      const choice = choices.find(c => c.id === choiceId);
      setJustVoted(`✓ ${trimmed} 已投票给"${choice?.text?.slice(0, 10) || ''}"`);
      setVoterId('');
      setTimeout(() => voteInputRef.current?.focus(), 50);
    }
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
    return { choice: winner, count: maxVotes };
  };

  const handleStartCountdown = (seconds: number) => {
    setTotalSeconds(seconds);
    setCountdown(seconds);
  };

  const handleCloseVoting = () => {
    setCountdown(null);
    const winner = closeVoteRound();
    const winningChoice = winner ? choices.find(c => c.id === winner.choiceId) : null;
    if (winningChoice) {
      setTimeout(() => {
        onVoteComplete?.(winningChoice);
      }, 1800);
    }
  };

  const handleCancelVoting = () => {
    resetVotes();
    setCountdown(null);
    setVoterId('');
    setJustVoted(null);
  };

  const progressPercent = countdown !== null && totalSeconds > 0
    ? ((totalSeconds - countdown) / totalSeconds) * 100
    : 0;

  const { choice: finalWinner, count: finalCount } = getWinningChoice();

  const votingClosed = !votingEnabled;
  const { choice: prevWinner, count } = votingClosed ? getWinningChoice() : { choice: null as any, count: 0 };

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

      <div className="mb-3 p-2 bg-horror-bg/50 rounded border border-horror-border/50">
        <p className="text-xs text-horror-textMuted">
          当前场景：<span className="text-horror-text">{sceneTitle}</span>
        </p>
      </div>

      {countdown !== null && (
        <div className="mb-4 p-3 bg-horror-blood/10 rounded-lg border border-horror-blood/30 text-center">
          <div className="flex items-center justify-center gap-2">
            <Clock size={18} className="text-horror-bloodLight animate-pulse" />
            <span className="font-gothic text-2xl text-horror-bloodLight">{countdown}</span>
            <span className="text-sm text-horror-textMuted">秒后自动结束</span>
          </div>
          <div className="h-1.5 bg-horror-bg rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-horror-bloodLight transition-all duration-1000 ease-linear"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        </div>
      )}

      {votingEnabled && (
        <div className="mb-4">
          <label className="block text-xs text-horror-textMuted mb-1.5 flex items-center gap-1">
            <UserPlus size={12} />
            学生名字/学号（轮流填写投票）
          </label>
          <div className="flex gap-2">
            <input
              ref={voteInputRef}
              type="text"
              className="horror-input text-sm flex-1"
              placeholder="输入名字/学号，再点击下方选项投票"
              value={voterId}
              onChange={(e) => setVoterId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const firstChoice = choices[0];
                  if (firstChoice) handleVote(firstChoice.id);
                }
              }}
              autoFocus
            />
          </div>
          {justVoted && (
            <div className="mt-2 p-2 rounded bg-green-500/10 border border-green-500/30 animate-fade-in">
              <p className="text-xs text-green-400 flex items-center gap-1">
                <CheckCircle2 size={14} />
                {justVoted}（继续输入下一个同学名字）
              </p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {choices.map((choice, index) => {
          const voteCount = votes[choice.id]?.count || 0;
          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
          const isWinning = votingClosed && voteCount === count && voteCount > 0 && prevWinner?.id === choice.id;
          const isLeadingLive = votingEnabled && voteCount === finalCount && voteCount > 0 && finalWinner?.id === choice.id;

          return (
            <div key={choice.id} className="relative">
              <button
                onClick={() => handleVote(choice.id)}
                disabled={!votingEnabled}
                className={`w-full text-left p-4 rounded-lg border transition-all duration-300 relative overflow-hidden
                  ${isWinning ? 'border-horror-bloodLight bg-horror-blood/10' : 'border-horror-border bg-horror-bg'}
                  ${isLeadingLive ? 'border-horror-accent/60' : ''}
                  ${votingEnabled ? 'hover:border-horror-blood cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}
              >
                {totalVotes > 0 && (
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-horror-blood/30 to-transparent transition-all duration-500"
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
                    <span className={`font-gothic text-xl ${isWinning ? 'text-horror-bloodLight' : isLeadingLive ? 'text-horror-accent' : 'text-horror-textMuted'}`}>
                      {voteCount}
                    </span>
                    {totalVotes > 0 && (
                      <span className="text-xs text-horror-textMuted">
                        ({percentage.toFixed(0)}%)
                      </span>
                    )}
                  </div>
                </div>
                {isWinning && (
                  <span className="absolute top-1 right-2 text-[10px] text-horror-accent bg-horror-accent/10 px-1.5 py-0.5 rounded">
                    ✓ 胜出
                  </span>
                )}
              </button>
              {votes[choice.id]?.count > 0 && (
                <div className="mt-1 pl-8">
                  <p className="text-[10px] text-horror-textMuted truncate">
                    投票者：{votes[choice.id].voters.join('、')}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {votingEnabled && (
        <div className="mt-4 pt-4 border-t border-horror-border space-y-3">
          {countdown === null && (
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <span className="text-sm text-horror-textMuted">投票计时：</span>
              <button onClick={() => handleStartCountdown(15)} className="horror-btn text-xs px-3 py-1">15秒</button>
              <button onClick={() => handleStartCountdown(30)} className="horror-btn text-xs px-3 py-1">30秒</button>
              <button onClick={() => handleStartCountdown(60)} className="horror-btn text-xs px-3 py-1">60秒</button>
              <button onClick={() => setCountdown(null)} className="horror-btn text-xs px-3 py-1 opacity-60">取消倒计时</button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <button onClick={handleCancelVoting} className="horror-btn text-sm">
              取消本轮
            </button>
            <button onClick={handleCloseVoting} className="horror-btn-primary text-sm">
              立即结束 · 统计
            </button>
          </div>
        </div>
      )}

      {!votingEnabled && totalVotes > 0 && prevWinner && (
        <div className="mt-4 pt-4 border-t border-horror-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-horror-textMuted">
              投票结果：<span className="text-horror-bloodLight font-semibold">{prevWinner.text}</span> 胜出
              <span className="text-xs ml-1">（{count}/{totalVotes} 票）</span>
            </p>
          </div>
          <p className="text-xs text-horror-accent mt-2 text-center animate-pulse">
            即将按此选择继续剧情...
          </p>
        </div>
      )}

      {!votingEnabled && totalVotes === 0 && (
        <div className="mt-4 pt-4 border-t border-horror-border text-center">
          <p className="text-xs text-horror-textMuted">无人投票，关闭面板</p>
        </div>
      )}
    </div>
  );
}
