import { useState, useRef, useEffect } from "react";
import { Send, X, Dices } from "lucide-react";
import { useGameStore } from "../../store/gameStore";
import { network } from "../../services/network";
import { diceService } from "../../services/diceService";
import { DiceRollResult, ChatMessage } from '@thecompany/shared-types';

const DICE_FACES = [4, 6, 8, 10, 12, 20] as const;

const DiceButton = ({ faces, onClick }: { faces: number; onClick: () => void }) => (
    <button
        onClick={onClick}
        className="h-8 bg-surface-4 hover:bg-surface-5 rounded-md flex items-center justify-center font-mono font-semibold text-zinc-400 hover:text-brand-400 text-xs border border-border hover:border-brand-500/30 transition-all"
        title={`Roll d${faces}`}
    >
        d{faces}
    </button>
);

export const ChatPanel = () => {
    const [msg, setMsg] = useState("");
    const [showDiceModal, setShowDiceModal] = useState<{ faces: number } | null>(null);
    const messages = useGameStore(state => state.chatMessages);
    const currentUser = useGameStore(state => state.currentUser);
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

    useEffect(() => {
        const handleRoll = (roll: DiceRollResult) => {
            const equation = roll.equation || "Dice";
            const total = roll.total_value;
            const rollerExternalId = roll.external_id;
            const rollerName = roll.user?.username || "Unknown";
            const rollId = roll.uuid || crypto.randomUUID();
            
            let breakdown = "";
            if (roll.values && roll.values.length > 1) {
                const vals = roll.values.map(v => v.value).join(" + ");
                breakdown = `( ${vals} ) = `;
            }

            const modStr = roll.modifier !== 0 ? (roll.modifier > 0 ? ` +${roll.modifier}` : ` ${roll.modifier}`) : '';
            const content = `Rolled ${equation}${modStr}: ${breakdown}[ ${total} ]`;
            
            const localUsers = useGameStore.getState().users;
            const knownUser = localUsers.find(u => u.id === rollerExternalId) 
                           || localUsers.find(u => u.username === rollerName);
            
            const displaySender = knownUser ? knownUser.username : (rollerName !== "Unknown" ? rollerName : "??");
            const displayColor = knownUser ? knownUser.color : "#ffaa00";

            const chatMsg: ChatMessage = {
                id: rollId,
                sender: displaySender,
                content: content, 
                type: 'roll',
                timestamp: Date.now(),
                color: displayColor
            };

            useGameStore.getState().addChatMessage(chatMsg);

            if (roll.is_local) {
                const networkPayload: DiceRollResult = { ...roll, is_local: false };
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

        const diceArgs = [];
        for (let i = 0; i < count; i++) {
            diceArgs.push({ type: `d${showDiceModal.faces}` }); 
        }
        
        await diceService.roll(diceArgs, { external_id: currentUser.id, modifier });
        setShowDiceModal(null);
    };

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    };

    return (
        <div className="h-full flex flex-col bg-surface-1 border-l border-border relative">
             {/* Messages Area */}
             <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2">
                        <Dices size={28} strokeWidth={1.5} />
                        <p className="text-xs text-center">No messages yet.<br/>Start chatting or roll some dice!</p>
                    </div>
                )}
                {messages.map(m => (
                    <div key={m.id} className="group text-[13px] leading-relaxed py-0.5 hover:bg-surface-2/50 -mx-1 px-1 rounded">
                        <span className="text-[10px] text-zinc-700 mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                            {formatTime(m.timestamp)}
                        </span>
                        <span className="font-semibold mr-1.5" style={{ color: m.color || '#fff' }}>{m.sender}</span>
                        {m.type === 'contextual_roll' && m.rollContext ? (
                            <span className="text-violet-400 font-mono text-xs">
                                <span className="text-zinc-600 text-[10px]">{m.rollContext.characterName} — </span>
                                {m.content}
                                {m.rollContext.modifierBreakdown && m.rollContext.modifierBreakdown.length > 0 && (
                                    <span className="text-zinc-700 text-[10px] ml-1">
                                        ({m.rollContext.modifierBreakdown.map(b => `${b.source} ${b.value >= 0 ? '+' : ''}${b.value}`).join(', ')})
                                    </span>
                                )}
                            </span>
                        ) : m.type === 'roll' ? (
                            <span className="text-brand-400 font-mono text-xs">{m.content}</span>
                        ) : (
                            <span className="text-zinc-300">{m.content}</span>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
             </div>

             {/* Dice Controls */}
             <div className="px-2.5 py-2 border-t border-border grid grid-cols-6 gap-1.5">
                 {DICE_FACES.map(f => (
                     <DiceButton key={f} faces={f} onClick={() => handleRollClick(f)} />
                 ))}
             </div>

             {/* Input Area */}
             <div className="p-2.5 border-t border-border flex gap-2">
                 <input 
                    className="input flex-1 !py-1.5 text-sm"
                    placeholder="Type a message..."
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                 />
                 <button 
                    onClick={sendMessage}
                    className="btn-primary !px-3 !py-1.5"
                 >
                     <Send size={14} />
                 </button>
             </div>

             {/* Roll Modal Popover */}
             {showDiceModal && (
                 <div className="absolute inset-x-0 bottom-[88px] bg-surface-3 border-t border-border p-4 animate-slide-up shadow-xl">
                     <div className="flex justify-between items-center mb-3">
                         <h3 className="font-bold text-zinc-100 text-sm font-mono">
                             {count}d{showDiceModal.faces}{modifier !== 0 && (modifier > 0 ? ` +${modifier}` : ` ${modifier}`)}
                         </h3>
                         <button onClick={() => setShowDiceModal(null)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                             <X size={14} />
                         </button>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-3 mb-3">
                         <div>
                             <label className="label mb-1 block">Count</label>
                             <input 
                                type="number" 
                                min="1" 
                                max="10" 
                                value={count}
                                onChange={e => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                                className="input !py-1.5 text-sm"
                             />
                         </div>
                         <div>
                             <label className="label mb-1 block">Modifier</label>
                             <input 
                                type="number" 
                                value={modifier}
                                onChange={e => setModifier(parseInt(e.target.value) || 0)}
                                className="input !py-1.5 text-sm"
                             />
                         </div>
                     </div>

                     <button 
                        onClick={confirmRoll}
                        className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                     >
                         <Dices size={15} /> Roll Dice
                     </button>
                 </div>
             )}
        </div>
    );
};