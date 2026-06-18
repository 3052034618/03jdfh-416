import { useState } from 'react';
import { MapPin, MousePointer2, Skull, BookOpen, Download, Upload, Trash2, Play } from 'lucide-react';
import { useStoryStore } from '@/store/useStoryStore';
import type { CardType } from '@/types/story';

interface CardTemplate {
  type: CardType;
  icon: typeof MapPin;
  title: string;
  description: string;
  color: string;
}

const cardTemplates: CardTemplate[] = [
  {
    type: 'scene',
    icon: MapPin,
    title: '场景',
    description: '描述玩家所处的环境和氛围',
    color: 'from-horror-blue to-horror-purple',
  },
  {
    type: 'choice',
    icon: MousePointer2,
    title: '选择',
    description: '玩家可以做出的行动决定',
    color: 'from-horror-blood to-horror-bloodLight',
  },
  {
    type: 'curse',
    icon: Skull,
    title: '诅咒效果',
    description: '延迟触发的恐怖后果',
    color: 'from-horror-purple to-horror-purpleLight',
  },
  {
    type: 'ending',
    icon: BookOpen,
    title: '结局',
    description: '故事的终结和回扣',
    color: 'from-horror-brown to-horror-accent',
  },
];

export default function CardPanel() {
  const [draggingType, setDraggingType] = useState<CardType | null>(null);
  const { loadDemoStory, resetAll, cards } = useStoryStore();

  const handleDragStart = (e: React.DragEvent, type: CardType) => {
    setDraggingType(type);
    e.dataTransfer.setData('cardType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggingType(null);
  };

  const handleExport = () => {
    const data = useStoryStore.getState();
    const exportData = {
      cards: data.cards,
      connections: data.connections,
      narrativeElements: data.narrativeElements,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'curse-story.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            useStoryStore.getState().importStory(data);
          } catch (err) {
            console.error('导入失败', err);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="w-64 bg-horror-surface border-r border-horror-border p-4 flex flex-col gap-4 overflow-y-auto">
      <div className="text-center mb-2">
        <h2 className="font-gothic text-xl text-horror-text text-shadow-blood">
          卡片面板
        </h2>
        <p className="text-xs text-horror-textMuted mt-1">
          拖拽卡片到画布上
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {cardTemplates.map((template) => {
          const Icon = template.icon;
          return (
            <div
              key={template.type}
              draggable
              onDragStart={(e) => handleDragStart(e, template.type)}
              onDragEnd={handleDragEnd}
              className={`horror-card cursor-grab active:cursor-grabbing transition-all duration-200 ${
                draggingType === template.type ? 'dragging' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg bg-gradient-to-br ${template.color} shadow-haunt`}
                >
                  <Icon size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-gothic text-horror-text font-semibold">
                    {template.title}
                  </h3>
                  <p className="text-xs text-horror-textMuted mt-1">
                    {template.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-horror-border pt-4 mt-auto">
        <h3 className="font-gothic text-horror-text mb-3 text-sm">快捷操作</h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => loadDemoStory()}
            className="horror-btn flex items-center justify-center gap-2 text-sm"
          >
            <Play size={16} />
            加载示例剧情
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="horror-btn flex-1 flex items-center justify-center gap-1 text-xs"
              disabled={cards.length === 0}
            >
              <Download size={14} />
              导出
            </button>
            <button
              onClick={handleImport}
              className="horror-btn flex-1 flex items-center justify-center gap-1 text-xs"
            >
              <Upload size={14} />
              导入
            </button>
          </div>
          <button
            onClick={() => {
              if (confirm('确定要清空所有内容吗？此操作不可撤销。')) {
                resetAll();
              }
            }}
            className="horror-btn flex items-center justify-center gap-2 text-sm text-horror-bloodLight border-horror-blood hover:bg-horror-blood/20"
          >
            <Trash2 size={16} />
            清空画布
          </button>
        </div>
      </div>
    </div>
  );
}
