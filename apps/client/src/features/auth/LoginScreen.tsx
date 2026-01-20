import { useState, useEffect } from 'react';
import { network } from '../../services/network';
import { Lock, User, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';

interface LoginScreenProps {
    onBack: () => void;
}

export const LoginScreen = ({ onBack }: LoginScreenProps) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'connecting' | 'idle' | 'authenticating'>('idle');

    useEffect(() => {
        // Setup network callbacks
        network.onAuthError = (msg) => {
            setError(msg);
            setStatus('idle');
        };
        
        // On success, the store is updated, and the parent component should switch the view
        // But we can also set a local state if needed.
        
        return () => {
            network.onAuthError = null;
        };
    }, []);

    const handleLogin = () => {
        if (!username) return;
        setStatus('authenticating');
        setError(null);
        network.sendLogin(username, password);
    };

    return (
        <div className="h-screen w-screen bg-zinc-900 flex items-center justify-center relative">
            <button 
                onClick={onBack}
                className="absolute top-4 left-4 text-zinc-400 hover:text-white flex items-center gap-2"
            >
                <ArrowLeft size={20} /> Back
            </button>
            <div className="bg-zinc-800 p-8 rounded-xl shadow-2xl w-full max-w-sm border border-zinc-700">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Identify Yourself</h2>
                    <p className="text-zinc-400 text-sm">Enter your character credentials provided by the GM.</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 p-3 rounded mb-4 flex items-center gap-2 text-red-500 text-sm">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                            <input 
                                type="text" 
                                className="w-full bg-zinc-900 border border-zinc-700 text-white pl-10 pr-3 py-2 rounded focus:border-blue-500 outline-none transition-colors"
                                placeholder="Character Name"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Password (Optional)</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                             <input 
                                type="password" 
                                className="w-full bg-zinc-900 border border-zinc-700 text-white pl-10 pr-3 py-2 rounded focus:border-blue-500 outline-none transition-colors"
                                placeholder="Secret"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleLogin}
                        disabled={status === 'authenticating' || !username}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded flex items-center justify-center gap-2 mt-2"
                    >
                        {status === 'authenticating' ? (
                            'Verifying...'
                        ) : (
                            <>Login <ArrowRight size={16} /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};