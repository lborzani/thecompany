import { PathfinderCharacter } from '@thecompany/shared-types';

interface NotesTabProps {
  character: PathfinderCharacter;
  onChange: (updated: PathfinderCharacter) => void;
}

export const NotesTab = ({ character, onChange }: NotesTabProps) => {
  return (
    <div className="p-3 h-full flex flex-col">
      <h3 className="text-xs font-bold text-zinc-400 uppercase mb-2">Character Notes</h3>
      <textarea
        value={character.notes}
        onChange={(e) => onChange({ ...character, notes: e.target.value })}
        placeholder="Write notes, backstory, session logs..."
        className="flex-1 w-full bg-zinc-800 text-sm text-zinc-200 rounded-lg p-3 border border-zinc-700 resize-none min-h-[300px] focus:outline-none focus:border-blue-500"
      />
    </div>
  );
};
