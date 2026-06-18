import { useState, useEffect, useCallback } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
  startDelay?: number;
}

export default function Typewriter({
  text,
  speed = 50,
  onComplete,
  className = '',
  startDelay = 0,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [shouldStart, setShouldStart] = useState(false);

  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
    setIsComplete(false);
    setShouldStart(false);

    const delayTimer = setTimeout(() => {
      setShouldStart(true);
    }, startDelay);

    return () => clearTimeout(delayTimer);
  }, [text, startDelay]);

  useEffect(() => {
    if (!shouldStart) return;
    if (currentIndex >= text.length) {
      setIsComplete(true);
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setDisplayText(prev => prev + text[currentIndex]);
      setCurrentIndex(prev => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [currentIndex, text, speed, onComplete, shouldStart]);

  const skipToEnd = useCallback(() => {
    setDisplayText(text);
    setCurrentIndex(text.length);
    setIsComplete(true);
    onComplete?.();
  }, [text, onComplete]);

  return (
    <div
      className={className}
      onClick={!isComplete ? skipToEnd : undefined}
      style={{ cursor: !isComplete ? 'pointer' : 'default' }}
    >
      {displayText}
      {!isComplete && <span className="typewriter-cursor" />}
      {!isComplete && (
        <span className="text-xs text-horror-textMuted ml-2 opacity-60">
          点击跳过
        </span>
      )}
    </div>
  );
}
