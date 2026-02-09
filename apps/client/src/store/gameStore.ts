import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Token, User, MapState, ChatMessage, DiceRoom, SavedGameState, PathfinderCharacter } from '@thecompany/shared-types';
import { storageService } from '../services/storage';

// Re-export for convenience
export type { User } from '@thecompany/shared-types';

// Pre-computed hex positions for initial tokens
// HEX_SIZE=60: hexToPixel(q,r) = { x: 60*(√3*q + √3/2*r), y: 60*(3/2*r) }
const INITIAL_TOKENS: Token[] = [
    { id: 'token-1', x: 727, y: 360, color: '#ef4444', label: 'Red' },
    { id: 'token-2', x: 935, y: 360, color: '#3b82f6', label: 'Blue' },
];

interface GameState {
  campaignId: string | null;
  campaignName: string;
  isTemp: boolean;

  users: User[];
  currentUser: User | null;

  tokens: Token[];
  map: MapState;
  diceRoom: DiceRoom | null;
  chatMessages: ChatMessage[];
  characters: PathfinderCharacter[];

  setTokens: (tokens: Token[]) => void;
  updateToken: (token: Token) => void;
  removeToken: (tokenId: string) => void;
  setMap: (map: MapState) => void;
  setDiceRoom: (room: DiceRoom | null) => void;
  addChatMessage: (msg: ChatMessage) => void;

  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  removeUser: (userId: string) => void;
  setCurrentUser: (user: User | null) => void;
  setUsers: (users: User[]) => void;

  addCharacter: (character: PathfinderCharacter) => void;
  updateCharacter: (character: PathfinderCharacter) => void;
  removeCharacter: (characterId: string) => void;
  setCharacters: (characters: PathfinderCharacter[]) => void;

  loadSession: (data: SavedGameState) => void;
  createSession: (name: string, isTemp: boolean) => void;
}

export const GM_USER: User = {
    id: 'gm',
    username: 'Game Master',
    color: '#ef4444',
    isGM: true,
};

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, _get) => ({
    campaignId: null,
    campaignName: 'Untitled Session',
    isTemp: true,

    users: [GM_USER],
    currentUser: null,

    tokens: INITIAL_TOKENS,
    map: {
        imageUrl: null,
        scale: 1,
        offset: { x: 0, y: 0 }
    },
    diceRoom: null,
    chatMessages: [],
    characters: [],

    setTokens: (tokens) => set({ tokens }),
    
    updateToken: (updatedToken) =>
        set((state) => ({
        tokens: state.tokens.map((t) =>
            t.id === updatedToken.id ? updatedToken : t
        ),
    })),
    
    removeToken: (tokenId) => set((state) => ({ tokens: state.tokens.filter(t => t.id !== tokenId) })),

    setMap: (map) => set({ map }),
    setDiceRoom: (diceRoom) => set({ diceRoom }),
    addChatMessage: (msg) => set(state => ({ chatMessages: [...state.chatMessages, msg] })),

    setUsers: (users) => set({ users }),
    addUser: (user) => set(state => ({ users: [...state.users, user] })),
    updateUser: (user) => set(state => ({ users: state.users.map(u => u.id === user.id ? user : u) })),
    removeUser: (userId) => set(state => ({ users: state.users.filter(u => u.id !== userId) })),
    setCurrentUser: (user) => set({ currentUser: user }),

    setCharacters: (characters) => set({ characters }),
    addCharacter: (character) => set(state => ({ characters: [...state.characters, character] })),
    updateCharacter: (character) => set(state => ({
      characters: state.characters.map(c => c.id === character.id ? character : c)
    })),
    removeCharacter: (characterId) => set(state => ({
      characters: state.characters.filter(c => c.id !== characterId)
    })),

    loadSession: (data: SavedGameState) => {
        set({
            campaignId: data.campaignId,
            campaignName: data.campaignName,
            tokens: data.tokens,
            map: data.map,
            users: data.users && data.users.length > 0 ? data.users : [GM_USER],
            characters: data.characters ?? [],
            currentUser: GM_USER,
            isTemp: false
        });
    },

    createSession: (name: string, isTemp: boolean) => {
        set({
            campaignId: isTemp ? null : storageService.generateId(),
            campaignName: name,
            isTemp,
            tokens: INITIAL_TOKENS,
            users: [GM_USER],
            characters: [],
            currentUser: GM_USER,
            map: {
                imageUrl: null,
                scale: 1,
                offset: { x: 0, y: 0 }
            },
        });
    }
  }))
);

// Auto-Save Subscription
let saveTimeout: ReturnType<typeof setTimeout>;
useGameStore.subscribe(
    (state) => state, // Subscribe to entire state changes
    (state) => {
        // Se for temporária ou não tiver ID, não salva
        if (state.isTemp || !state.campaignId) return;

        // Debounce simple para não salvar a cada pixel arrastado
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            console.log('Auto-saving campaign:', state.campaignName);
            storageService.saveCampaign({
                campaignId: state.campaignId!,
                campaignName: state.campaignName,
                tokens: state.tokens,
                map: state.map,
                users: state.users,
                characters: state.characters
            });
        }, 1000); // Salva 1s após a última mudança
    }
);
