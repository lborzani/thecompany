import { Minus, Plus } from 'lucide-react';

interface HPTrackerProps {
  current: number;
  max: number;
  temp: number;
  onChange: (current: number, temp: number) => void;
}

export const HPTracker = ({ current, max, temp, onChange }: HPTrackerProps) => {
  const ratio = max > 0 ? current / max : 0;
  const barColor = ratio > 0.5 ? 'bg-green-500' : ratio > 0.25 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-zinc-400 uppercase">Hit Points</span>
        {temp > 0 && (
          <span className="text-xs text-blue-400">+{temp} temp</span>
        )}
      </div>

      {/* HP Bar */}
      <div className="w-full h-3 bg-zinc-700 rounded-full mb-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.max(0, Math.min(100, ratio * 100))}%` }}
        />
      </div>

      {/* HP Display + Controls */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, current - 1), temp)}
          className="p-1 rounded bg-zinc-700 hover:bg-red-600 transition-colors"
        >
          <Minus size={14} />
        </button>

        <div className="flex items-baseline gap-1">
          <input
            type="number"
            value={current}
            onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0), temp)}
            className="w-12 text-center text-lg font-bold bg-transparent text-white border-b border-zinc-600"
          />
          <span className="text-zinc-500">/</span>
          <span className="text-sm text-zinc-400">{max}</span>
        </div>

        <button
          onClick={() => onChange(Math.min(max, current + 1), temp)}
          className="p-1 rounded bg-zinc-700 hover:bg-green-600 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Temp HP */}
      <div className="mt-2 flex items-center justify-center gap-2">
        <span className="text-[10px] text-zinc-500">Temp:</span>
        <input
          type="number"
          value={temp}
          onChange={(e) => onChange(current, Math.max(0, parseInt(e.target.value) || 0))}
          className="w-10 text-center text-xs bg-zinc-700 text-blue-400 rounded border border-zinc-600"
        />
      </div>
    </div>
  );
};
