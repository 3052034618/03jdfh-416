import { AlertTriangle, CheckCircle, XCircle, MapPin, GitBranch, BookOpen, Crosshair } from 'lucide-react';
import { useStoryStore } from '@/store/useStoryStore';
import type { SceneCard, ChoiceCard, EndingCard, StoryCard, CardType } from '@/types/story';

interface StructureIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  cardId: string;
  cardType: CardType;
  cardTitle: string;
  message: string;
}

export default function StructureCheck() {
  const { cards, connections, setActiveCard } = useStoryStore();

  const getConnectedFrom = (cardId: string) => connections.filter(c => c.from === cardId).map(c => c.to);
  const getConnectedTo = (cardId: string) => connections.filter(c => c.to === cardId).map(c => c.from);

  const issues: StructureIssue[] = [];

  const scenes = cards.filter(c => c.type === 'scene') as SceneCard[];
  const choices = cards.filter(c => c.type === 'choice') as ChoiceCard[];
  const endings = cards.filter(c => c.type === 'ending') as EndingCard[];

  const entryScene = scenes.find(s => s.isEntry);
  if (!entryScene) {
    if (scenes.length > 0) {
      issues.push({
        id: 'no-entry',
        type: 'error',
        cardId: scenes[0].id,
        cardType: 'scene',
        cardTitle: scenes[0].title || '未命名场景',
        message: '没有设置入口场景，请在某个场景上勾选"入口场景"',
      });
    } else {
      issues.push({
        id: 'no-scenes',
        type: 'error',
        cardId: '',
        cardType: 'scene',
        cardTitle: '',
        message: '没有任何场景卡片，请先添加场景',
      });
    }
  }

  scenes.forEach(scene => {
    const outgoingChoices = getConnectedFrom(scene.id).filter(id => {
      const card = cards.find(c => c.id === id);
      return card?.type === 'choice';
    });

    if (scene.isEntry && outgoingChoices.length === 0 && scenes.length > 1) {
      issues.push({
        id: `scene-no-choices-${scene.id}`,
        type: 'warning',
        cardId: scene.id,
        cardType: 'scene',
        cardTitle: scene.title || '未命名场景',
        message: `入口场景没有任何选择连接，玩家无法继续`,
      });
    } else if (!scene.isEntry && outgoingChoices.length === 0 && !getConnectedTo(scene.id).some(id => {
      const c = cards.find(cc => cc.id === id);
      return c?.type === 'choice';
    })) {
    } else if (!scene.isEntry && outgoingChoices.length === 0 && scenes.length > 1) {
      issues.push({
        id: `scene-no-choices-${scene.id}`,
        type: 'info',
        cardId: scene.id,
        cardType: 'scene',
        cardTitle: scene.title || '未命名场景',
        message: '此场景没有连接选择卡片（如果是终端场景可忽略）',
      });
    }
  });

  choices.forEach(choice => {
    const incoming = getConnectedTo(choice.id);
    if (incoming.length === 0) {
      issues.push({
        id: `choice-disconnected-${choice.id}`,
        type: 'error',
        cardId: choice.id,
        cardType: 'choice',
        cardTitle: choice.text || '未命名选择',
        message: '此选择没有连接到任何场景（断开的选择）',
      });
    }

    const outgoing = getConnectedFrom(choice.id);
    const hasSceneTarget = outgoing.some(id => cards.find(c => c.id === id)?.type === 'scene');
    const hasEndingTarget = outgoing.some(id => cards.find(c => c.id === id)?.type === 'ending');

    if (!hasSceneTarget && !hasEndingTarget) {
      issues.push({
        id: `choice-no-target-${choice.id}`,
        type: 'error',
        cardId: choice.id,
        cardType: 'choice',
        cardTitle: choice.text || '未命名选择',
        message: '此选择没有连接到场景或结局（死路）',
      });
    }
  });

  endings.forEach(ending => {
    const incoming = getConnectedTo(ending.id);
    if (incoming.length === 0) {
      issues.push({
        id: `ending-orphan-${ending.id}`,
        type: 'warning',
        cardId: ending.id,
        cardType: 'ending',
        cardTitle: ending.title || '未命名结局',
        message: '此结局没有被任何选择连接（孤立结局）',
      });
    }

    if (!ending.callback || ending.callback.trim() === '') {
      issues.push({
        id: `ending-no-callback-${ending.id}`,
        type: 'info',
        cardId: ending.id,
        cardType: 'ending',
        cardTitle: ending.title || '未命名结局',
        message: '此结局没有设置"结局回扣"，建议呼应前面的伏笔',
      });
    }
  });

  const findDeadEndPaths = () => {
    if (!entryScene) return [];
    const deadEnds: { path: string[]; lastCard: StoryCard }[] = [];

    const traverse = (currentId: string, path: string[], visited: Set<string>) => {
      if (visited.has(currentId)) return;
      visited.add(currentId);
      const newPath = [...path, currentId];
      const card = cards.find(c => c.id === currentId);
      if (!card) return;

      const outgoing = getConnectedFrom(currentId);
      const nextTargets = outgoing.filter(id => {
        const c = cards.find(cc => cc.id === id);
        return c?.type === 'scene' || c?.type === 'ending';
      });

      if (card.type === 'ending') return;
      if (nextTargets.length === 0) {
        const choiceOutgoing = outgoing.filter(id => cards.find(c => c.id === id)?.type === 'choice');
        if (choiceOutgoing.length === 0) {
          deadEnds.push({ path: newPath, lastCard: card });
        } else {
          choiceOutgoing.forEach(choiceId => {
            const choiceOut = getConnectedFrom(choiceId);
            const hasEnd = choiceOut.some(id => {
              const c = cards.find(cc => cc.id === id);
              return c?.type === 'scene' || c?.type === 'ending';
            });
            if (!hasEnd) {
              const choiceCard = cards.find(c => c.id === choiceId);
              deadEnds.push({ path: [...newPath, choiceId], lastCard: choiceCard! });
            }
          });
        }
        return;
      }

      outgoing.forEach(nextId => {
        traverse(nextId, newPath, new Set(visited));
      });
    };

    traverse(entryScene.id, [], new Set());
    return deadEnds;
  };

  const deadEnds = findDeadEndPaths();
  deadEnds.forEach((de, i) => {
    issues.push({
      id: `dead-end-${i}`,
      type: 'warning',
      cardId: de.lastCard.id,
      cardType: de.lastCard.type as CardType,
      cardTitle: de.lastCard.type === 'choice' ? (de.lastCard as ChoiceCard).text || '未命名选择' : de.lastCard.type === 'scene' ? (de.lastCard as SceneCard).title || '未命名场景' : '卡片',
      message: `路线未能到达结局，最终停在"${de.lastCard.type === 'choice' ? (de.lastCard as ChoiceCard).text?.slice(0, 20) : de.lastCard.type === 'scene' ? (de.lastCard as SceneCard).title : '卡片'}"`,
    });
  });

  const handleLocate = (cardId: string) => {
    setActiveCard(cardId);
    const el = document.getElementById(`card-${cardId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      el.classList.add('animate-pulse');
      setTimeout(() => el.classList.remove('animate-pulse'), 2000);
    }
  };

  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  const infos = issues.filter(i => i.type === 'info');

  const typeIcon: Record<CardType, typeof MapPin> = {
    scene: MapPin,
    choice: GitBranch,
    ending: BookOpen,
    curse: Crosshair,
  };

  const typeLabel: Record<CardType, string> = {
    scene: '场景',
    choice: '选择',
    ending: '结局',
    curse: '诅咒',
  };

  const renderIssueGroup = (title: string, items: StructureIssue[], icon: typeof AlertTriangle, colorClass: string) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <h4 className={`text-sm font-gothic mb-2 flex items-center gap-2 ${colorClass}`}>
          {icon({ size: 14 })}
          {title} ({items.length})
        </h4>
        <div className="space-y-1.5">
          {items.map(issue => {
            const Icon = typeIcon[issue.cardType];
            return (
              <button
                key={issue.id}
                onClick={() => issue.cardId && handleLocate(issue.cardId)}
                disabled={!issue.cardId}
                className={`w-full text-left p-2.5 rounded-lg border transition-all duration-200
                  ${issue.cardId ? 'border-horror-border hover:border-horror-accent hover:bg-horror-accent/5 cursor-pointer' : 'border-horror-border/50 cursor-default'}`}
              >
                <div className="flex items-start gap-2">
                  <Icon size={14} className="text-horror-textMuted mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-horror-text font-medium truncate">
                      {issue.cardTitle || typeLabel[issue.cardType]}
                    </p>
                    <p className="text-xs text-horror-textMuted mt-0.5 leading-relaxed">
                      {issue.message}
                    </p>
                  </div>
                  {issue.cardId && (
                    <span className="text-[10px] text-horror-accent shrink-0">定位 →</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const sceneStats = scenes.map(scene => {
    const choiceCount = getConnectedFrom(scene.id).filter(id => cards.find(c => c.id === id)?.type === 'choice').length;
    return { scene, choiceCount };
  });

  const isReadyForDisplay = errors.length === 0;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-horror-border">
        <h3 className="font-gothic text-lg text-horror-text flex items-center gap-2">
          <Crosshair size={18} className="text-horror-accent" />
          章节结构检查
        </h3>
        <p className="text-xs text-horror-textMuted mt-1">切到课堂展示前，检查剧情结构是否完整</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isReadyForDisplay ? (
          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-400" />
            <p className="text-sm text-green-400">结构完整，可以进入课堂展示！</p>
          </div>
        ) : (
          <div className="p-3 bg-horror-blood/10 rounded-lg border border-horror-blood/30 flex items-center gap-2">
            <XCircle size={18} className="text-horror-bloodLight" />
            <p className="text-sm text-horror-bloodLight">存在结构性问题，请修复后再展示</p>
          </div>
        )}

        <div>
          <h4 className="text-sm font-gothic text-horror-text mb-2">场景概览</h4>
          <div className="space-y-1.5">
            {sceneStats.map(({ scene, choiceCount }) => (
              <button
                key={scene.id}
                onClick={() => handleLocate(scene.id)}
                className="w-full text-left p-2 bg-horror-bg rounded-lg border border-horror-border hover:border-horror-accent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-horror-text truncate flex items-center gap-1.5">
                    <MapPin size={12} className={scene.isEntry ? 'text-horror-accent' : 'text-horror-textMuted'} />
                    {scene.isEntry && <span className="text-horror-accent text-[10px]">入口</span>}
                    {scene.title || '未命名'}
                  </span>
                  <span className={`text-xs font-gothic ${choiceCount === 0 ? 'text-horror-bloodLight' : choiceCount >= 2 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {choiceCount} 选择
                  </span>
                </div>
              </button>
            ))}
            {scenes.length === 0 && (
              <p className="text-xs text-horror-textMuted text-center py-2">暂无场景</p>
            )}
          </div>
        </div>

        {renderIssueGroup('错误', errors, XCircle, 'text-horror-bloodLight')}
        {renderIssueGroup('警告', warnings, AlertTriangle, 'text-yellow-400')}
        {renderIssueGroup('建议', infos, CheckCircle, 'text-horror-textMuted')}

        {issues.length === 0 && scenes.length > 0 && (
          <div className="text-center py-4">
            <p className="text-xs text-horror-textMuted">所有检查项通过 ✓</p>
          </div>
        )}
      </div>
    </div>
  );
}
