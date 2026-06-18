import { useState, useRef, useEffect } from 'react';
import { useStoryStore } from '@/store/useStoryStore';
import DraggableCard from './DraggableCard';
import type { CardType, StoryCard } from '@/types/story';

function isValidConnection(fromCard: StoryCard | undefined, toCard: StoryCard | undefined): boolean {
  if (!fromCard || !toCard) return false;
  if (fromCard.id === toCard.id) return false;
  const allowed: Record<string, string[]> = {
    scene: ['choice'],
    choice: ['scene', 'ending'],
    curse: [],
    ending: [],
  };
  return allowed[fromCard.type]?.includes(toCard.type) ?? false;
}

export default function Canvas() {
  const { cards, connections, addCard, addConnection, removeConnection, setActiveCard, activeCardId } = useStoryStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!connectingFrom) return;
    const handleMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    document.addEventListener('mousemove', handleMove);
    return () => document.removeEventListener('mousemove', handleMove);
  }, [connectingFrom]);

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
        setMousePos(null);
      }
    }
  };

  const handleConnectClick = (cardId: string) => {
    if (connectingFrom) {
      if (connectingFrom !== cardId) {
        const fromCard = cards.find(c => c.id === connectingFrom);
        const toCard = cards.find(c => c.id === cardId);
        const exists = connections.some(c => c.from === connectingFrom && c.to === cardId);

        if (exists) {
          removeConnection(connectingFrom, cardId);
        } else if (isValidConnection(fromCard, toCard)) {
          addConnection(connectingFrom, cardId);
        } else {
          const fromLabel = fromCard?.type === 'scene' ? '场景' : fromCard?.type === 'choice' ? '选择' : fromCard?.type === 'curse' ? '诅咒' : '结局';
          const toLabel = toCard?.type === 'scene' ? '场景' : toCard?.type === 'choice' ? '选择' : toCard?.type === 'curse' ? '诅咒' : '结局';
          alert(`无法连接：${fromLabel} → ${toLabel}\n有效连接：场景→选择，选择→场景/结局`);
        }
      }
      setConnectingFrom(null);
      setMousePos(null);
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

  const getConnectionLabel = (fromCard: StoryCard, toCard: StoryCard) => {
    if (fromCard.type === 'scene' && toCard.type === 'choice') return '→';
    if (fromCard.type === 'choice' && toCard.type === 'scene') return '→';
    if (fromCard.type === 'choice' && toCard.type === 'ending') return '⬇';
    return '';
  };

  const renderConnections = () => {
    return connections.map((conn, index) => {
      const fromCard = cards.find(c => c.id === conn.from);
      const toCard = cards.find(c => c.id === conn.to);
      if (!fromCard || !toCard) return null;

      const from = getCardCenter(fromCard);
      const to = getCardCenter(toCard);

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / dist;
      const ny = dx / dist;
      const curveOffset = Math.min(40, dist * 0.2);
      const cpX = (from.x + to.x) / 2 + nx * curveOffset;
      const cpY = (from.y + to.y) / 2 + ny * curveOffset;

      const isActive = activeCardId === conn.from || activeCardId === conn.to;

      return (
        <g key={`${conn.from}-${conn.to}`}>
          <path
            d={`M ${from.x} ${from.y} Q ${cpX} ${cpY} ${to.x} ${to.y}`}
            fill="none"
            stroke={isActive ? '#c9a227' : '#8b0000'}
            strokeWidth={isActive ? 2.5 : 1.5}
            strokeDasharray={isActive ? 'none' : '6,4'}
            className="transition-all duration-300"
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('删除此连接？')) {
                removeConnection(conn.from, conn.to);
              }
            }}
          />
          <path
            d={`M ${from.x} ${from.y} Q ${cpX} ${cpY} ${to.x} ${to.y}`}
            fill="none"
            stroke="transparent"
            strokeWidth={12}
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('删除此连接？')) {
                removeConnection(conn.from, conn.to);
              }
            }}
          />
          {(() => {
            const t = 0.5;
            const labelX = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * cpX + t * t * to.x;
            const labelY = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * cpY + t * t * to.y;
            const label = getConnectionLabel(fromCard, toCard);
            if (!label) return null;
            return (
              <text
                x={labelX}
                y={labelY - 8}
                textAnchor="middle"
                className="fill-horror-textMuted text-xs select-none pointer-events-none"
                fontSize={10}
              >
                {label}
              </text>
            );
          })()}
          <circle
            cx={to.x}
            cy={to.y}
            r="4"
            fill={isActive ? '#c9a227' : '#8b0000'}
            className="pointer-events-none"
          />
        </g>
      );
    });
  };

  const renderTempLine = () => {
    if (!connectingFrom || !mousePos) return null;
    const fromCard = cards.find(c => c.id === connectingFrom);
    if (!fromCard) return null;
    const from = getCardCenter(fromCard);
    return (
      <line
        x1={from.x}
        y1={from.y}
        x2={mousePos.x}
        y2={mousePos.y}
        stroke="#c9a227"
        strokeWidth={2}
        strokeDasharray="8,4"
        className="animate-pulse pointer-events-none"
      />
    );
  };

  const fromCard = connectingFrom ? cards.find(c => c.id === connectingFrom) : null;
  const connectHint = fromCard
    ? `🔗 从${fromCard.type === 'scene' ? '场景' : fromCard.type === 'choice' ? '选择' : fromCard.type === 'curse' ? '诅咒' : '结局'}出发 — 点击目标卡片完成连接（点击空白取消）`
    : '';

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
          <span className="text-horror-accent animate-pulse">{connectHint}</span>
        ) : cards.length === 0 ? (
          <span>👻 从左侧拖拽卡片到此处开始创作你的诅咒剧情</span>
        ) : (
          <span>✏️ 点击 🔗 按钮开始连线 | 拖拽移动卡片 | 点击编辑内容</span>
        )}
      </div>

      <svg
        id="canvas-svg"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ minWidth: '2000px', minHeight: '2000px' }}
      >
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#8b0000" className="fill-horror-blood" />
          </marker>
          <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#c9a227" />
          </marker>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g style={{ pointerEvents: 'auto' }}>{renderConnections()}</g>
        <g style={{ pointerEvents: 'none' }}>{renderTempLine()}</g>
      </svg>

      <div className="relative" style={{ minWidth: '2000px', minHeight: '2000px' }}>
        {cards.map((card) => (
          <DraggableCard
            key={card.id}
            card={card}
            onConnectClick={handleConnectClick}
            connectingFrom={connectingFrom}
          />
        ))}
      </div>

      {connectingFrom && (
        <div
          className="fixed inset-0 z-30"
          style={{ cursor: 'crosshair' }}
          onClick={() => {
            setConnectingFrom(null);
            setMousePos(null);
          }}
        />
      )}
    </div>
  );
}
