import { useGameStore } from '../../store/gameStore';
import { network } from '../../services/network';
import { Trash2, User, X, Check, Image as ImageIcon, Upload, ScrollText, Unlink } from 'lucide-react';
import { useRef } from 'react';

interface TokenContextMenuProps {
    tokenId: string;
    position: { x: number; y: number };
    onClose: () => void;
}

const SectionHeader = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
    <div className="label mb-2 flex items-center gap-1.5">
        <Icon size={11} /> {label}
    </div>
);

export const TokenContextMenu = ({ tokenId, position, onClose }: TokenContextMenuProps) => {
    const token = useGameStore(state => state.tokens.find(t => t.id === tokenId));
    const users = useGameStore(state => state.users);
    const characters = useGameStore(state => state.characters);
    const currentUser = useGameStore(state => state.currentUser);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    if (!token) { onClose(); return null; }
    if (!currentUser?.isGM) return null;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('Image too large! Please use images under 2MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            network.sendMove({ ...token, imageUrl: base64 });
        };
        reader.readAsDataURL(file);
    };

    const handleDelete = () => {
        if (confirm('Delete this token?')) {
            network.broadcastTokenDelete(token.id);
            onClose();
        }
    };

    const handleColorChange = (color: string) => {
        network.sendMove({ ...token, color });
    };

    const handleAssignOwner = (userId: string) => {
        network.sendMove({ ...token, ownerId: userId });
        onClose();
    };

    const handleClearOwner = () => {
        network.sendMove({ ...token, ownerId: undefined });
        onClose();
    };

    const colors = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#a78bfa', '#e879f9', '#ffffff', '#000000'];

    const listBtn = (active: boolean) =>
        `w-full text-left px-2 py-1.5 rounded-md text-[13px] flex items-center gap-2 transition-colors ${
            active ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30' : 'text-zinc-400 hover:bg-surface-4 border border-transparent'
        }`;

    return (
        <div 
            className="fixed z-50 bg-surface-2 rounded-xl shadow-2xl border border-border w-60 overflow-hidden animate-fade-in"
            style={{ top: position.y, left: position.x }}
            onMouseLeave={onClose}
        >   
            <div className="px-3 py-2 border-b border-border flex justify-between items-center bg-surface-3">
                <span className="text-xs font-semibold text-zinc-300 tracking-wide">Token Settings</span>
                <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors"><X size={13} /></button>
            </div>

            {/* Colors */}
            <div className="px-3 py-2.5 border-b border-border flex flex-wrap gap-1.5 justify-center">
                {colors.map(c => (
                    <button 
                        key={c}
                        className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-125 ${
                            token.color === c ? 'border-white ring-1 ring-white/30 scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                        onClick={() => handleColorChange(c)}
                    />
                ))}
            </div>

            {/* Image Upload */}
            <div className="px-3 py-2.5 border-b border-border">
                <SectionHeader icon={ImageIcon} label="IMAGE" />
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-ghost w-full text-xs justify-center"
                >
                    <Upload size={13} /> Upload Avatar
                </button>
                {token.imageUrl && (
                    <button 
                        onClick={() => network.sendMove({ ...token, imageUrl: undefined })}
                        className="w-full text-center text-[11px] text-red-400 hover:text-red-300 mt-1.5 transition-colors"
                    >
                        Remove image
                    </button>
                )}
            </div>

            {/* Owner Section */}
            <div className="px-3 py-2.5 border-b border-border">
                <SectionHeader icon={User} label="OWNER" />
                <div className="space-y-0.5 max-h-28 overflow-y-auto">
                    <button onClick={handleClearOwner} className={listBtn(!token.ownerId)}>
                        <span>None (GM Only)</span>
                        {!token.ownerId && <Check size={11} className="ml-auto" />}
                    </button>
                    {users.map(u => (
                        <button key={u.id} onClick={() => handleAssignOwner(u.id)} className={listBtn(token.ownerId === u.id)}>
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: u.color }} />
                            <span className="truncate">{u.username}</span>
                            {token.ownerId === u.id && <Check size={11} className="ml-auto" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Link Character Section */}
            {characters.length > 0 && (
                <div className="px-3 py-2.5 border-b border-border">
                    <SectionHeader icon={ScrollText} label="CHARACTER" />
                    <div className="space-y-0.5 max-h-28 overflow-y-auto">
                        <button
                            onClick={() => network.sendMove({ ...token, characterId: undefined })}
                            className={listBtn(!token.characterId).replace('brand', 'violet')}
                        >
                            <Unlink size={11} /> <span>None</span>
                            {!token.characterId && <Check size={11} className="ml-auto" />}
                        </button>
                        {characters.map(char => (
                            <button
                                key={char.id}
                                onClick={() => { network.sendMove({ ...token, characterId: char.id }); onClose(); }}
                                className={listBtn(token.characterId === char.id).replace('brand', 'violet')}
                            >
                                <ScrollText size={11} />
                                <span className="truncate">{char.name}</span>
                                {char.class && <span className="text-zinc-600 text-[10px]">({char.class} {char.level})</span>}
                                {token.characterId === char.id && <Check size={11} className="ml-auto" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Delete */}
            <div className="p-2">
                <button 
                    onClick={handleDelete}
                    className="btn-danger w-full text-xs justify-center"
                >
                    <Trash2 size={13} /> Delete Token
                </button>
            </div>
        </div>
    );
};