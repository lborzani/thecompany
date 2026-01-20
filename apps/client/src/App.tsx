import { useState, useRef, useEffect } from 'react';
import { GameCanvas } from './features/canvas/GameCanvas';
import { network } from './services/network';
import { Clipboard, Play, Users, Map as MapIcon, Upload, ArrowLeft, LogOut } from 'lucide-react';
import { LobbyScreen } from './features/lobby/LobbyScreen';
import { LoginScreen } from './features/auth/LoginScreen';
import { PlayerManager } from './features/auth/PlayerManager';
import { useGameStore, GM_USER } from './store/gameStore';
import { diceService } from './services/diceService';
import { DiceOverlay } from './features/dice/DiceOverlay';
import { ChatPanel } from './features/chat/ChatPanel';

function App() {
  const [sessionState, setSessionState] = useState<'idle' | 'lobby' | 'hosting' | 'connected'>('idle');
  const [hostId, setHostId] = useState<string>('');
  const [targetHostId, setTargetHostId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const diceCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const campaignName = useGameStore(state => state.campaignName);
  const currentUser = useGameStore(state => state.currentUser);
  const users = useGameStore(state => state.users);
  const diceRoom = useGameStore(state => state.diceRoom);
  
  const setCurrentUser = useGameStore(state => state.setCurrentUser);
  const setDiceRoom = useGameStore(state => state.setDiceRoom);

  // Initialize Dice Service
  useEffect(() => {
    if (diceCanvasRef.current) {
      diceService.initialize(diceCanvasRef.current);
    }
  }, [sessionState]); // Re-run when session state changes (e.g. Host/Join -> Canvas Created)

  // HOST DICE LOGIC
  useEffect(() => {
    if (sessionState === 'hosting' && !diceRoom && currentUser?.isGM) {
      diceService.createRoom().then(room => {
        setDiceRoom(room);
        network.broadcast({ type: 'DICE_ROOM_CONFIG', payload: room });
      }).catch(err => {
        console.error("Failed to create dice room:", err);
      });
    }
  }, [sessionState, currentUser, diceRoom]);

  // CLIENT DICE LOGIC
  useEffect(() => {
    if (diceRoom) {
      // Connect if not already (checked inside service potentially, or here)
      const current = diceService.getRoom();
      if (!current || current.slug !== diceRoom.slug) {
        diceService.joinRoom(diceRoom.slug, diceRoom.passcode);
      }
    }
  }, [diceRoom]);

  // KICK LOGIC
  useEffect(() => {
     if (currentUser && !currentUser.isGM) {
         const stillExists = users.find(u => u.id === currentUser.id);
         if (!stillExists) {
             alert('You have been removed from the session.');
             setCurrentUser(null);
             setSessionState('idle');
         }
     }
  }, [users, currentUser]);

  const startHost = async () => {
    try {
      setIsLoading(true);
      // Force GM User State
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

  const joinSession = async () => {
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(hostId);
    alert('Host ID copied!');
  };

  const handleMapUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB restriction for MVP P2P
       alert('Map too large! Please use images under 2MB for now.');
       return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const base64 = event.target?.result as string;
        network.broadcastMapUpdate({
            imageUrl: base64,
            offset: { x: 0, y: 0 },
            scale: 1
        });
    };
    reader.readAsDataURL(file);
  };

  if (sessionState === 'idle') {
    return (
      <div className="h-screen w-screen bg-zinc-900 flex items-center justify-center text-white">
        <div className="max-w-md w-full bg-zinc-800 p-8 rounded-xl shadow-2xl space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              The Company VTT
            </h1>
            <p className="text-zinc-400 mt-2">Local/P2P Virtual Tabletop</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setSessionState('lobby')}
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Play size={20} />
              Host Campaign
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-zinc-800 text-zinc-500">OR</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Join Existing Session</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste Host ID here..."
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={targetHostId}
                  onChange={(e) => setTargetHostId(e.target.value)}
                />
                <button
                  onClick={joinSession}
                  disabled={isLoading || !targetHostId}
                  className="px-6 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-all"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sessionState === 'lobby') {
     return (
        <div className="h-screen w-screen bg-zinc-900 overflow-hidden relative">
            <button 
                onClick={() => setSessionState('idle')}
                className="absolute top-4 left-4 text-zinc-400 hover:text-white flex items-center gap-2"
            >
                <ArrowLeft size={20} /> Back
            </button>
            <LobbyScreen onStart={startHost} />
        </div>
     );
  }

  // Client connected but not authenticated yet
  if (sessionState === 'connected' && !currentUser) {
      return <LoginScreen onBack={() => setSessionState('idle')} />;
  }

  const isGM = sessionState === 'hosting' || currentUser?.isGM;

  return (
    <div className="h-full w-full overflow-hidden bg-zinc-900 relative">
      <canvas ref={diceCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[100]" />
      {/* HUD Info */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-zinc-800/90 backdrop-blur p-4 rounded-lg shadow-lg text-white border border-zinc-700 w-64">
            <h1 className="font-bold flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                    <Users size={16} className="text-blue-400"/>
                    {sessionState === 'hosting' ? 'Hosting' : 'Connected'}
                </span>
                <button 
                    onClick={() => {
                        if (confirm('Are you sure you want to leave?')) {
                            setSessionState('idle');
                            setCurrentUser(null);
                        }
                    }}
                    className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-zinc-700"
                    title={sessionState === 'hosting' ? "Stop Session" : "Disconnect"}
                >
                    <LogOut size={14} />
                </button>
            </h1>
            {sessionState === 'hosting' && (
            <div className="mt-2 text-xs text-zinc-300">
                <p className="font-semibold text-white mb-2 pb-2 border-b border-zinc-700">{campaignName}</p>
                <p className="text-zinc-500 mb-1">Share this ID with players:</p>
                <button 
                onClick={copyToClipboard}
                className="flex items-center gap-2 bg-zinc-900 px-2 py-1 rounded border border-zinc-700 hover:bg-zinc-700 transition-colors w-full text-zinc-300"
                >
                <code className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{hostId}</code>
                <Clipboard size={12} />
                </button>
            </div>
            )}
            
            {!isGM && currentUser && (
                <div className="mt-2 pt-2 border-t border-zinc-700 text-xs text-zinc-400">
                    Logged in as: <span className="text-white font-bold" style={{ color: currentUser.color }}>{currentUser.username}</span>
                </div>
            )}
        </div>

        {/* Map & Game Controls - GM Only */}
        {isGM && (
            <div className="bg-zinc-800/90 backdrop-blur p-3 rounded-lg shadow-lg text-white border border-zinc-700 w-64 space-y-2">
                <div className="text-xs font-bold text-zinc-400 mb-2 uppercase flex items-center gap-2">
                    <MapIcon size={12} />
                    GM Tools
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleMapUpload}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-xs flex items-center justify-center gap-2 transition-colors"
                    title="Only images under 2MB supported for now"
                >
                    <Upload size={14} />
                    Upload Background
                </button>

                <PlayerManager />
            </div>
        )}
      </div>

      <GameCanvas />
      
      {(sessionState === 'hosting' || sessionState === 'connected') && !!currentUser && (
          <>
            <ChatPanel />
            <DiceOverlay />
          </>
      )}
    </div>
  );
}

export default App;
