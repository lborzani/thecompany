import { describe, it, expect } from 'vitest';
import {
  abilityModifier,
  proficiencyBonus,
  totalModifier,
  skillModifier,
  saveModifier,
  acTotal,
  perceptionModifier,
  calculateMaxHP,
} from '../../utils/pf2e/modifiers';
import { createBlankCharacter } from '../../utils/pf2e/defaults';
import { PathfinderCharacter } from '@thecompany/shared-types';

// Helper to create a test Fighter level 5
function createFighter5(): PathfinderCharacter {
  const char = createBlankCharacter('test-1', 'owner-1');
  char.name = 'Valeros';
  char.class = 'Fighter';
  char.level = 5;
  char.abilityScores = { str: 18, dex: 14, con: 14, int: 10, wis: 12, cha: 10 };
  char.ancestryHP = 8;
  char.classHP = 10;
  char.keyAbility = 'str';
  char.skills = {
    ...char.skills,
    athletics: { rank: 'trained' },
    acrobatics: { rank: 'trained' },
    intimidation: { rank: 'expert' },
    stealth: { rank: 'untrained' },
    arcana: { rank: 'untrained' },
  };
  char.saves = {
    fortitude: { proficiencyRank: 'expert' },
    reflex: { proficiencyRank: 'expert' },
    will: { proficiencyRank: 'trained' },
  };
  char.perception = { proficiencyRank: 'expert' };
  char.ac = { proficiencyRank: 'trained', itemBonus: 5, dexCap: 1 };
  return char;
}

describe('abilityModifier', () => {
  it('should return 0 for score 10', () => {
    expect(abilityModifier(10)).toBe(0);
  });

  it('should return 0 for score 11', () => {
    expect(abilityModifier(11)).toBe(0);
  });

  it('should return +4 for score 18', () => {
    expect(abilityModifier(18)).toBe(4);
  });

  it('should return -1 for score 8', () => {
    expect(abilityModifier(8)).toBe(-1);
  });

  it('should return +5 for score 20', () => {
    expect(abilityModifier(20)).toBe(5);
  });

  it('should return -5 for score 1', () => {
    expect(abilityModifier(1)).toBe(-5);
  });
});

describe('proficiencyBonus', () => {
  it('should return 0 for untrained regardless of level', () => {
    expect(proficiencyBonus('untrained', 1)).toBe(0);
    expect(proficiencyBonus('untrained', 20)).toBe(0);
  });

  it('should return level + 2 for trained', () => {
    expect(proficiencyBonus('trained', 1)).toBe(3);
    expect(proficiencyBonus('trained', 5)).toBe(7);
    expect(proficiencyBonus('trained', 20)).toBe(22);
  });

  it('should return level + 4 for expert', () => {
    expect(proficiencyBonus('expert', 5)).toBe(9);
  });

  it('should return level + 6 for master', () => {
    expect(proficiencyBonus('master', 10)).toBe(16);
  });

  it('should return level + 8 for legendary', () => {
    expect(proficiencyBonus('legendary', 20)).toBe(28);
  });
});

describe('totalModifier', () => {
  it('should sum all components', () => {
    expect(totalModifier(4, 7, 2, [1, -1])).toBe(13);
  });

  it('should work with no conditional bonuses', () => {
    expect(totalModifier(4, 7, 0)).toBe(11);
  });
});

describe('skillModifier', () => {
  const fighter = createFighter5();

  it('should calculate Athletics (STR, trained, level 5): +4 + 7 = +11', () => {
    const result = skillModifier(fighter, 'athletics');
    expect(result.total).toBe(11);
    expect(result.breakdown).toHaveLength(2);
  });

  it('should calculate Intimidation (CHA, expert, level 5): +0 + 9 = +9', () => {
    const result = skillModifier(fighter, 'intimidation');
    expect(result.total).toBe(9);
  });

  it('should calculate Stealth (DEX, untrained): +2 + 0 = +2', () => {
    const result = skillModifier(fighter, 'stealth');
    expect(result.total).toBe(2);
  });

  it('should include item bonus when present', () => {
    const charWithItem = createFighter5();
    charWithItem.skills.athletics = { rank: 'trained', itemBonus: 1 };
    const result = skillModifier(charWithItem, 'athletics');
    expect(result.total).toBe(12);
    expect(result.breakdown).toHaveLength(3);
  });

  it('should return 0 for unknown skill', () => {
    const result = skillModifier(fighter, 'nonexistent');
    expect(result.total).toBe(0);
  });
});

describe('saveModifier', () => {
  const fighter = createFighter5();

  it('should calculate Fortitude (CON, expert, level 5): +2 + 9 = +11', () => {
    const result = saveModifier(fighter, 'fortitude');
    expect(result.total).toBe(11);
  });

  it('should calculate Reflex (DEX, expert, level 5): +2 + 9 = +11', () => {
    const result = saveModifier(fighter, 'reflex');
    expect(result.total).toBe(11);
  });

  it('should calculate Will (WIS, trained, level 5): +1 + 7 = +8', () => {
    const result = saveModifier(fighter, 'will');
    expect(result.total).toBe(8);
  });
});

describe('acTotal', () => {
  it('should calculate AC with dex cap: 10 + 1 (capped) + 7 (trained 5) + 5 (item) = 23', () => {
    const fighter = createFighter5();
    const result = acTotal(fighter);
    expect(result.total).toBe(23);
  });

  it('should calculate AC without dex cap', () => {
    const char = createBlankCharacter('test-2', 'owner-1');
    char.level = 1;
    char.abilityScores.dex = 16; // +3
    char.ac = { proficiencyRank: 'trained', itemBonus: 0 };
    // AC = 10 + 3 (dex) + 3 (trained lv1) + 0 = 16
    const result = acTotal(char);
    expect(result.total).toBe(16);
  });
});

describe('perceptionModifier', () => {
  it('should calculate perception (WIS, expert, level 5): +1 + 9 = +10', () => {
    const fighter = createFighter5();
    const result = perceptionModifier(fighter);
    expect(result.total).toBe(10);
  });
});

describe('calculateMaxHP', () => {
  it('should calculate HP for Fighter 5 (ancestry 8, class 10, CON +2): 8 + (10+2)*5 = 68', () => {
    const fighter = createFighter5();
    expect(calculateMaxHP(fighter)).toBe(68);
  });

  it('should handle negative CON modifier', () => {
    const char = createBlankCharacter('test-3', 'owner-1');
    char.level = 3;
    char.abilityScores.con = 8; // -1
    char.ancestryHP = 6;
    char.classHP = 8;
    // 6 + (8 + -1) * 3 = 6 + 21 = 27
    expect(calculateMaxHP(char)).toBe(27);
  });
});
