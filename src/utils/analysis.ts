import type {
  SceneCard,
  ChoiceCard,
  CurseCard,
  EndingCard,
  StoryCard,
  Connection,
  BranchCoverageResult,
  CurseClarityResult,
  PacingResult,
  AnalysisResult,
  RouteFearSummary,
  CurseSeverity,
} from '@/types/story';

export function calculateBranchCoverage(
  cards: StoryCard[],
  connections: Connection[],
  exploredPaths: string[][]
): BranchCoverageResult {
  const scenes = cards.filter(c => c.type === 'scene') as SceneCard[];
  const choices = cards.filter(c => c.type === 'choice') as ChoiceCard[];
  const endings = cards.filter(c => c.type === 'ending') as EndingCard[];

  if (scenes.length === 0) {
    return {
      coverage: 0,
      totalBranches: 0,
      exploredBranches: 0,
      missingBranches: [],
    };
  }

  const entryScene = scenes.find(s => s.isEntry);
  if (!entryScene) {
    return {
      coverage: 0,
      totalBranches: 0,
      exploredBranches: 0,
      missingBranches: [],
    };
  }

  const allPaths: string[][] = [];

  const traverse = (currentId: string, path: string[], visited: Set<string>) => {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    const card = cards.find(c => c.id === currentId);
    if (!card) return;

    const newPath = [...path, currentId];

    if (card.type === 'ending') {
      allPaths.push(newPath);
      return;
    }

    const nextConnections = connections.filter(c => c.from === currentId);

    if (nextConnections.length === 0) {
      const currentCard = cards.find(c => c.id === currentId);
      if (currentCard?.type === 'choice') {
        if (currentCard.nextSceneId) {
          traverse(currentCard.nextSceneId, newPath, new Set(visited));
        }
        if (currentCard.endingId) {
          traverse(currentCard.endingId, newPath, new Set(visited));
        }
      } else if (currentCard?.type === 'scene') {
        currentCard.nextChoices.forEach(choiceId => {
          traverse(choiceId, newPath, new Set(visited));
        });
      }
    } else {
      nextConnections.forEach(conn => {
        traverse(conn.to, newPath, new Set(visited));
      });
    }
  };

  traverse(entryScene.id, [], new Set());

  const pathKey = (path: string[]) => path.join('->');
  const allPathKeys = new Set(allPaths.map(pathKey));
  const exploredPathKeys = new Set(exploredPaths.map(pathKey));

  let exploredCount = 0;
  exploredPathKeys.forEach(key => {
    if (allPathKeys.has(key)) exploredCount++;
  });

  const missingBranches = allPaths.filter(
    path => !exploredPathKeys.has(pathKey(path))
  );

  const coverage = allPaths.length > 0 ? (exploredCount / allPaths.length) * 100 : 0;

  return {
    coverage: Math.round(coverage * 10) / 10,
    totalBranches: allPaths.length,
    exploredBranches: exploredCount,
    missingBranches,
  };
}

