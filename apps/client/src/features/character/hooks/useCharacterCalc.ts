import { useMemo } from 'react';
import { PathfinderCharacter } from '@thecompany/shared-types';
import {
  skillModifier,
  saveModifier,
  acTotal,
  perceptionModifier,
  calculateMaxHP,
  abilityModifier,
} from '../../../utils/pf2e';
import type { ModifierBreakdown, SaveName } from '@thecompany/shared-types';

export interface CalculatedStats {
  maxHP: number;
  ac: { total: number; breakdown: ModifierBreakdown[] };
  perception: { total: number; breakdown: ModifierBreakdown[] };
  saves: Record<SaveName, { total: number; breakdown: ModifierBreakdown[] }>;
  skills: Record<string, { total: number; breakdown: ModifierBreakdown[] }>;
  abilityMods: Record<string, number>;
}

/**
 * Hook that returns pre-computed modifiers for a character.
 * Recalculates only when the character reference changes.
 */
export function useCharacterCalc(character: PathfinderCharacter | null): CalculatedStats | null {
  return useMemo(() => {
    if (!character) return null;

    const abilityMods: Record<string, number> = {
      str: abilityModifier(character.abilityScores.str),
      dex: abilityModifier(character.abilityScores.dex),
      con: abilityModifier(character.abilityScores.con),
      int: abilityModifier(character.abilityScores.int),
      wis: abilityModifier(character.abilityScores.wis),
      cha: abilityModifier(character.abilityScores.cha),
    };

    const skills: Record<string, { total: number; breakdown: ModifierBreakdown[] }> = {};
    for (const skillKey of Object.keys(character.skills)) {
      skills[skillKey] = skillModifier(character, skillKey);
    }

    return {
      maxHP: calculateMaxHP(character),
      ac: acTotal(character),
      perception: perceptionModifier(character),
      saves: {
        fortitude: saveModifier(character, 'fortitude'),
        reflex: saveModifier(character, 'reflex'),
        will: saveModifier(character, 'will'),
      },
      skills,
      abilityMods,
    };
  }, [character]);
}
