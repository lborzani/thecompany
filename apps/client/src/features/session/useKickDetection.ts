import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';

/**
 * Detecta quando o GM remove um jogador da sessão.
 * Se o currentUser não existe mais na lista de users, executa onKicked.
 */
export function useKickDetection(onKicked: () => void) {
  const currentUser = useGameStore(state => state.currentUser);
  const users = useGameStore(state => state.users);

  useEffect(() => {
    if (currentUser && !currentUser.isGM) {
      const stillExists = users.find(u => u.id === currentUser.id);
      if (!stillExists) {
        alert('You have been removed from the session.');
        onKicked();
      }
    }
  }, [users, currentUser, onKicked]);
}
