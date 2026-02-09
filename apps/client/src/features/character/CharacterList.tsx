import { useGameStore } from '../../store/gameStore';
import { PathfinderCharacter } from '@thecompany/shared-types';
import { Plus, Users, ScrollText } from 'lucide-react';
import { createBlankCharacter } from '../../utils/pf2e';
import { network } from '../../services/network';

interface CharacterListProps {
  onSelect: (character: PathfinderCharacter) => void;
  selectedId: string | null;
}

export const CharacterList = ({ onSelect, selectedId }: CharacterListProps) => {
  const characters = useGameStore(state => state.characters);
  const currentUser = useGameStore(state => state.currentUser);
  const addCharacter = useGameStore(state => state.addCharacter);

  const isGM = currentUser?.isGM ?? false;

  // Players see only their own characters; GM sees all
  const visibleCharacters = isGM
    ? characters
    : characters.filter(c => c.ownerId === currentUser?.id);

  const handleCreate = () => {
    if (!currentUser) return;
    const newChar = createBlankCharacter(crypto.randomUUID(), currentUser.id);
    newChar.name = `${currentUser.username}'s Character`;
    addCharacter(newChar);
    network.broadcastCharacterUpdate(newChar);
    onSelect(newChar);
  };

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-zinc-400" />
          <span className="text-xs font-bold text-zinc-400 uppercase">
            Characters ({visibleCharacters.length})
          </span>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
        >
          <Plus size={12} /> New
        </button>
      </div>

      <div className="space-y-1">
        {visibleCharacters.map(char => (
          <button
            key={char.id}
            onClick={() => onSelect(char)}
            className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
              selectedId === char.id
                ? 'bg-blue-600/20 border-blue-500 text-white'
                : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600'
            }`}
          >
            <div className="flex items-center gap-2">
              {char.imageUrl ? (
                <img src={char.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                  <ScrollText size={14} className="text-zinc-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{char.name}</div>
                <div className="text-[10px] text-zinc-500">
                  {char.ancestry && `${char.ancestry} `}
                  {char.class && `${char.class} `}
                  {char.level > 0 && `Lv ${char.level}`}
                </div>
              </div>
              {char.hp.max > 0 && (
                <div className="text-[10px] text-zinc-500">
                  {char.hp.current}/{char.hp.max}
                </div>
              )}
            </div>
          </button>
        ))}

        {visibleCharacters.length === 0 && (
          <p className="text-xs text-zinc-600 italic text-center py-6">
            No characters yet. Create one to get started!
          </p>
        )}
      </div>
    </div>
  );
};
