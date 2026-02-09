import { useState, useCallback } from 'react';
import { GameCanvas } from './features/canvas/GameCanvas';
import { network } from './services/network';
import { ArrowLeft } from 'lucide-react';
import { LobbyScreen } from './features/lobby/LobbyScreen';
import { LoginScreen } from './features/auth/LoginScreen';
import { useGameStore, GM_USER } from './store/gameStore';
import { DiceOverlay } from './features/dice/DiceOverlay';
import { ChatPanel } from './features/chat/ChatPanel';
import { IdleScreen } from './features/session/IdleScreen';
import { TopBar } from './features/session/TopBar';
import { PlayerManager } from './features/auth/PlayerManager';
import { useDiceSync } from './features/session/useDiceSync';
import { useKickDetection } from './features/session/useKickDetection';
import { ErrorBoundary } from './features/shared/ErrorBoundary';
import { CharacterSheet } from './features/character/CharacterSheet';

type SessionState = 'idle' | 'lobby' | 'hosting' | 'connected';

function App() {
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [hostId, setHostId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showCharSheet, setShowCharSheet] = useState(false);
  const [showPlayers, setShowPlayers] = useState(false);

  const currentUser = useGameStore(state => state.currentUser);
  const setCurrentUser = useGameStore(state => state.setCurrentUser);

  const diceCanvasRef = useDiceSync(sessionState);

  const handleLeave = useCallback(() => {
    setCurrentUser(null);
    setSessionState('idle');
  }, [setCurrentUser]);

  useKickDetection(handleLeave);

  const startHost = async () => {
    try {
      setIsLoading(true);
      setCurrentUser(GM_USER);
      const id = await network.startHost();
      setHostId(id);
      setSessionState('hosting');
    } catch (err) {
      console.error('Failed to start host:', err);
      alert('Error starting host session');
    } finally {
      setIsLoading(false);
    }
  };

  const joinSession = async (targetHostId: string) => {
    if (!targetHostId) return;
    try {
      setIsLoading(true);
      await network.joinSession(targetHostId);
      setSessionState('connected');
    } catch (err) {
      console.error('Failed to join:', err);
      alert('Error joining session. Check the ID.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Pre-game screens ───────────────────────────────────────

  if (sessionState === 'idle') {
    return (
      <IdleScreen
        onHost={() => setSessionState('lobby')}
        onJoin={joinSession}
        isLoading={isLoading}
      />
    );
  }

  if (sessionState === 'lobby') {
    return (
      <div className="h-screen w-screen bg-surface-1 overflow-hidden relative">
        <button
          onClick={() => setSessionState('idle')}
          className="absolute top-4 left-4 btn-ghost z-10"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <LobbyScreen onStart={startHost} />
      </div>
    );
  }

  if (sessionState === 'connected' && !currentUser) {
    return <LoginScreen onBack={() => setSessionState('idle')} />;
  }

  // ── Game View ──────────────────────────────────────────────

  return (
    <ErrorBoundary>
      <div className="h-full w-full flex flex-col bg-surface-0">
        {/* Top Bar */}
        <TopBar
          hostId={hostId}
          sessionState={sessionState as 'hosting' | 'connected'}
          onLeave={handleLeave}
          onToggleChat={() => setShowChat(v => !v)}
          onToggleCharSheet={() => setShowCharSheet(v => !v)}
          onTogglePlayers={() => setShowPlayers(v => !v)}
          showChat={showChat}
          showCharSheet={showCharSheet}
        />

        {/* Main Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas Area */}
          <div className="flex-1 relative overflow-hidden">
            <canvas
              ref={diceCanvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-[100]"
            />

            <GameCanvas />

            {currentUser && <DiceOverlay />}
          </div>

          {/* Chat Sidebar */}
          {currentUser && showChat && (
            <div className="w-80 min-w-[320px] h-full animate-slide-right">
              <ChatPanel />
            </div>
          )}

          {/* Character Sheet Sidebar */}
          {showCharSheet && (
            <div className="w-[400px] min-w-[400px] h-full animate-slide-right">
              <CharacterSheet onClose={() => setShowCharSheet(false)} />
            </div>
          )}
        </div>

        {/* Player Manager Modal */}
        {showPlayers && <PlayerManager onClose={() => setShowPlayers(false)} />}
      </div>
    </ErrorBoundary>
  );
}

export default App;
