// ── Socket.IO Events (Server) ──────────────────────────────────

export interface ServerToClientEvents {
  pong: (message: string) => void;
  "token:moved": (token: Token) => void;
  "state:full": (tokens: Token[]) => void;
}

export interface ClientToServerEvents {
  ping: () => void;
  "token:move": (token: Token) => void;
  "state:request": () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
}

// ── Core Data Models ───────────────────────────────────────────

export interface Token {
  id: string;
  x: number;
  y: number;
  color: string;
  label?: string;
  ownerId?: string;
  imageUrl?: string;
  characterId?: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  color: string;
  isGM: boolean;
}

export interface MapState {
  imageUrl: string | null;
  scale: number;
  offset: { x: number; y: number };
}

export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  type: 'text' | 'roll' | 'contextual_roll';
  timestamp: number;
  color?: string;
  rollContext?: ContextualRollContext;
}

export interface DiceRoom {
  slug: string;
  passcode?: string;
}

// ── Dice Types ─────────────────────────────────────────────────

export interface DiceValue {
  value: number;
  type: string;
  label: string;
}

export interface DiceRollResult {
  uuid: string;
  created_at: string;
  equation: string;
  total_value: number;
  values: DiceValue[];
  modifier: number;
  user: {
    uuid: string;
    username: string;
  };
  is_local: boolean;
  external_id?: string;
}

export interface DiceArg {
  type: string;
  theme?: string;
}

// ── Contextual Rolls (PF2e) ───────────────────────────────────

export type DegreeOfSuccess = 'critical-success' | 'success' | 'failure' | 'critical-failure';

export type RollContextType = 'skill' | 'save' | 'attack' | 'perception' | 'flat';

export interface ModifierBreakdown {
  source: string;
  value: number;
}

export interface ContextualRollContext {
  type: RollContextType;
  label: string;
  dc?: number;
  degreeOfSuccess?: DegreeOfSuccess;
  characterName: string;
  modifierBreakdown: ModifierBreakdown[];
}

export interface ContextualRollResult extends DiceRollResult {
  context: ContextualRollContext;
}

// ── Pathfinder 2e Character Types ─────────────────────────────

export type ProficiencyRank = 'untrained' | 'trained' | 'expert' | 'master' | 'legendary';

export type AbilityName = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export type SkillName =
  | 'acrobatics' | 'arcana' | 'athletics' | 'crafting'
  | 'deception' | 'diplomacy' | 'intimidation' | 'medicine'
  | 'nature' | 'occultism' | 'performance' | 'religion'
  | 'society' | 'stealth' | 'survival' | 'thievery';

export type SaveName = 'fortitude' | 'reflex' | 'will';

export interface SkillProficiency {
  rank: ProficiencyRank;
  itemBonus?: number;
  loreType?: string;
}

export interface PF2eConditionInstance {
  id: string;
  name: string;
  value?: number;
}

export interface SpellSlot {
  level: number;
  total: number;
  used: number;
}

export interface PreparedSpell {
  spellId: string;
  name: string;
  level: number;
  heightened?: number;
}

export interface EquippedItem {
  itemId: string;
  name: string;
  bulk: number;
  invested?: boolean;
  isEquipped: boolean;
  quantity: number;
  bonuses?: Array<{ type: string; value: number; target: string }>;
}

export interface FeatEntry {
  featId: string;
  name: string;
  level: number;
  type: 'ancestry' | 'class' | 'skill' | 'general' | 'bonus';
  source?: string;
}

export interface PathfinderCharacter {
  id: string;
  name: string;
  ownerId: string;
  tokenId?: string;

  // Identity
  ancestry: string;
  heritage: string;
  background: string;
  class: string;
  subclass?: string;

  // Progression
  level: number;
  xp: number;

  // Abilities
  abilityScores: AbilityScores;

  // Hit Points
  hp: { max: number; current: number; temp: number };

  // Armor Class
  ac: { proficiencyRank: ProficiencyRank; itemBonus: number; dexCap?: number };

  // Saves
  saves: Record<SaveName, { proficiencyRank: ProficiencyRank; itemBonus?: number }>;

  // Skills (keyed by SkillName or 'lore_<name>')
  skills: Record<string, SkillProficiency>;

  // Perception
  perception: { proficiencyRank: ProficiencyRank; itemBonus?: number };

  // Speed
  speed: { base: number; modifiers?: Array<{ type: string; value: number }> };

  // Feats
  feats: FeatEntry[];

  // Spells
  spellSlots?: SpellSlot[];
  preparedSpells?: PreparedSpell[];
  focusPoints?: { max: number; current: number };
  spellcastingTradition?: string;
  spellcastingAbility?: AbilityName;

  // Inventory
  inventory: EquippedItem[];

