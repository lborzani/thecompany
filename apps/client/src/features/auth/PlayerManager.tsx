import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore, User } from '../../store/gameStore';
import { network } from '../../services/network';
import { Plus, X, User as UserIcon, Shield, Trash2 } from 'lucide-react';

interface PlayerManagerProps {
  onClose: () => void;
}

export const PlayerManager = ({ onClose }: PlayerManagerProps) => {
    const users = useGameStore(state => state.users);
    const addUser = useGameStore(state => state.addUser);
    const removeUser = useGameStore(state => state.removeUser);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleAddUser = () => {
        if (!username) return;
        
        const newUser: User = {
            id: crypto.randomUUID(),
            username,
            password: password || undefined,
            color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
            isGM: false
        };

        addUser(newUser);
        const updatedUsers = [...users, newUser];
        network.broadcastUserList(updatedUsers);

        setUsername('');
        setPassword('');
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
            <div className="card p-6 w-full max-w-md shadow-2xl relative flex flex-col max-h-[90vh]">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 btn-ghost !p-1.5 z-10"
                >
                    <X size={18} />
                </button>

                <h2 className="text-lg font-bold text-zinc-100 mb-4 flex items-center gap-2 flex-shrink-0">
                    <UserIcon size={18} /> Manage Players
                </h2>

                <div className="space-y-2 mb-5 overflow-y-auto min-h-0 flex-1 pr-1">
                    {users.map(u => (
                        <div key={u.id} className="flex items-center justify-between bg-surface-4 p-3 rounded-lg border border-border">
                             <div className="flex items-center gap-3">
                                <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-black"
                                    style={{ backgroundColor: u.color }}
                                >
                                    {u.username[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-200 font-medium flex items-center gap-2">
                                        {u.username}
                                        {u.isGM && <Shield size={12} className="text-amber-400"/>}
                                    </p>
                                    <p className="text-[11px] text-zinc-600">
                                        {u.password ? 'Password Protected' : 'No Password'}
                                    </p>
                                </div>
                             </div>

                             {!u.isGM && (
                                 <button 
                                    onClick={() => {
                                        removeUser(u.id);
                                        const updatedUsers = users.filter(user => user.id !== u.id);
                                        network.broadcastUserList(updatedUsers);
                                    }}
                                    className="text-red-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                 >
                                     <Trash2 size={15} />
                                 </button>
                             )}
                        </div>
                    ))}
                </div>

                <div className="bg-surface-4 p-4 rounded-lg border border-border flex-shrink-0">
                    <h3 className="label mb-3">Create Player Account</h3>
                    <div className="space-y-2">
                        <input 
                            type="text" 
                            placeholder="Username"
                            className="input"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                         <input 
                            type="text" 
                            placeholder="Password (Optional)"
                            className="input"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <button 
                            onClick={handleAddUser}
                            className="btn-primary w-full mt-1"
                        >
                            <Plus size={15} /> Add Player
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};