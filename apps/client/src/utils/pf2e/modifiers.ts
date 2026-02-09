import {
  PathfinderCharacter,
  AbilityName,
  ProficiencyRank,
  SkillName,
  SaveName,
  ModifierBreakdown,
  SKILL_ABILITY_MAP,
  PROFICIENCY_RANK_VALUES,
} from '@thecompany/shared-types';

/**
 * Calculate ability modifier from ability score.
 * PF2e formula: floor((score - 10) / 2)
 */
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Calculate proficiency bonus from rank and character level.
 * Untrained = 0, Trained = level + 2, Expert = level + 4, Master = level + 6, Legendary = level + 8
 */
export function proficiencyBonus(rank: ProficiencyRank, level: number): number {
  if (rank === 'untrained') return 0;
  return level + PROFICIENCY_RANK_VALUES[rank];
}

/**
 * Sum total modifier from individual components.
 */
export function totalModifier(
  abilityMod: number,
  profBonus: number,
  itemBonus: number,
  conditionalBonuses: number[] = []
): number {
  return abilityMod + profBonus + itemBonus + conditionalBonuses.reduce((a, b) => a + b, 0);
}

/**
 * Get the full modifier breakdown for a skill check.
 */
export function skillModifier(
  character: PathfinderCharacter,
  skillName: string
): { total: number; breakdown: ModifierBreakdown[] } {
  const skillData = character.skills[skillName];
  if (!skillData) {
    return { total: 0, breakdown: [{ source: 'No proficiency', value: 0 }] };
  }

  // Determine ability: first check SKILL_ABILITY_MAP, otherwise default to INT for lore
  const abilityKey: AbilityName =
    (skillName in SKILL_ABILITY_MAP)
      ? SKILL_ABILITY_MAP[skillName as SkillName]
      : 'int'; // Lore skills use Intelligence

  const abilityMod = abilityModifier(character.abilityScores[abilityKey]);
  const profBonus = proficiencyBonus(skillData.rank, character.level);
  const itemBonus = skillData.itemBonus ?? 0;

  const breakdown: ModifierBreakdown[] = [
    { source: `${abilityKey.toUpperCase()} modifier`, value: abilityMod },
    { source: `Proficiency (${skillData.rank})`, value: profBonus },
  ];

  if (itemBonus !== 0) {
    breakdown.push({ source: 'Item bonus', value: itemBonus });
  }

  const total = totalModifier(abilityMod, profBonus, itemBonus);
  return { total, breakdown };
}

/**
 * Get the full modifier breakdown for a saving throw.
 */
export function saveModifier(
  character: PathfinderCharacter,
  saveName: SaveName
): { total: number; breakdown: ModifierBreakdown[] } {
  const saveData = character.saves[saveName];
  const abilityMap: Record<SaveName, AbilityName> = {
    fortitude: 'con',
    reflex: 'dex',
    will: 'wis',
  };

  const abilityKey = abilityMap[saveName];
  const abilityMod = abilityModifier(character.abilityScores[abilityKey]);
  const profBonus = proficiencyBonus(saveData.proficiencyRank, character.level);
  const itemBonus = saveData.itemBonus ?? 0;

  const breakdown: ModifierBreakdown[] = [
    { source: `${abilityKey.toUpperCase()} modifier`, value: abilityMod },
    { source: `Proficiency (${saveData.proficiencyRank})`, value: profBonus },
  ];

  if (itemBonus !== 0) {
    breakdown.push({ source: 'Item bonus', value: itemBonus });
  }

  const total = totalModifier(abilityMod, profBonus, itemBonus);
  return { total, breakdown };
}

/**
 * Get total AC for a character.
 */
export function acTotal(
  character: PathfinderCharacter
): { total: number; breakdown: ModifierBreakdown[] } {
  const dexMod = abilityModifier(character.abilityScores.dex);
  const profBonus = proficiencyBonus(character.ac.proficiencyRank, character.level);
  const itemBonus = character.ac.itemBonus;

  // Apply dex cap from armor
  const effectiveDexMod = character.ac.dexCap !== undefined
    ? Math.min(dexMod, character.ac.dexCap)
    : dexMod;

  const breakdown: ModifierBreakdown[] = [
    { source: 'Base', value: 10 },
    { source: 'DEX modifier' + (character.ac.dexCap !== undefined ? ` (capped at ${character.ac.dexCap})` : ''), value: effectiveDexMod },
    { source: `Proficiency (${character.ac.proficiencyRank})`, value: profBonus },
  ];

  if (itemBonus !== 0) {
    breakdown.push({ source: 'Armor bonus', value: itemBonus });
  }

  const total = 10 + effectiveDexMod + profBonus + itemBonus;
  return { total, breakdown };
}

/**
 * Get perception modifier breakdown.
 */
export function perceptionModifier(
  character: PathfinderCharacter
): { total: number; breakdown: ModifierBreakdown[] } {
  const wisMod = abilityModifier(character.abilityScores.wis);
  const profBonus = proficiencyBonus(character.perception.proficiencyRank, character.level);
  const itemBonus = character.perception.itemBonus ?? 0;

  const breakdown: ModifierBreakdown[] = [
    { source: 'WIS modifier', value: wisMod },
    { source: `Proficiency (${character.perception.proficiencyRank})`, value: profBonus },
  ];

  if (itemBonus !== 0) {
    breakdown.push({ source: 'Item bonus', value: itemBonus });
  }

  const total = totalModifier(wisMod, profBonus, itemBonus);
  return { total, breakdown };
}

/**
 * Calculate max HP.
 * Formula: ancestryHP + (classHP + CON modifier) × level
 */
export function calculateMaxHP(character: PathfinderCharacter): number {
  const conMod = abilityModifier(character.abilityScores.con);
  return character.ancestryHP + (character.classHP + conMod) * character.level;
}
