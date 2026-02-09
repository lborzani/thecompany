import { useCallback } from 'react';
import { PathfinderCharacter } from '@thecompany/shared-types';
import { useGameStore } from '../../../store/gameStore';
import { network } from '../../../services/network';

/**
 * Hook that broadcasts character changes via P2P whenever the character is updated.
 */
export function useCharacterSync() {
  const updateCharacter = useGameStore(state => state.updateCharacter);

  const syncCharacter = useCallback((character: PathfinderCharacter) => {
    updateCharacter(character);
    network.broadcastCharacterUpdate(character);
  }, [updateCharacter]);

  const deleteCharacter = useCallback((characterId: string) => {
    network.broadcastCharacterDelete(characterId);
  }, []);

  return { syncCharacter, deleteCharacter };
}
