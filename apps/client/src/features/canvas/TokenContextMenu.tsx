import { useGameStore } from '../../store/gameStore';
import { network } from '../../services/network';
import { Trash2, User, Palette, X, Check, Image as ImageIcon, Upload } from 'lucide-react';
import { Token } from '@thecompany/shared-types';
import { useState, useRef, useEffect } from 'react';

interface TokenContextMenuProps {
    tokenId: string;
    position: { x: number; y: number };
    onClose: () => void;
}

export const TokenContextMenu = ({ tokenId, position, onClose }: TokenContextMenuProps) => {
    const token = useGameStore(state => state.tokens.find(t => t.id === tokenId));
    const users = useGameStore(state => state.users);
    const currentUser = useGameStore(state => state.currentUser);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Safety check: Close if token doesn't exist
    if (!token) {
        onClose();
        return null;
    }

    // Only GM can see this menu context for now
    if (!currentUser?.isGM) return null;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) { // 2MB restriction
            alert('Image too large! Please use images under 2MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            const updated = { ...token, imageUrl: base64 };
            network.sendMove(updated);
        };
        reader.readAsDataURL(file);
    };

    const handleDelete = () => {
        if(confirm('Delete this token?')) {
             network.broadcastTokenDelete(token.id);
             onClose();
        }
    };

    const handleColorChange = (color: string) => {
        const updated = { ...token, color };
        network.sendMove(updated); // Syncs update
    };

    const handleAssignOwner = (userId: string) => {
        const updated = { ...token, ownerId: userId };
        network.sendMove(updated);
        onClose();
    };

    const handleClearOwner = () => {
        const updated = { ...token, ownerId: undefined };
        network.sendMove(updated);
        onClose();
    };

    const colors = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#a78bfa', '#e879f9', '#ffffff', '#000000'];

    return (
        <div 
            className="fixed z-50 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 w-64 overflow-hidden flex flex-col pt-1"
            style={{ top: position.y, left: position.x }}
            onMouseLeave={onClose}
        >   
            <div className="px-3 py-2 border-b border-zinc-700 flex justify-between items-center">
                <span className="font-bold text-white text-xs uppercase">Token Settings</span>
                <button onClick={onClose}><X size={14} className="text-zinc-400 hover:text-white"/></button>
            </div>

            {/* Colors */}
            <div className="p-3 grid grid-cols-5 gap-2 border-b border-zinc-700">
                {colors.map(c => (
                    <button 
                        key={c}
                        className={`w-6 h-6 rounded-full border-2 ${token.color === c ? 'border-white' : 'border-transparent'} hover:scale-110 transition-transform`}
                        style={{ backgroundColor: c }}
                        onClick={() => handleColorChange(c)}
                    />
                ))}
            </div>

            {/* Image Upload */}
            <div className="p-3 border-b border-zinc-700">
                <div className="text-xs font-bold text-zinc-400 mb-2 flex items-center gap-2">
                    <ImageIcon size={12} /> IMAGE
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-left px-2 py-1.5 rounded text-sm bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center gap-2"
                >
                    <Upload size={14} /> Upload Avatar
                </button>
                {token.imageUrl && (
                    <button 
                        onClick={() => {
                            const updated = { ...token, imageUrl: undefined };
                            network.sendMove(updated);
                        }}
                        className="w-full text-center text-xs text-red-400 hover:text-red-300 mt-2"
                    >
                        Remove Image
                    </button>
                )}
            </div>

            {/* Owner Section */}
            <div className="p-3 border-b border-zinc-700">
                 <div className="text-xs font-bold text-zinc-400 mb-2 flex items-center gap-2">
                    <User size={12} /> OWNER
                 </div>
                 <div className="space-y-1 max-h-32 overflow-y-auto">
                    <button 
                        onClick={handleClearOwner}
                        className={`w-full text-left px-2 py-1 rounded text-sm flex items-center gap-2 ${!token.ownerId ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-zinc-700'}`}
                    >
                        <span>None (GM Only)</span>
                        {!token.ownerId && <Check size={12} />}
                    </button>
                    {users.map(u => (
                         <button 
                            key={u.id}
                            onClick={() => handleAssignOwner(u.id)}
                            className={`w-full text-left px-2 py-1 rounded text-sm flex items-center gap-2 ${token.ownerId === u.id ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-zinc-700'}`}
                        >
                            <span className="w-2 h-2 rounded-full" style={{backgroundColor: u.color}}></span>
                            <span className="truncate">{u.username}</span>
                            {token.ownerId === u.id && <Check size={12} />}
                        </button>
                    ))}
                 </div>
            </div>

            {/* Actions */}
            <div className="p-2 bg-zinc-900">
                <button 
                    onClick={handleDelete}
                    className="w-full text-red-400 hover:text-white hover:bg-red-600 rounded px-2 py-2 text-sm flex items-center justify-center gap-2 transition-colors"
                >
                    <Trash2 size={14} /> Delete Token
                </button>
            </div>
        </div>
    );
};