import { PF2eConditionInstance } from '@thecompany/shared-types';
import { X, Plus } from 'lucide-react';
import { useState } from 'react';

// Core PF2e conditions
const CONDITION_LIST = [
  'Blinded', 'Broken', 'Clumsy', 'Concealed', 'Confused', 'Controlled',
  'Dazzled', 'Deafened', 'Doomed', 'Drained', 'Dying', 'Encumbered',
  'Enfeebled', 'Fascinated', 'Fatigued', 'Fleeing', 'Frightened',
  'Grabbed', 'Hidden', 'Immobilized', 'Invisible', 'Off-Guard',
  'Paralyzed', 'Petrified', 'Prone', 'Quickened', 'Restrained',
  'Sickened', 'Slowed', 'Stunned', 'Stupefied', 'Unconscious', 'Wounded',
];

const VALUE_CONDITIONS = new Set([
  'Clumsy', 'Doomed', 'Drained', 'Dying', 'Enfeebled', 'Frightened',
  'Sickened', 'Slowed', 'Stunned', 'Stupefied', 'Wounded',
]);

interface ConditionTrackerProps {
  conditions: PF2eConditionInstance[];
  onChange: (conditions: PF2eConditionInstance[]) => void;
}

export const ConditionTracker = ({ conditions, onChange }: ConditionTrackerProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');

  const addCondition = (name: string) => {
    const hasValue = VALUE_CONDITIONS.has(name);
    const newCondition: PF2eConditionInstance = {
      id: crypto.randomUUID(),
      name,
      value: hasValue ? 1 : undefined,
    };
    onChange([...conditions, newCondition]);
    setShowAdd(false);
    setSearch('');
  };

  const removeCondition = (id: string) => {
    onChange(conditions.filter(c => c.id !== id));
  };

  const updateValue = (id: string, value: number) => {
    onChange(conditions.map(c => c.id === id ? { ...c, value: Math.max(0, value) } : c));
  };

  const filtered = CONDITION_LIST.filter(
    c => c.toLowerCase().includes(search.toLowerCase()) &&
    !conditions.some(cc => cc.name === c)
  );

  return (
    <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-zinc-400 uppercase">Conditions</span>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Active Conditions */}
      <div className="flex flex-wrap gap-1">
        {conditions.length === 0 && (
          <span className="text-xs text-zinc-600 italic">None</span>
        )}
        {conditions.map(c => (
          <div key={c.id} className="flex items-center gap-1 bg-zinc-700 rounded px-2 py-0.5 text-xs">
            <span className="text-orange-400">{c.name}</span>
            {c.value !== undefined && (
              <input
                type="number"
                value={c.value}
                onChange={(e) => updateValue(c.id, parseInt(e.target.value) || 0)}
                className="w-6 text-center bg-transparent text-orange-300 font-bold"
              />
            )}
            <button onClick={() => removeCondition(c.id)} className="text-zinc-500 hover:text-red-400">
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Add Condition Dropdown */}
      {showAdd && (
        <div className="mt-2 border border-zinc-600 rounded bg-zinc-900 p-2 max-h-40 overflow-y-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search condition..."
            className="w-full bg-zinc-800 text-sm text-white rounded px-2 py-1 mb-1 border border-zinc-700"
            autoFocus
          />
          {filtered.map(name => (
            <button
              key={name}
              onClick={() => addCondition(name)}
              className="block w-full text-left text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 px-2 py-1 rounded"
            >
              {name} {VALUE_CONDITIONS.has(name) && <span className="text-zinc-500">(value)</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
