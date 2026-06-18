import { Skull } from 'lucide-react';
import { useStoryStore } from '@/store/useStoryStore';
import type { CurseCard, CurseSeverity } from '@/types/story';

interface CurseEditorProps {
  card: CurseCard;
}

const severityOptions: { value: CurseSeverity; label: string; color: string }[] = [
  { value: 'mild', label: '轻微', color: 'text-yellow-500' },
  { value: 'medium', label: '中等', color: 'text-orange-500' },
  { value: 'severe', label: '严重', color: 'text-horror-bloodLight' },
];

export default function CurseEditor({ card }: CurseEditorProps) {
  const { updateCard } = useStoryStore();

  const handleChange = (field: keyof CurseCard, value: string) => {
    updateCard(card.id, { [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-horror-border">
        <div className="p-2 rounded-lg bg-gradient-to-br from-horror-purple to-horror-purpleLight">
          <Skull size={20} className="text-white" />
        </div>
        <h3 className="font-gothic text-lg text-horror-text">诅咒编辑</h3>
      </div>

      <div>
        <label className="block text-sm text-horror-textMuted mb-1">诅咒名称</label>
        <input
          type="text"
          className="horror-input"
          value={card.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="例如：镜中延迟、沾染之印"
        />
      </div>

      <div>
        <label className="block text-sm text-horror-textMuted mb-1">诅咒描述</label>
        <textarea
          className="horror-textarea"
          value={card.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="描述诅咒给玩家带来的恐怖体验..."
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm text-horror-textMuted mb-2">严重程度</label>
        <div className="flex gap-2">
          {severityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleChange('severity', option.value)}
              className={`flex-1 py-2 px-3 rounded border transition-all ${
                card.severity === option.value
                  ? 'border-horror-blood bg-horror-blood/20 ' + option.color
                  : 'border-horror-border bg-horror-bg text-horror-textMuted hover:border-horror-blood/50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-horror-textMuted mb-1">触发条件</label>
        <textarea
          className="horror-textarea"
          value={card.triggerCondition}
          onChange={(e) => handleChange('triggerCondition', e.target.value)}
          placeholder="描述诅咒在什么情况下会被触发..."
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm text-horror-textMuted mb-1">视觉效果</label>
        <textarea
          className="horror-textarea"
          value={card.visualEffect}
          onChange={(e) => handleChange('visualEffect', e.target.value)}
          placeholder="描述诅咒触发时玩家看到的画面..."
          rows={2}
        />
      </div>

      <div className="pt-2 border-t border-horror-border">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-horror-accent">🔄</span>
          <label className="text-sm text-horror-text font-semibold">诅咒规则</label>
        </div>
        <textarea
          className="horror-textarea"
          value={card.rule}
          onChange={(e) => handleChange('rule', e.target.value)}
          placeholder="描述诅咒的规则。考虑加入规则反转：让玩家以为掌握了规律，但实际上规则在某处发生了变化..."
          rows={3}
        />
        <p className="text-xs text-horror-textMuted mt-2">
          <strong>提示：</strong>规则反转是恐怖叙事的高级技巧。例如："你以为镜子照出的是现在，但实际上它照出的是三秒后的未来。而当你发现这个规则时，规则已经反转了——现在镜中的你才是真实的。"
        </p>
      </div>

      <div className="p-3 bg-horror-purple/10 rounded-lg border border-horror-purple/30">
        <p className="text-xs text-horror-textMuted">
          💡 <strong>设计建议：</strong>尝试设置不同延迟时间的诅咒效果。经典的恐怖叙事技巧是：让玩家做出选择后，当场无事发生，但在几幕之后，诅咒突然降临，带来更强的恐惧感。
        </p>
      </div>
    </div>
  );
}