export function analyzeCurseClarity(
  curses: CurseCard[],
  choices: ChoiceCard[],
  scenes: SceneCard[]
): CurseClarityResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  if (curses.length === 0) {
    return {
      score: 0,
      consistent: false,
      issues: ['没有设置任何诅咒效果'],
      suggestions: ['至少设置一个诅咒效果来构建恐怖氛围'],
    };
  }

  curses.forEach((curse, index) => {
    if (!curse.name.trim()) {
      score -= 10;
      issues.push(`诅咒 #${index + 1} 没有命名`);
      suggestions.push(`为诅咒 #${index + 1} 添加一个令人恐惧的名字`);
    }
    if (!curse.rule.trim()) {
      score -= 15;
      issues.push(`诅咒 "${curse.name || '#' + (index + 1)}" 没有明确的规则`);
      suggestions.push(`为诅咒定义清晰的触发规则，例如"照镜子三次后触发"`);
    }
    if (!curse.triggerCondition.trim()) {
      score -= 10;
      issues.push(`诅咒 "${curse.name || '#' + (index + 1)}" 没有触发条件`);
      suggestions.push(`描述诅咒在什么情况下会被触发`);
    }
    if (!curse.visualEffect.trim()) {
      score -= 5;
      suggestions.push(`为诅咒添加视觉效果描述，增强玩家体验`);
    }
  });

  const curseIds = curses.map(c => c.id);
  const referencedCurses = new Set<string>();

  choices.forEach(choice => {
    if (choice.delayedConsequence) {
      referencedCurses.add(choice.delayedConsequence.curseId);
    }
  });

  const unusedCurses = curseIds.filter(id => !referencedCurses.has(id));
  if (unusedCurses.length > 0) {
    score -= unusedCurses.length * 8;
    issues.push(`${unusedCurses.length} 个诅咒没有被任何选择引用`);
    suggestions.push('确保每个诅咒都通过某个选择的延迟后果触发');
  }

  const hasDelayVariety = choices.some(
    c => c.delayedConsequence && c.delayedConsequence.delayScenes > 0
  );
  const hasImmediateCurse = choices.some(
    c => c.delayedConsequence && c.delayedConsequence.delayScenes === 0
  );

  if (!hasDelayVariety && choices.some(c => c.delayedConsequence)) {
    suggestions.push('尝试设置不同延迟时间的诅咒效果，例如"当场无事发生，但三幕之后镜子裂开"');
  }

  const hasRuleReversal = curses.some(c => 
    c.rule.toLowerCase().includes('反转') || 
    c.rule.toLowerCase().includes('相反') ||
    c.description.toLowerCase().includes('以为') ||
    c.description.toLowerCase().includes('但实际上')
  );

  if (!hasRuleReversal && curses.length >= 2) {
    suggestions.push('考虑加入"规则反转"元素：让玩家以为掌握了规律，但实际上规则在某处发生了变化');
  }

  const severityMap: Record<string, number> = { mild: 1, medium: 2, severe: 3 };
  const hasIncreasingSeverity = curses.length >= 2 && 
    curses.every((c, i) => i === 0 || severityMap[c.severity] >= severityMap[curses[i-1].severity]);

  if (!hasIncreasingSeverity && curses.length >= 2) {
    suggestions.push('考虑让诅咒的严重程度递增，营造逐渐升级的恐惧感');
  }

  return {
    score: Math.max(0, score),
    consistent: issues.length === 0,
    issues,
    suggestions,
  };
}

