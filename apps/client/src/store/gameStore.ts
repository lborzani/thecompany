import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Token } from '@thecompany/shared-types';
import { storageService, SavedGameState } from '../services/storage';

export interface User {
  id: string;
  username: string;
  password?: string; // Host stores the password (simple implementation for now)
  color: string;
  isGM: boolean;
}

interface MapState {
  imageUrl: string | null;
  scale: number;
  offset: { x: number; y: number };
}

export interface ChatMessage {
  id: string;
  sender: string;
  content: string; 
  type: 'text' | 'roll';
  timestamp: number;
  color?: string;
}

interface GameState {
  // Session Info
  campaignId: string | null;
  campaignName: string;
  isTemp: boolean; // Se true, não salva no disco

  // Auth / Users
  users: User[];
  currentUser: User | null; // Quem SOU EU nesta sessão

  // Game Data
  tokens: Token[];
  map: MapState; 
  diceRoom: { slug: string; passcode?: string } | null;
  chatMessages: ChatMessage[];
  
  // Actions
  setTokens: (tokens: Token[]) => void;
  updateToken: (token: Token) => void;
  removeToken: (tokenId: string) => void;
  setMap: (map: MapState) => void;
  setDiceRoom: (room: { slug: string; passcode?: string } | null) => void;
  addChatMessage: (msg: ChatMessage) => void;
  
  // User Actions
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  removeUser: (userId: string) => void;
  setCurrentUser: (user: User | null) => void;
  setUsers: (users: User[]) => void; // Sync from Host

  // Session Actions
  loadSession: (data: SavedGameState) => void;
  createSession: (name: string, isTemp: boolean) => void;
}

const INITIAL_TOKENS: Token[] = [
    { id: 'token-1', x: 2, y: 2, color: 'red' }, 
    { id: 'token-2', x: 5, y: 5, color: '#3b82f6' }, 
];

export const GM_USER: User = {
    id: 'gm',
    username: 'Game Master',
    color: '#ff0000',
    isGM: true,
};

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
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

    loadSession: (data: SavedGameState) => {
        set({
            campaignId: data.campaignId,
            campaignName: data.campaignName,
            tokens: data.tokens,
            map: data.map,
            // @ts-ignore - Handle legacy saves without users
            users: data.users || [GM_USER],
            currentUser: GM_USER, // Host is always GM when loading
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
let saveTimeout: NodeJS.Timeout;
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
                // @ts-ignore
                users: state.users
            });
        }, 1000); // Salva 1s após a última mudança
    }
);
