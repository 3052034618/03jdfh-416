import { Route, Skull, Coins, BookOpen, AlertTriangle, CheckCircle } from 'lucide-react';
import type { RouteFearSummary as RouteFearSummaryType } from '@/types/story';

interface RouteFearSummaryListProps {
  data: RouteFearSummaryType[];
}

const severityLabel: Record<string, { text: string; color: string }> = {
  mild: { text: '轻微', color: 'text-yellow-400' },
  medium: { text: '中等', color: 'text-orange-400' },
  severe: { text: '严重', color: 'text-horror-bloodLight' },
};

const endingTypeIcon: Record<string, string> = {
  good: '🌅',
  bad: '💀',
  twist: '🌀',
  neutral: '🌙',
};

export default function RouteFearSummaryList({ data }: RouteFearSummaryListProps) {
  if (data.length === 0) {
    return (
      <div className="horror-card border-horror-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-horror-purple to-horror-purpleLight">
            <Route size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-gothic text-xl text-horror-text">路线恐惧意义</h3>
            <p className="text-xs text-horror-textMuted">每条路线的恐惧元素分析</p>
          </div>
        </div>
        <div className="text-center py-8">
          <Route size={48} className="text-horror-textMuted mx-auto mb-2 opacity-30" />
          <p className="text-horror-textMuted">暂无完整路线数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="horror-card border-horror-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-horror-purple to-horror-purpleLight">
          <Route size={24} className="text-white" />
        </div>
        <div>
          <h3 className="font-gothic text-xl text-horror-text">路线恐惧意义</h3>
          <p className="text-xs text-horror-textMuted">每条路线的代价、诅咒与结局回扣对应分析</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((route, index) => {
          const scoreColor = route.fearMeaningScore >= 70
            ? 'text-green-400'
            : route.fearMeaningScore >= 40
              ? 'text-yellow-400'
              : 'text-horror-bloodLight';

          const scoreBg = route.fearMeaningScore >= 70
            ? 'border-green-500/30 bg-green-500/5'
            : route.fearMeaningScore >= 40
              ? 'border-yellow-500/30 bg-yellow-500/5'
              : 'border-horror-blood/30 bg-horror-blood/5';

          return (
            <div key={index} className={`rounded-lg border p-4 ${scoreBg}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Route size={14} className="text-horror-textMuted" />
                    <span className="font-gothic text-sm text-horror-text">
                      路线 {index + 1}
                    </span>
                  </div>
                  <p className="text-xs text-horror-textMuted truncate">
                    {route.pathLabel}
                  </p>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <p className={`font-gothic text-2xl font-bold ${scoreColor}`}>
                    {route.fearMeaningScore}
                  </p>
                  <p className="text-[10px] text-horror-textMuted">恐惧意义</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 bg-horror-bg/50 rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Coins size={12} className="text-yellow-400" />
                    <span className="text-xs text-horror-textMuted">代价</span>
                  </div>
                  <p className="font-gothic text-lg text-horror-text">{route.totalCost}</p>
                </div>

                <div className="text-center p-2 bg-horror-bg/50 rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Skull size={12} className="text-horror-bloodLight" />
                    <span className="text-xs text-horror-textMuted">诅咒</span>
                  </div>
                  <p className="font-gothic text-lg text-horror-text">{route.triggeredCurses.length}</p>
                </div>

                <div className="text-center p-2 bg-horror-bg/50 rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <BookOpen size={12} className="text-horror-accent" />
                    <span className="text-xs text-horror-textMuted">回扣</span>
                  </div>
                  <p className="font-gothic text-lg text-horror-text">
                    {route.hasCallback ? '✓' : '✗'}
                  </p>
                </div>
              </div>

              {route.triggeredCurses.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-horror-textMuted mb-1">触发诅咒：</p>
                  {route.triggeredCurses.map((curse, ci) => (
                    <div key={ci} className="flex items-center gap-2 text-xs mb-1">
                      <Skull size={10} className="text-horror-bloodLight" />
                      <span className="text-horror-text">{curse.name}</span>
                      <span className={severityLabel[curse.severity]?.color || 'text-horror-textMuted'}>
                        ({severityLabel[curse.severity]?.text || curse.severity})
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {route.endingTitle && (
                <div className="mb-2 flex items-center gap-2 text-xs">
                  <span className="text-lg">{endingTypeIcon[route.endingType || 'neutral'] || '🌙'}</span>
                  <span className="text-horror-text">结局：{route.endingTitle}</span>
                </div>
              )}

              {route.hasCallback && route.callbackText && (
                <div className="text-xs text-horror-accent italic border-l-2 border-horror-accent/50 pl-2 mb-2">
                  回扣：{route.callbackText.length > 60 ? route.callbackText.slice(0, 60) + '…' : route.callbackText}
                </div>
              )}

              <div className={`text-xs mt-2 p-2 rounded flex items-start gap-1.5 ${
                route.fearMeaningScore >= 70
                  ? 'text-green-400 bg-green-500/5'
                  : route.fearMeaningScore >= 40
                    ? 'text-yellow-400 bg-yellow-500/5'
                    : 'text-horror-bloodLight bg-horror-blood/5'
              }`}>
                {route.fearMeaningScore >= 70 ? (
                  <CheckCircle size={14} className="mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                )}
                {route.fearMeaningNote}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
