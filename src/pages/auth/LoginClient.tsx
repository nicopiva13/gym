import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Fingerprint, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { motion } from 'framer-motion';

export default function LoginClient() {
    const [dni, setDni] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (dni.length < 6) return setError('Ingresá un DNI válido');
        
        setError('');
        setLoading(true);

        try {
            const response = await api.loginClient({ dni });
            login(response.token, response.user);
            navigate('/usuario');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al validar tu identidad');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#09090b] relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 blur-[120px] rounded-full" />

            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16 z-10"
            >
                <h1 className="text-6xl font-display font-black text-white italic tracking-widest mb-4">IRON<span className="text-amber-500">GYM</span></h1>
                <p className="text-xs font-body font-black text-amber-500/60 uppercase tracking-[0.5em] animate-pulse">Training Portal</p>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-[40px] p-10 max-w-sm w-full space-y-10 z-10 shadow-amber-500/5 shadow-2xl"
            >
                <div className="space-y-4">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
                        <Fingerprint className="w-10 h-10 text-amber-500" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-3xl font-display text-white uppercase tracking-wider">Hola Socio!</h2>
                        <p className="text-xs text-neutral-500 font-body uppercase tracking-[0.1em] font-black">Ingresá tu DNI para ver tu plan</p>
                    </div>
                </div>

                {error && (
                    <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest leading-relaxed text-center">
                        <AlertCircle className="w-4 h-4 mx-auto mb-2" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-8">
                    <div className="space-y-3">
                        <input
                            type="number"
                            value={dni}
                            onChange={(e) => setDni(e.target.value)}
                            required
                            className="form-input text-center text-2xl font-display font-bold tracking-[0.2em] py-6 rounded-3xl"
                            placeholder="DNI SIN PUNTOS"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-5 text-lg tracking-[0.2em] rounded-3xl"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'VER MI PLAN'}
                    </button>
                </form>

                <div className="pt-8 border-t border-white/5 flex flex-col gap-4">
                  <button 
                    type="button"
                    onClick={() => navigate('/admin/login')}
                    className="text-[9px] font-black text-neutral-600 hover:text-amber-500 uppercase tracking-widest transition-colors"
                  >
                      Acceso Staff Administrativo
                  </button>
                  <button 
                    type="button"
                    onClick={() => navigate('/trainer/login')}
                    className="text-[9px] font-black text-neutral-600 hover:text-orange-500 uppercase tracking-widest transition-colors"
                  >
                      Acceso Coach de Entrenamiento
                  </button>
                </div>
            </motion.div>
            
            <p className="mt-12 text-[10px] text-neutral-800 font-body tracking-[0.3em] uppercase z-10 font-black">Power by GMS v2.0</p>
        </div>
    );
}
