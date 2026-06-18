import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { PacingResult } from '@/types/story';

interface PacingAnalysisProps {
  data: PacingResult;
}

export default function PacingAnalysis({ data }: PacingAnalysisProps) {
  const getRhythmIcon = () => {
    switch (data.rhythm) {
      case 'too-fast':
        return <TrendingUp size={24} className="text-horror-bloodLight" />;
      case 'too-slow':
        return <TrendingDown size={24} className="text-yellow-400" />;
      default:
        return <Minus size={24} className="text-green-400" />;
    }
  };

  const getRhythmLabel = () => {
    switch (data.rhythm) {
      case 'too-fast':
        return { text: '节奏过快', color: 'text-horror-bloodLight' };
      case 'too-slow':
        return { text: '节奏偏慢', color: 'text-yellow-400' };
      default:
        return { text: '节奏良好', color: 'text-green-400' };
    }
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 4) return 'bg-horror-blood';
    if (intensity >= 3) return 'bg-horror-bloodLight';
    if (intensity >= 2) return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  const maxIntensity = 5;

  return (
    <div className="horror-card border-horror-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-horror-blood to-horror-bloodLight">
          <Activity size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-gothic text-xl text-horror-text">惊吓节奏分析</h3>
          <p className="text-xs text-horror-textMuted">恐惧点分布与节奏感评估</p>
        </div>
        <div className="flex items-center gap-2">
          {getRhythmIcon()}
          <span className={`font-gothic text-sm ${getRhythmLabel().color}`}>
            {getRhythmLabel().text}
          </span>
        </div>
      </div>

      {data.pacingChart.length === 0 ? (
        <div className="text-center py-8">
          <Activity size={48} className="text-horror-textMuted mx-auto mb-2 opacity-30" />
          <p className="text-horror-textMuted">数据不足，无法分析节奏</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h4 className="text-sm text-horror-textMuted mb-3">恐惧强度曲线</h4>
            <div className="flex items-end gap-2 h-40 bg-horror-bg rounded-lg p-4">
              {data.pacingChart.map((point, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end h-28">
                    <div
                      className={`w-full ${getIntensityColor(point.intensity)} rounded-t transition-all duration-700`}
                      style={{
                        height: `${(point.intensity / maxIntensity) * 100}%`,
                        animationDelay: `${index * 100}ms`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-horror-textMuted truncate w-full text-center">
                    {point.scene.slice(0, 4)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-horror-textMuted">
              <span>低</span>
              <span>恐惧强度</span>
              <span>高</span>
            </div>
          </div>

          {data.pacingChart.length >= 2 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {data.pacingChart.map((point, index) => (
                <div
                  key={index}
                  className="text-center p-2 bg-horror-bg rounded"
                >
                  <div className="flex justify-center gap-0.5 mb-1">
                    {[...Array(maxIntensity)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < point.intensity
                            ? getIntensityColor(point.intensity)
                            : 'bg-horror-border'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-horror-textMuted truncate">
                    {point.scene}
                  </p>
                </div>
              ))}
            </div>
          )}

          {data.suggestions.length > 0 && (
            <div className="pt-4 border-t border-horror-border">
              <h4 className="text-sm text-horror-textMuted mb-3">节奏建议</h4>
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

          {data.rhythm === 'well-paced' && (
            <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/30 flex items-start gap-2">
              <TrendingUp size={18} className="text-green-400 mt-0.5 rotate-45" />
              <p className="text-sm text-green-400">
                故事节奏把控良好，恐惧感循序渐进，张弛有度。
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
