import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { motion } from 'framer-motion';

export default function Login() {
    const [email, setEmail] = useState('owner@gym.com');
    const [password, setPassword] = useState('1234');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.login({ email, password });
            login(response.token || '', response.data);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#050505] relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[100px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[100px] rounded-full" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-3 mb-10 z-10"
            >
                <div className="p-3 bg-amber-500/20 rounded-xl neon-border rotate-12">
                    <Dumbbell className="w-10 h-10 text-amber-500" />
                </div>
                <h1 className="text-5xl font-display italic tracking-widest text-white uppercase drop-shadow-lg">
                    IRON<span className="text-amber-500 neon-text">GYM</span>
                </h1>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="glass-panel rounded-3xl p-8 max-w-sm w-full space-y-8 z-10 border-white/10"
            >
                <div className="space-y-2 text-center">
                    <h2 className="text-3xl font-display text-white">Bienvenido</h2>
                    <p className="text-sm text-neutral-500 font-body">Ingresá tus credenciales para continuar</p>
                </div>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium flex items-center gap-2"
                    >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleLogin} className="w-full space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 font-body ml-1">Email</label>
                        <div className="relative">
                            <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="form-input pl-11"
                                placeholder="email@gym.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 font-body">Contraseña</label>
                            <button type="button" className="text-[10px] uppercase font-bold text-amber-500/70 hover:text-amber-500 transition-colors">¿Olvidaste?</button>
                        </div>
                        <div className="relative">
                            <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="form-input pl-11"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-4 text-sm tracking-[0.2em]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar al Sistema'}
                    </button>
                </form>

                <div className="text-[10px] text-neutral-600 text-center pt-6 border-t border-white/5 w-full font-body flex justify-center gap-8">
                   <button onClick={() => { setEmail('owner@gym.com'); setPassword('1234'); }} type="button" className="hover:text-amber-500 transition-all uppercase tracking-widest">Admin</button>
                   <button onClick={() => { setEmail('staff@gym.com'); setPassword('1234'); }} type="button" className="hover:text-amber-500 transition-all uppercase tracking-widest">Staff</button>
                   <button onClick={() => { setEmail('client@gym.com'); setPassword('1234'); }} type="button" className="hover:text-amber-500 transition-all uppercase tracking-widest">Cliente</button>
                </div>
            </motion.div>
            
            <p className="mt-8 text-[10px] text-neutral-700 font-body tracking-widest uppercase z-10">Iron Gym Management v2.0</p>
        </div>
    );
}
