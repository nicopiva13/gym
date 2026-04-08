import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, User, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { motion } from 'framer-motion';

export default function LoginTrainer() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.loginTrainer({ username, password });
            login(response.token, response.user);
            navigate('/entrenador');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#09090b] relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[100px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[100px] rounded-full" />

            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10 z-10"
            >
                <h1 className="text-5xl font-display font-black text-white tracking-[0.2em] mb-2">IRON<span className="text-orange-500">TRAINER</span></h1>
                <p className="text-[10px] font-body font-black text-neutral-500 uppercase tracking-[0.4em]">Coach Support Center</p>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel rounded-3xl p-8 max-w-sm w-full space-y-8 z-10"
            >
                <div className="text-center">
                    <h2 className="text-3xl font-display text-white uppercase tracking-wider">Acceso Entrenador</h2>
                    <p className="text-xs text-neutral-500 font-body uppercase tracking-widest font-bold">Ingresá a tu panel de coach</p>
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">Usuario</label>
                        <div className="relative">
                            <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="form-input pl-12 focus:ring-orange-500/50 focus:border-orange-500"
                                placeholder="Trainer ID"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">Pin / Clave</label>
                        <div className="relative">
                            <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="form-input pl-12 focus:ring-orange-500/50 focus:border-orange-500"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-display font-black uppercase tracking-widest py-4 px-6 rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(249,115,22,0.2)] flex justify-center items-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar a Coach Hub'}
                    </button>
                    
                    <button 
                      type="button" 
                      onClick={() => navigate('/usuario/login')}
                      className="w-full text-center text-[9px] font-black text-neutral-600 hover:text-orange-500 uppercase tracking-widest transition-colors"
                    >
                        ¿Eres socio? Entra aquí
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
