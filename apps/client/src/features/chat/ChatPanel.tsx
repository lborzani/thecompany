import { useState, useRef, useEffect } from "react";
import { Send, X, AlertCircle } from "lucide-react";
import { useGameStore } from "../../store/gameStore";
import { network } from "../../services/network";
import { diceService } from "../../services/diceService";

interface DiceButtonProps {
    faces: number;
    label: string;
    onClick: () => void;
}

const DiceButton = ({ faces, label, onClick }: DiceButtonProps) => (
    <button
        onClick={onClick}
        className="w-8 h-8 md:w-10 md:h-10 bg-zinc-700 hover:bg-zinc-600 rounded flex items-center justify-center font-bold text-zinc-300 text-xs md:text-sm border border-zinc-600 transition-colors"
        title={`Roll d${faces}`}
    >
        {label}
    </button>
);

export const ChatPanel = () => {
    const [msg, setMsg] = useState("");
    const [showDiceModal, setShowDiceModal] = useState<{ faces: number } | null>(null);
    const messages = useGameStore(state => state.chatMessages);
    const currentUser = useGameStore(state => state.currentUser);
    const users = useGameStore(state => state.users);
    const diceRoom = useGameStore(state => state.diceRoom);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [modifier, setModifier] = useState(0);
    const [count, setCount] = useState(1);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Listen for dice rolls from the service
    useEffect(() => {
        const handleRoll = (roll: any) => {
            // Check if equation exists (e.g. 1d20)
            const equation = roll.equation || "Dice";
            const total = roll.total_value;
            
            // Extract user name from dddice event
            // We use external_id to match with our local P2P users
            const rollerExternalId = roll.external_id;
            const rollerName = roll.user?.username || "Unknown";

            const rollId = roll.uuid || crypto.randomUUID();
            
            // Individual values breakdown if multiple dice
            let breakdown = "";
            if (roll.values && roll.values.length > 1) {
                const vals = roll.values.map((v: any) => v.value).join(" + ");
                breakdown = `( ${vals} ) = `;
            }

            const content = `Rolled ${equation}: ${breakdown}[ ${total} ]`;
            
            // Try to match with local users
            const localUsers = useGameStore.getState().users;
            const knownUser = localUsers.find(u => u.id === rollerExternalId) 
                           || localUsers.find(u => u.username === rollerName);
            
            // Use local user data if found, otherwise fallback to dddice data
            const displaySender = knownUser ? knownUser.username : (rollerName !== "Unknown" ? rollerName : "??");
            const displayColor = knownUser ? knownUser.color : "#ffaa00";

            const chatMsg = {
                id: rollId,
                sender: displaySender,
                content: content, 
                type: 'roll' as const,
                timestamp: Date.now(),
                color: displayColor
            };

            useGameStore.getState().addChatMessage(chatMsg);

            // Broadcast to other peers if this roll was generated locally
            if (roll.is_local) {
                const networkPayload = { ...roll, is_local: false };
                network.broadcast({ type: 'DICE_ROLL', payload: networkPayload });
            }
        };

        diceService.onRoll(handleRoll);
        return () => diceService.offRoll(handleRoll);
    }, []);

    const sendMessage = () => {
        if (!msg.trim() || !currentUser) return;
        
        const chatMsg = {
            id: crypto.randomUUID(),
            sender: currentUser.username,
            content: msg,
            type: 'text' as const,
            timestamp: Date.now(),
            color: currentUser.color
        };

        useGameStore.getState().addChatMessage(chatMsg);
        network.broadcast({ type: 'CHAT_MESSAGE', payload: chatMsg });
        setMsg("");
    };

    const handleRollClick = (faces: number) => {
        if (!diceRoom) {
            alert("Dice room not connected yet. Please wait for the Host.");
            return;
        }
        setCount(1);
        setModifier(0);
        setShowDiceModal({ faces });
    };

    const confirmRoll = async () => {
        if (!showDiceModal || !currentUser) return;

        // 1. Executa a rolagem Visual 3D
        // "theme": "dddice-standard" é o basicão (OBRIGATÓRIO enviar theme)
        const diceArgs = [];
        for(let i=0; i<count; i++) {
            diceArgs.push({ 
                type: `d${showDiceModal.faces}`, 
                theme: "dddice-bees" // Mudando para dddice-red que é garantido existir ou dddice-standard
            }); 
        }
        
        console.log("Rolling dice:", diceArgs);
        await diceService.roll(diceArgs, { external_id: currentUser.id });
        
        setShowDiceModal(null);
    };

    return (
        <div className="absolute bottom-4 right-4 z-40 w-80 h-96 bg-zinc-900/95 backdrop-blur border border-zinc-700 rounded-lg flex flex-col shadow-2xl overflow-hidden">
             {/* Header */}
             <div className="bg-zinc-800 p-2 flex items-center justify-between border-b border-zinc-700">
                <span className="font-bold text-zinc-300 text-sm">Chat & Dice</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">P2P Encrypted</span>
             </div>

             {/* Messages Area */}
             <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 && (
                    <div className="text-zinc-500 text-center text-xs mt-4 italic">
                        No messages yet. Start chatting or roll some dice!
                    </div>
                )}
                {messages.map(m => (
                    <div key={m.id} className="text-sm">
                        <span className="font-bold mr-2" style={{ color: m.color || '#fff' }}>[{m.sender}]:</span>
                        <span className={m.type === 'roll' ? 'text-blue-400 font-mono italic' : 'text-zinc-300'}>
                            {m.content}
                        </span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
             </div>

             {/* Dice Controls */}
             <div className="p-2 bg-zinc-800 border-t border-zinc-700 grid grid-cols-6 gap-1">
                 <DiceButton faces={4} label="d4" onClick={() => handleRollClick(4)} />
                 <DiceButton faces={6} label="d6" onClick={() => handleRollClick(6)} />
                 <DiceButton faces={8} label="d8" onClick={() => handleRollClick(8)} />
                 <DiceButton faces={10} label="d10" onClick={() => handleRollClick(10)} />
                 <DiceButton faces={12} label="d12" onClick={() => handleRollClick(12)} />
                 <DiceButton faces={20} label="d20" onClick={() => handleRollClick(20)} />
             </div>

             {/* Input Area */}
             <div className="p-2 bg-zinc-800 border-t border-zinc-700 flex gap-2">
                 <input 
                    className="flex-1 bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-sm text-white focus:border-blue-500 outline-none"
                    placeholder="Type a message..."
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                 />
                 <button 
                    onClick={sendMessage}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded"
                 >
                     <Send size={14} />
                 </button>
             </div>

             {/* Roll Modal Popover */}
             {showDiceModal && (
                 <div className="absolute inset-x-0 bottom-[88px] bg-zinc-800 border-t border-zinc-600 p-4 animate-in slide-in-from-bottom-2">
                     <div className="flex justify-between items-center mb-3">
                         <h3 className="font-bold text-white text-sm">Roll {count}d{showDiceModal.faces} {modifier !== 0 && (modifier > 0 ? `+${modifier}` : modifier)}</h3>
                         <button onClick={() => setShowDiceModal(null)}><X size={14} className="text-zinc-400"/></button>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 mb-4">
                         <div>
                             <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Count</label>
                             <input 
                                type="number" 
                                min="1" 
                                max="10" 
                                value={count}
                                onChange={e => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-white text-sm"
                             />
                         </div>
                         <div>
                             <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Modifier</label>
                             <input 
                                type="number" 
                                value={modifier}
                                onChange={e => setModifier(parseInt(e.target.value) || 0)}
                                className="w-full bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-white text-sm"
                             />
                         </div>
                     </div>

                     <button 
                        onClick={confirmRoll}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-sm uppercase tracking-wide flex items-center justify-center gap-2"
                     >
                         Roll Dice
                     </button>
                 </div>
             )}
        </div>
    );
};