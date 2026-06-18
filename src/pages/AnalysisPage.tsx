import { useState, useEffect } from 'react';
import { Award, RefreshCw, BookOpen, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStoryStore } from '@/store/useStoryStore';
import { runFullAnalysis } from '@/utils/analysis';
import ModeToggle from '@/components/common/ModeToggle';
import BranchCoverage from '@/components/analysis/BranchCoverage';
import CurseClarity from '@/components/analysis/CurseClarity';
import PacingAnalysis from '@/components/analysis/PacingAnalysis';
import RouteFearSummaryList from '@/components/analysis/RouteFearSummary';
import Typewriter from '@/components/display/Typewriter';
import type { AnalysisResult } from '@/types/story';

export default function AnalysisPage() {
  const navigate = useNavigate();
  const { cards, connections, exploredPaths, resetVotes, exploredPaths: paths } = useStoryStore();
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
    }
  };

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
