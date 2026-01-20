import { useEffect, useState } from 'react';
import { storageService, CampaignMetadata } from '../../services/storage';
import { useGameStore } from '../../store/gameStore';
import { Play, Plus, Trash2, FolderOpen } from 'lucide-react';

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
    if (confirm('Are you sure you want to delete this campaign?')) {
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
      <h2 className="text-2xl font-bold text-white">Campaign Manager</h2>

      {/* Campaign List */}
      <div className="w-full max-w-md space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {campaigns.map(camp => (
            <div 
                key={camp.id}
                onClick={() => handleLoad(camp.id)}
                className="bg-zinc-800 p-4 rounded-lg flex items-center justify-between cursor-pointer hover:bg-zinc-700 transition-colors border border-zinc-700"
            >
                <div>
                    <h3 className="font-bold text-white">{camp.name}</h3>
                    <p className="text-xs text-zinc-400">Last played: {new Date(camp.lastPlayed).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                    <button className="text-blue-400 hover:text-blue-300 p-2">
                       <FolderOpen size={18} />
                    </button>
                    <button 
                        onClick={(e) => handleDelete(e, camp.id)}
                        className="text-red-400 hover:text-red-300 p-2"
                    >
                       <Trash2 size={18} />
                    </button>
                </div>
            </div>
        ))}

        {campaigns.length === 0 && (
            <div className="text-center text-zinc-500 py-8 italic">
                No saved campaigns found.
            </div>
        )}
      </div>

      {/* Actions */}
      <div className="w-full max-w-md space-y-3">
         {!isCreating ? (
            <button 
                onClick={() => setIsCreating(true)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 font-medium"
            >
                <Plus size={18} />
                Create New Campaign (Persistent)
            </button>
         ) : (
            <div className="flex gap-2">
                <input 
                    type="text"
                    autoFocus
                    placeholder="Enter Campaign Name..."
                    className="flex-1 bg-zinc-900 border border-zinc-600 rounded px-4 text-white outline-none focus:border-blue-500"
                    value={newCampaignName}
                    onChange={e => setNewCampaignName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
                <button 
                    onClick={handleCreate}
                    className="bg-green-600 px-4 rounded hover:bg-green-500 text-white"
                >
                    Create
                </button>
                 <button 
                    onClick={() => setIsCreating(false)}
                    className="bg-zinc-700 px-4 rounded hover:bg-zinc-600 text-zinc-300"
                >
                    Cancel
                </button>
            </div>
         )}

         <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-700"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-zinc-900 text-zinc-500">OR</span></div>
         </div>

         <button 
            onClick={handleTempSession}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-300 rounded-lg flex items-center justify-center gap-2 text-sm"
         >
            <Play size={16} />
            Start Temporary Session (No Save)
         </button>
      </div>
    </div>
  );
};