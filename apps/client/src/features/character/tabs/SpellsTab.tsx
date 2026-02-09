import { PathfinderCharacter, SpellSlot, PreparedSpell } from '@thecompany/shared-types';
import { Plus, Trash2, Zap } from 'lucide-react';
import { useState } from 'react';

interface SpellsTabProps {
  character: PathfinderCharacter;
  onChange: (updated: PathfinderCharacter) => void;
}

export const SpellsTab = ({ character, onChange }: SpellsTabProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newSpell, setNewSpell] = useState<Partial<PreparedSpell>>({
    name: '',
    level: 0,
  });

  const slots = character.spellSlots ?? [];
  const spells = character.preparedSpells ?? [];
  const focus = character.focusPoints ?? { max: 0, current: 0 };

  const updateSlot = (level: number, field: 'total' | 'used', value: number) => {
    const updated = slots.map(s =>
      s.level === level ? { ...s, [field]: Math.max(0, value) } : s
    );
    onChange({ ...character, spellSlots: updated });
  };

  const addSlotLevel = () => {
    const nextLevel = slots.length > 0 ? Math.max(...slots.map(s => s.level)) + 1 : 1;
    if (nextLevel > 10) return;
    onChange({ ...character, spellSlots: [...slots, { level: nextLevel, total: 0, used: 0 }] });
  };

  const removeSlotLevel = (level: number) => {
    onChange({ ...character, spellSlots: slots.filter(s => s.level !== level) });
  };

  const addSpell = () => {
    if (!newSpell.name?.trim()) return;
    const spell: PreparedSpell = {
      spellId: crypto.randomUUID(),
      name: newSpell.name.trim(),
      level: newSpell.level ?? 0,
    };
    onChange({ ...character, preparedSpells: [...spells, spell] });
    setNewSpell({ name: '', level: 0 });
    setShowAdd(false);
  };

  const removeSpell = (spellId: string) => {
    onChange({ ...character, preparedSpells: spells.filter(s => s.spellId !== spellId) });
  };

  const castSpell = (spell: PreparedSpell) => {
    const slotLevel = spell.heightened ?? spell.level;
    const slot = slots.find(s => s.level === slotLevel);
    if (slot && slot.used < slot.total) {
      updateSlot(slotLevel, 'used', slot.used + 1);
    }
  };

  const spellsByLevel = spells.reduce<Record<number, PreparedSpell[]>>((acc, s) => {
    const lvl = s.level;
    if (!acc[lvl]) acc[lvl] = [];
    acc[lvl].push(s);
    return acc;
  }, {});

  return (
    <div className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-180px)]">
      {/* Tradition & Ability */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-zinc-500 uppercase">Tradition</label>
          <input
            value={character.spellcastingTradition ?? ''}
            onChange={(e) => onChange({ ...character, spellcastingTradition: e.target.value })}
            className="w-full bg-zinc-800 text-sm text-white rounded px-2 py-1 border border-zinc-700"
            placeholder="Arcane, Divine..."
          />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 uppercase">Spell Ability</label>
          <select
            value={character.spellcastingAbility ?? ''}
            onChange={(e) => onChange({ ...character, spellcastingAbility: e.target.value as PathfinderCharacter['spellcastingAbility'] })}
            className="w-full bg-zinc-800 text-sm text-white rounded px-2 py-1 border border-zinc-700"
          >
            <option value="">None</option>
            <option value="int">Intelligence</option>
            <option value="wis">Wisdom</option>
            <option value="cha">Charisma</option>
          </select>
        </div>
      </div>

      {/* Focus Points */}
      <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-zinc-400 uppercase">Focus Points</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={focus.current}
            onChange={(e) => onChange({ ...character, focusPoints: { ...focus, current: Math.max(0, parseInt(e.target.value) || 0) } })}
            className="w-10 text-center bg-zinc-700 text-white rounded border border-zinc-600 text-sm"
          />
          <span className="text-zinc-500">/</span>
          <input
            type="number"
            value={focus.max}
            onChange={(e) => onChange({ ...character, focusPoints: { ...focus, max: Math.max(0, parseInt(e.target.value) || 0) } })}
            className="w-10 text-center bg-zinc-700 text-zinc-400 rounded border border-zinc-600 text-sm"
          />
        </div>
      </div>

      {/* Spell Slots */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-zinc-400 uppercase">Spell Slots</h3>
          <button onClick={addSlotLevel} className="text-xs text-zinc-400 hover:text-blue-400 flex items-center gap-1">
            <Plus size={12} /> Level
          </button>
        </div>
        <div className="space-y-1">
          {slots.map(slot => (
            <SlotRow key={slot.level} slot={slot} onUpdate={updateSlot} onRemove={removeSlotLevel} />
          ))}
          {slots.length === 0 && (
            <p className="text-xs text-zinc-600 italic">No spell slots</p>
          )}
        </div>
      </div>

      {/* Spells Known/Prepared */}
      <div>
        <h3 className="text-xs font-bold text-zinc-400 uppercase mb-2">Spells</h3>

        {Object.entries(spellsByLevel)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([level, levelSpells]) => (
            <div key={level} className="mb-2">
              <h4 className="text-[10px] text-zinc-500 mb-1">
                {Number(level) === 0 ? 'Cantrips' : `Level ${level}`}
              </h4>
              <div className="space-y-0.5">
                {levelSpells.map(spell => (
                  <div key={spell.spellId} className="bg-zinc-800 rounded px-2 py-1.5 border border-zinc-700 flex items-center justify-between">
                    <span className="text-sm text-zinc-200">{spell.name}</span>
                    <div className="flex items-center gap-1">
                      {Number(level) > 0 && (
                        <button
                          onClick={() => castSpell(spell)}
                          className="p-1 rounded hover:bg-purple-600 text-zinc-400 hover:text-white"
                          title="Cast (use slot)"
                        >
                          <Zap size={12} />
                        </button>
                      )}
                      <button onClick={() => removeSpell(spell.spellId)} className="text-zinc-600 hover:text-red-400">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

        {spells.length === 0 && !showAdd && (
          <p className="text-xs text-zinc-600 italic text-center py-2">No spells</p>
        )}

        {showAdd ? (
          <div className="bg-zinc-800 rounded-lg p-2 border border-zinc-700 space-y-2 mt-2">
            <input
              type="text"
              value={newSpell.name || ''}
              onChange={(e) => setNewSpell({ ...newSpell, name: e.target.value })}
              placeholder="Spell name"
              className="w-full bg-zinc-700 text-sm text-white rounded px-2 py-1 border border-zinc-600"
              autoFocus
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={newSpell.level ?? 0}
                onChange={(e) => setNewSpell({ ...newSpell, level: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-16 bg-zinc-700 text-sm text-white rounded px-2 py-1 border border-zinc-600"
                placeholder="Level"
              />
              <button onClick={addSpell} className="flex-1 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500">
                Add
              </button>
              <button onClick={() => setShowAdd(false)} className="text-zinc-400 text-xs">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-blue-400 mt-2"
          >
            <Plus size={12} /> Add Spell
          </button>
        )}
      </div>
    </div>
  );
};

// ── Slot Row Sub-component ──────────────────────────────────

function SlotRow({ slot, onUpdate, onRemove }: {
  slot: SpellSlot;
  onUpdate: (level: number, field: 'total' | 'used', value: number) => void;
  onRemove: (level: number) => void;
}) {
  const remaining = slot.total - slot.used;

  return (
    <div className="bg-zinc-800 rounded px-2 py-1.5 border border-zinc-700 flex items-center justify-between">
      <span className="text-xs text-zinc-400 w-14">Level {slot.level}</span>
      <div className="flex items-center gap-1">
        {Array.from({ length: slot.total }, (_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border ${
              i < remaining ? 'bg-purple-500 border-purple-400' : 'bg-zinc-700 border-zinc-600'
            } cursor-pointer`}
            onClick={() => onUpdate(slot.level, 'used', i < remaining ? slot.total - i : slot.total - i - 1)}
          />
        ))}
        <input
          type="number"
          value={slot.total}
          onChange={(e) => onUpdate(slot.level, 'total', parseInt(e.target.value) || 0)}
          className="w-8 text-center text-[10px] bg-zinc-700 text-zinc-400 rounded border border-zinc-600 ml-2"
        />
        <button onClick={() => onRemove(slot.level)} className="text-zinc-600 hover:text-red-400 ml-1">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
