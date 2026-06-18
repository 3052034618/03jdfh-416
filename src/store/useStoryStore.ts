import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  StoryCard,
  SceneCard,
  ChoiceCard,
  CurseCard,
  EndingCard,
  Connection,
  StoryState,
  Mode,
  VoteRecord,
  VoteRound,
  VoteRoundOption,
  ChoiceSource,
  ClassroomPath,
  PathStep,
} from '@/types/story';
import {
  createEmptyScene,
  createEmptyChoice,
  createEmptyCurse,
  createEmptyEnding,
  generateId,
} from '@/types/story';
import { analyzeNarrativeElements } from '@/utils/analysis';

const makeInitialState = (): StoryState => ({
  cards: [],
  connections: [],
  narrativeElements: {
    redHerring: false,
    increasingCost: false,
    ruleReversal: false,
    callback: false,
    hints: [],
  },
  votes: {},
  exploredPaths: [],
  currentPath: [],
  classroomPaths: [],
  currentClassroomPath: null,
  voteRounds: [],
  currentVoteRoundId: null,
  activeCardId: null,
  mode: 'edit',
  votingEnabled: false,
  currentSceneIndex: 0,
  activeCurses: [],
});

const initialState = makeInitialState();

interface StoryActions {
  addCard: (type: 'scene' | 'choice' | 'curse' | 'ending', x: number, y: number) => void;
  updateCard: (id: string, updates: Partial<StoryCard>) => void;
  deleteCard: (id: string) => void;
  moveCard: (id: string, x: number, y: number) => void;
  setActiveCard: (id: string | null) => void;
  addConnection: (from: string, to: string) => void;
  removeConnection: (from: string, to: string) => void;
  setMode: (mode: Mode) => void;
  updateNarrativeElements: () => void;
  resetDisplay: () => void;
  addToCurrentPath: (cardId: string, source?: ChoiceSource, voteRoundId?: string) => void;
  saveCurrentPath: () => void;
  castVote: (choiceId: string, voterId: string) => boolean;
  hasVoterInCurrentRound: (voterId: string) => boolean;
  startVoteRound: (sceneId: string, sceneTitle: string, choices: ChoiceCard[]) => void;
  closeVoteRound: () => { choiceId: string; text: string } | null;
  setVotingEnabled: (enabled: boolean) => void;
  resetVotes: () => void;
  resetVoteRounds: () => void;
  triggerCurse: (curseId: string) => void;
  clearActiveCurses: () => void;
  resetAll: () => void;
  loadDemoStory: () => void;
  importStory: (data: Partial<StoryState>) => void;
  deleteClassroomPath: (id: string) => void;
  resetClassroomPaths: () => void;
}

