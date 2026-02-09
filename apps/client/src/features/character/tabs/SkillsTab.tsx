import { PathfinderCharacter, SkillName, ProficiencyRank, SKILL_ABILITY_MAP, ALL_SKILLS } from '@thecompany/shared-types';
import { ProficiencyBadge } from '../components/ProficiencyBadge';
import { RollButton } from '../components/RollButton';
import { CalculatedStats } from '../hooks/useCharacterCalc';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';

const ABILITY_SHORT: Record<string, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
};

const RANK_ORDER: ProficiencyRank[] = ['untrained', 'trained', 'expert', 'master', 'legendary'];

function cycleRank(current: ProficiencyRank): ProficiencyRank {
  const idx = RANK_ORDER.indexOf(current);
  return RANK_ORDER[(idx + 1) % RANK_ORDER.length];
}

interface SkillsTabProps {
  character: PathfinderCharacter;
  calc: CalculatedStats;
  onChange: (updated: PathfinderCharacter) => void;
  onRoll: (label: string, modifier: number, breakdown: { source: string; value: number }[]) => void;
}

export const SkillsTab = ({ character, calc, onChange, onRoll }: SkillsTabProps) => {
  const [filter, setFilter] = useState('');
  const [loreName, setLoreName] = useState('');
  const [showAddLore, setShowAddLore] = useState(false);

  const changeRank = (skillKey: string, newRank: ProficiencyRank) => {
    onChange({
      ...character,
      skills: {
        ...character.skills,
        [skillKey]: { ...character.skills[skillKey], rank: newRank },
      },
    });
  };

  const addLore = () => {
    if (!loreName.trim()) return;
    const key = `lore_${loreName.toLowerCase().replace(/\s+/g, '_')}`;
    onChange({
      ...character,
      skills: {
        ...character.skills,
        [key]: { rank: 'trained', loreType: loreName.trim() },
      },
    });
    setLoreName('');
    setShowAddLore(false);
  };

  // Combine ALL_SKILLS with lore skills  
  const allSkillKeys = [
    ...ALL_SKILLS,
    ...Object.keys(character.skills).filter(k => k.startsWith('lore_')),
  ];

  const filteredSkills = allSkillKeys.filter(k =>
    k.toLowerCase().includes(filter.toLowerCase()) ||
    (character.skills[k]?.loreType?.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-180px)]">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter skills..."
          className="w-full pl-7 pr-2 py-1.5 bg-zinc-800 text-sm text-white rounded border border-zinc-700"
        />
      </div>

      {/* Skills List */}
      <div className="space-y-0.5">
        {filteredSkills.map(skillKey => {
          const skillData = character.skills[skillKey];
          if (!skillData) return null;

          const isLore = skillKey.startsWith('lore_');
          const displayName = isLore
            ? `Lore (${skillData.loreType || skillKey.replace('lore_', '')})`
            : skillKey.charAt(0).toUpperCase() + skillKey.slice(1);

          const abilityKey = isLore ? 'int' : SKILL_ABILITY_MAP[skillKey as SkillName];
          const calcData = calc.skills[skillKey] || { total: 0, breakdown: [] };

          return (
            <div
              key={skillKey}
              className="bg-zinc-800 rounded px-2 py-1.5 border border-zinc-700 flex items-center justify-between"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <ProficiencyBadge
                  rank={skillData.rank}
                  onClick={() => changeRank(skillKey, cycleRank(skillData.rank))}
                />
                <span className="text-sm text-zinc-300 truncate">{displayName}</span>
                <span className="text-[10px] text-zinc-600">{ABILITY_SHORT[abilityKey]}</span>
              </div>
              <RollButton
                modifier={calcData.total}
                breakdown={calcData.breakdown}
                label={`${displayName} Check`}
                onRoll={() => onRoll(`${displayName} Check`, calcData.total, calcData.breakdown)}
              />
            </div>
          );
        })}
      </div>

      {/* Add Lore */}
      {showAddLore ? (
        <div className="flex gap-1">
          <input
            type="text"
            value={loreName}
            onChange={(e) => setLoreName(e.target.value)}
            placeholder="Lore name..."
            className="flex-1 bg-zinc-800 text-sm text-white rounded px-2 py-1 border border-zinc-700"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && addLore()}
          />
          <button onClick={addLore} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500">
            Add
          </button>
          <button onClick={() => setShowAddLore(false)} className="px-2 py-1 text-zinc-400 hover:text-white text-xs">
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddLore(true)}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-blue-400"
        >
          <Plus size={12} /> Add Lore Skill
        </button>
      )}
    </div>
  );
};