export function analyzePacing(
  scenes: SceneCard[],
  choices: ChoiceCard[],
  curses: CurseCard[],
  connections: Connection[]
): PacingResult {
  const suggestions: string[] = [];
  const pacingChart: { scene: string; intensity: number }[] = [];

  if (scenes.length < 2) {
    return {
      pacingChart: [],
      rhythm: 'too-slow',
      suggestions: ['至少需要2个场景来建立节奏'],
    };
  }

  const entryScene = scenes.find(s => s.isEntry);
  if (!entryScene) {
    return {
      pacingChart: [],
      rhythm: 'too-slow',
      suggestions: ['请设置一个入口场景'],
    };
  }

  const visited = new Set<string>();
  const sceneOrder: SceneCard[] = [];

  const buildOrder = (sceneId: string) => {
    if (visited.has(sceneId)) return;
    visited.add(sceneId);

    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;

    sceneOrder.push(scene);

    scene.nextChoices.forEach(choiceId => {
      const choice = choices.find(c => c.id === choiceId);
      if (choice?.nextSceneId) {
        buildOrder(choice.nextSceneId);
      }
    });

    connections
      .filter(c => c.from === sceneId)
      .forEach(c => {
        const targetCard = scenes.find(s => s.id === c.to);
        if (targetCard) {
          buildOrder(c.to);
        }
      });
  };

  buildOrder(entryScene.id);

  const curseIdToSeverity: Record<string, number> = {
    mild: 1,
    medium: 2,
    severe: 3,
  };

  sceneOrder.forEach((scene, index) => {
    let intensity = 1;

    if (scene.atmosphere.toLowerCase().includes('恐怖') || 
        scene.atmosphere.toLowerCase().includes('压抑') ||
        scene.atmosphere.toLowerCase().includes('诡异')) {
      intensity += 1;
    }

    scene.nextChoices.forEach(choiceId => {
      const choice = choices.find(c => c.id === choiceId);
      if (choice?.delayedConsequence) {
        const curse = curses.find(c => c.id === choice.delayedConsequence!.curseId);
        if (curse) {
          intensity += curseIdToSeverity[curse.severity] * 0.5;
        }
      }
      if (choice && choice.cost > 0) {
        intensity += choice.cost * 0.3;
      }
    });

    if (scene.hasRedHerring) {
      intensity += 0.5;
    }

    if (index === 0) {
      intensity = Math.min(2, intensity);
    }

    pacingChart.push({
      scene: scene.title || `场景 ${index + 1}`,
      intensity: Math.min(5, Math.max(1, intensity)),
    });
  });

  let rhythm: 'too-fast' | 'too-slow' | 'well-paced' = 'well-paced';

  if (pacingChart.length >= 3) {
    const firstHalf = pacingChart.slice(0, Math.ceil(pacingChart.length / 2));
    const secondHalf = pacingChart.slice(Math.ceil(pacingChart.length / 2));

    const firstHalfAvg = firstHalf.reduce((sum, p) => sum + p.intensity, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, p) => sum + p.intensity, 0) / secondHalf.length;

    if (firstHalfAvg >= 3.5 && secondHalfAvg <= firstHalfAvg) {
      rhythm = 'too-fast';
      suggestions.push('开局强度太高，建议在开头先营造氛围，让恐惧逐渐升级');
    } else if (secondHalfAvg <= 2 && pacingChart.length >= 4) {
      rhythm = 'too-slow';
      suggestions.push('后半段节奏太慢，需要在结尾处增加更强的恐惧点');
    } else if (secondHalfAvg > firstHalfAvg) {
      suggestions.push('很好！恐惧强度呈上升趋势，这是经典的恐怖叙事节奏');
    }
  }

  const intensities = pacingChart.map(p => p.intensity);
  const hasVariation = new Set(intensities).size > 1;

  if (!hasVariation && pacingChart.length > 2) {
    suggestions.push('恐惧强度缺少变化，尝试在平稳的段落中插入高强度的惊吓点');
  }

  const hasPeak = intensities.some((i, idx) => 
    idx > 0 && idx < intensities.length - 1 &&
    i > intensities[idx - 1] && i > intensities[idx + 1]
  );

  if (!hasPeak && pacingChart.length >= 4) {
    suggestions.push('考虑在故事中段设置一个"伪高潮"，让玩家放松警惕后再迎来真正的结局');
  }

  return {
    pacingChart,
    rhythm,
    suggestions,
  };
}

export function analyzeNarrativeElements(
  cards: StoryCard[],
  choices: ChoiceCard[]
): { redHerring: boolean; increasingCost: boolean; ruleReversal: boolean; callback: boolean; hints: string[] } {
  const hints: string[] = [];

  const scenes = cards.filter(c => c.type === 'scene') as SceneCard[];
  const endings = cards.filter(c => c.type === 'ending') as EndingCard[];
  const curses = cards.filter(c => c.type === 'curse') as CurseCard[];

  const redHerring = scenes.some(s => s.hasRedHerring && s.redHerringText.trim().length > 0);
  if (!redHerring) {
    hints.push('💡 误导线索：尝试加入一些看起来重要但实际上无关的线索，迷惑玩家的判断');
  }

  const costs = choices.map(c => c.cost).filter(c => c > 0);
  const increasingCost = costs.length >= 2 && 
    costs.every((c, i) => i === 0 || c >= costs[i - 1]);

  if (!increasingCost && choices.length >= 2) {
    hints.push('💸 代价递增：让选择的代价逐渐升高，每个选择都比前一个更难以抉择');
  }

  const ruleReversal = curses.some(c => 
    c.rule.toLowerCase().includes('反转') || 
    c.rule.toLowerCase().includes('相反') ||
    c.description.toLowerCase().includes('但实际上') ||
    c.description.toLowerCase().includes('然而')
  );
  if (!ruleReversal) {
    hints.push('🔄 规则反转：在玩家以为掌握了诅咒规律时，突然改变规则，打破安全感');
  }

  const callback = endings.some(e => e.callback.trim().length > 0);
  if (!callback) {
    hints.push('🎯 结局回扣：让结局呼应开头的某个细节，产生"原来如此"的冲击感');
  }

  return {
    redHerring,
    increasingCost,
    ruleReversal,
    callback,
    hints,
  };
}

