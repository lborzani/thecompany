import { AbilityName } from '@thecompany/shared-types';

const ABILITY_LABELS: Record<AbilityName, string> = {
  str: 'STR',
  dex: 'DEX',
  con: 'CON',
  int: 'INT',
  wis: 'WIS',
  cha: 'CHA',
};

const ABILITY_FULL: Record<AbilityName, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

interface AbilityScoreBlockProps {
  ability: AbilityName;
  score: number;
  modifier: number;
  onScoreChange?: (value: number) => void;
}

export const AbilityScoreBlock = ({ ability, score, modifier, onScoreChange }: AbilityScoreBlockProps) => {
  const sign = modifier >= 0 ? '+' : '';

  return (
    <div className="flex flex-col items-center bg-zinc-800 rounded-lg p-2 border border-zinc-700 w-20" title={ABILITY_FULL[ability]}>
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
        {ABILITY_LABELS[ability]}
      </span>
      <span className="text-xl font-bold text-white">
        {sign}{modifier}
      </span>
      {onScoreChange ? (
        <input
          type="number"
          value={score}
          onChange={(e) => onScoreChange(parseInt(e.target.value) || 0)}
          className="w-12 text-center text-sm bg-zinc-700 text-zinc-300 rounded border border-zinc-600 mt-1"
        />
      ) : (
        <span className="text-xs text-zinc-500 mt-1">{score}</span>
      )}
    </div>
  );
};
