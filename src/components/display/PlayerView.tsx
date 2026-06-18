import { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, SkipForward, Skull, Eye, Vote, Users, Play, Pause } from 'lucide-react';
import { useStoryStore } from '@/store/useStoryStore';
import Typewriter from './Typewriter';
import VotingPanel from './VotingPanel';
import VoteHistoryPanel from './VoteHistoryPanel';
import PlaybackPanel from './PlaybackPanel';
import type { SceneCard, ChoiceCard, CurseCard, EndingCard, ClassroomPath, ChoiceSource, PathStep } from '@/types/story';

export default function PlayerView() {
  const {
    cards,
    connections,
    currentPath,
    currentSceneIndex,
    activeCurses,
    addToCurrentPath,
    saveCurrentPath,
    resetDisplay,
    clearActiveCurses,
    currentClassroomPath,
    voteRounds,
  } = useStoryStore();

  const [phase, setPhase] = useState<'scene' | 'feedback' | 'choice' | 'voting' | 'ending'>('scene');
  const [showChoices, setShowChoices] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState('');
  const [showCurseEffect, setShowCurseEffect] = useState(false);
  const [triggeredCurse, setTriggeredCurse] = useState<CurseCard | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(true);

  // Playback state
  const [playbackPath, setPlaybackPath] = useState<ClassroomPath | null>(null);
  const [playbackStep, setPlaybackStep] = useState(0);
  const [playbackAuto, setPlaybackAuto] = useState(false);
  const playbackTimerRef = useRef<number | null>(null);

  const getConnectedIds = useCallback((cardId: string) => {
    return connections.filter(c => c.from === cardId).map(c => c.to);
  }, [connections]);

  const getCurrentCard = useCallback(() => {
    if (playbackPath) {
      const currentStep = playbackPath.steps[playbackStep];
      if (!currentStep) return null;
      return cards.find(c => c.id === currentStep.cardId) || null;
    }
    if (currentPath.length === 0) return null;
    const currentId = currentPath[currentPath.length - 1];
    return cards.find(c => c.id === currentId);
  }, [currentPath, cards, playbackPath, playbackStep]);

  const currentCard = getCurrentCard();
  const currentScene = currentCard?.type === 'scene' ? (currentCard as SceneCard) : null;
  const currentEnding = currentCard?.type === 'ending' ? (currentCard as EndingCard) : null;

  const currentStepSource = ((): ChoiceSource | null => {
    if (playbackPath) {
      return playbackPath.steps[playbackStep]?.source || null;
    }
    if (!currentClassroomPath) return null;
    const last = currentClassroomPath.steps[currentClassroomPath.steps.length - 1];
    return last?.source || null;
  })();

  const currentStepSourceInfo = (() => {
    if (!currentStepSource) return null;
    if (playbackPath && currentStepSource === 'vote') {
      const step = playbackPath.steps[playbackStep];
      if (step?.voteRoundId) {
        const round = voteRounds.find(r => r.id === step.voteRoundId);
        if (round) return { source: 'vote' as const, round };
      }
    }
    return { source: currentStepSource };
  })();

  useEffect(() => {
    const idx = playbackPath ? playbackStep : currentSceneIndex;
    const triggered = activeCurses.filter(ac => ac.triggerScene === idx);
    if (triggered.length > 0) {
      const curseCard = cards.find(c => c.id === triggered[0].curseId) as CurseCard;
      if (curseCard) {
        setTriggeredCurse(curseCard);
        setShowCurseEffect(true);
        setTimeout(() => setShowCurseEffect(false), 3000);
      }
    }
  }, [currentSceneIndex, activeCurses, cards, playbackStep, playbackPath]);

  useEffect(() => {
    if (currentCard?.type === 'ending') {
      if (!playbackPath) {
        setPhase('ending');
        saveCurrentPath();
      }
    }
  }, [currentCard, saveCurrentPath, playbackPath]);

  // Playback auto advance
  useEffect(() => {
    if (!playbackAuto || !playbackPath) return;
    const isLast = playbackStep >= playbackPath.steps.length - 1;
    if (isLast) {
      setPlaybackAuto(false);
      return;
    }
    const card = cards.find(c => c.id === playbackPath.steps[playbackStep]?.cardId);
    let delay = 3000;
    if (card?.type === 'scene') delay = 6000;
    if (card?.type === 'choice') delay = 3500;
    if (card?.type === 'ending') delay = 8000;
    playbackTimerRef.current = window.setTimeout(() => {
      setPlaybackStep(s => Math.min(s + 1, playbackPath.steps.length - 1));
    }, delay);
    return () => {
      if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
    };
  }, [playbackAuto, playbackStep, playbackPath, cards]);

  const handleSceneComplete = () => {
    if (playbackPath) {
      // Playback: allow manual or auto advance
      if (!playbackAuto) return;
    }
    setShowChoices(true);
    setPhase('choice');
  };

  const getChoices = useCallback((): ChoiceCard[] => {
    if (!currentScene) return [];
    const choiceIds = getConnectedIds(currentScene.id);
    return choiceIds
      .map(id => cards.find(c => c.id === id) as ChoiceCard)
      .filter(c => c && c.type === 'choice');
  }, [currentScene, getConnectedIds, cards]);

  const getNextCardAfterChoice = useCallback((choiceId: string): { sceneId: string | null; endingId: string | null } => {
    const nextIds = getConnectedIds(choiceId);
    for (const nid of nextIds) {
      const card = cards.find(c => c.id === nid);
      if (card?.type === 'scene') return { sceneId: nid, endingId: null };
      if (card?.type === 'ending') return { sceneId: null, endingId: nid };
    }
    return { sceneId: null, endingId: null };
  }, [getConnectedIds, cards]);

  const handleChoiceSelect = (choice: ChoiceCard) => {
    setCurrentFeedback(choice.immediateFeedback);
    setPhase('feedback');
    addToCurrentPath(choice.id, 'manual');
    setShowChoices(false);
    setIsPreviewing(true);
  };

  const handleFeedbackComplete = () => {
    const lastCardId = playbackPath
      ? playbackPath.steps[playbackStep]?.cardId
      : currentPath[currentPath.length - 1];

    if (playbackPath) {
      setPhase('scene');
      setCurrentFeedback('');
      return;
    }

    const { sceneId, endingId } = getNextCardAfterChoice(lastCardId);

    if (endingId) {
      addToCurrentPath(endingId, 'manual');
    } else if (sceneId) {
      addToCurrentPath(sceneId, 'manual');
      setPhase('scene');
      setCurrentFeedback('');
    } else {
      saveCurrentPath();
      setPhase('ending');
    }
  };

  const handleVoteComplete = (winningChoice: ChoiceCard) => {
    setPhase('choice');
    // Use currentVoteRoundId from store to tag the step
    const roundId = useStoryStore.getState().currentVoteRoundId;
    setCurrentFeedback(winningChoice.immediateFeedback);
    setPhase('feedback');
    addToCurrentPath(winningChoice.id, 'vote', roundId || undefined);
    setShowChoices(false);
    setIsPreviewing(true);
  };

  const handleStartVoting = () => {
    if (!currentScene) return;
    setIsPreviewing(false);
    setPhase('voting');
  };

  const handleRestart = () => {
    if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
    setPlaybackPath(null);
    setPlaybackStep(0);
    setPlaybackAuto(false);
    resetDisplay();
    clearActiveCurses();
    setPhase('scene');
    setShowChoices(false);
    setCurrentFeedback('');
    setTriggeredCurse(null);
    setIsPreviewing(true);
  };

  // Playback handlers
  const handleStartPlayback = (path: ClassroomPath) => {
    setPlaybackPath(path);
    setPlaybackStep(0);
    setPlaybackAuto(false);
    setPhase('scene');
    setShowChoices(false);
    setCurrentFeedback('');
    setTriggeredCurse(null);
    setCurrentFeedback('');
  };

  const playbackPrev = () => {
    setPlaybackAuto(false);
    setPlaybackStep(s => Math.max(0, s - 1));
    setCurrentFeedback('');
    setPhase('scene');
  };

  const playbackNext = () => {
    if (!playbackPath) return;
    if (playbackStep >= playbackPath.steps.length - 1) return;
    setPlaybackStep(s => Math.min(s + 1, playbackPath.steps.length - 1));
    setCurrentFeedback('');
    setPhase('scene');
  };

  const renderSceneContent = () => {
    if (!currentScene) {
      if (playbackPath && currentCard?.type === 'choice') {
        const choice = currentCard as ChoiceCard;
        return (
          <div className="animate-fade-in p-6 bg-horror-surface/50 rounded-xl border border-horror-accent/30">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs px-2 py-0.5 rounded bg-horror-blood/20 text-horror-bloodLight flex items-center gap-1">
                {currentStepSource === 'vote' ? <Vote size={12} /> : null}
                {currentStepSource === 'manual' ? <Eye size={12} /> : null}
                回放 · {currentStepSource === 'vote' ? '当时通过投票选择' : '当时手点选择'}
              </span>
            </div>
            <h3 className="font-gothic text-2xl text-horror-bloodLight mb-2">{choice.text}</h3>
            <p className="text-horror-text leading-relaxed">{choice.immediateFeedback}</p>
          </div>
        );
      }
      return null;
    }
    const choices = getChoices();

    return (
      <div className="animate-fade-in">
        {currentStepSourceInfo && (currentCard?.id !== currentPath[0] || playbackPath) && (
          <div className="mb-4">
            <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 inline-flex
              ${currentStepSourceInfo.source === 'vote' ? 'bg-horror-blood/10 text-horror-bloodLight border border-horror-blood/30' : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'}`}>
              {currentStepSourceInfo.source === 'vote' ? (
                <>
                  <Vote size={12} />
                  通过投票选择
                  {'round' in currentStepSourceInfo && `（${currentStepSourceInfo.round?.totalVotes || 0}人）`}
                </>
              ) : (
                <>
                  <Eye size={12} />
                  老师手动选择
                </>
              )}
            </span>
          </div>
        )}

        <div className="mb-6">
          <h2 className="font-gothic text-3xl text-horror-text text-shadow-candle mb-2">
            {currentScene.title}
          </h2>
          {currentScene.atmosphere && (
            <p className="text-horror-textMuted text-sm italic">
              氛围：{currentScene.atmosphere}
            </p>
          )}
        </div>

        <div className="space-y-4 text-lg leading-relaxed">
          <Typewriter
            text={currentScene.description}
            speed={40}
            className="text-horror-text"
            onComplete={() => {
              if (!currentScene.environmentDetails && !playbackPath) handleSceneComplete();
              if (playbackAuto && playbackPath) {
                const nextCard = playbackPath.steps[playbackStep + 1];
                if (nextCard) {
                  const nc = cards.find(c => c.id === nextCard.cardId);
                  if (nc?.type === 'ending' || nc?.type === 'choice') {
                    setTimeout(() => playbackNext(), 2000);
                  }
                }
              }
            }}
          />
          {currentScene.environmentDetails && (
            <Typewriter
              text={currentScene.environmentDetails}
              speed={35}
              startDelay={500}
              className="text-horror-textMuted italic"
              onComplete={() => {
                if (!playbackPath) handleSceneComplete();
              }}
            />
          )}
          {currentScene.hasRedHerring && currentScene.redHerringText && (
            <Typewriter
              text={currentScene.redHerringText}
              speed={35}
              startDelay={1000}
              className="text-horror-accent animate-pulse-slow"
            />
          )}
        </div>

        {!playbackPath && showChoices && choices.length > 0 && (
          <div className="mt-8 space-y-3 animate-slide-up">
            <h3 className="font-gothic text-xl text-horror-bloodLight mb-4 flex items-center gap-2">
              <Skull size={20} />
              你的选择
            </h3>

            <div className="flex gap-3 mb-4">
              <button
                onClick={handleStartVoting}
                className="horror-btn flex-1 text-sm flex items-center justify-center gap-2"
              >
                <Vote size={16} />
                开启投票
              </button>
            </div>

            {isPreviewing && (
              <p className="text-xs text-horror-textMuted mb-3 flex items-center gap-1">
                <Eye size={14} />
                老师预览模式 — 开启投票后同学参与选择
              </p>
            )}

            {choices.map((choice, index) => (
              <button
                key={choice.id}
                onClick={() => handleChoiceSelect(choice)}
                className="w-full text-left p-4 horror-card border-horror-border hover:border-horror-blood 
                         transition-all duration-300 group"
              >
                <div className="flex items-start gap-3">
                  <span className="font-gothic text-horror-accent font-bold text-xl group-hover:text-horror-bloodLight transition-colors">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <div className="flex-1">
                    <p className="text-horror-text group-hover:text-white transition-colors">
                      {choice.text}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {choice.cost > 0 && (
                        <span className="text-xs text-horror-textMuted">代价：{'💰'.repeat(choice.cost)}</span>
                      )}
                      {choice.delayedConsequence && (
                        <span className="text-xs text-horror-bloodLight flex items-center gap-1">
                          <Skull size={10} />
                          延迟 {choice.delayedConsequence.delayScenes} 幕
                        </span>
                      )}
                    </div>
                  </div>
                  <SkipForward size={18} className="text-horror-textMuted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderFeedback = () => {
    if (!currentFeedback) return null;
    return (
      <div className="animate-fade-in">
        <Typewriter
          text={currentFeedback}
          speed={45}
          className="text-xl text-horror-text leading-relaxed"
          onComplete={() => {
            if (!playbackPath) handleFeedbackComplete();
          }}
        />
        <div className="mt-6 flex justify-end gap-2">
          {playbackPath && (
            <>
              <button onClick={playbackPrev} className="horror-btn text-sm">上一步</button>
              <button onClick={playbackNext} className="horror-btn text-sm">下一步</button>
            </>
          )}
          {!playbackPath && (
            <button
              onClick={handleFeedbackComplete}
              className="horror-btn-primary flex items-center gap-2"
            >
              继续
              <SkipForward size={18} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderEnding = () => {
    if (!currentEnding) return null;
    return (
      <div className="animate-fade-in text-center">
        <div className="mb-6">
          <span className="text-6xl">
            {currentEnding.endingType === 'good' ? '🌅' :
             currentEnding.endingType === 'bad' ? '💀' :
             currentEnding.endingType === 'twist' ? '🌀' : '🌙'}
          </span>
        </div>
        <h2 className="font-gothic text-4xl text-horror-text text-shadow-blood mb-4">
          {currentEnding.title}
        </h2>
        <div className="max-w-2xl mx-auto space-y-6">
          <Typewriter
            text={currentEnding.description}
            speed={50}
            className="text-xl text-horror-text leading-relaxed"
            startDelay={500}
          />
          {currentEnding.callback && (
            <Typewriter
              text={currentEnding.callback}
              speed={45}
              startDelay={2000}
              className="text-horror-accent italic text-lg border-l-4 border-horror-accent pl-4 text-left"
            />
          )}
        </div>
        <div className="mt-8 flex justify-center gap-4">
          {playbackPath && (
            <div className="flex items-center gap-2">
              <button onClick={playbackPrev} className="horror-btn text-sm">上一步</button>
              <button
                onClick={() => setPlaybackAuto(a => !a)}
                className="horror-btn text-sm flex items-center gap-1"
              >
                {playbackAuto ? <Pause size={14} /> : <Play size={14} />}
                {playbackAuto ? '暂停' : '自动播放'}
              </button>
            </div>
          )}
          <button
            onClick={handleRestart}
            className="horror-btn-primary flex items-center gap-2"
          >
            <RotateCcw size={18} />
            {playbackPath ? '退出回放' : '重新开始'}
          </button>
        </div>
      </div>
    );
  };

  const renderCurseEffect = () => {
    if (!showCurseEffect || !triggeredCurse) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in">
        <div className="text-center animate-glitch max-w-lg p-8">
          <Skull size={80} className="text-horror-blood mx-auto mb-4 animate-pulse" />
          <h2 className="font-gothic text-4xl text-horror-bloodLight text-shadow-blood mb-4">
            {triggeredCurse.name}
          </h2>
          <p className="text-xl text-horror-text mb-2">{triggeredCurse.description}</p>
          {triggeredCurse.visualEffect && (
            <p className="text-horror-textMuted italic">{triggeredCurse.visualEffect}</p>
          )}
        </div>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-px bg-horror-blood/30"
              style={{
                top: `${Math.random() * 100}%`,
                animation: `scanline ${0.1 + Math.random() * 0.3}s linear infinite`,
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-horror-bg flex items-center justify-center p-8 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, #000 100%)',
          animation: 'pulse 8s ease-in-out infinite',
        }}
      />

      {phase === 'voting' && currentScene && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl">
            <VotingPanel
              choices={getChoices()}
              sceneId={currentScene.id}
              sceneTitle={currentScene.title || '场景'}
              onVoteComplete={handleVoteComplete}
            />
          </div>
        </div>
      )}

      {renderCurseEffect()}

      <div className="relative z-10 max-w-4xl w-full">
        {playbackPath && (
          <div className="mb-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2 text-sm">
              <Play size={14} className="text-purple-400" />
              <span className="text-purple-400 font-medium">课堂回放模式</span>
              <span className="text-horror-textMuted text-xs">
                {playbackStep + 1} / {playbackPath.steps.length} 步
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={playbackPrev} className="horror-btn text-xs px-2 py-1">
                ◀ 上一步
              </button>
              <button
                onClick={() => setPlaybackAuto(a => !a)}
                className={`horror-btn text-xs px-2 py-1 ${playbackAuto ? 'ring-1 ring-horror-accent' : ''}`}
              >
                {playbackAuto ? '⏸ 暂停' : '▶ 自动'}
              </button>
              <button onClick={playbackNext} className="horror-btn text-xs px-2 py-1">
                下一步 ▶
              </button>
              <button
                onClick={handleRestart}
                className="horror-btn-primary text-xs px-2 py-1"
              >
                ✕ 退出
              </button>
            </div>
          </div>
        )}

        {(phase === 'scene' || playbackPath) && renderSceneContent()}
        {phase === 'choice' && !playbackPath && renderSceneContent()}
        {phase === 'feedback' && renderFeedback()}
        {phase === 'ending' && renderEnding()}
      </div>

      <div className="noise-overlay" />

      {!playbackPath && (
        <VoteHistoryPanel />
      )}
      {!playbackPath && (
        <PlaybackPanel onStartPlayback={handleStartPlayback} />
      )}

      {currentPath.length > 1 && !playbackPath && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-xs text-horror-textMuted/50 font-mono">
          路径: {currentClassroomPath?.steps.length || currentPath.length} 步
          · 课堂记录: {useStoryStore.getState().classroomPaths.length} 条
          · 投票轮次: {voteRounds.length} 轮
        </div>
      )}

      {!playbackPath && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2">
          <button
            onClick={handleRestart}
            className="horror-btn text-xs flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity"
          >
            <RotateCcw size={14} />
            重新开始
          </button>
        </div>
      )}
    </div>
  );
}
