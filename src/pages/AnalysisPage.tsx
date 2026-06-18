import { useState, useEffect, useMemo } from 'react';
import { Award, RefreshCw, BookOpen, ArrowLeft, Users, Vote, Trophy, BarChart3, TrendingUp, Skull } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStoryStore } from '@/store/useStoryStore';
import { runFullAnalysis } from '@/utils/analysis';
import ModeToggle from '@/components/common/ModeToggle';
import BranchCoverage from '@/components/analysis/BranchCoverage';
import CurseClarity from '@/components/analysis/CurseClarity';
import PacingAnalysis from '@/components/analysis/PacingAnalysis';
import RouteFearSummaryList from '@/components/analysis/RouteFearSummary';
import Typewriter from '@/components/display/Typewriter';
import type { AnalysisResult, VoteRound, ClassroomPath } from '@/types/story';

export default function AnalysisPage() {
  const navigate = useNavigate();
  const { cards, connections, exploredPaths, resetVotes, exploredPaths: paths, voteRounds, classroomPaths, resetVoteRounds, resetClassroomPaths } = useStoryStore();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const result = runFullAnalysis(cards, connections, exploredPaths);
    setAnalysis(result);
    
    const timer = setTimeout(() => {
      setShowFeedback(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [cards, connections, exploredPaths]);

  const handleRefresh = () => {
    const result = runFullAnalysis(cards, connections, exploredPaths);
    setAnalysis(result);
    setShowFeedback(false);
    setTimeout(() => setShowFeedback(true), 500);
  };

  const handleResetVotes = () => {
    if (confirm('确定要重置所有投票数据吗？')) {
      resetVotes();
      resetVoteRounds();
    }
  };

  const handleResetClassroom = () => {
    if (confirm('确定要清空所有课堂记录吗？（包含路径、投票历史）')) {
      resetClassroomPaths();
      resetVoteRounds();
    }
  };

  const classroomStats = useMemo(() => {
    const totalVotes = voteRounds.reduce((sum, r) => sum + r.totalVotes, 0);
    const uniqueVoters = new Set<string>();
    voteRounds.forEach(r => r.options.forEach(o => o.voters.forEach(v => uniqueVoters.add(v))));

    const endingCounts: Record<string, { count: number; title: string; type: string }> = {};
    classroomPaths.forEach(cp => {
      if (cp.endingId) {
        if (!endingCounts[cp.endingId]) {
          endingCounts[cp.endingId] = { count: 0, title: cp.endingTitle || '未命名结局', type: 'neutral' };
          const ed = cards.find(c => c.id === cp.endingId);
          if (ed?.type === 'ending') endingCounts[cp.endingId].type = ed.endingType || 'neutral';
        }
        endingCounts[cp.endingId].count++;
      }
    });

    const topEndings = Object.entries(endingCounts)
      .map(([id, e]) => ({ id, ...e }))
      .sort((a, b) => b.count - a.count);

    const voteRoundsByScene: Record<string, VoteRound[]> = {};
    voteRounds.forEach(r => {
      if (!voteRoundsByScene[r.sceneId]) voteRoundsByScene[r.sceneId] = [];
      voteRoundsByScene[r.sceneId].push(r);
    });

    const totalManualChoices = classroomPaths.reduce(
      (sum, cp) => sum + cp.steps.filter(s => s.source === 'manual').length,
      0
    );
    const totalVoteChoices = classroomPaths.reduce(
      (sum, cp) => sum + cp.steps.filter(s => s.source === 'vote').length,
      0
    );

    return {
      totalVotes,
      uniqueVoters: uniqueVoters.size,
      topEndings,
      voteRoundsByScene,
      totalManualChoices,
      totalVoteChoices,
      totalClassroomSessions: classroomPaths.length,
    };
  }, [voteRounds, classroomPaths, cards]);

  if (!analysis) {
    return (
      <div className="min-h-screen bg-horror-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-horror-blood border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-horror-textMuted">分析中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-horror-bg pb-16">
      <ModeToggle />
      
      <div className="pt-20 px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/display')}
              className="horror-btn text-sm flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              返回展示
            </button>
            <h1 className="font-gothic text-3xl text-horror-text text-shadow-blood flex items-center gap-3">
              <Award size={32} className="text-horror-accent" />
              剧情评分分析
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetClassroom}
              className="horror-btn text-sm"
              title="清空课堂路径和投票历史"
            >
              清空课堂
            </button>
            <button
              onClick={handleResetVotes}
              className="horror-btn text-sm"
            >
              重置投票
            </button>
            <button
              onClick={handleRefresh}
              className="horror-btn text-sm flex items-center gap-2"
            >
              <RefreshCw size={16} />
              刷新分析
            </button>
          </div>
        </div>

        {classroomStats.totalClassroomSessions > 0 && (
          <div className="horror-card mb-8 p-5 animate-fade-in border-horror-accent/30">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-horror-accent/20">
                <Users size={18} className="text-horror-accent" />
              </div>
              <div>
                <h3 className="font-gothic text-lg text-horror-text">课堂实际数据</h3>
                <p className="text-xs text-horror-textMuted">
                  汇总 {classroomStats.totalClassroomSessions} 次课堂展示的真实投票与路径数据
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
              <div className="p-3 bg-horror-bg rounded-lg border border-horror-border text-center">
                <p className="text-2xl font-gothic text-blue-400 mb-0.5">{classroomStats.totalClassroomSessions}</p>
                <p className="text-[11px] text-horror-textMuted flex items-center justify-center gap-1">
                  <Users size={11} /> 课堂次数
                </p>
              </div>
              <div className="p-3 bg-horror-bg rounded-lg border border-horror-border text-center">
                <p className="text-2xl font-gothic text-horror-bloodLight mb-0.5">{classroomStats.totalVotes}</p>
                <p className="text-[11px] text-horror-textMuted flex items-center justify-center gap-1">
                  <Vote size={11} /> 累计票数
                </p>
              </div>
              <div className="p-3 bg-horror-bg rounded-lg border border-horror-border text-center">
                <p className="text-2xl font-gothic text-green-400 mb-0.5">{classroomStats.uniqueVoters}</p>
                <p className="text-[11px] text-horror-textMuted flex items-center justify-center gap-1">
                  <Users size={11} /> 参与学生
                </p>
              </div>
              <div className="p-3 bg-horror-bg rounded-lg border border-horror-border text-center">
                <p className="text-2xl font-gothic text-blue-400 mb-0.5">{classroomStats.totalManualChoices}</p>
                <p className="text-[11px] text-horror-textMuted flex items-center justify-center gap-1">
                  <Trophy size={11} /> 手点次数
                </p>
              </div>
              <div className="p-3 bg-horror-bg rounded-lg border border-horror-border text-center">
                <p className="text-2xl font-gothic text-horror-accent mb-0.5">{classroomStats.totalVoteChoices}</p>
                <p className="text-[11px] text-horror-textMuted flex items-center justify-center gap-1">
                  <Vote size={11} /> 投票决定
                </p>
              </div>
            </div>

            {classroomStats.topEndings.length > 0 && (
              <div className="mb-5">
                <h4 className="text-sm font-gothic text-horror-text mb-3 flex items-center gap-2">
                  <Trophy size={14} className="text-yellow-400" />
                  班级最爱结局排名
                </h4>
                <div className="space-y-2">
                  {classroomStats.topEndings.map((ed, i) => {
                    const maxCount = classroomStats.topEndings[0].count;
                    const pct = Math.round((ed.count / maxCount) * 100);
                    return (
                      <div key={ed.id} className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                          ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                            i === 1 ? 'bg-gray-400/20 text-gray-300' :
                            i === 2 ? 'bg-orange-500/20 text-orange-400' :
                            'bg-horror-surface text-horror-textMuted'}`}>
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-xs font-medium ${
                              ed.type === 'good' ? 'text-green-400' :
                              ed.type === 'bad' ? 'text-horror-bloodLight' :
                              ed.type === 'twist' ? 'text-purple-400' :
                              'text-yellow-400'
                            }`}>
                              {ed.title}
                              <span className="ml-2 text-[10px] opacity-60">
                                {ed.type === 'good' ? '（好结局）' :
                                 ed.type === 'bad' ? '（坏结局）' :
                                 ed.type === 'twist' ? '（反转结局）' : '（中性结局）'}
                              </span>
                            </p>
                            <span className="text-xs text-horror-textMuted font-mono">
                              {ed.count} 次 / {Math.round(ed.count / classroomStats.totalClassroomSessions * 100)}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-horror-surface rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                ed.type === 'good' ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                                ed.type === 'bad' ? 'bg-gradient-to-r from-horror-blood to-horror-bloodLight' :
                                ed.type === 'twist' ? 'bg-gradient-to-r from-purple-500 to-pink-400' :
                                'bg-gradient-to-r from-yellow-500 to-orange-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {voteRounds.length > 0 && (
              <div>
                <h4 className="text-sm font-gothic text-horror-text mb-3 flex items-center gap-2">
                  <BarChart3 size={14} className="text-horror-bloodLight" />
                  投票轮次记录 ({voteRounds.length} 轮)
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {[...voteRounds].sort((a, b) => b.timestamp - a.timestamp).map((round) => {
                    const maxVotes = Math.max(...round.options.map(o => o.count), 1);
                    return (
                      <div key={round.id} className="p-2.5 bg-horror-bg rounded-lg border border-horror-border">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-horror-text font-medium flex items-center gap-1.5">
                            <TrendingUp size={11} className="text-horror-accent shrink-0" />
                            <span className="truncate">{round.sceneTitle}</span>
                            <span className="text-[10px] text-horror-textMuted shrink-0">
                              · {round.totalVotes} 人
                              · {new Date(round.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          {round.options.map(opt => {
                            const isWinner = opt.choiceId === round.winningChoiceId;
                            const pct = round.totalVotes > 0 ? Math.round((opt.count / round.totalVotes) * 100) : 0;
                            return (
                              <div key={opt.choiceId}>
                                <div className="flex items-center justify-between mb-0.5">
                                  <p className={`text-[11px] truncate ${isWinner ? 'text-horror-bloodLight font-medium' : 'text-horror-textMuted'}`}>
                                    {isWinner && '🏆 '}
                                    {opt.choiceText.slice(0, 20)}
                                    {opt.voters.length > 0 && (
                                      <span className="text-[9px] opacity-50 ml-1">
                                        ({opt.voters.length > 3 ? opt.voters.slice(0, 3).join('/') + '…' : opt.voters.join('/')})
                                      </span>
                                    )}
                                  </p>
                                  <span className="text-[10px] text-horror-textMuted font-mono shrink-0 ml-2">
                                    {opt.count} 票 · {pct}%
                                  </span>
                                </div>
                                <div className="h-1 bg-horror-surface rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      isWinner ? 'bg-gradient-to-r from-horror-blood to-horror-accent' : 'bg-horror-border'
                                    }`}
                                    style={{ width: `${Math.round((opt.count / maxVotes) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-horror-card rounded-lg border border-horror-border">
            <p className="text-4xl font-gothic text-horror-bloodLight mb-1">
              {paths.length}
            </p>
            <p className="text-sm text-horror-textMuted">已探索路径</p>
          </div>
          <div className="text-center p-4 bg-horror-card rounded-lg border border-horror-border">
            <p className="text-4xl font-gothic text-horror-accent mb-1">
              {cards.filter(c => c.type === 'scene').length}
            </p>
            <p className="text-sm text-horror-textMuted">场景数量</p>
          </div>
          <div className="text-center p-4 bg-horror-card rounded-lg border border-horror-border">
            <p className="text-4xl font-gothic text-purple-400 mb-1">
              {cards.filter(c => c.type === 'choice').length}
            </p>
            <p className="text-sm text-horror-textMuted">选择数量</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <BranchCoverage data={analysis.branchCoverage} />
          <CurseClarity data={analysis.curseClarity} />
        </div>

        <div className="mb-8">
          <PacingAnalysis data={analysis.pacing} />
        </div>

        <div className="mb-8">
          <RouteFearSummaryList data={analysis.routeFearSummaries} />
        </div>

        {showFeedback && analysis.overallFeedback.length > 0 && (
          <div className="horror-card border-horror-accent mb-8 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-horror-accent to-yellow-600">
                <BookOpen size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-gothic text-xl text-horror-text">综合评价</h3>
                <p className="text-xs text-horror-textMuted">教学反馈与改进建议</p>
              </div>
            </div>
            <div className="space-y-3">
              {analysis.overallFeedback.map((feedback, index) => (
                <Typewriter
                  key={index}
                  text={feedback}
                  speed={30}
                  startDelay={index * 800}
                  className="p-3 bg-horror-bg rounded-lg border-l-4 border-horror-accent text-horror-text"
                />
              ))}
            </div>
          </div>
        )}

        <div className="p-6 bg-gradient-to-r from-horror-blood/10 to-horror-purple/10 rounded-xl border border-horror-border">
          <h3 className="font-gothic text-xl text-horror-text mb-4 text-center">
            🏆 设计理念
          </h3>
          <p className="text-horror-textMuted text-center max-w-2xl mx-auto leading-relaxed">
            记住：<span className="text-horror-bloodLight font-semibold">分支不是越多越好，而是每条都要有恐惧意义。</span>
            <br />
            每一个选择都应该让玩家感受到代价，每一个诅咒都应该在玩家最意想不到的时候降临。
            好的恐怖叙事，是让玩家在做出选择后，在未来的某个时刻突然意识到：
            "原来当时的那个选择，已经注定了现在的结局。"
          </p>
        </div>
      </div>

      <div className="noise-overlay" />
    </div>
  );
}
