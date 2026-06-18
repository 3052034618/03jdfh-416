import { GitBranch, CheckCircle2, XCircle } from 'lucide-react';
import type { BranchCoverageResult } from '@/types/story';

interface BranchCoverageProps {
  data: BranchCoverageResult;
}

export default function BranchCoverage({ data }: BranchCoverageProps) {
  const getCoverageColor = () => {
    if (data.coverage >= 80) return 'text-green-400';
    if (data.coverage >= 50) return 'text-yellow-400';
    return 'text-horror-bloodLight';
  };

  const getCoverageBgColor = () => {
    if (data.coverage >= 80) return 'from-green-500/20 to-green-500/5';
    if (data.coverage >= 50) return 'from-yellow-500/20 to-yellow-500/5';
    return 'from-horror-blood/20 to-horror-blood/5';
  };

  return (
    <div className="horror-card border-horror-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-horror-blue to-horror-purple">
          <GitBranch size={24} className="text-white" />
        </div>
        <div>
          <h3 className="font-gothic text-xl text-horror-text">分支覆盖度</h3>
          <p className="text-xs text-horror-textMuted">已探索的分支占所有可能分支的比例</p>
        </div>
      </div>

      {data.totalBranches === 0 ? (
        <div className="text-center py-8">
          <XCircle size={48} className="text-horror-textMuted mx-auto mb-2" />
          <p className="text-horror-textMuted">没有检测到完整的分支结构</p>
          <p className="text-xs text-horror-textMuted mt-1">请确保剧情有入口场景和完整的结局</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex items-end justify-between mb-2">
              <span className="text-horror-textMuted text-sm">覆盖度</span>
              <span className={`font-gothic text-4xl font-bold ${getCoverageColor()}`}>
                {data.coverage}%
              </span>
            </div>
            <div className="h-4 bg-horror-bg rounded-full overflow-hidden border border-horror-border">
              <div
                className={`h-full bg-gradient-to-r ${getCoverageBgColor()} transition-all duration-1000 ease-out`}
                style={{ width: `${data.coverage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-horror-bg rounded-lg">
              <p className="text-3xl font-gothic text-horror-text">{data.totalBranches}</p>
              <p className="text-xs text-horror-textMuted">总分支数</p>
            </div>
            <div className="text-center p-3 bg-horror-bg rounded-lg">
              <p className="text-3xl font-gothic text-green-400">{data.exploredBranches}</p>
              <p className="text-xs text-horror-textMuted">已探索</p>
            </div>
          </div>

          {data.missingBranches.length > 0 && (
            <div className="pt-4 border-t border-horror-border">
              <h4 className="text-sm text-horror-textMuted mb-3 flex items-center gap-2">
                <XCircle size={14} className="text-horror-bloodLight" />
                未探索的分支 ({data.missingBranches.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {data.missingBranches.map((path, index) => (
                  <div
                    key={index}
                    className="text-xs text-horror-textMuted bg-horror-bg p-2 rounded border-l-2 border-horror-blood/50"
                  >
                    路径 {index + 1}: {path.length} 步
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.coverage >= 80 && (
            <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/30 flex items-start gap-2">
              <CheckCircle2 size={18} className="text-green-400 mt-0.5" />
              <p className="text-sm text-green-400">
                优秀！同学们探索了大部分分支路线。
              </p>
            </div>
          )}

          {data.coverage < 50 && (
            <div className="mt-4 p-3 bg-horror-blood/10 rounded-lg border border-horror-blood/30">
              <p className="text-sm text-horror-bloodLight">
                💡 鼓励同学们尝试不同的选择，探索更多分支路线。每条分支都应该有独特的恐惧意义。
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
