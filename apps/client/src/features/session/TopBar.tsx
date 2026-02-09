import { useRef } from 'react';
import {
  Clipboard, Check, Users, Upload, LogOut, ScrollText,
  MessageSquare, Dices, Radio,
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { network } from '../../services/network';
import { MapState } from '@thecompany/shared-types';
import { useState } from 'react';

interface TopBarProps {
  hostId: string;
  sessionState: 'hosting' | 'connected';
  onLeave: () => void;
  onToggleChat: () => void;
  onToggleCharSheet: () => void;
  onTogglePlayers: () => void;
  showChat: boolean;
  showCharSheet: boolean;
}

export const TopBar = ({
  hostId,
  sessionState,
  onLeave,
  onToggleChat,
  onToggleCharSheet,
  onTogglePlayers,
  showChat,
  showCharSheet,
}: TopBarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const campaignName = useGameStore(state => state.campaignName);
  const currentUser = useGameStore(state => state.currentUser);
  const users = useGameStore(state => state.users);
  const [copied, setCopied] = useState(false);

  const isGM = sessionState === 'hosting' || currentUser?.isGM;
  const connectedCount = users.length;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(hostId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMapUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Map too large! Please use images under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const mapState: MapState = { imageUrl: base64, offset: { x: 0, y: 0 }, scale: 1 };
      network.broadcastMapUpdate(mapState);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="h-11 flex-shrink-0 flex items-center gap-1 px-2 bg-surface-2 border-b border-border select-none">
      {/* Brand */}
      <div className="flex items-center gap-2 pr-3 border-r border-border mr-1">
        <Dices size={18} className="text-brand-400" />
        <span className="text-xs font-bold text-zinc-400 tracking-wider hidden sm:inline">TC</span>
      </div>

      {/* Campaign name */}
      <div className="flex items-center gap-2 px-2">
        <span className="text-sm font-semibold text-zinc-200 truncate max-w-[200px]">
          {campaignName}
        </span>
      </div>

      {/* Session ID (GM only) */}
      {sessionState === 'hosting' && (
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all"
          title="Click to copy Session ID"
        >
          <Radio size={10} className="text-emerald-500 animate-pulse" />
          <code className="font-mono text-[11px] max-w-[120px] truncate">{hostId}</code>
          {copied ? <Check size={12} className="text-emerald-400" /> : <Clipboard size={12} />}
        </button>
      )}

      {/* Connected users */}
      <div className="flex items-center gap-1 px-2 text-xs text-zinc-500">
        <Users size={13} />
        <span>{connectedCount}</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Player identity (non-GM) */}
      {!isGM && currentUser && (
        <div className="flex items-center gap-1.5 px-2 mr-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentUser.color }} />
          <span className="text-xs text-zinc-400">{currentUser.username}</span>
        </div>
      )}

      {/* GM Tools */}
      {isGM && (
        <>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleMapUpload} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-ghost !px-2 !py-1.5"
            title="Upload Map"
          >
            <Upload size={15} />
          </button>
          <button onClick={onTogglePlayers} className="btn-ghost !px-2 !py-1.5" title="Manage Players">
            <Users size={15} />
          </button>
        </>
      )}

      {/* Toggle buttons */}
      <div className="flex items-center gap-0.5 border-l border-border ml-1 pl-1">
        <button
          onClick={onToggleChat}
          className={`btn-ghost !px-2 !py-1.5 ${showChat ? 'text-brand-400 bg-brand-500/10' : ''}`}
          title="Toggle Chat"
        >
          <MessageSquare size={15} />
        </button>

        <button
          onClick={onToggleCharSheet}
          className={`btn-ghost !px-2 !py-1.5 ${showCharSheet ? 'text-brand-400 bg-brand-500/10' : ''}`}
          title="Character Sheets"
        >
          <ScrollText size={15} />
        </button>
      </div>

      {/* Leave */}
      <button
        onClick={() => { if (confirm('Leave session?')) onLeave(); }}
        className="ml-1 btn-ghost !px-2 !py-1.5 text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
        title={sessionState === 'hosting' ? 'Stop Session' : 'Disconnect'}
      >
        <LogOut size={15} />
      </button>
    </div>
  );
};