export const useStoryStore = create<StoryState & StoryActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      addCard: (type, x, y) => {
        const id = generateId();
        let newCard: StoryCard;
        switch (type) {
          case 'scene':
            newCard = createEmptyScene(id, x, y);
            const scenes = get().cards.filter(c => c.type === 'scene');
            if (scenes.length === 0) {
              (newCard as SceneCard).isEntry = true;
            }
            break;
          case 'choice':
            newCard = createEmptyChoice(id, x, y);
            break;
          case 'curse':
            newCard = createEmptyCurse(id, x, y);
            break;
          case 'ending':
            newCard = createEmptyEnding(id, x, y);
            break;
          default:
            return;
        }
        set(state => ({ cards: [...state.cards, newCard] }));
        get().updateNarrativeElements();
      },

      updateCard: (id, updates) => {
        set(state => ({
          cards: state.cards.map(card =>
            card.id === id ? { ...card, ...updates } as StoryCard : card
          ),
        }));

        const card = get().cards.find(c => c.id === id);
        if (card?.type === 'scene' && (updates as Partial<SceneCard>).isEntry) {
          set(state => ({
            cards: state.cards.map(c =>
              c.type === 'scene' && c.id !== id
                ? { ...c, isEntry: false }
                : c
            ),
          }));
        }
        get().updateNarrativeElements();
      },

      deleteCard: (id) => {
        set(state => ({
          cards: state.cards.filter(c => c.id !== id),
          connections: state.connections.filter(
            c => c.from !== id && c.to !== id
          ),
          activeCardId: state.activeCardId === id ? null : state.activeCardId,
        }));
        get().updateNarrativeElements();
      },

      moveCard: (id, x, y) => {
        set(state => ({
          cards: state.cards.map(card =>
            card.id === id ? { ...card, x, y } : card
          ),
        }));
      },

      setActiveCard: (id) => {
        set({ activeCardId: id });
      },

      addConnection: (from, to) => {
        const exists = get().connections.some(
          c => c.from === from && c.to === to
        );
        if (!exists) {
          set(state => ({
            connections: [...state.connections, { from, to }],
          }));
        }
      },

      removeConnection: (from, to) => {
        set(state => ({
          connections: state.connections.filter(
            c => !(c.from === from && c.to === to)
          ),
        }));
      },

      setMode: (mode) => {
        set({ mode });
        if (mode === 'display') {
          get().resetDisplay();
        }
      },

      updateNarrativeElements: () => {
        const { cards } = get();
        const choices = cards.filter(c => c.type === 'choice') as ChoiceCard[];
        const result = analyzeNarrativeElements(cards, choices);
        set({ narrativeElements: result });
      },

      resetDisplay: () => {
        const entryScene = get().cards.find(
          c => c.type === 'scene' && (c as SceneCard).isEntry
        );
        const cardTitles: Record<string, string> = {};
        if (entryScene) {
          cardTitles[entryScene.id] = (entryScene as SceneCard).title || '入口';
        }
        set({
          currentPath: entryScene ? [entryScene.id] : [],
          currentSceneIndex: 0,
          activeCurses: [],
          votes: {},
          votingEnabled: false,
          currentVoteRoundId: null,
          currentClassroomPath: entryScene ? {
            id: generateId(),
            steps: [{ cardId: entryScene.id, source: 'manual' } as PathStep],
            cardTitles,
            endingTitle: null,
            endingId: null,
            startedAt: Date.now(),
            completedAt: 0,
          } : null,
        });
      },

      addToCurrentPath: (cardId, source = 'manual', voteRoundId) => {
        const card = get().cards.find(c => c.id === cardId);
        const titles: Record<string, string> = {};
        if (card?.type === 'scene') titles[cardId] = (card as SceneCard).title;
        else if (card?.type === 'choice') titles[cardId] = (card as ChoiceCard).text;
        else if (card?.type === 'ending') titles[cardId] = (card as EndingCard).title;

        set(state => {
          const newCurrent = [...state.currentPath, cardId];
          const prevPath = state.currentClassroomPath;
          const newStep: PathStep = { cardId, source };
          if (voteRoundId) newStep.voteRoundId = voteRoundId;

          let newClassroomPath: ClassroomPath | null = prevPath;
          if (prevPath) {
            newClassroomPath = {
              ...prevPath,
              steps: [...prevPath.steps, newStep],
              cardTitles: { ...prevPath.cardTitles, ...titles },
              ...(card?.type === 'ending' ? {
                endingId: cardId,
                endingTitle: (card as EndingCard).title,
                completedAt: Date.now(),
              } : {}),
            };
          }

          return {
            currentPath: newCurrent,
            currentSceneIndex: state.currentSceneIndex + 1,
            currentClassroomPath: newClassroomPath,
          };
        });

        if (card?.type === 'choice') {
          const choice = card as ChoiceCard;
          if (choice.delayedConsequence) {
            const triggerScene = get().currentSceneIndex + choice.delayedConsequence.delayScenes;
            set(state => ({
              activeCurses: [
                ...state.activeCurses,
                { curseId: choice.delayedConsequence!.curseId, triggerScene },
              ],
            }));
          }
        }
      },

      saveCurrentPath: () => {
        const { currentPath, exploredPaths, currentClassroomPath, classroomPaths } = get();
        if (currentPath.length > 0) {
          const pathKey = currentPath.join('->');
          const exists = exploredPaths.some(p => p.join('->') === pathKey);
          const stateUpdates: Partial<StoryState> = {};
          if (!exists) {
            stateUpdates.exploredPaths = [...exploredPaths, currentPath];
          }
          if (currentClassroomPath && !classroomPaths.some(p => p.id === currentClassroomPath.id)) {
            const finished: ClassroomPath = currentClassroomPath.completedAt > 0
              ? currentClassroomPath
              : { ...currentClassroomPath, completedAt: Date.now() };
            stateUpdates.classroomPaths = [...classroomPaths, finished];
          }
          if (Object.keys(stateUpdates).length > 0) {
            set(stateUpdates);
          }
        }
      },

      hasVoterInCurrentRound: (voterId) => {
        const { votes } = get();
        return Object.values(votes).some(vr => vr.voters.includes(voterId));
      },

      castVote: (choiceId, voterId) => {
        const trimmed = voterId.trim();
        if (!trimmed) return false;
        if (get().hasVoterInCurrentRound(trimmed)) return false;

        set(state => {
          const existingVote = state.votes[choiceId];
          if (existingVote) {
            return {
              votes: {
                ...state.votes,
                [choiceId]: {
                  ...existingVote,
                  count: existingVote.count + 1,
                  voters: [...existingVote.voters, trimmed],
                },
              },
            };
          } else {
            return {
              votes: {
                ...state.votes,
                [choiceId]: {
                  choiceId,
                  count: 1,
                  voters: [trimmed],
                },
              },
            };
          }
        });
        return true;
      },

      startVoteRound: (sceneId, sceneTitle, choices) => {
        const roundId = generateId();
        const options: VoteRoundOption[] = choices.map(c => ({
          choiceId: c.id,
          choiceText: c.text,
          voters: [],
          count: 0,
        }));
        set({
          currentVoteRoundId: roundId,
          votingEnabled: true,
          votes: {},
        });
      },

      closeVoteRound: () => {
        const { votes, voteRounds, currentVoteRoundId, cards, currentClassroomPath } = get();
        const sceneId = currentClassroomPath
          ? [...currentClassroomPath.steps].reverse().find(s => {
              const card = cards.find(c => c.id === s.cardId);
              return card?.type === 'scene';
            })?.cardId
          : null;
        const sceneCard = sceneId ? cards.find(c => c.id === sceneId) as SceneCard : null;

        const options: VoteRoundOption[] = Object.values(votes).map(v => {
          const choice = cards.find(c => c.id === v.choiceId) as ChoiceCard;
          return {
            choiceId: v.choiceId,
            choiceText: choice?.text || '未命名',
            voters: v.voters,
            count: v.count,
          };
        });

        // 补充零票选项
        if (sceneCard) {
          const choiceIds = cards
            .filter(c => c.type === 'choice')
            .map(c => c.id);
          choiceIds.forEach(cid => {
            if (!options.find(o => o.choiceId === cid)) {
              const choice = cards.find(c => c.id === cid) as ChoiceCard;
              options.push({
                choiceId: cid,
                choiceText: choice?.text || '未命名',
                voters: [],
                count: 0,
              });
            }
          });
        }

        let winner: { choiceId: string; text: string } | null = null;
        let maxCount = -1;
        options.forEach(o => {
          if (o.count > maxCount) {
            maxCount = o.count;
            winner = { choiceId: o.choiceId, text: o.choiceText };
          }
        });

        if (!winner || maxCount === 0) {
          set({
            votingEnabled: false,
            currentVoteRoundId: null,
            votes: {},
          });
          return null;
        }

        const round: VoteRound = {
          id: currentVoteRoundId || generateId(),
          sceneId: sceneId || '',
          sceneTitle: sceneCard?.title || '场景',
          options,
          winningChoiceId: winner.choiceId,
          winningChoiceText: winner.text,
          totalVotes: options.reduce((s, o) => s + o.count, 0),
          timestamp: Date.now(),
        };

        set(state => ({
          voteRounds: [...state.voteRounds, round],
          votingEnabled: false,
          currentVoteRoundId: null,
          votes: {},
        }));

        return winner;
      },

      setVotingEnabled: (enabled) => {
        set({ votingEnabled: enabled });
      },

      resetVotes: () => {
        set({ votes: {}, votingEnabled: false, currentVoteRoundId: null });
      },

      resetVoteRounds: () => {
        set({ voteRounds: [], votes: {}, votingEnabled: false, currentVoteRoundId: null });
      },

      triggerCurse: (curseId) => {
        // visual trigger, handled in UI
      },

      clearActiveCurses: () => {
        set({ activeCurses: [] });
      },

      resetAll: () => {
        set(makeInitialState());
      },

      deleteClassroomPath: (id) => {
        set(state => ({
          classroomPaths: state.classroomPaths.filter(p => p.id !== id),
        }));
      },

      resetClassroomPaths: () => {
        set({ classroomPaths: [], voteRounds: [] });
      },

      loadDemoStory: () => {
        const scene1Id = generateId();
        const scene2Id = generateId();
        const scene3Id = generateId();
        const choice1Id = generateId();
        const choice2Id = generateId();
        const choice3Id = generateId();
        const choice4Id = generateId();
        const curse1Id = generateId();
        const curse2Id = generateId();
        const ending1Id = generateId();
        const ending2Id = generateId();

        const demoState: Partial<StoryState> = {
          cards: [
            {
              id: scene1Id,
              type: 'scene',
              x: 100,
              y: 50,
              title: '鬼屋入口',
              description: '你站在一座废弃的维多利亚式宅邸前。铁艺大门在风中吱呀作响，庭院里的杂草已经没过膝盖。二楼的一扇窗户后似乎有人影闪过，但当你定睛细看时却什么都没有。',
              environmentDetails: '空气中弥漫着潮湿的霉味和某种说不清的甜味。远处传来猫头鹰的叫声。门上的铜锁已经锈迹斑斑，但奇怪的是，门是虚掩着的。',
              atmosphere: '压抑、诡异、未知',
              isEntry: true,
              hasRedHerring: true,
              redHerringText: '门口的石阶上有新鲜的泥土脚印，看起来是最近留下的。',
            } as SceneCard,
            {
              id: scene2Id,
              type: 'scene',
              x: 50,
              y: 300,
              title: '镜厅',
              description: '走廊两侧挂满了古老的镜子。在摇曳的烛光下，你的倒影似乎比你慢了半拍。走廊尽头传来轻微的歌唱声，是一首古老的童谣。',
              environmentDetails: '墙上的壁纸正在剥落，露出里面的砖墙。地毯上有深褐色的污渍，看起来像是干涸的血迹。每面镜子都蒙着厚厚的灰尘，但奇怪的是，你能清楚地看到自己的倒影。',
              atmosphere: '诡异、不安、被注视',
              isEntry: false,
              hasRedHerring: false,
              redHerringText: '',
            } as SceneCard,
            {
              id: scene3Id,
              type: 'scene',
              x: 350,
              y: 300,
              title: '地下室',
              description: '楼梯吱呀作响，你来到了地下室。空气中弥漫着腐烂的气息。墙角堆着几个旧木箱，天花板上挂着一条锈迹斑斑的铁链。',
              environmentDetails: '地面湿漉漉的，有水滴从天花板落下。墙上刻着一些奇怪的符号，有些还很新。角落里有一个老旧的娃娃，眼睛似乎在跟着你移动。',
              atmosphere: '恐怖、窒息、危险',
              isEntry: false,
              hasRedHerring: false,
              redHerringText: '',
            } as SceneCard,
            {
              id: choice1Id,
              type: 'choice',
              x: 50,
              y: 180,
              text: '推开门，直接进入宅邸',
              immediateFeedback: '门轴发出令人牙酸的吱呀声。你踏入昏暗的大厅，一股冷风迎面吹来，门在你身后重重关上。',
              cost: 1,
              delayedConsequence: {
                curseId: curse1Id,
                delayScenes: 1,
              },
            } as ChoiceCard,
            {
              id: choice2Id,
              type: 'choice',
              x: 300,
              y: 180,
              text: '绕到房子后面，从窗户进入',
              immediateFeedback: '你小心翼翼地绕过杂草丛。后窗的玻璃已经碎了，你很容易就爬了进去。落地时，你踩到了什么软软的东西——是一只死老鼠。',
              cost: 2,
              delayedConsequence: {
                curseId: curse2Id,
                delayScenes: 2,
              },
            } as ChoiceCard,
            {
              id: choice3Id,
              type: 'choice',
              x: 50,
              y: 450,
              text: '对着镜子数三声',
              immediateFeedback: '"一...二...三..." 什么都没发生。你松了一口气，转身准备离开。',
              cost: 2,
              delayedConsequence: null,
            } as ChoiceCard,
            {
              id: choice4Id,
              type: 'choice',
              x: 300,
              y: 450,
              text: '打碎所有镜子',
              immediateFeedback: '你抓起一把椅子，疯狂地砸向镜子。玻璃碎片四溅，每一片碎片中都映着你惊恐的脸。',
              cost: 3,
              delayedConsequence: null,
            } as ChoiceCard,
            {
              id: curse1Id,
              type: 'curse',
              x: 500,
              y: 100,
              name: '镜中延迟',
              description: '你的倒影开始有了自己的意识。它会在你不注意的时候，做出你没有做过的动作。',
              triggerCondition: '进入宅邸时触发，经过三幕之后显现',
              visualEffect: '镜子中的你比真实的你慢一拍，嘴角挂着诡异的微笑',
              severity: 'medium',
              rule: '你以为镜子照出的是现在，但实际上它照出的是三秒后的未来。而当你发现这个规则时，规则已经反转了——现在镜中的你才是真实的。',
            } as CurseCard,
            {
              id: curse2Id,
              type: 'curse',
              x: 500,
              y: 300,
              name: '沾染之印',
              description: '你触碰的每一样东西都会留下血红色的手印，而且只有你能看到。',
              triggerCondition: '从窗户进入时，手上沾染了诅咒之血',
              visualEffect: '手掌心浮现出黑色的纹路，所触之处皆留血印',
              severity: 'severe',
              rule: '你以为只要不碰东西就没事，但实际上，每当你克制触碰一样东西，那个东西就会自己向你移动。',
            } as CurseCard,
            {
              id: ending1Id,
              type: 'ending',
              x: 50,
              y: 600,
              title: '镜中囚笼',
              description: '你转身的瞬间，眼角余光瞥见镜中的你没有动。你猛地回头，镜中的你正对着你微笑，嘴巴一张一合："现在，该换我出去了。" 你想尖叫，却发现自己发不出声音。你的手贴在镜面上，而镜中的你的手，也贴了上来...',
              endingType: 'bad',
              callback: '你终于明白，门口那些新鲜的脚印，其实是你自己留下的。或者说，是镜中的"你"留下的。',
            } as EndingCard,
            {
              id: ending2Id,
              type: 'ending',
              x: 300,
              y: 600,
              title: '碎片之海',
              description: '当最后一面镜子碎裂时，你发现整个世界都在碎裂。原来，你一直生活在镜子里。而真实的你，正在镜厅的另一端，对着满地碎片微笑...',
              endingType: 'twist',
              callback: '从你踏入鬼屋的那一刻起，你就从未真正"进去"过。你只是镜中的倒影，被某个闯入者惊醒了而已。',
            } as EndingCard,
          ],
          connections: [
            { from: scene1Id, to: choice1Id },
            { from: scene1Id, to: choice2Id },
            { from: choice1Id, to: scene2Id },
            { from: choice2Id, to: scene3Id },
            { from: scene2Id, to: choice3Id },
            { from: scene2Id, to: choice4Id },
            { from: choice3Id, to: ending1Id },
            { from: choice4Id, to: ending2Id },
          ],
        };

        set(demoState);
        get().updateNarrativeElements();
      },

      importStory: (data) => {
        set(data as StoryState);
        get().updateNarrativeElements();
      },
    }),
    {
      name: 'curse-story-storage',
      partialize: (state) => ({
        cards: state.cards,
        connections: state.connections,
        narrativeElements: state.narrativeElements,
        exploredPaths: state.exploredPaths,
        classroomPaths: state.classroomPaths,
        voteRounds: state.voteRounds,
      }),
    }
  )
);
