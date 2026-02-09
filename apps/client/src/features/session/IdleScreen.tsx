import { useState } from 'react';
import { Play, Plug, Dices, Loader2 } from 'lucide-react';

interface IdleScreenProps {
  onHost: () => void;
  onJoin: (hostId: string) => void;
  isLoading: boolean;
}

export const IdleScreen = ({ onHost, onJoin, isLoading }: IdleScreenProps) => {
  const [targetHostId, setTargetHostId] = useState('');

  return (
    <div className="h-screen w-screen bg-surface-0 flex items-center justify-center relative overflow-hidden">
      {/* Subtle radial gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.08)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(139,92,246,0.05)_0%,_transparent_50%)]" />

      <div className="relative z-10 max-w-sm w-full mx-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600/15 border border-brand-500/20 mb-5">
            <Dices size={28} className="text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            The Company <span className="text-brand-400">VTT</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1.5">Peer-to-peer virtual tabletop</p>
        </div>

        {/* Main actions */}
        <div className="space-y-3">
          <button
            onClick={onHost}
            disabled={isLoading}
            className="btn-primary w-full !py-3.5 text-base"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
            Host Campaign
          </button>

          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-zinc-600 font-medium">or join a session</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Paste Session ID..."
              className="input flex-1 font-mono text-xs"
              value={targetHostId}
              onChange={(e) => setTargetHostId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onJoin(targetHostId)}
            />
            <button
              onClick={() => onJoin(targetHostId)}
              disabled={isLoading || !targetHostId}
              className="btn-primary !px-5"
            >
              <Plug size={16} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-zinc-700 mt-8">
          No account needed &middot; WebRTC encrypted &middot; No server required
        </p>
      </div>
    </div>
  );
};
