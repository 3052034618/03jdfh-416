export type CardType = 'scene' | 'choice' | 'curse' | 'ending';

export type EndingType = 'good' | 'bad' | 'neutral' | 'twist';

export type CurseSeverity = 'mild' | 'medium' | 'severe';

export type Mode = 'edit' | 'display' | 'analysis';

export interface BaseCard {
  id: string;
  type: CardType;
  x: number;
  y: number;
}

export interface SceneCard extends BaseCard {
  type: 'scene';
  title: string;
  description: string;
  environmentDetails: string;
  atmosphere: string;
  isEntry: boolean;
  hasRedHerring: boolean;
  redHerringText: string;
  nextChoices: string[];
}

export interface ChoiceCard extends BaseCard {
  type: 'choice';
  text: string;
  immediateFeedback: string;
  cost: number;
  delayedConsequence: {
    curseId: string;
    delayScenes: number;
  } | null;
  nextSceneId: string | null;
  endingId: string | null;
}

export interface CurseCard extends BaseCard {
  type: 'curse';
  name: string;
  description: string;
  triggerCondition: string;
  visualEffect: string;
  severity: CurseSeverity;
  rule: string;
}

export interface EndingCard extends BaseCard {
  type: 'ending';
  title: string;
  description: string;
  endingType: EndingType;
  callback: string;
}

export type StoryCard = SceneCard | ChoiceCard | CurseCard | EndingCard;

export interface Connection {
  from: string;
  to: string;
}

export interface NarrativeElements {
  redHerring: boolean;
  increasingCost: boolean;
  ruleReversal: boolean;
  callback: boolean;
  hints: string[];
}

export interface VoteRecord {
  choiceId: string;
  count: number;
  voters: string[];
}

export type ChoiceSource = 'manual' | 'vote';

export interface PathStep {
  cardId: string;
  source: ChoiceSource;
  voteRoundId?: string;
}

export interface VoteRoundOption {
  choiceId: string;
  choiceText: string;
  voters: string[];
  count: number;
}

export interface VoteRound {
  id: string;
  sceneId: string;
  sceneTitle: string;
  options: VoteRoundOption[];
  winningChoiceId: string;
  winningChoiceText: string;
  totalVotes: number;
  timestamp: number;
}

export interface ClassroomPath {
  id: string;
  steps: PathStep[];
  cardTitles: Record<string, string>;
  endingTitle: string | null;
  endingId: string | null;
  startedAt: number;
  completedAt: number;
}

export interface StoryState {
  cards: StoryCard[];
  connections: Connection[];
  narrativeElements: NarrativeElements;
  votes: Record<string, VoteRecord>;
  exploredPaths: string[][];
  currentPath: string[];
  classroomPaths: ClassroomPath[];
  currentClassroomPath: ClassroomPath | null;
  voteRounds: VoteRound[];
  currentVoteRoundId: string | null;
  activeCardId: string | null;
  mode: Mode;
  votingEnabled: boolean;
  currentSceneIndex: number;
  activeCurses: { curseId: string; triggerScene: number }[];
}

export interface BranchCoverageResult {
  coverage: number;
  totalBranches: number;
  exploredBranches: number;
  missingBranches: string[][];
}

export interface CurseClarityResult {
  score: number;
  consistent: boolean;
  issues: string[];
  suggestions: string[];
}

export interface PacingResult {
  pacingChart: { scene: string; intensity: number }[];
  rhythm: 'too-fast' | 'too-slow' | 'well-paced';
  suggestions: string[];
}

export interface RouteFearSummary {
  pathLabel: string;
  choiceTexts: string[];
  totalCost: number;
  triggeredCurses: { name: string; severity: CurseSeverity; rule: string }[];
  endingTitle: string | null;
  endingType: EndingType | null;
  hasCallback: boolean;
  callbackText: string;
  fearMeaningScore: number;
  fearMeaningNote: string;
}

export interface AnalysisResult {
  branchCoverage: BranchCoverageResult;
  curseClarity: CurseClarityResult;
  pacing: PacingResult;
  routeFearSummaries: RouteFearSummary[];
  overallFeedback: string[];
}

export const createEmptyScene = (id: string, x: number, y: number): SceneCard => ({
  id,
  type: 'scene',
  x,
  y,
  title: '新场景',
  description: '',
  environmentDetails: '',
  atmosphere: '',
  isEntry: false,
  hasRedHerring: false,
  redHerringText: '',
  nextChoices: [],
});

export const createEmptyChoice = (id: string, x: number, y: number): ChoiceCard => ({
  id,
  type: 'choice',
  x,
  y,
  text: '',
  immediateFeedback: '',
  cost: 0,
  delayedConsequence: null,
  nextSceneId: null,
  endingId: null,
});

export const createEmptyCurse = (id: string, x: number, y: number): CurseCard => ({
  id,
  type: 'curse',
  x,
  y,
  name: '',
  description: '',
  triggerCondition: '',
  visualEffect: '',
  severity: 'medium',
  rule: '',
});

export const createEmptyEnding = (id: string, x: number, y: number): EndingCard => ({
  id,
  type: 'ending',
  x,
  y,
  title: '',
  description: '',
  endingType: 'neutral',
  callback: '',
});

export const generateId = (): string => {
  return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