  // Conditions
  conditions: PF2eConditionInstance[];

  // Misc
  notes: string;
  imageUrl?: string;

  // Class-specific data
  classHP: number;
  ancestryHP: number;
  keyAbility: AbilityName;
}

// ── PF2e Static Data Types (for pf2e-data package) ───────────

export interface PF2eClass {
  id: string;
  name: string;
  hp: number;
  keyAbility: AbilityName[];
  perception: ProficiencyRank;
  saveProficiencies: Record<SaveName, ProficiencyRank>;
  trainedSkillCount: number;
  attackProficiencies: { simple: ProficiencyRank; martial: ProficiencyRank; advanced?: ProficiencyRank; unarmed: ProficiencyRank };
  defenseProficiencies: { unarmored: ProficiencyRank; light: ProficiencyRank; medium?: ProficiencyRank; heavy?: ProficiencyRank };
  classFeatLevels: number[];
  skillFeatLevels: number[];
  generalFeatLevels: number[];
  abilityBoostLevels: number[];
  description: string;
}

export interface PF2eAncestry {
  id: string;
  name: string;
  hp: number;
  speed: number;
  size: string;
  abilityBoosts: AbilityName[];
  abilityFlaws: AbilityName[];
  traits: string[];
  description: string;
}

export interface PF2eBackground {
  id: string;
  name: string;
  abilityBoosts: AbilityName[];
  trainedSkill: string;
  trainedLore?: string;
  featId?: string;
  description: string;
}

export interface PF2eFeat {
  id: string;
  name: string;
  level: number;
  traits: string[];
  prerequisites?: string;
  type: 'ancestry' | 'class' | 'skill' | 'general';
  actions?: string;
  description: string;
}

export interface PF2eSpell {
  id: string;
  name: string;
  level: number;
  traditions: string[];
  traits: string[];
  actions: string;
  range?: string;
  area?: string;
  duration?: string;
  description: string;
}

export interface PF2eEquipment {
  id: string;
  name: string;
  price: string;
  bulk: number;
  category: string;
  group?: string;
  damage?: string;
  armorBonus?: number;
  dexCap?: number;
  traits: string[];
  description: string;
}

export interface PF2eCondition {
  id: string;
  name: string;
  hasValue: boolean;
  description: string;
}

// ── Skill-to-Ability Mapping ──────────────────────────────────

export const SKILL_ABILITY_MAP: Record<SkillName, AbilityName> = {
  acrobatics: 'dex',
  arcana: 'int',
  athletics: 'str',
  crafting: 'int',
  deception: 'cha',
  diplomacy: 'cha',
  intimidation: 'cha',
  medicine: 'wis',
  nature: 'wis',
  occultism: 'int',
  performance: 'cha',
  religion: 'wis',
  society: 'int',
  stealth: 'dex',
  survival: 'wis',
  thievery: 'dex',
};

export const ALL_SKILLS: SkillName[] = [
  'acrobatics', 'arcana', 'athletics', 'crafting',
  'deception', 'diplomacy', 'intimidation', 'medicine',
  'nature', 'occultism', 'performance', 'religion',
  'society', 'stealth', 'survival', 'thievery',
];

export const PROFICIENCY_RANK_VALUES: Record<ProficiencyRank, number> = {
  untrained: 0,
  trained: 2,
  expert: 4,
  master: 6,
  legendary: 8,
};

// ── P2P Network Events ─────────────────────────────────────────

export type NetworkEvent =
  | { type: 'LOGIN_REQUEST'; payload: { username: string; password?: string } }
  | { type: 'LOGIN_RESPONSE'; payload: { success: boolean; error?: string; user?: User } }
  | { type: 'SYNC_STATE'; payload: { tokens: Token[]; map: MapState; users: User[]; characters: PathfinderCharacter[] } }
  | { type: 'TOKEN_MOVE'; payload: Token }
  | { type: 'TOKEN_DELETE'; payload: { tokenId: string } }
  | { type: 'MAP_UPDATE'; payload: MapState }
  | { type: 'CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'DICE_ROOM_CONFIG'; payload: DiceRoom }
  | { type: 'DICE_ROLL'; payload: DiceRollResult }
  | { type: 'CHARACTER_UPDATE'; payload: PathfinderCharacter }
  | { type: 'CHARACTER_DELETE'; payload: { characterId: string } }
  | { type: 'CONTEXTUAL_ROLL'; payload: ContextualRollResult };

// ── Storage Types ──────────────────────────────────────────────

export interface CampaignMetadata {
  id: string;
  name: string;
  lastPlayed: number;
  createdAt: number;
}

export interface SavedGameState {
  campaignId: string;
  campaignName: string;
  tokens: Token[];
  map: MapState;
  users?: User[];
  characters?: PathfinderCharacter[];
}
