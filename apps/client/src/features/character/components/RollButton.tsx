import { Dice5 } from 'lucide-react';
import { ModifierBreakdown } from '@thecompany/shared-types';
import { useState } from 'react';

interface RollButtonProps {
  modifier: number;
  breakdown: ModifierBreakdown[];
  label: string;
  onRoll: () => void;
}

export const RollButton = ({ modifier, breakdown, label, onRoll }: RollButtonProps) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const sign = modifier >= 0 ? '+' : '';

  return (
    <div className="relative inline-flex items-center gap-1">
      <button
        onClick={onRoll}
        className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
        title={`Roll ${label}: d20${sign}${modifier}`}
      >
        <Dice5 size={12} />
        <span>{sign}{modifier}</span>
      </button>

      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="text-zinc-500 hover:text-zinc-300 text-[10px]"
        title="View breakdown"
      >
        ⓘ
      </button>

      {showBreakdown && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded p-2 shadow-lg min-w-[160px]">
          <div className="text-[10px] text-zinc-400 mb-1 font-bold">{label}</div>
          {breakdown.map((b, i) => (
            <div key={i} className="flex justify-between text-[11px]">
              <span className="text-zinc-400">{b.source}</span>
              <span className="text-white font-mono">
                {b.value >= 0 ? '+' : ''}{b.value}
              </span>
            </div>
          ))}
          <div className="border-t border-zinc-700 mt-1 pt-1 flex justify-between text-xs font-bold">
            <span className="text-zinc-300">Total</span>
            <span className="text-blue-400">{sign}{modifier}</span>
          </div>
        </div>
      )}
    </div>
  );
};
