import { PathfinderCharacter, AbilityName, SaveName } from '@thecompany/shared-types';
import { AbilityScoreBlock } from '../components/AbilityScoreBlock';
import { HPTracker } from '../components/HPTracker';
import { ConditionTracker } from '../components/ConditionTracker';
import { ProficiencyBadge } from '../components/ProficiencyBadge';
import { RollButton } from '../components/RollButton';
import { CalculatedStats } from '../hooks/useCharacterCalc';
import { Shield, Eye, Footprints } from 'lucide-react';

const ABILITY_ORDER: AbilityName[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

const SAVE_LABELS: Record<SaveName, string> = {
  fortitude: 'Fortitude',
  reflex: 'Reflex',
  will: 'Will',
};

interface StatsTabProps {
  character: PathfinderCharacter;
  calc: CalculatedStats;
  onChange: (updated: PathfinderCharacter) => void;
  onRoll: (label: string, modifier: number, breakdown: { source: string; value: number }[]) => void;
}

export const StatsTab = ({ character, calc, onChange, onRoll }: StatsTabProps) => {
  const updateAbility = (ability: AbilityName, value: number) => {
    onChange({
      ...character,
      abilityScores: { ...character.abilityScores, [ability]: value },
    });
  };

  const updateHP = (current: number, temp: number) => {
    onChange({
      ...character,
      hp: { ...character.hp, current, temp },
    });
  };

  return (
    <div className="space-y-4 p-3 overflow-y-auto max-h-[calc(100vh-180px)]">
      {/* Character Identity */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-zinc-500 uppercase">Class</label>
          <input
            value={character.class}
            onChange={(e) => onChange({ ...character, class: e.target.value })}
            className="w-full bg-zinc-800 text-sm text-white rounded px-2 py-1 border border-zinc-700"
          />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 uppercase">Level</label>
          <input
            type="number"
            value={character.level}
            onChange={(e) => onChange({ ...character, level: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) })}
            className="w-full bg-zinc-800 text-sm text-white rounded px-2 py-1 border border-zinc-700"
          />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 uppercase">Ancestry</label>
          <input
            value={character.ancestry}
            onChange={(e) => onChange({ ...character, ancestry: e.target.value })}
            className="w-full bg-zinc-800 text-sm text-white rounded px-2 py-1 border border-zinc-700"
          />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 uppercase">Background</label>
          <input
            value={character.background}
            onChange={(e) => onChange({ ...character, background: e.target.value })}
            className="w-full bg-zinc-800 text-sm text-white rounded px-2 py-1 border border-zinc-700"
          />
        </div>
      </div>

      {/* Ability Scores */}
      <div>
        <h3 className="text-xs font-bold text-zinc-400 uppercase mb-2">Ability Scores</h3>
        <div className="flex gap-1 justify-between">
          {ABILITY_ORDER.map(ability => (
            <AbilityScoreBlock
              key={ability}
              ability={ability}
              score={character.abilityScores[ability]}
              modifier={calc.abilityMods[ability]}
              onScoreChange={(v) => updateAbility(ability, v)}
            />
          ))}
        </div>
      </div>

      {/* HP */}
      <HPTracker
        current={character.hp.current}
        max={calc.maxHP}
        temp={character.hp.temp}
        onChange={updateHP}
      />

      {/* AC, Saves, Perception, Speed */}
      <div className="grid grid-cols-2 gap-2">
        {/* AC */}
        <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700 flex items-center gap-2">
          <Shield size={18} className="text-zinc-400" />
          <div>
            <div className="text-[10px] text-zinc-500 uppercase">Armor Class</div>
            <div className="text-xl font-bold text-white">{calc.ac.total}</div>
          </div>
          <ProficiencyBadge rank={character.ac.proficiencyRank} />
        </div>

        {/* Speed */}
        <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700 flex items-center gap-2">
          <Footprints size={18} className="text-zinc-400" />
          <div>
            <div className="text-[10px] text-zinc-500 uppercase">Speed</div>
            <div className="text-xl font-bold text-white">{character.speed.base} ft</div>
          </div>
        </div>
      </div>

      {/* Perception */}
      <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-zinc-400" />
          <span className="text-sm text-zinc-300">Perception</span>
          <ProficiencyBadge rank={character.perception.proficiencyRank} />
        </div>
        <RollButton
          modifier={calc.perception.total}
          breakdown={calc.perception.breakdown}
          label="Perception"
          onRoll={() => onRoll('Perception', calc.perception.total, calc.perception.breakdown)}
        />
      </div>

      {/* Saving Throws */}
      <div>
        <h3 className="text-xs font-bold text-zinc-400 uppercase mb-2">Saving Throws</h3>
        <div className="space-y-1">
          {(Object.keys(SAVE_LABELS) as SaveName[]).map(save => (
            <div key={save} className="bg-zinc-800 rounded px-3 py-2 border border-zinc-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ProficiencyBadge rank={character.saves[save].proficiencyRank} />
                <span className="text-sm text-zinc-300">{SAVE_LABELS[save]}</span>
              </div>
              <RollButton
                modifier={calc.saves[save].total}
                breakdown={calc.saves[save].breakdown}
                label={SAVE_LABELS[save]}
                onRoll={() => onRoll(SAVE_LABELS[save], calc.saves[save].total, calc.saves[save].breakdown)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Conditions */}
      <ConditionTracker
        conditions={character.conditions}
        onChange={(conditions) => onChange({ ...character, conditions })}
      />
    </div>
  );
};
