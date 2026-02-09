import { PathfinderCharacter, FeatEntry } from '@thecompany/shared-types';
import { Plus, Trash2, Search } from 'lucide-react';
import { useState } from 'react';

const FEAT_TYPE_COLORS: Record<string, string> = {
  ancestry: 'bg-emerald-700',
  class: 'bg-blue-700',
  skill: 'bg-purple-700',
  general: 'bg-zinc-600',
  bonus: 'bg-yellow-700',
};

interface FeatsTabProps {
  character: PathfinderCharacter;
  onChange: (updated: PathfinderCharacter) => void;
}

export const FeatsTab = ({ character, onChange }: FeatsTabProps) => {
  const [filter, setFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newFeat, setNewFeat] = useState<Partial<FeatEntry>>({
    name: '',
    level: 1,
    type: 'class',
  });

  const addFeat = () => {
    if (!newFeat.name?.trim()) return;
    const feat: FeatEntry = {
      featId: crypto.randomUUID(),
      name: newFeat.name.trim(),
      level: newFeat.level ?? 1,
      type: newFeat.type ?? 'class',
      source: newFeat.source,
    };
    onChange({ ...character, feats: [...character.feats, feat] });
    setNewFeat({ name: '', level: 1, type: 'class' });
    setShowAdd(false);
  };

  const removeFeat = (featId: string) => {
    onChange({ ...character, feats: character.feats.filter(f => f.featId !== featId) });
  };

  const grouped = {
    ancestry: character.feats.filter(f => f.type === 'ancestry'),
    class: character.feats.filter(f => f.type === 'class'),
    skill: character.feats.filter(f => f.type === 'skill'),
    general: character.feats.filter(f => f.type === 'general'),
    bonus: character.feats.filter(f => f.type === 'bonus'),
  };

  const filteredGroups = Object.entries(grouped).map(([type, feats]) => ({
    type,
    feats: feats.filter(f => f.name.toLowerCase().includes(filter.toLowerCase())),
  })).filter(g => g.feats.length > 0);

  return (
    <div className="p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-180px)]">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search feats..."
          className="w-full pl-7 pr-2 py-1.5 bg-zinc-800 text-sm text-white rounded border border-zinc-700"
        />
      </div>

      {/* Grouped Feats */}
      {filteredGroups.map(({ type, feats }) => (
        <div key={type}>
          <h3 className="text-[10px] font-bold uppercase text-zinc-500 mb-1">
            {type} Feats ({feats.length})
          </h3>
          <div className="space-y-1">
            {feats.map(feat => (
              <div key={feat.featId} className="bg-zinc-800 rounded px-3 py-2 border border-zinc-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${FEAT_TYPE_COLORS[feat.type]} text-white`}>
                    {feat.level}
                  </span>
                  <span className="text-sm text-zinc-200">{feat.name}</span>
                  {feat.source && <span className="text-[10px] text-zinc-600">{feat.source}</span>}
                </div>
                <button onClick={() => removeFeat(feat.featId)} className="text-zinc-600 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {character.feats.length === 0 && !showAdd && (
        <p className="text-sm text-zinc-600 italic text-center py-4">No feats yet</p>
      )}

      {/* Add Feat */}
      {showAdd ? (
        <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700 space-y-2">
          <input
            type="text"
            value={newFeat.name || ''}
            onChange={(e) => setNewFeat({ ...newFeat, name: e.target.value })}
            placeholder="Feat name"
            className="w-full bg-zinc-700 text-sm text-white rounded px-2 py-1 border border-zinc-600"
            autoFocus
          />
          <div className="flex gap-2">
            <select
              value={newFeat.type}
              onChange={(e) => setNewFeat({ ...newFeat, type: e.target.value as FeatEntry['type'] })}
              className="flex-1 bg-zinc-700 text-sm text-white rounded px-2 py-1 border border-zinc-600"
            >
              <option value="ancestry">Ancestry</option>
              <option value="class">Class</option>
              <option value="skill">Skill</option>
              <option value="general">General</option>
              <option value="bonus">Bonus</option>
            </select>
            <input
              type="number"
              value={newFeat.level ?? 1}
              onChange={(e) => setNewFeat({ ...newFeat, level: parseInt(e.target.value) || 1 })}
              className="w-16 bg-zinc-700 text-sm text-white rounded px-2 py-1 border border-zinc-600"
              placeholder="Lvl"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={addFeat} className="flex-1 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500">
              Add Feat
            </button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-1 text-zinc-400 hover:text-white text-xs">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-blue-400"
        >
          <Plus size={12} /> Add Feat
        </button>
      )}
    </div>
  );
};
