import { useState, useCallback, useRef, useEffect } from 'react';
import { PathfinderCharacter, ModifierBreakdown, ContextualRollResult, RollContextType } from '@thecompany/shared-types';
import { useGameStore } from '../../store/gameStore';
import { useCharacterSync } from './hooks/useCharacterSync';
import { useCharacterCalc } from './hooks/useCharacterCalc';
import { CharacterList } from './CharacterList';
import { StatsTab } from './tabs/StatsTab';
import { SkillsTab } from './tabs/SkillsTab';
import { FeatsTab } from './tabs/FeatsTab';
import { SpellsTab } from './tabs/SpellsTab';
import { InventoryTab } from './tabs/InventoryTab';
import { NotesTab } from './tabs/NotesTab';
import { diceService } from '../../services/diceService';
import { network } from '../../services/network';
import { X, ChevronLeft, Trash2 } from 'lucide-react';

const TABS = [
  { id: 'stats', label: 'Stats' },
  { id: 'skills', label: 'Skills' },
  { id: 'feats', label: 'Feats' },
  { id: 'spells', label: 'Spells' },
  { id: 'inventory', label: 'Inv.' },
  { id: 'notes', label: 'Notes' },
] as const;

type TabId = typeof TABS[number]['id'];

interface CharacterSheetProps {
  onClose: () => void;
}

export const CharacterSheet = ({ onClose }: CharacterSheetProps) => {
  const characters = useGameStore(state => state.characters);
  const currentUser = useGameStore(state => state.currentUser);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('stats');
  const { syncCharacter, deleteCharacter } = useCharacterSync();
  const syncTimeout = useRef<ReturnType<typeof setTimeout>>();

  const selectedCharacter = characters.find(c => c.id === selectedId) ?? null;
  const calc = useCharacterCalc(selectedCharacter);

  const canEdit = currentUser?.isGM || selectedCharacter?.ownerId === currentUser?.id;

  // Debounced sync — update local immediately, broadcast after 500ms
  const handleChange = useCallback((updated: PathfinderCharacter) => {
    useGameStore.getState().updateCharacter(updated);
    clearTimeout(syncTimeout.current);
    syncTimeout.current = setTimeout(() => {
      syncCharacter(updated);
    }, 500);
  }, [syncCharacter]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => clearTimeout(syncTimeout.current);
  }, []);

  const handleDelete = () => {
    if (!selectedCharacter) return;
    if (!confirm(`Delete ${selectedCharacter.name}?`)) return;
    deleteCharacter(selectedCharacter.id);
    setSelectedId(null);
  };

  const handleRoll = useCallback((label: string, modifier: number, breakdown: ModifierBreakdown[]) => {
    if (!selectedCharacter || !currentUser) return;

    // Determine roll type from label
    let rollType: RollContextType = 'flat';
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('check')) rollType = 'skill';
    else if (lowerLabel === 'perception') rollType = 'perception';
    else if (['fortitude', 'reflex', 'will'].some(s => lowerLabel.includes(s))) rollType = 'save';

    // Roll d20 + modifier
    const naturalRoll = Math.floor(Math.random() * 20) + 1;
    const totalResult = naturalRoll + modifier;

    const rollResult: ContextualRollResult = {
      uuid: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      equation: `d20${modifier >= 0 ? '+' : ''}${modifier}`,
      total_value: totalResult,
      values: [{ value: naturalRoll, type: 'd20', label: naturalRoll.toString() }],
      modifier,
      user: { uuid: currentUser.id, username: currentUser.username },
      is_local: true,
      external_id: currentUser.id,
      context: {
        type: rollType,
        label,
        characterName: selectedCharacter.name,
        modifierBreakdown: breakdown,
      },
    };

    // Trigger overlay
    diceService.replayRoll(rollResult);

    // Add to chat
    useGameStore.getState().addChatMessage({
      id: rollResult.uuid,
      sender: currentUser.username,
      content: `${label}: ${totalResult}`,
      type: 'contextual_roll',
      timestamp: Date.now(),
      color: currentUser.color,
      rollContext: rollResult.context,
    });

    // Broadcast to peers
    network.broadcastContextualRoll(rollResult);
    network.broadcast({
      type: 'CHAT_MESSAGE',
      payload: {
        id: rollResult.uuid,
        sender: currentUser.username,
        content: `${label}: ${totalResult}`,
        type: 'contextual_roll',
        timestamp: Date.now(),
        color: currentUser.color,
        rollContext: rollResult.context,
      },
    });
  }, [selectedCharacter, currentUser]);

  // ── Character List View ────────────────────────────────────
  if (!selectedCharacter) {
    return (
      <div className="h-full flex flex-col bg-zinc-900 border-l border-zinc-700">
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700">
          <span className="text-sm font-bold text-zinc-200">Character Sheets</span>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
        <CharacterList onSelect={(c) => setSelectedId(c.id)} selectedId={selectedId} />
      </div>
    );
  }

  // ── Character Sheet View ───────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-zinc-900 border-l border-zinc-700">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700">
        <button
          onClick={() => setSelectedId(null)}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex-1 min-w-0">
          <input
            value={selectedCharacter.name}
            onChange={(e) => canEdit && handleChange({ ...selectedCharacter, name: e.target.value })}
            readOnly={!canEdit}
            className="bg-transparent text-sm font-bold text-white w-full focus:outline-none"
          />
        </div>

        {canEdit && (
          <button onClick={handleDelete} className="p-1 rounded hover:bg-red-600/20 text-zinc-400 hover:text-red-400">
            <Trash2 size={14} />
          </button>
        )}

        <button onClick={onClose} className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white">
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-700 px-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {calc && activeTab === 'stats' && (
          <StatsTab character={selectedCharacter} calc={calc} onChange={handleChange} onRoll={handleRoll} />
        )}
        {calc && activeTab === 'skills' && (
          <SkillsTab character={selectedCharacter} calc={calc} onChange={handleChange} onRoll={handleRoll} />
        )}
        {activeTab === 'feats' && (
          <FeatsTab character={selectedCharacter} onChange={handleChange} />
        )}
        {activeTab === 'spells' && (
          <SpellsTab character={selectedCharacter} onChange={handleChange} />
        )}
        {activeTab === 'inventory' && (
          <InventoryTab character={selectedCharacter} onChange={handleChange} />
        )}
        {activeTab === 'notes' && (
          <NotesTab character={selectedCharacter} onChange={handleChange} />
        )}
      </div>
    </div>
  );
};
