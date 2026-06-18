import ModeToggle from '@/components/common/ModeToggle';
import PlayerView from '@/components/display/PlayerView';

export default function DisplayPage() {
  return (
    <div className="min-h-screen bg-horror-bg">
      <ModeToggle />
      <div className="pt-16">
        <PlayerView />
      </div>
    </div>
  );
}
