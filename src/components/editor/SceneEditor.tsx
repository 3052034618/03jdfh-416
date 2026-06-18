import { MapPin, Link2, XCircle } from 'lucide-react';
import { useStoryStore } from '@/store/useStoryStore';
import type { SceneCard } from '@/types/story';

function SceneConnectionStatus({ cardId }: { cardId: string }) {
  const { connections, cards, removeConnection } = useStoryStore();
  const outgoing = connections.filter(c => c.from === cardId);

  if (outgoing.length === 0) {
    return (
      <div className="p-2 bg-horror-bg rounded-lg border border-horror-border text-center">
        <p className="text-xs text-horror-bloodLight">未连接到任何选择卡片</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {outgoing.map((conn, index) => {
        const target = cards.find(c => c.id === conn.to);
        if (!target) return null;
        const typeLabel = target.type === 'choice' ? '选择' : target.type === 'scene' ? '场景' : target.type;
        const title = target.type === 'choice' ? (target as { text: string }).text :
                      target.type === 'scene' ? (target as { title: string }).title :
                      target.type === 'ending' ? (target as { title: string }).title :
                      (target as { name: string }).name;
        return (
          <div key={conn.to} className="flex items-center gap-2 p-2 bg-horror-bg rounded-lg border border-horror-border">
            <Link2 size={12} className="text-horror-accent" />
            <span className="text-xs text-horror-textMuted">{typeLabel} {index + 1}：</span>
            <span className="text-xs text-horror-text flex-1 truncate">{title || '未命名'}</span>
            <button
              onClick={() => removeConnection(cardId, conn.to)}
              className="p-0.5 hover:bg-horror-blood/20 rounded transition-colors"
              title="断开连接"
            >
              <XCircle size={12} className="text-horror-textMuted hover:text-horror-bloodLight" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

interface SceneEditorProps {
  card: SceneCard;
}

export default function SceneEditor({ card }: SceneEditorProps) {
  const { updateCard } = useStoryStore();

  const handleChange = (field: keyof SceneCard, value: string | boolean | string[]) => {
    updateCard(card.id, { [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-horror-border">
        <div className="p-2 rounded-lg bg-gradient-to-br from-horror-blue to-horror-purple">
          <MapPin size={20} className="text-white" />
        </div>
        <h3 className="font-gothic text-lg text-horror-text">场景编辑</h3>
      </div>

      <div>
        <label className="block text-sm text-horror-textMuted mb-1">场景标题</label>
        <input
          type="text"
          className="horror-input"
          value={card.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="例如：鬼屋入口"
        />
      </div>

      <div>
        <label className="block text-sm text-horror-textMuted mb-1">场景描述</label>
        <textarea
          className="horror-textarea"
          value={card.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="描述玩家在这个场景中看到的主要内容..."
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm text-horror-textMuted mb-1">环境细节</label>
        <textarea
          className="horror-textarea"
          value={card.environmentDetails}
          onChange={(e) => handleChange('environmentDetails', e.target.value)}
          placeholder="气味、声音、触感等感官细节..."
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm text-horror-textMuted mb-1">氛围</label>
        <input
          type="text"
          className="horror-input"
          value={card.atmosphere}
          onChange={(e) => handleChange('atmosphere', e.target.value)}
          placeholder="例如：压抑、诡异、未知"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isEntry"
          checked={card.isEntry}
          onChange={(e) => handleChange('isEntry', e.target.checked)}
          className="w-4 h-4 rounded border-horror-border bg-horror-bg text-horror-blood focus:ring-horror-blood"
        />
        <label htmlFor="isEntry" className="text-sm text-horror-text">
          设为入口场景（故事开始的地方）
        </label>
      </div>

      <div className="pt-2 border-t border-horror-border">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="hasRedHerring"
            checked={card.hasRedHerring}
            onChange={(e) => handleChange('hasRedHerring', e.target.checked)}
            className="w-4 h-4 rounded border-horror-border bg-horror-bg text-horror-blood focus:ring-horror-blood"
          />
          <label htmlFor="hasRedHerring" className="text-sm text-horror-text font-semibold">
            💡 添加误导线索
          </label>
        </div>
        {card.hasRedHerring && (
          <textarea
            className="horror-textarea"
            value={card.redHerringText}
            onChange={(e) => handleChange('redHerringText', e.target.value)}
            placeholder="描述一个看似重要但实际上无关的线索..."
            rows={2}
          />
        )}
        <p className="text-xs text-horror-textMuted mt-2">
          误导线索是恐怖叙事的重要元素，用来迷惑玩家的判断
        </p>
      </div>

      <div className="pt-2 border-t border-horror-border">
        <label className="block text-sm text-horror-text font-semibold mb-2">连线目标</label>
        <SceneConnectionStatus cardId={card.id} />
        <p className="text-xs text-horror-textMuted mt-2">
          💡 在画布上点击此卡片的 🔗 按钮，再点击选择卡片即可建立连接
        </p>
      </div>
    </div>
  );
}
