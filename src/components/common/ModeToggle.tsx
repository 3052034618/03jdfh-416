import { useNavigate, useLocation } from 'react-router-dom';
import { Edit, Play, BarChart3 } from 'lucide-react';
import { useStoryStore } from '@/store/useStoryStore';
import type { Mode } from '@/types/story';

const modes: { mode: Mode; path: string; icon: typeof Edit; label: string }[] = [
  { mode: 'edit', path: '/', icon: Edit, label: '编辑模式' },
  { mode: 'display', path: '/display', icon: Play, label: '课堂展示' },
  { mode: 'analysis', path: '/analysis', icon: BarChart3, label: '评分分析' },
];

export default function ModeToggle() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setMode, cards } = useStoryStore();

  const currentMode = modes.find(m => m.path === location.pathname)?.mode || 'edit';

  const handleModeChange = (mode: Mode, path: string) => {
    if (mode !== 'edit' && cards.length === 0) {
      alert('请先创建剧情内容！');
      return;
    }
    
    const entryScene = cards.find(c => c.type === 'scene' && (c as { isEntry: boolean }).isEntry);
    if (mode !== 'edit' && !entryScene) {
      alert('请先设置一个入口场景！');
      return;
    }

    setMode(mode);
    navigate(path);
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex bg-horror-surface/95 backdrop-blur-sm rounded-lg border border-horror-border shadow-haunt p-1">
      {modes.map(({ mode, path, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => handleModeChange(mode, path)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 ${
            currentMode === mode
              ? 'bg-horror-blood text-white shadow-blood'
              : 'text-horror-textMuted hover:text-horror-text hover:bg-horror-card'
          }`}
        >
          <Icon size={18} />
          <span className="font-gothic text-sm">{label}</span>
        </button>
      ))}
    </div>
  );
}
