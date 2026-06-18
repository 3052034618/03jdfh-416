import { useState, useRef } from 'react';
import { useStoryStore } from '@/store/useStoryStore';
import DraggableCard from './DraggableCard';
import type { CardType, StoryCard } from '@/types/story';

export default function Canvas() {
  const { cards, connections, addCard, addConnection, removeConnection, setActiveCard } = useStoryStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const cardType = e.dataTransfer.getData('cardType') as CardType;
    if (!cardType) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - 96;
    const y = e.clientY - rect.top - 40;

    addCard(cardType, Math.max(0, x), Math.max(0, y));
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).id === 'canvas-svg') {
      setActiveCard(null);
      if (connectingFrom) {
        setConnectingFrom(null);
      }
    }
  };

  const handleConnectStart = (cardId: string) => {
    if (connectingFrom) {
      if (connectingFrom !== cardId) {
        const exists = connections.some(
          c => c.from === connectingFrom && c.to === cardId
        );
        if (exists) {
          removeConnection(connectingFrom, cardId);
        } else {
          addConnection(connectingFrom, cardId);
          
          const fromCard = cards.find(c => c.id === connectingFrom);
          const toCard = cards.find(c => c.id === cardId);
          
          if (fromCard?.type === 'scene' && toCard?.type === 'choice') {
            const scene = fromCard;
            if (!scene.nextChoices.includes(cardId)) {
              useStoryStore.getState().updateCard(connectingFrom, {
                nextChoices: [...scene.nextChoices, cardId],
              });
            }
          }
          
          if (fromCard?.type === 'choice') {
            if (toCard?.type === 'scene') {
              useStoryStore.getState().updateCard(connectingFrom, {
                nextSceneId: cardId,
              });
            } else if (toCard?.type === 'ending') {
              useStoryStore.getState().updateCard(connectingFrom, {
                endingId: cardId,
              });
            }
          }
        }
      }
      setConnectingFrom(null);
    } else {
      setConnectingFrom(cardId);
    }
  };

  const getCardCenter = (card: StoryCard) => {
    return {
      x: card.x + 96,
      y: card.y + 40,
    };
  };

  const renderConnections = () => {
    return connections.map((conn, index) => {
      const fromCard = cards.find(c => c.id === conn.from);
      const toCard = cards.find(c => c.id === conn.to);
      if (!fromCard || !toCard) return null;

      const from = getCardCenter(fromCard);
      const to = getCardCenter(toCard);

      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;

      return (
        <g key={index}>
          <path
            d={`M ${from.x} ${from.y} Q ${midX} ${midY - 30} ${to.x} ${to.y}`}
            className="connection-line"
            strokeDasharray="5,5"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('删除此连接？')) {
                removeConnection(conn.from, conn.to);
              }
            }}
            style={{ cursor: 'pointer' }}
          />
          <circle
            cx={midX}
            cy={midY - 15}
            r="6"
            fill="#8b0000"
            className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('删除此连接？')) {
                removeConnection(conn.from, conn.to);
              }
            }}
          />
        </g>
      );
    });
  };

  return (
    <div
      id="editor-canvas"
      ref={canvasRef}
      className={`flex-1 wood-bg relative overflow-auto transition-all duration-300 ${
        isDragOver ? 'drag-over' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleCanvasClick}
    >
      <div className="absolute top-4 left-4 text-horror-textMuted text-sm font-gothic z-20">
        {connectingFrom ? (
          <span className="text-horror-accent animate-pulse">
            🔗 点击另一张卡片建立连接，或点击空白处取消
          </span>
        ) : cards.length === 0 ? (
          <span>👻 从左侧拖拽卡片到此处开始创作你的诅咒剧情</span>
        ) : (
          <span>✏️ 点击卡片进行编辑，拖拽移动位置</span>
        )}
      </div>

      <svg
        id="canvas-svg"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ minWidth: '2000px', minHeight: '2000px' }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g style={{ pointerEvents: 'auto' }}>{renderConnections()}</g>
      </svg>

      <div className="relative" style={{ minWidth: '2000px', minHeight: '2000px' }}>
        {cards.map((card) => (
          <DraggableCard
            key={card.id}
            card={card}
            onConnectStart={handleConnectStart}
            connectingFrom={connectingFrom}
          />
        ))}
      </div>

      {connectingFrom && (
        <div
          className="fixed inset-0 bg-black/30 z-40 cursor-crosshair"
          onClick={() => setConnectingFrom(null)}
        />
      )}
    </div>
  );
}
