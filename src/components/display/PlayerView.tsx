import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, SkipForward, Skull, Eye, Vote, Users } from 'lucide-react';
import { useStoryStore } from '@/store/useStoryStore';
import Typewriter from './Typewriter';
import VotingPanel from './VotingPanel';
import type { SceneCard, ChoiceCard, CurseCard, EndingCard } from '@/types/story';

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
    setVotingEnabled,
  } = useStoryStore();

  const [phase, setPhase] = useState<'scene' | 'feedback' | 'choice' | 'voting' | 'ending'>('scene');
  const [showChoices, setShowChoices] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState('');
  const [showCurseEffect, setShowCurseEffect] = useState(false);
  const [triggeredCurse, setTriggeredCurse] = useState<CurseCard | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(true);

  const getConnectedIds = useCallback((cardId: string) => {
    return connections.filter(c => c.from === cardId).map(c => c.to);
  }, [connections]);

  const getCurrentCard = useCallback(() => {
    if (currentPath.length === 0) return null;
    const currentId = currentPath[currentPath.length - 1];
    return cards.find(c => c.id === currentId);
  }, [currentPath, cards]);

  const currentCard = getCurrentCard();
  const currentScene = currentCard?.type === 'scene' ? (currentCard as SceneCard) : null;
  const currentEnding = currentCard?.type === 'ending' ? (currentCard as EndingCard) : null;

  useEffect(() => {
    const triggered = activeCurses.filter(ac => ac.triggerScene === currentSceneIndex);
    if (triggered.length > 0) {
      const curseCard = cards.find(c => c.id === triggered[0].curseId) as CurseCard;
      if (curseCard) {
        setTriggeredCurse(curseCard);
        setShowCurseEffect(true);
        setTimeout(() => setShowCurseEffect(false), 3000);
      }
    }
  }, [currentSceneIndex, activeCurses, cards]);

  useEffect(() => {
    if (currentCard?.type === 'ending') {
      setPhase('ending');
      saveCurrentPath();
    }
  }, [currentCard, saveCurrentPath]);

  const handleSceneComplete = () => {
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
    addToCurrentPath(choice.id);
    setShowChoices(false);
    setIsPreviewing(true);
  };

  const handleFeedbackComplete = () => {
    const lastCardId = currentPath[currentPath.length - 1];
    const { sceneId, endingId } = getNextCardAfterChoice(lastCardId);

    if (endingId) {
      addToCurrentPath(endingId);
    } else if (sceneId) {
      addToCurrentPath(sceneId);
      setPhase('scene');
      setCurrentFeedback('');
    } else {
      saveCurrentPath();
      setPhase('ending');
    }
  };

  const handleVoteComplete = (winningChoice: ChoiceCard) => {
    setPhase('choice');
    handleChoiceSelect(winningChoice);
  };

  const handleStartVoting = () => {
    setIsPreviewing(false);
    setPhase('voting');
    setVotingEnabled(true);
  };

  const handleRestart = () => {
    resetDisplay();
    clearActiveCurses();
    setPhase('scene');
    setShowChoices(false);
    setCurrentFeedback('');
    setTriggeredCurse(null);
    setIsPreviewing(true);
  };

  const renderSceneContent = () => {
    if (!currentScene) return null;
    const choices = getChoices();

    return (
      <div className="animate-fade-in">
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
              if (!currentScene.environmentDetails) handleSceneComplete();
            }}
          />
          {currentScene.environmentDetails && (
            <Typewriter
              text={currentScene.environmentDetails}
              speed={35}
              startDelay={500}
              className="text-horror-textMuted italic"
              onComplete={handleSceneComplete}
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

        {showChoices && choices.length > 0 && (
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
          onComplete={handleFeedbackComplete}
        />
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleFeedbackComplete}
            className="horror-btn-primary flex items-center gap-2"
          >
            继续
            <SkipForward size={18} />
          </button>
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
          <button
            onClick={handleRestart}
            className="horror-btn-primary flex items-center gap-2"
          >
            <RotateCcw size={18} />
            重新开始
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
            <VotingPanel choices={getChoices()} onVoteComplete={handleVoteComplete} />
          </div>
        </div>
      )}

      {renderCurseEffect()}

      <div className="relative z-10 max-w-4xl w-full">
        {phase === 'scene' && renderSceneContent()}
        {phase === 'choice' && renderSceneContent()}
        {phase === 'feedback' && renderFeedback()}
        {phase === 'ending' && renderEnding()}
      </div>

      <div className="noise-overlay" />
      
      {currentPath.length > 1 && (
        <div className="fixed bottom-4 left-4 text-xs text-horror-textMuted/50 font-mono">
          路径: {currentPath.length} 步 | 已探索: {useStoryStore.getState().exploredPaths.length} 条
        </div>
      )}
      
      <div className="fixed bottom-4 right-4 flex items-center gap-2">
        <button
          onClick={handleRestart}
          className="horror-btn text-xs flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity"
        >
          <RotateCcw size={14} />
          重新开始
        </button>
      </div>
    </div>
  );
}
