import { ScrollText, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';
import type { CurseClarityResult } from '@/types/story';

interface CurseClarityProps {
  data: CurseClarityResult;
}

export default function CurseClarity({ data }: CurseClarityProps) {
  const getScoreColor = () => {
    if (data.score >= 80) return 'text-green-400';
    if (data.score >= 50) return 'text-yellow-400';
    return 'text-horror-bloodLight';
  };

  const getScoreBgColor = () => {
    if (data.score >= 80) return 'conic-gradient(from 0deg, #22c55e 0%, #22c55e var(--score), #1a1a25 var(--score))';
    if (data.score >= 50) return 'conic-gradient(from 0deg, #eab308 0%, #eab308 var(--score), #1a1a25 var(--score))';
    return 'conic-gradient(from 0deg, #8b0000 0%, #8b0000 var(--score), #1a1a25 var(--score))';
  };

  return (
    <div className="horror-card border-horror-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-horror-purple to-horror-purpleLight">
          <ScrollText size={24} className="text-white" />
        </div>
        <div>
          <h3 className="font-gothic text-xl text-horror-text">诅咒规则清晰度</h3>
          <p className="text-xs text-horror-textMuted">诅咒设定的完整性与一致性分析</p>
        </div>
      </div>

      <div className="flex items-start gap-6 mb-6">
        <div 
          className="relative w-24 h-24 rounded-full flex items-center justify-center"
          style={{ 
            background: getScoreBgColor(),
            '--score': `${data.score}%`,
          } as React.CSSProperties}
        >
          <div className="w-16 h-16 rounded-full bg-horror-card flex items-center justify-center">
            <span className={`font-gothic text-2xl font-bold ${getScoreColor()}`}>
              {data.score}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <p className={`text-sm mb-2 ${data.consistent ? 'text-green-400' : 'text-horror-bloodLight'}`}>
            {data.consistent ? (
              <span className="flex items-center gap-1">
                <CheckCircle size={16} />
                规则设定一致
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <AlertTriangle size={16} />
                存在待改进的问题
              </span>
            )}
          </p>
          {data.issues.length > 0 && (
            <div className="space-y-1">
              {data.issues.slice(0, 3).map((issue, index) => (
                <p key={index} className="text-xs text-horror-textMuted flex items-start gap-1">
                  <span className="text-horror-bloodLight">•</span>
                  {issue}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {data.suggestions.length > 0 && (
        <div className="pt-4 border-t border-horror-border">
          <h4 className="text-sm text-horror-textMuted mb-3 flex items-center gap-2">
            <Lightbulb size={14} className="text-yellow-400" />
            改进建议
          </h4>
          <div className="space-y-2">
            {data.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-3 bg-horror-bg rounded-lg border-l-2 border-horror-accent text-sm text-horror-textMuted"
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.score >= 80 && (
        <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/30 flex items-start gap-2">
          <CheckCircle size={18} className="text-green-400 mt-0.5" />
          <p className="text-sm text-green-400">
            诅咒规则设定清晰完整，玩家能够理解恐惧的来源。
          </p>
        </div>
      )}
    </div>
  );
}
