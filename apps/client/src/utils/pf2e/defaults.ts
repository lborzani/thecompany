import {
  PathfinderCharacter,
  AbilityScores,
  ALL_SKILLS,
  SkillProficiency,
} from '@thecompany/shared-types';

/**
 * Create default ability scores (all 10).
 */
export function defaultAbilityScores(): AbilityScores {
  return { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
}

/**
 * Create default skills map (all untrained).
 */
export function defaultSkills(): Record<string, SkillProficiency> {
  const skills: Record<string, SkillProficiency> = {};
  for (const skill of ALL_SKILLS) {
    skills[skill] = { rank: 'untrained' };
  }
  return skills;
}

/**
 * Create a blank PathfinderCharacter with sensible defaults.
 */
export function createBlankCharacter(id: string, ownerId: string): PathfinderCharacter {
  return {
    id,
    name: 'New Character',
    ownerId,

    ancestry: '',
    heritage: '',
    background: '',
    class: '',

    level: 1,
    xp: 0,

    abilityScores: defaultAbilityScores(),

    hp: { max: 0, current: 0, temp: 0 },

    ac: { proficiencyRank: 'trained', itemBonus: 0 },

    saves: {
      fortitude: { proficiencyRank: 'trained' },
      reflex: { proficiencyRank: 'trained' },
      will: { proficiencyRank: 'trained' },
    },

    skills: defaultSkills(),

    perception: { proficiencyRank: 'trained' },

    speed: { base: 25 },

    feats: [],
    spellSlots: [],
    preparedSpells: [],
    inventory: [],
    conditions: [],
    notes: '',

    classHP: 0,
    ancestryHP: 0,
    keyAbility: 'str',
  };
}