export function analyzeRouteFearSummaries(
  cards: StoryCard[],
  connections: Connection[]
): RouteFearSummary[] {
  const scenes = cards.filter(c => c.type === 'scene') as SceneCard[];
  const choices = cards.filter(c => c.type === 'choice') as ChoiceCard[];
  const curses = cards.filter(c => c.type === 'curse') as CurseCard[];
  const endings = cards.filter(c => c.type === 'ending') as EndingCard[];

  const entryScene = scenes.find(s => s.isEntry);
  if (!entryScene) return [];

  const getNextIds = (cardId: string) => connections.filter(c => c.from === cardId).map(c => c.to);

  const allRoutes: {
    choices: ChoiceCard[];
    ending: EndingCard | null;
  }[] = [];

  const traverse = (
    currentId: string,
    visited: Set<string>,
    routeChoices: ChoiceCard[]
  ) => {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    const card = cards.find(c => c.id === currentId);
    if (!card) return;

    if (card.type === 'choice') {
      const choice = card as ChoiceCard;
      const newChoices = [...routeChoices, choice];
      const nextIds = getNextIds(choice.id);

      if (nextIds.length === 0) {
        allRoutes.push({ choices: newChoices, ending: null });
        return;
      }

      nextIds.forEach(nextId => {
        traverse(nextId, new Set(visited), newChoices);
      });
      return;
    }

    if (card.type === 'ending') {
      allRoutes.push({ choices: routeChoices, ending: card as EndingCard });
      return;
    }

    const nextIds = getNextIds(currentId);
    if (nextIds.length === 0 && card.type === 'scene') {
      if (routeChoices.length > 0) {
        allRoutes.push({ choices: routeChoices, ending: null });
      }
      return;
    }

    nextIds.forEach(nextId => {
      traverse(nextId, new Set(visited), routeChoices);
    });
  };

  const firstChoices = getNextIds(entryScene.id);
  firstChoices.forEach(choiceId => {
    traverse(choiceId, new Set([entryScene.id]), []);
  });

  return allRoutes.map((route, index) => {
    const totalCost = route.choices.reduce((sum, c) => sum + c.cost, 0);

    const triggeredCurses: { name: string; severity: CurseSeverity; rule: string }[] = [];
    route.choices.forEach(choice => {
      if (choice.delayedConsequence) {
        const curse = curses.find(c => c.id === choice.delayedConsequence!.curseId);
        if (curse) {
          triggeredCurses.push({
            name: curse.name,
            severity: curse.severity,
            rule: curse.rule,
          });
        }
      }
    });

    const hasCallback = !!(route.ending && route.ending.callback?.trim());
    const callbackText = route.ending?.callback || '';

    let fearMeaningScore = 0;
    const notes: string[] = [];

    if (totalCost > 0) {
      fearMeaningScore += Math.min(30, totalCost * 10);
    } else {
      notes.push('此路线无选择代价');
    }

    if (triggeredCurses.length > 0) {
      fearMeaningScore += triggeredCurses.length * 15;
      const hasSevere = triggeredCurses.some(c => c.severity === 'severe');
      if (hasSevere) fearMeaningScore += 10;
    } else {
      notes.push('此路线未触发任何诅咒');
    }

    if (hasCallback) {
      fearMeaningScore += 20;
    } else {
      notes.push('结局缺少回扣');
    }

    if (route.ending?.endingType === 'bad' || route.ending?.endingType === 'twist') {
      fearMeaningScore += 10;
    }

    const choiceTexts = route.choices.map(c => c.text || '未命名选择');
    const pathLabel = choiceTexts.length > 0
      ? choiceTexts.map(t => t.length > 10 ? t.slice(0, 10) + '…' : t).join(' → ')
      : `路线 ${index + 1}`;

    let fearNote = '';
    if (fearMeaningScore >= 70) {
      fearNote = '恐惧意义丰富：代价、诅咒与结局回扣形成完整的恐惧体验';
    } else if (fearMeaningScore >= 40) {
      fearNote = '有一定恐惧意义，但' + (notes.length > 0 ? notes[0] : '仍可加强');
    } else {
      fearNote = '恐惧意义不足：' + (notes.length > 0 ? notes.join('，') : '需要增加恐怖元素');
    }

    return {
      pathLabel,
      choiceTexts,
      totalCost,
      triggeredCurses,
      endingTitle: route.ending?.title || null,
      endingType: route.ending?.endingType || null,
      hasCallback,
      callbackText,
      fearMeaningScore: Math.min(100, fearMeaningScore),
      fearMeaningNote: fearNote,
    };
  });
}

