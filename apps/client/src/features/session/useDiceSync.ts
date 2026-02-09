import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { network } from '../../services/network';
import { diceService } from '../../services/diceService';

/**
 * Hook que gerencia inicialização, criação de sala e sincronização de dados.
 * Extrai a lógica de dice do App.tsx para manter o componente enxuto.
 */
export function useDiceSync(sessionState: string) {
  const diceCanvasRef = useRef<HTMLCanvasElement>(null);

  const currentUser = useGameStore(state => state.currentUser);
  const diceRoom = useGameStore(state => state.diceRoom);
  const setDiceRoom = useGameStore(state => state.setDiceRoom);

  // Initialize Dice Service when canvas appears
  useEffect(() => {
    if (diceCanvasRef.current) {
      diceService.initialize(diceCanvasRef.current);
    }
  }, [sessionState]);

  // Host creates dice room
  useEffect(() => {
    if (sessionState === 'hosting' && !diceRoom && currentUser?.isGM) {
      diceService
        .createRoom()
        .then(room => {
          setDiceRoom(room);
          network.broadcast({ type: 'DICE_ROOM_CONFIG', payload: room });
        })
        .catch(err => console.error('Failed to create dice room:', err));
    }
  }, [sessionState, currentUser, diceRoom, setDiceRoom]);

  // Client joins dice room when config arrives
  useEffect(() => {
    if (diceRoom) {
      const current = diceService.getRoom();
      if (!current || current.slug !== diceRoom.slug) {
        diceService.joinRoom(diceRoom.slug, diceRoom.passcode);
      }
    }
  }, [diceRoom]);

  return diceCanvasRef;
}
