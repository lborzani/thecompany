import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore, User } from '../../store/gameStore';
import { network } from '../../services/network';
import { Plus, X, User as UserIcon, Shield, Trash2 } from 'lucide-react';

export const PlayerManager = () => {
    const users = useGameStore(state => state.users);
    const addUser = useGameStore(state => state.addUser);
    const removeUser = useGameStore(state => state.removeUser);

    const [isOpen, setIsOpen] = useState(false);
    
    // New User Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleAddUser = () => {
        if (!username) return;
        
        const newUser: User = {
            id: crypto.randomUUID(),
            username,
            password: password || undefined,
            color: '#' + Math.floor(Math.random()*16777215).toString(16),
            isGM: false
        };

        addUser(newUser);
        // Sync with network
        const updatedUsers = [...users, newUser]; // We can't trust state to update immediately here
        network.broadcastUserList(updatedUsers);

        setUsername('');
        setPassword('');
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-xs flex items-center justify-center gap-2 transition-colors text-white"
            >
                <UserIcon size={14} />
                Manage Players
            </button>
        );
    }

    return createPortal(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-zinc-800 p-6 rounded-lg w-full max-w-md shadow-2xl border border-zinc-700 relative flex flex-col max-h-[90vh]">
                <button 
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white z-10"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 flex-shrink-0">
                    <UserIcon /> Manage Players
                </h2>

                <div className="space-y-4 mb-6 overflow-y-auto min-h-0 flex-1 pr-2">
                    {users.map(u => (
                        <div key={u.id} className="flex items-center justify-between bg-zinc-900 p-3 rounded border border-zinc-700">
                             <div className="flex items-center gap-3">
                                <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-black"
                                    style={{ backgroundColor: u.color }}
                                >
                                    {u.username[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-white font-medium flex items-center gap-2">
                                        {u.username}
                                        {u.isGM && <Shield size={12} className="text-yellow-500"/>}
                                    </p>
                                    <p className="text-xs text-zinc-500">
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
                                    className="text-red-500 hover:text-red-400 p-2"
                                 >
                                     <Trash2 size={16} />
                                 </button>
                             )}
                        </div>
                    ))}
                </div>

                <div className="bg-zinc-900 p-4 rounded border border-zinc-700 flex-shrink-0">
                    <h3 className="text-sm font-bold text-zinc-400 mb-3 uppercase">Create New Player Account</h3>
                    <div className="space-y-2">
                        <input 
                            type="text" 
                            placeholder="Username"
                            className="w-full bg-zinc-800 border border-zinc-600 text-white px-3 py-2 rounded focus:border-blue-500 outline-none"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                         <input 
                            type="text" 
                            placeholder="Password (Optional)"
                            className="w-full bg-zinc-800 border border-zinc-600 text-white px-3 py-2 rounded focus:border-blue-500 outline-none"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <button 
                            onClick={handleAddUser}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded mt-2 flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> Add User
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};