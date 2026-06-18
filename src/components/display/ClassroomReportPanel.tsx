import { useState, useMemo } from 'react';
import { FileText, Copy, Download, X, Check, Users, Vote, Route, Trophy, Calendar } from 'lucide-react';
import { useStoryStore } from '@/store/useStoryStore';
import type { ClassroomPath, VoteRound, StoryCard, SceneCard, ChoiceCard, EndingCard } from '@/types/story';

interface Props {
  mode?: 'analysis' | 'player';
}

export default function ClassroomReportPanel({ mode = 'analysis' }: Props) {
  const { classroomPaths, voteRounds, cards } = useStoryStore();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const reportText = useMemo(() => {
    if (classroomPaths.length === 0 && voteRounds.length === 0) return '';

    const lines: string[] = [];
    const now = new Date().toLocaleString('zh-CN');

    lines.push('═══════════════════════════════════════');
    lines.push('      鬼屋章节 · 课堂记录报告');
    lines.push('═══════════════════════════════════════');
    lines.push(`生成时间: ${now}`);
    lines.push('');

    // 总览
    const totalVotes = voteRounds.reduce((sum, r) => sum + r.totalVotes, 0);
    const allVoters = new Set<string>();
    voteRounds.forEach(r => r.options.forEach(o => o.voters.forEach(v => allVoters.add(v))));

    lines.push('📊 课堂总览');
    lines.push('───────────────────────────────────────');
    lines.push(`  课堂记录数: ${classroomPaths.length} 次`);
    lines.push(`  投票轮次: ${voteRounds.length} 轮`);
    lines.push(`  累计投票: ${totalVotes} 票`);
    lines.push(`  参与学生: ${allVoters.size} 人`);
    if (allVoters.size > 0) {
      lines.push(`  学生名单: ${[...allVoters].join('、')}`);
    }
    lines.push('');

    // 各条路线详情
    if (classroomPaths.length > 0) {
      lines.push('🗺️ 课堂路线记录');
      lines.push('───────────────────────────────────────');
      lines.push('');

      [...classroomPaths].sort((a, b) => a.startedAt - b.startedAt).forEach((path, idx) => {
        const startTime = new Date(path.startedAt).toLocaleString('zh-CN');
        const endTime = path.completedAt ? new Date(path.completedAt).toLocaleString('zh-CN') : '未完成';

        lines.push(`  路线 #${idx + 1}`);
        lines.push(`  开始时间: ${startTime}`);
        lines.push(`  结束时间: ${endTime}`);
        lines.push(`  最终结局: ${path.endingTitle || '未到达结局'}`);

        const pathSteps = path.steps.map(s => {
          const c = cards.find(cc => cc.id === s.cardId);
          if (!c) return null;
          const source = s.source === 'vote' ? '[投票]' : '[手点]';
          if (c.type === 'scene') return `${source} 场景: ${(c as SceneCard).title || '未命名'}`;
          if (c.type === 'choice') return `${source} 选择: ${(c as ChoiceCard).text.slice(0, 20)}`;
          if (c.type === 'ending') return `${source} 结局: ${(c as EndingCard).title || '未命名'}`;
          return null;
        }).filter(Boolean);

        lines.push(`  完整路径: ${pathSteps.length} 步`);
        pathSteps.forEach((s, i) => {
          lines.push(`    ${i + 1}. ${s}`);
        });
        lines.push('');
      });
    }

    // 各轮投票详情
    if (voteRounds.length > 0) {
      lines.push('🗳️ 投票轮次详情');
      lines.push('───────────────────────────────────────');
      lines.push('');

      [...voteRounds].sort((a, b) => a.timestamp - b.timestamp).forEach((round, idx) => {
        const time = new Date(round.timestamp).toLocaleString('zh-CN');
        lines.push(`  第 ${idx + 1} 轮: ${round.sceneTitle}`);
        lines.push(`  时间: ${time}`);
        lines.push(`  参与人数: ${round.totalVotes} 人`);
        lines.push(`  投票选项:`);

        round.options.forEach((opt, oi) => {
          const winner = opt.choiceId === round.winningChoiceId ? ' 🏆' : '';
          const pct = round.totalVotes > 0 ? Math.round((opt.count / round.totalVotes) * 100) : 0;
          const voters = opt.voters.length > 0 ? ` (${opt.voters.join('、')})` : '';
          lines.push(`    ${String.fromCharCode(65 + oi)}. ${opt.choiceText} - ${opt.count} 票 (${pct}%)${voters}${winner}`);
        });

        lines.push(`  胜出选项: ${round.winningChoiceText}`);
        lines.push('');
      });
    }

    // 学生参与统计
    if (allVoters.size > 0) {
      lines.push('👥 学生参与统计');
      lines.push('───────────────────────────────────────');
      lines.push('');

      const voterStats: Record<string, { rounds: number; scenes: string[] }> = {};
      voteRounds.forEach(round => {
        round.options.forEach(opt => {
          opt.voters.forEach(voter => {
            if (!voterStats[voter]) voterStats[voter] = { rounds: 0, scenes: [] };
            voterStats[voter].rounds++;
            if (!voterStats[voter].scenes.includes(round.sceneTitle)) {
              voterStats[voter].scenes.push(round.sceneTitle);
            }
          });
        });
      });

      Object.entries(voterStats)
        .sort((a, b) => b[1].rounds - a[1].rounds)
        .forEach(([name, stat], i) => {
          lines.push(`  ${i + 1}. ${name} - 参与 ${stat.rounds} 轮投票，投过 ${stat.scenes.length} 个场景`);
          lines.push(`     参与场景: ${stat.scenes.join('、')}`);
        });
      lines.push('');
    }

    lines.push('═══════════════════════════════════════');
    lines.push('      报告生成完毕 · 鬼屋练习器');
    lines.push('═══════════════════════════════════════');

    return lines.join('\n');
  }, [classroomPaths, voteRounds, cards]);

  const handleCopy = async () => {
    if (!reportText) return;
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      alert('复制失败，请手动复制');
    }
  };

  const handleDownload = () => {
    if (!reportText) return;
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `鬼屋课堂记录_${date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (mode === 'player' && !isOpen) {
    return (
      <div className="fixed bottom-20 right-4 z-30">
        <button
          onClick={() => setIsOpen(true)}
          className="horror-btn flex items-center gap-2 text-sm shadow-lg"
        >
          <FileText size={14} className="text-green-400" />
          导出课堂记录
        </button>
      </div>
    );
  }

  if (mode === 'analysis' && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="horror-btn text-sm flex items-center gap-2"
      >
        <FileText size={16} />
        导出课堂报告
      </button>
    );
  }

  if (!isOpen) return null;

  const hasData = classroomPaths.length > 0 || voteRounds.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-horror-surface/95 backdrop-blur-sm rounded-xl border border-horror-border shadow-haunt animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-horror-border">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-green-400" />
            <h3 className="font-gothic text-lg text-horror-text">课堂记录报告</h3>
          </div>
          <div className="flex items-center gap-2">
            {hasData && (
              <>
                <button
                  onClick={handleCopy}
                  className="horror-btn text-xs flex items-center gap-1"
                >
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  {copied ? '已复制' : '复制'}
                </button>
                <button
                  onClick={handleDownload}
                  className="horror-btn-primary text-xs flex items-center gap-1"
                >
                  <Download size={12} />
                  下载 .txt
                </button>
              </>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-horror-bg rounded transition-colors"
            >
              <X size={16} className="text-horror-textMuted" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!hasData ? (
            <div className="text-center py-12">
              <Calendar size={48} className="text-horror-textMuted mx-auto mb-4 opacity-50" />
              <p className="text-horror-textMuted">暂无课堂记录</p>
              <p className="text-xs text-horror-textMuted/60 mt-1">完成至少一次课堂展示后会生成报告</p>
            </div>
          ) : (
            <pre className="text-xs text-horror-text bg-horror-bg rounded-lg p-4 font-mono whitespace-pre-wrap leading-relaxed">
              {reportText}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