export function runFullAnalysis(
  cards: StoryCard[],
  connections: Connection[],
  exploredPaths: string[][]
): AnalysisResult {
  const scenes = cards.filter(c => c.type === 'scene') as SceneCard[];
  const choices = cards.filter(c => c.type === 'choice') as ChoiceCard[];
  const curses = cards.filter(c => c.type === 'curse') as CurseCard[];

  const branchCoverage = calculateBranchCoverage(cards, connections, exploredPaths);
  const curseClarity = analyzeCurseClarity(curses, choices, scenes);
  const pacing = analyzePacing(scenes, choices, curses, connections);
  const routeFearSummaries = analyzeRouteFearSummaries(cards, connections);

  const overallFeedback: string[] = [];

  if (branchCoverage.coverage < 50) {
    overallFeedback.push('📊 分支探索度较低，鼓励同学们探索更多路线');
  } else if (branchCoverage.coverage >= 80) {
    overallFeedback.push('📊 分支探索度很好！同学们体验了大部分剧情');
  }

  if (curseClarity.score >= 80) {
    overallFeedback.push('📜 诅咒规则设定清晰，玩家能理解恐惧的来源');
  }

  if (pacing.rhythm === 'well-paced') {
    overallFeedback.push('⏱️ 故事节奏把控良好，恐惧感循序渐进');
  }

  if (scenes.length < 3) {
    overallFeedback.push('💡 建议增加更多场景，让剧情有足够的展开空间');
  }

  if (choices.length < 2) {
    overallFeedback.push('💡 至少设置2-3个选择，让玩家感受到分支的意义');
  }

  const narrativeCheck = analyzeNarrativeElements(cards, choices);
  if (narrativeCheck.redHerring && narrativeCheck.increasingCost && 
      narrativeCheck.ruleReversal && narrativeCheck.callback) {
    overallFeedback.push('🏆 四大叙事要素齐全！这是一个结构完整的恐怖叙事');
  }

  const lowFearRoutes = routeFearSummaries.filter(r => r.fearMeaningScore < 40);
  if (lowFearRoutes.length > 0) {
    overallFeedback.push(`⚠️ ${lowFearRoutes.length} 条路线的恐惧意义不足，建议增加代价、诅咒或结局回扣`);
  }

  return {
    branchCoverage,
    curseClarity,
    pacing,
    routeFearSummaries,
    overallFeedback,
  };
}
