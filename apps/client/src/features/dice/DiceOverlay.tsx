import { useEffect, useState } from 'react';
import { diceService } from '../../services/diceService';
import { DiceRollResult } from '@thecompany/shared-types';

export const DiceOverlay = () => {
    const [result, setResult] = useState<DiceRollResult | null>(null);
    const [displayValue, setDisplayValue] = useState(1);
    const [phase, setPhase] = useState<'hidden' | 'rolling' | 'result'>('hidden');

    useEffect(() => {
        const handleRoll = (roll: DiceRollResult) => {
            // Check if it's a D20 roll for special effects, otherwise just show total
            setResult(roll);
            setPhase('rolling');
            
            let steps = 0;
            const maxSteps = 15; // ~1.2 seconds of rolling
            
            const interval = setInterval(() => {
                // Random numbers for effect
                setDisplayValue(Math.floor(Math.random() * 20) + 1);
                steps++;
                
                if (steps >= maxSteps) {
                    clearInterval(interval);
                    setDisplayValue(roll.total_value);
                    setPhase('result');
                    
                    // Hide after showing result for a bit
                    setTimeout(() => {
                        setPhase('hidden');
                        setTimeout(() => setResult(null), 300); // Clear data after fade out
                    }, 2000); 
                }
            }, 80);
        };
        
        diceService.onRoll(handleRoll);
        return () => diceService.offRoll(handleRoll);
    }, []);

    if (phase === 'hidden' && !result) return null;

    // Determine visual style based on D20 rules (simplified)
    const finalValue = result?.total_value || 0;
    // Assume Crit logic only if equation contains 'd20'
    const isD20 = result?.equation?.includes('d20');
    const isCrit = isD20 && finalValue === 20;
    const isFail = isD20 && finalValue === 1;

    // Overlay classes for transitions
    const containerClass = phase === 'hidden' 
        ? "opacity-0 pointer-events-none" 
        : "opacity-100 pointer-events-auto";

    return (
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${containerClass}`}>
            
            {/* Main Dice Container */}
            <div className={`
                relative w-64 h-64 flex items-center justify-center transition-transform duration-300
                ${phase === 'result' ? 'scale-110' : 'scale-100'}
                ${phase === 'rolling' ? 'animate-pulse' : ''}
            `}>
                {/* SVG D20 Background */}
                <svg viewBox="0 0 100 100" className={`w-full h-full transition-all duration-500 overflow-visible
                    ${phase === 'result' && isCrit ? 'drop-shadow-[0_0_35px_rgba(234,179,8,1)] text-yellow-600' : ''}
                    ${phase === 'result' && isFail ? 'drop-shadow-[0_0_35px_rgba(220,38,38,1)] text-red-900' : ''}
                    ${!isCrit && !isFail ? 'text-zinc-800 drop-shadow-2xl' : ''}
                `}>
                     {/* Hexagon Base / D20 Silhouette */}
                     <path d="M50 5 L93 25 L93 75 L50 95 L7 75 L7 25 Z" 
                           fill="currentColor" 
                           stroke="rgba(255,255,255,0.1)" 
                           strokeWidth="2" />
                           
                     {/* Inner "Facets" Lines for verify D20 look */}
                     <path d="M50 5 L50 50 M93 25 L50 50 M93 75 L50 50 M50 95 L50 50 L7 75 M7 25 L50 50" 
                           stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none"/>
                           
                     {/* Inner Triangle (The face facing user) */}
                     {phase === 'result' && (
                        <path d="M50 95 L7 25 L93 25 Z" fill="rgba(255,255,255,0.05)" />
                     )}
                </svg>

                {/* The Number */}
                <div className={`absolute inset-0 flex items-center justify-center font-black text-7xl select-none
                    ${phase === 'rolling' ? 'text-zinc-400 blur-[1px]' : ''}
                    ${phase === 'result' && isCrit ? 'text-yellow-100 scale-125 transition-transform duration-300' : ''}
                    ${phase === 'result' && isFail ? 'text-red-500 scale-90 transition-transform duration-300' : ''}
                    ${phase === 'result' && !isCrit && !isFail ? 'text-white' : ''}
                `}>
                    {phase === 'rolling' ? displayValue : finalValue}
                </div>
            </div>
            
            {/* Info Text */}
            <div className={`mt-8 text-center transition-all duration-500 transform
                ${phase === 'hidden' ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}
            `}>
                <div className="text-zinc-400 font-medium tracking-[0.2em] text-sm uppercase mb-2">
                    {result?.user?.username || "Player"} rolled
                </div>
                <div className="text-2xl font-bold text-zinc-200">
                    {result?.equation}
                </div>
            </div>
        </div>
    );
};
