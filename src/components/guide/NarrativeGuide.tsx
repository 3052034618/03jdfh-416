import { useStoryStore } from '@/store/useStoryStore';
import { Check, AlertTriangle, Lightbulb, Skull, DollarSign, RefreshCw, Target } from 'lucide-react';

const narrativeItems = [
  {
    key: 'redHerring',
    icon: Lightbulb,
    title: '误导线索',
    description: '加入看似重要但无关的线索，迷惑玩家判断',
    color: 'yellow',
  },
  {
    key: 'increasingCost',
    icon: DollarSign,
    title: '代价递增',
    description: '让选择的代价逐渐升高，每个选择都更难抉择',
    color: 'orange',
  },
  {
    key: 'ruleReversal',
    icon: RefreshCw,
    title: '规则反转',
    description: '在玩家掌握规律时突然改变规则，打破安全感',
    color: 'purple',
  },
  {
    key: 'callback',
    icon: Target,
    title: '结局回扣',
    description: '结局呼应开头细节，产生"原来如此"的冲击感',
    color: 'accent',
  },
] as const;

const colorClasses: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  yellow: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500',
    text: 'text-yellow-400',
    glow: 'shadow-[0_0_10px_rgba(234,179,8,0.3)]',
  },
  orange: {
    bg: 'bg-orange-500/20',
    border: 'border-orange-500',
    text: 'text-orange-400',
    glow: 'shadow-[0_0_10px_rgba(249,115,22,0.3)]',
  },
  purple: {
    bg: 'bg-purple-500/20',
    border: 'border-purple-500',
    text: 'text-purple-400',
    glow: 'shadow-[0_0_10px_rgba(168,85,247,0.3)]',
  },
  accent: {
    bg: 'bg-horror-accent/20',
    border: 'border-horror-accent',
    text: 'text-horror-accent',
    glow: 'shadow-candle',
  },
};

export default function NarrativeGuide() {
  const { narrativeElements, activeCardId, cards } = useStoryStore();
  const activeCard = cards.find(c => c.id === activeCardId);

  const getEditorContent = () => {
    if (!activeCard) return null;

    switch (activeCard.type) {
      case 'scene':
        return (
          <div className="mb-4 p-3 bg-horror-bg rounded-lg border border-horror-border">
            <h4 className="font-gothic text-sm text-horror-text mb-2">当前编辑：场景</h4>
            <p className="text-xs text-horror-textMuted">
              填写环境细节和氛围，考虑是否加入误导线索
            </p>
          </div>
        );
      case 'choice':
        return (
          <div className="mb-4 p-3 bg-horror-bg rounded-lg border border-horror-border">
            <h4 className="font-gothic text-sm text-horror-text mb-2">当前编辑：选择</h4>
            <p className="text-xs text-horror-textMuted">
              设置即时反馈和延迟诅咒，考虑代价递增
            </p>
          </div>
        );
      case 'curse':
        return (
          <div className="mb-4 p-3 bg-horror-bg rounded-lg border border-horror-border">
            <h4 className="font-gothic text-sm text-horror-text mb-2">当前编辑：诅咒</h4>
            <p className="text-xs text-horror-textMuted">
              定义清晰的规则，考虑规则反转的可能性
            </p>
          </div>
        );
      case 'ending':
        return (
          <div className="mb-4 p-3 bg-horror-bg rounded-lg border border-horror-border">
            <h4 className="font-gothic text-sm text-horror-text mb-2">当前编辑：结局</h4>
            <p className="text-xs text-horror-textMuted">
              填写结局回扣，呼应故事开头的某个细节
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-72 bg-horror-surface border-l border-horror-border p-4 flex flex-col gap-4 overflow-y-auto">
      <div className="text-center mb-2">
        <h2 className="font-gothic text-xl text-horror-text text-shadow-blood flex items-center justify-center gap-2">
          <Skull size={20} className="text-horror-bloodLight" />
          叙事要素
        </h2>
        <p className="text-xs text-horror-textMuted mt-1">
          补足恐怖叙事的四大核心要素
        </p>
      </div>

      {getEditorContent()}

      <div className="space-y-3">
        {narrativeItems.map((item) => {
          const Icon = item.icon;
          const isComplete = narrativeElements[item.key];
          const colors = colorClasses[item.color];

          return (
            <div
              key={item.key}
              className={`p-3 rounded-lg border transition-all duration-300 ${
                isComplete
                  ? `${colors.bg} ${colors.border} ${colors.glow}`
                  : 'bg-horror-bg border-horror-border'
              } ${!isComplete ? 'animate-pulse-slow' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-1.5 rounded ${
                    isComplete ? colors.bg : 'bg-horror-surface'
                  }`}
                >
                  {isComplete ? (
                    <Check size={16} className={colors.text} />
                  ) : (
                    <AlertTriangle size={16} className="text-horror-textMuted" />
                  )}
                </div>
                <div className="flex-1">
                  <h3
                    className={`font-gothic text-sm font-semibold ${
                      isComplete ? colors.text : 'text-horror-text'
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p className="text-xs text-horror-textMuted mt-0.5">
                    {item.description}
                  </p>
                </div>
                <Icon
                  size={14}
                  className={isComplete ? colors.text : 'text-horror-textMuted'}
                />
              </div>
            </div>
          );
        })}
      </div>

      {narrativeElements.hints.length > 0 && (
        <div className="pt-3 border-t border-horror-border">
          <h3 className="font-gothic text-sm text-horror-text mb-2 flex items-center gap-2">
            <Lightbulb size={16} className="text-yellow-400" />
            改进建议
          </h3>
          <div className="space-y-2">
            {narrativeElements.hints.map((hint, index) => (
              <div
                key={index}
                className="p-2 bg-horror-bg rounded text-xs text-horror-textMuted border-l-2 border-horror-blood"
              >
                {hint}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto pt-3 border-t border-horror-border">
        <div className="p-3 bg-horror-blood/10 rounded-lg border border-horror-blood/30">
          <h4 className="font-gothic text-sm text-horror-bloodLight mb-1">
            🏆 设计理念
          </h4>
          <p className="text-xs text-horror-textMuted">
            记住：分支不是越多越好，而是每条都要有恐惧意义。
            每一个选择都应该让玩家感受到代价，每一个诅咒都应该在玩家最意想不到的时候降临。
          </p>
        </div>
      </div>
    </div>
  );
}
