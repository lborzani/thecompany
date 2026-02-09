import { useState, useEffect } from 'react';
import { network } from '../../services/network';
import { Lock, User, ArrowRight, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

interface LoginScreenProps {
    onBack: () => void;
}

export const LoginScreen = ({ onBack }: LoginScreenProps) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'connecting' | 'idle' | 'authenticating'>('idle');

    useEffect(() => {
        network.onAuthError = (msg) => {
            setError(msg);
            setStatus('idle');
        };
        return () => { network.onAuthError = null; };
    }, []);

    const handleLogin = () => {
        if (!username) return;
        setStatus('authenticating');
        setError(null);
        network.sendLogin(username, password);
    };

    return (
        <div className="h-screen w-screen bg-surface-0 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.06)_0%,_transparent_60%)]" />

            <button 
                onClick={onBack}
                className="absolute top-4 left-4 btn-ghost z-10"
            >
                <ArrowLeft size={18} /> Back
            </button>

            <div className="card p-7 w-full max-w-sm shadow-2xl relative z-10">
                <div className="text-center mb-6">
                    <h2 className="text-lg font-bold text-zinc-100 mb-1.5">Identify Yourself</h2>
                    <p className="text-sm text-zinc-500">Enter the credentials provided by your GM.</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg mb-4 flex items-center gap-2 text-red-400 text-sm animate-fade-in">
                        <AlertCircle size={15} />
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    <div>
                        <label className="label mb-1.5 block">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 text-zinc-600" size={15} />
                            <input 
                                type="text" 
                                className="input !pl-9"
                                placeholder="Character Name"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label mb-1.5 block">Password <span className="text-zinc-700">(Optional)</span></label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-zinc-600" size={15} />
                            <input 
                                type="password" 
                                className="input !pl-9"
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
                        className="btn-primary w-full mt-1"
                    >
                        {status === 'authenticating' ? (
                            <><Loader2 size={15} className="animate-spin" /> Verifying...</>
                        ) : (
                            <>Login <ArrowRight size={15} /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};