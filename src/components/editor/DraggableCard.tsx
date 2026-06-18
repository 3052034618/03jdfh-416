import { useState, useRef, useEffect } from 'react';
import { MapPin, MousePointer2, Skull, BookOpen, X, Link } from 'lucide-react';
import { useStoryStore } from '@/store/useStoryStore';
import type { StoryCard, CardType } from '@/types/story';

const cardIcons: Record<CardType, typeof MapPin> = {
  scene: MapPin,
  choice: MousePointer2,
  curse: Skull,
  ending: BookOpen,
};

const cardColors: Record<CardType, string> = {
  scene: 'border-horror-blue hover:border-horror-purpleLight',
  choice: 'border-horror-blood hover:border-horror-bloodLight',
  curse: 'border-horror-purple hover:border-horror-purpleLight',
  ending: 'border-horror-accent hover:border-yellow-500',
};

const cardBgColors: Record<CardType, string> = {
  scene: 'bg-gradient-to-br from-horror-blue/20 to-horror-purple/20',
  choice: 'bg-gradient-to-br from-horror-blood/20 to-horror-bloodLight/20',
  curse: 'bg-gradient-to-br from-horror-purple/20 to-horror-purpleLight/20',
  ending: 'bg-gradient-to-br from-horror-brown/20 to-horror-accent/20',
};

interface DraggableCardProps {
  card: StoryCard;
  onConnectClick?: (cardId: string) => void;
  connectingFrom?: string | null;
}

export default function DraggableCard({ card, onConnectClick, connectingFrom }: DraggableCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const { moveCard, setActiveCard, activeCardId, deleteCard } = useStoryStore();

  const Icon = cardIcons[card.type];
  const isActive = activeCardId === card.id;
  const isConnecting = connectingFrom === card.id;

  const getCardTitle = () => {
    switch (card.type) {
      case 'scene':
        return card.title || '未命名场景';
      case 'choice':
        return card.text || '未命名选择';
      case 'curse':
        return card.name || '未命名诅咒';
      case 'ending':
        return card.title || '未命名结局';
      default:
        return '卡片';
    }
  };

  const getCardSubtitle = () => {
    switch (card.type) {
      case 'scene':
        return card.isEntry ? '入口场景' : '场景';
      case 'choice':
        return `代价: ${card.cost}`;
      case 'curse':
        return `严重度: ${card.severity}`;
      case 'ending':
        return `类型: ${card.endingType}`;
      default:
        return '';
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.card-actions')) return;
    
    e.preventDefault();
    setIsDragging(true);
    setActiveCard(card.id);

    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = document.getElementById('editor-canvas');
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      const x = e.clientX - canvasRect.left - dragOffset.x;
      const y = e.clientY - canvasRect.top - dragOffset.y;

      moveCard(card.id, Math.max(0, x), Math.max(0, y));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, card.id, moveCard]);

  return (
    <div
      id={`card-${card.id}`}
      ref={cardRef}
      className={`absolute w-48 cursor-move select-none transition-all duration-150
        ${isDragging ? 'dragging z-50' : 'z-10'}
        ${isActive ? 'horror-card-active scale-105' : ''}
        ${isConnecting ? 'ring-2 ring-horror-accent animate-pulse' : ''}
        horror-card ${cardColors[card.type]} ${cardBgColors[card.type]}`}
      style={{
        left: card.x,
        top: card.y,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        setActiveCard(card.id);
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded ${
            card.type === 'scene' ? 'bg-horror-blue/50' :
            card.type === 'choice' ? 'bg-horror-blood/50' :
            card.type === 'curse' ? 'bg-horror-purple/50' :
            'bg-horror-accent/50'
          }`}>
            <Icon size={16} className="text-white" />
          </div>
          <span className="text-xs font-gothic text-horror-textMuted">
            {getCardSubtitle()}
          </span>
        </div>
        <div className="card-actions flex items-center gap-1">
          {onConnectClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConnectClick(card.id);
              }}
              className={`p-1 rounded transition-colors ${
                connectingFrom === card.id
                  ? 'bg-horror-accent/30 text-horror-accent'
                  : 'hover:bg-horror-blood/30'
              }`}
              title={connectingFrom === card.id ? '取消连接' : '连接到其他卡片'}
            >
              <Link size={14} className={connectingFrom === card.id ? 'text-horror-accent' : 'text-horror-textMuted hover:text-horror-accent'} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('确定删除此卡片吗？')) {
                deleteCard(card.id);
              }
            }}
            className="p-1 hover:bg-horror-blood/30 rounded transition-colors"
            title="删除卡片"
          >
            <X size={14} className="text-horror-textMuted hover:text-horror-bloodLight" />
          </button>
        </div>
      </div>
      <div className="font-gothic text-horror-text text-sm font-semibold truncate">
        {getCardTitle()}
      </div>
      {card.type === 'scene' && card.description && (
        <div className="text-xs text-horror-textMuted mt-1 line-clamp-2">
          {card.description}
        </div>
      )}
      {card.type === 'choice' && card.delayedConsequence && (
        <div className="text-xs text-horror-bloodLight mt-1 flex items-center gap-1">
          <Skull size={12} />
          延迟诅咒: {card.delayedConsequence.delayScenes} 幕
        </div>
      )}
    </div>
  );
}
