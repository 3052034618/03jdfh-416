import { useState } from 'react';
import { MousePointer2, Skull, Clock } from 'lucide-react';
import { useStoryStore } from '@/store/useStoryStore';
import type { ChoiceCard } from '@/types/story';

interface ChoiceEditorProps {
  card: ChoiceCard;
}

export default function ChoiceEditor({ card }: ChoiceEditorProps) {
  const { updateCard, cards } = useStoryStore();
  const [hasDelayedConsequence, setHasDelayedConsequence] = useState(!!card.delayedConsequence);

  const handleChange = (field: keyof ChoiceCard, value: unknown) => {
    updateCard(card.id, { [field]: value });
  };

  const curseOptions = cards.filter(c => c.type === 'curse').map(c => ({
    id: c.id,
    name: (c as { name: string }).name || '未命名诅咒',
  }));

  const sceneOptions = cards.filter(c => c.type === 'scene').map(c => ({
    id: c.id,
    name: (c as { title: string }).title || '未命名场景',
  }));

  const endingOptions = cards.filter(c => c.type === 'ending').map(c => ({
    id: c.id,
    name: (c as { title: string }).title || '未命名结局',
  }));

  const handleDelayedConsequenceToggle = (checked: boolean) => {
    setHasDelayedConsequence(checked);
    if (checked && !card.delayedConsequence && curseOptions.length > 0) {
      handleChange('delayedConsequence', {
        curseId: curseOptions[0].id,
        delayScenes: 1,
      });
    } else if (!checked) {
      handleChange('delayedConsequence', null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-horror-border">
        <div className="p-2 rounded-lg bg-gradient-to-br from-horror-blood to-horror-bloodLight">
          <MousePointer2 size={20} className="text-white" />
        </div>
        <h3 className="font-gothic text-lg text-horror-text">选择编辑</h3>
      </div>

      <div>
        <label className="block text-sm text-horror-textMuted mb-1">选择文本</label>
        <textarea
          className="horror-textarea"
          value={card.text}
          onChange={(e) => handleChange('text', e.target.value)}
          placeholder="玩家看到的选项文字..."
          rows={2}
          style={{ minHeight: '60px' }}
        />
      </div>

      <div>
        <label className="block text-sm text-horror-textMuted mb-1">即时反馈</label>
        <textarea
          className="horror-textarea"
          value={card.immediateFeedback}
          onChange={(e) => handleChange('immediateFeedback', e.target.value)}
          placeholder="选择后立即显示的结果描述..."
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm text-horror-textMuted mb-2">
          💰 选择代价 <span className="text-xs">(0-5，越高代价越大)</span>
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="5"
            step="1"
            value={card.cost}
            onChange={(e) => handleChange('cost', parseInt(e.target.value))}
            className="flex-1 h-2 bg-horror-border rounded-lg appearance-none cursor-pointer accent-horror-blood"
          />
          <span className="w-8 text-center font-gothic text-xl text-horror-bloodLight">
            {card.cost}
          </span>
        </div>
        <p className="text-xs text-horror-textMuted mt-1">
          代价递增是恐怖叙事的重要技巧，让每个选择都比前一个更难以抉择
        </p>
      </div>

      <div className="pt-2 border-t border-horror-border">
        <div className="flex items-center gap-2 mb-3">
          <Skull size={18} className="text-horror-bloodLight" />
          <label className="text-sm text-horror-text font-semibold">延迟诅咒效果</label>
          <label className="relative inline-flex items-center cursor-pointer ml-auto">
            <input
              type="checkbox"
              checked={hasDelayedConsequence}
              onChange={(e) => handleDelayedConsequenceToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-horror-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-horror-blood"></div>
          </label>
        </div>

        {hasDelayedConsequence && card.delayedConsequence && (
          <div className="space-y-3 pl-6">
            <div>
              <label className="block text-sm text-horror-textMuted mb-1">选择诅咒</label>
              <select
                className="horror-input"
                value={card.delayedConsequence.curseId}
                onChange={(e) => handleChange('delayedConsequence', {
                  ...card.delayedConsequence!,
                  curseId: e.target.value,
                })}
              >
                {curseOptions.length === 0 ? (
                  <option value="">请先创建诅咒卡片</option>
                ) : (
                  curseOptions.map(curse => (
                    <option key={curse.id} value={curse.id}>
                      {curse.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm text-horror-textMuted mb-2">
                <Clock size={14} className="inline mr-1" />
                延迟幕数
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={card.delayedConsequence.delayScenes}
                  onChange={(e) => handleChange('delayedConsequence', {
                    ...card.delayedConsequence!,
                    delayScenes: parseInt(e.target.value),
                  })}
                  className="flex-1 h-2 bg-horror-border rounded-lg appearance-none cursor-pointer accent-horror-blood"
                />
                <span className="w-12 text-center font-gothic text-lg text-horror-bloodLight">
                  {card.delayedConsequence.delayScenes} 幕
                </span>
              </div>
              <p className="text-xs text-horror-textMuted mt-1">
                0 = 立即触发，1 = 下一幕触发，以此类推
              </p>
            </div>
          </div>
        )}
        {hasDelayedConsequence && curseOptions.length === 0 && (
          <p className="text-sm text-horror-bloodLight pl-6">
            ⚠️ 请先在画布上创建诅咒卡片
          </p>
        )}
      </div>

      <div className="pt-2 border-t border-horror-border">
        <label className="block text-sm text-horror-textMuted mb-2">连接到...</label>
        
        <div className="mb-3">
          <label className="block text-xs text-horror-textMuted mb-1">下一个场景</label>
          <select
            className="horror-input"
            value={card.nextSceneId || ''}
            onChange={(e) => handleChange('nextSceneId', e.target.value || null)}
          >
            <option value="">（不连接到场景）</option>
            {sceneOptions.map(scene => (
              <option key={scene.id} value={scene.id}>
                {scene.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-horror-textMuted mb-1">或直接连接到结局</label>
          <select
            className="horror-input"
            value={card.endingId || ''}
            onChange={(e) => handleChange('endingId', e.target.value || null)}
          >
            <option value="">（不连接到结局）</option>
            {endingOptions.map(ending => (
              <option key={ending.id} value={ending.id}>
                {ending.name}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-horror-textMuted mt-2">
          提示：你也可以在画布上使用连接功能来建立关联
        </p>
      </div>
    </div>
  );
}
