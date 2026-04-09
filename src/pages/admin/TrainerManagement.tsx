import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { UserCheck, Plus, Mail, Phone, MoreVertical, Shield, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface Trainer {
    id: number;
    name: string;
    lastname: string;
    email: string;
    phone?: string;
    role: string;
}

export default function TrainerManagement() {
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('gym_token');
        const apiBase = import.meta.env.VITE_API_URL || 'http://76.13.163.126:8082/api';
        fetch(`${apiBase}/staff`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        })
            .then(r => r.json())
            .then(res => {
                const filtered: Trainer[] = (res.data || []).filter((u: Trainer) => u.role === 'trainer');
                setTrainers(filtered);
            })
            .catch(() => setTrainers([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-amber-500 font-display animate-pulse p-20 text-3xl tracking-[0.5em] font-black uppercase text-center w-full">Sincronizando Staff...</div>;

    return (
        <div className="space-y-10">
            <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-5xl font-display font-black text-white uppercase tracking-widest mb-2">Staff de Coaches</h1>
                  <p className="text-sm font-body font-black text-neutral-500 uppercase tracking-widest">Gestión de entrenadores y asignaciones</p>
                </div>
                <button className="btn-primary flex items-center gap-3 px-8">
                    <Plus className="w-5 h-5" />
                    Nuevo Coach
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {trainers.map((t) => (
                    <motion.div 
                        key={t.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel p-10 rounded-[3rem] relative group border-white/5 hover:border-amber-500/20 transition-all overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[40px] rounded-full -z-10" />
                        
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="w-24 h-24 rounded-[2rem] bg-zinc-800 flex items-center justify-center p-3 border-2 border-white/5 group-hover:border-amber-500/30 transition-all rotate-3">
                                <UserCheck className="w-12 h-12 text-amber-500" />
                            </div>
                            
                            <div>
                                <h3 className="text-2xl font-display font-black text-white uppercase tracking-wider">{t.name} {t.lastname}</h3>
                                <p className="text-[10px] font-body text-neutral-500 font-black uppercase tracking-[0.4em] mb-4">Coach Autorizado</p>
                                
                                <div className="flex gap-4 mb-8">
                                    <span className="badge-active">Activo</span>
                                </div>

                                <div className="space-y-4 w-full">
                                    <div className="flex items-center gap-4 text-xs font-body text-neutral-400 font-bold bg-white/5 p-3 rounded-2xl border border-white/5">
                                        <Mail className="w-4 h-4 text-amber-500/50" />
                                        <span className="truncate">{t.email}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-body text-neutral-400 font-bold bg-white/5 p-3 rounded-2xl border border-white/5">
                                        <Phone className="w-4 h-4 text-amber-500/50" />
                                        <span>{t.phone || 'No registrado'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 w-full mt-4">
                                <button className="flex-1 btn-secondary text-[10px]">Ver Socios</button>
                                <button className="p-4 bg-zinc-800 rounded-2xl hover:text-white text-neutral-600 transition-colors">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
