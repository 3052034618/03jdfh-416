import { AlertTriangle, CheckCircle, XCircle, MapPin, GitBranch, BookOpen, Crosshair, Route, Zap, AlertOctagon } from 'lucide-react';
import { useStoryStore } from '@/store/useStoryStore';
import type { SceneCard, ChoiceCard, EndingCard, StoryCard, CardType } from '@/types/story';

interface CompleteRoute {
  id: string;
  sceneNodes: StoryCard[];
  choiceNodes: ChoiceCard[];
  endingCard: EndingCard;
  length: number;
  scenesWithChoices: { scene: SceneCard; choice: ChoiceCard }[];
  summary: string;
}

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
    const deadEnds: { path: StoryCard[]; lastCard: StoryCard; reason: string }[] = [];
    const visitedPaths = new Set<string>();

    const traverse = (currentId: string, path: StoryCard[], visited: Set<string>) => {
      const card = cards.find(c => c.id === currentId);
      if (!card) return;

      const pathKey = [...path.map(c => c.id), currentId].join('->');
      if (visitedPaths.has(pathKey)) return;
      visitedPaths.add(pathKey);

      if (card.type === 'ending') return;
      if (visited.has(currentId)) return;

      const newVisited = new Set(visited);
      newVisited.add(currentId);
      const newPath = [...path, card];

      const outgoing = getConnectedFrom(currentId);

      if (outgoing.length === 0) {
        if (card.type === 'scene' && card.isEntry && scenes.length === 1) return;
        deadEnds.push({
          path: newPath,
          lastCard: card,
          reason: card.type === 'choice' ? '此选择没有连到下一场景或结局' : '此场景没有后续选择',
        });
        return;
      }

      const hasValidNext = outgoing.some(id => {
        const next = cards.find(c => c.id === id);
        if (!next) return false;
        if (card.type === 'scene' && next.type === 'choice') return true;
        if (card.type === 'choice' && (next.type === 'scene' || next.type === 'ending')) return true;
        return false;
      });

      if (!hasValidNext) {
        deadEnds.push({
          path: newPath,
          lastCard: card,
          reason: '后续连接类型不匹配，无法形成有效剧情路线',
        });
        return;
      }

      let foundAnyPath = false;
      outgoing.forEach(nextId => {
        const next = cards.find(c => c.id === nextId);
        if (!next) return;
        if (card.type === 'scene' && next.type !== 'choice') return;
        if (card.type === 'choice' && next.type !== 'scene' && next.type !== 'ending') return;
        foundAnyPath = true;
        traverse(nextId, newPath, newVisited);
      });

      if (!foundAnyPath) {
        deadEnds.push({
          path: newPath,
          lastCard: card,
          reason: '没有有效的后续连接',
        });
      }
    };

    traverse(entryScene.id, [], new Set());
    return deadEnds;
  };

  const deadEnds = findDeadEndPaths();
  deadEnds.forEach((de, i) => {
    const pathSummary = de.path
      .map(c => {
        if (c.type === 'scene') return (c as SceneCard).title || '场景';
        if (c.type === 'choice') return (c as ChoiceCard).text || '选择';
        return '卡片';
      })
      .join(' → ');

    issues.push({
      id: `dead-end-${i}`,
      type: 'warning',
      cardId: de.lastCard.id,
      cardType: de.lastCard.type as CardType,
      cardTitle: de.lastCard.type === 'choice'
        ? (de.lastCard as ChoiceCard).text || '未命名选择'
        : de.lastCard.type === 'scene'
          ? (de.lastCard as SceneCard).title || '未命名场景'
          : '卡片',
      message: `死路：${pathSummary || '入口'} → ❌（${de.reason}）`,
    });
  });

  const findCompleteRoutes = (): CompleteRoute[] => {
    if (!entryScene) return [];
    const routes: CompleteRoute[] = [];
    const visitedPaths = new Set<string>();

    const traverse = (
      currentId: string,
      path: StoryCard[],
      sceneChoicePairs: { scene: SceneCard; choice: ChoiceCard }[],
      lastChoice: ChoiceCard | null,
      lastScene: SceneCard | null,
    ) => {
      const card = cards.find(c => c.id === currentId);
      if (!card) return;

      const pathKey = [...path.map(c => c.id), currentId].join('->');
      if (visitedPaths.has(pathKey)) return;
      visitedPaths.add(pathKey);

      const newPath = [...path, card];

      if (card.type === 'ending') {
        const ending = card as EndingCard;
        const sceneNodes = newPath.filter(c => c.type === 'scene');
        const choiceNodes = newPath.filter(c => c.type === 'choice') as ChoiceCard[];

        const sceneSteps = sceneNodes.map((s, i) => {
          const sc = s as SceneCard;
          const choice = sceneChoicePairs.find(p => p.scene.id === sc.id);
          return `${i + 1}.${sc.title?.slice(0, 8) || '场景'}`;
        }).join(' → ');

        const summaryParts: string[] = [];
        summaryParts.push(`【${ending.endingType === 'good' ? '好结局' : ending.endingType === 'bad' ? '坏结局' : ending.endingType === 'twist' ? '反转结局' : '中性结局'}】${ending.title}`);

        if (sceneChoicePairs.length > 0) {
          const keyChoices = sceneChoicePairs
            .map((p, i) => `${i + 1})${p.scene.title?.slice(0, 6) || ''}:「${p.choice.text.slice(0, 10) || ''}」`)
            .join('→');
          summaryParts.push(`关键分支: ${keyChoices}`);
        }

        summaryParts.push(`共 ${sceneNodes.length} 幕 · ${choiceNodes.length} 次选择`);

        routes.push({
          id: `route-${routes.length}`,
          sceneNodes,
          choiceNodes,
          endingCard: ending,
          length: sceneNodes.length + choiceNodes.length,
          scenesWithChoices: sceneChoicePairs,
          summary: summaryParts.join(' · '),
        });
        return;
      }

      const outgoing = getConnectedFrom(currentId);
      if (outgoing.length === 0) return;

      if (card.type === 'scene') {
        const scene = card as SceneCard;
        outgoing.forEach(nextId => {
          const next = cards.find(c => c.id === nextId);
          if (next?.type === 'choice') {
            traverse(nextId, newPath, sceneChoicePairs, null, scene);
          }
        });
      } else if (card.type === 'choice') {
        const choice = card as ChoiceCard;
        const pairs = lastScene ? [...sceneChoicePairs, { scene: lastScene, choice }] : sceneChoicePairs;
        outgoing.forEach(nextId => {
          const next = cards.find(c => c.id === nextId);
          if (next?.type === 'scene') {
            traverse(nextId, newPath, pairs, choice, null);
          } else if (next?.type === 'ending') {
            traverse(nextId, newPath, pairs, choice, null);
          }
        });
      }
    };

    traverse(entryScene.id, [], [], null, null);
    return routes;
  };

  const completeRoutes = findCompleteRoutes();

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

        <div>
          <h4 className="text-sm font-gothic text-horror-text mb-2 flex items-center gap-2">
            <Route size={14} className="text-horror-accent" />
            完整路线摘要 ({completeRoutes.length} 条)
            {completeRoutes.length > 0 && endings.length > 0 && completeRoutes.length < endings.length && (
              <span className="text-[10px] text-yellow-400 ml-auto flex items-center gap-1">
                <AlertOctagon size={10} />
                还有 {endings.length - completeRoutes.length} 个结局未连通
              </span>
            )}
          </h4>
          {completeRoutes.length === 0 ? (
            <div className="p-3 rounded-lg bg-horror-bg border border-horror-border">
              <p className="text-xs text-horror-textMuted text-center">
                暂无可到达结局的完整路线
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {completeRoutes.map((route, idx) => (
                <div key={route.id} className="rounded-lg bg-horror-bg border border-horror-border overflow-hidden">
                  <div className="p-2.5 border-b border-horror-border/50 flex items-start gap-2">
                    <div className={`w-6 h-6 rounded shrink-0 flex items-center justify-center text-xs font-bold
                      ${route.endingCard.endingType === 'good' ? 'bg-green-500/20 text-green-400' :
                        route.endingCard.endingType === 'bad' ? 'bg-horror-blood/30 text-horror-bloodLight' :
                        route.endingCard.endingType === 'twist' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-yellow-500/20 text-yellow-400'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-horror-text font-medium leading-snug">
                        {route.summary}
                      </p>
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
                      {route.scenesWithChoices.map((pair, pi) => (
                        <div key={pi} className="flex items-center gap-1">
                          <button
                            onClick={() => handleLocate(pair.scene.id)}
                            className="px-1.5 py-0.5 rounded bg-horror-surface border border-horror-border text-horror-textMuted hover:text-horror-accent hover:border-horror-accent/50 transition-colors"
                            title={pair.scene.title}
                          >
                            {pair.scene.title?.slice(0, 5) || '场景'}
                          </button>
                          <span className="text-horror-textMuted/50">→</span>
                          <button
                            onClick={() => handleLocate(pair.choice.id)}
                            className="px-1.5 py-0.5 rounded bg-horror-surface border border-horror-border text-horror-text hover:text-horror-bloodLight hover:border-horror-blood/50 transition-colors"
                            title={pair.choice.text}
                          >
                            {pair.choice.text.slice(0, 6) || '选择'}
                          </button>
                          {pi < route.scenesWithChoices.length - 1 && (
                            <span className="text-horror-textMuted/50 mx-0.5">·</span>
                          )}
                        </div>
                      ))}
                      {route.endingCard && (
                        <div className="flex items-center gap-1">
                          <span className="text-horror-textMuted/50">→</span>
                          <button
                            onClick={() => handleLocate(route.endingCard.id)}
                            className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:border-purple-400/50 transition-colors"
                            title={route.endingCard.title}
                          >
                            {route.endingCard.title?.slice(0, 6) || '结局'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {issues.length === 0 && scenes.length > 0 && (
          <div className="text-center py-4">
            <p className="text-xs text-horror-textMuted">所有检查项通过 ✓</p>
          </div>
        )}
      </div>
    </div>
  );
}
