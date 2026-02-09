import { useEffect, useState } from 'react';
import { storageService, CampaignMetadata } from '../../services/storage';
import { useGameStore } from '../../store/gameStore';
import { Plus, Trash2, FolderOpen, Zap } from 'lucide-react';

interface LobbyScreenProps {
  onStart: () => void;
}

export const LobbyScreen = ({ onStart }: LobbyScreenProps) => {
  const [campaigns, setCampaigns] = useState<CampaignMetadata[]>([]);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadSession = useGameStore(state => state.loadSession);
  const createSession = useGameStore(state => state.createSession);

  useEffect(() => {
    refreshList();
  }, []);

  const refreshList = async () => {
    const list = await storageService.listCampaigns();
    setCampaigns(list);
  };

  const handleCreate = () => {
    if (!newCampaignName.trim()) return;
    createSession(newCampaignName, false);
    onStart();
  };

  const handleLoad = async (id: string) => {
    const data = await storageService.loadCampaign(id);
    if (data) {
        loadSession(data);
        onStart();
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this campaign permanently?')) {
        await storageService.deleteCampaign(id);
        refreshList();
    }
  };

  const handleTempSession = () => {
    createSession('Temporary Room', true);
    onStart();
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 space-y-6">
      <h2 className="text-xl font-bold text-zinc-100">Campaign Manager</h2>

      {/* Campaign List */}
      <div className="w-full max-w-md space-y-2 max-h-[360px] overflow-y-auto pr-1">
        {campaigns.map(camp => (
            <div 
                key={camp.id}
                onClick={() => handleLoad(camp.id)}
                className="card p-4 flex items-center justify-between cursor-pointer hover:bg-surface-4 transition-colors group"
            >
                <div>
                    <h3 className="font-semibold text-sm text-zinc-200">{camp.name}</h3>
                    <p className="text-[11px] text-zinc-600 mt-0.5">
                      Last played: {new Date(camp.lastPlayed).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="btn-ghost !p-1.5 text-brand-400">
                       <FolderOpen size={15} />
                    </button>
                    <button 
                        onClick={(e) => handleDelete(e, camp.id)}
                        className="btn-ghost !p-1.5 text-red-400 hover:bg-red-500/10"
                    >
                       <Trash2 size={15} />
                    </button>
                </div>
            </div>
        ))}

        {campaigns.length === 0 && (
            <div className="text-center text-zinc-600 py-10 text-sm">
                No saved campaigns yet.
            </div>
        )}
      </div>

      {/* Actions */}
      <div className="w-full max-w-md space-y-3">
         {!isCreating ? (
            <button 
                onClick={() => setIsCreating(true)}
                className="btn-primary w-full"
            >
                <Plus size={16} />
                New Campaign
            </button>
         ) : (
            <div className="flex gap-2">
                <input 
                    type="text"
                    autoFocus
                    placeholder="Campaign Name..."
                    className="input flex-1"
                    value={newCampaignName}
                    onChange={e => setNewCampaignName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
                <button onClick={handleCreate} className="btn-primary !px-5">
                    Create
                </button>
                <button onClick={() => setIsCreating(false)} className="btn-ghost">
                    Cancel
                </button>
            </div>
         )}

         <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-zinc-600">or</span>
            <div className="flex-1 h-px bg-border" />
         </div>

         <button 
            onClick={handleTempSession}
            className="btn-ghost w-full border border-border"
         >
            <Zap size={15} />
            Quick Session (No Save)
         </button>
      </div>
    </div>
  );
};