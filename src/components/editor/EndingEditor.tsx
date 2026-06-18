import { BookOpen } from 'lucide-react';
import { useStoryStore } from '@/store/useStoryStore';
import type { EndingCard, EndingType } from '@/types/story';

interface EndingEditorProps {
  card: EndingCard;
}

const endingTypeOptions: { value: EndingType; label: string; icon: string; color: string }[] = [
  { value: 'good', label: '好结局', icon: '🌅', color: 'text-green-400' },
  { value: 'neutral', label: '中性结局', icon: '🌙', color: 'text-blue-400' },
  { value: 'bad', label: '坏结局', icon: '💀', color: 'text-horror-bloodLight' },
  { value: 'twist', label: '反转结局', icon: '🌀', color: 'text-purple-400' },
];

export default function EndingEditor({ card }: EndingEditorProps) {
  const { updateCard } = useStoryStore();

  const handleChange = (field: keyof EndingCard, value: string) => {
    updateCard(card.id, { [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-horror-border">
        <div className="p-2 rounded-lg bg-gradient-to-br from-horror-brown to-horror-accent">
          <BookOpen size={20} className="text-white" />
        </div>
        <h3 className="font-gothic text-lg text-horror-text">结局编辑</h3>
      </div>

      <div>
        <label className="block text-sm text-horror-textMuted mb-1">结局标题</label>
        <input
          type="text"
          className="horror-input"
          value={card.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="例如：镜中囚笼、无尽轮回"
        />
      </div>

      <div>
        <label className="block text-sm text-horror-textMuted mb-2">结局类型</label>
        <div className="grid grid-cols-2 gap-2">
          {endingTypeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleChange('endingType', option.value)}
              className={`py-2 px-3 rounded border transition-all text-sm ${
                card.endingType === option.value
                  ? 'border-horror-accent bg-horror-accent/20'
                  : 'border-horror-border bg-horror-bg text-horror-textMuted hover:border-horror-accent/50'
              }`}
            >
              <span className="mr-1">{option.icon}</span>
              <span className={card.endingType === option.value ? option.color : ''}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-horror-textMuted mb-1">结局描述</label>
        <textarea
          className="horror-textarea"
          value={card.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="详细描述这个结局发生了什么..."
          rows={4}
        />
      </div>

      <div className="pt-2 border-t border-horror-border">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-horror-accent">🎯</span>
          <label className="text-sm text-horror-text font-semibold">结局回扣</label>
        </div>
        <textarea
          className="horror-textarea"
          value={card.callback}
          onChange={(e) => handleChange('callback', e.target.value)}
          placeholder="这个结局如何呼应故事开头的某个细节？让玩家产生'原来如此'的冲击感..."
          rows={3}
        />
        <p className="text-xs text-horror-textMuted mt-2">
          <strong>提示：</strong>结局回扣是让故事令人难忘的关键。例如："你终于明白，门口那些新鲜的脚印，其实是你自己留下的。"
        </p>
      </div>

      <div className="p-3 bg-horror-accent/10 rounded-lg border border-horror-accent/30">
        <p className="text-xs text-horror-textMuted">
          💡 <strong>设计建议：</strong>一个好的恐怖结局不应该是简单的"生"或"死"。尝试让结局揭示某种被隐藏的真相，或者让玩家意识到自己在不知不觉中促成了悲剧。反转结局（Twist）通常最令人难忘。
        </p>
      </div>
    </div>
  );
}
