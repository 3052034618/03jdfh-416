import { useStoryStore } from '@/store/useStoryStore';
import SceneEditor from './SceneEditor';
import ChoiceEditor from './ChoiceEditor';
import CurseEditor from './CurseEditor';
import EndingEditor from './EndingEditor';
import type { SceneCard, ChoiceCard, CurseCard, EndingCard } from '@/types/story';

export default function PropertyPanel() {
  const { activeCardId, cards } = useStoryStore();
  const activeCard = cards.find(c => c.id === activeCardId);

  const renderEditor = () => {
    if (!activeCard) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="text-6xl mb-4">👻</div>
          <h3 className="font-gothic text-xl text-horror-text mb-2">
            选择一张卡片
          </h3>
          <p className="text-sm text-horror-textMuted">
            点击画布上的任意卡片来编辑它的内容
          </p>
          <div className="mt-6 p-4 bg-horror-bg rounded-lg border border-horror-border text-left">
            <h4 className="font-gothic text-sm text-horror-text mb-2">快速开始</h4>
            <ol className="text-xs text-horror-textMuted space-y-2 list-decimal list-inside">
              <li>从左侧拖拽"场景"卡片到画布</li>
              <li>填写场景描述和环境细节</li>
              <li>添加2-3个"选择"卡片</li>
              <li>为每个选择设置即时反馈和延迟诅咒</li>
              <li>添加"结局"卡片并设置回扣</li>
              <li>使用连接功能关联所有卡片</li>
            </ol>
          </div>
        </div>
      );
    }

    switch (activeCard.type) {
      case 'scene':
        return <SceneEditor card={activeCard as SceneCard} />;
      case 'choice':
        return <ChoiceEditor card={activeCard as ChoiceCard} />;
      case 'curse':
        return <CurseEditor card={activeCard as CurseCard} />;
      case 'ending':
        return <EndingEditor card={activeCard as EndingCard} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full p-4 overflow-y-auto">
      {renderEditor()}
    </div>
  );
}
