import { ProficiencyRank } from '@thecompany/shared-types';

const RANK_LABELS: Record<ProficiencyRank, string> = {
  untrained: 'U',
  trained: 'T',
  expert: 'E',
  master: 'M',
  legendary: 'L',
};

const RANK_COLORS: Record<ProficiencyRank, string> = {
  untrained: 'bg-zinc-600 text-zinc-400',
  trained: 'bg-blue-600 text-white',
  expert: 'bg-purple-600 text-white',
  master: 'bg-yellow-600 text-white',
  legendary: 'bg-red-600 text-white',
};

interface ProficiencyBadgeProps {
  rank: ProficiencyRank;
  onClick?: () => void;
}

export const ProficiencyBadge = ({ rank, onClick }: ProficiencyBadgeProps) => {
  return (
    <button
      onClick={onClick}
      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${RANK_COLORS[rank]} ${onClick ? 'cursor-pointer hover:ring-2 ring-white/50' : 'cursor-default'}`}
      title={rank.charAt(0).toUpperCase() + rank.slice(1)}
    >
      {RANK_LABELS[rank]}
    </button>
  );
};
