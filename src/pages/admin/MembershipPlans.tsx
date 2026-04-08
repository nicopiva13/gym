import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Plus, CreditCard, Clock, CheckCircle2, MoreVertical, Edit2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MembershipPlans() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);

    // Form
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('30');
    const [desc, setDesc] = useState('');

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = () => {
        setLoading(true);
        api.getMembershipPlans().then(res => {
            setPlans(res.data);
            setLoading(false);
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = { name, price: parseFloat(price), duration_days: parseInt(duration), description: desc };
        try {
            await api.createMembershipPlan(data); // Solo implementé store en el controller por ahora
            setShowModal(false);
            fetchPlans();
            reset();
        } catch (err) { alert('Error al guardar'); }
    };

    const reset = () => {
        setName(''); setPrice(''); setDuration('30'); setDesc(''); setEditingPlan(null);
    };

    if (loading && plans.length === 0) return <div className="text-amber-500 font-display animate-pulse p-20 text-3xl tracking-[0.5em] font-black uppercase text-center w-full">Sincronizando Planes...</div>;

    return (
        <div className="space-y-10">
            <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-5xl font-display font-black text-white uppercase tracking-widest mb-2">Planes de Membresía</h1>
                  <p className="text-sm font-body font-black text-neutral-500 uppercase tracking-widest">Configuración de suscripciones y precios</p>
                </div>
                <button 
                  onClick={() => { reset(); setShowModal(true); }}
                  className="btn-primary"
                >
                    <Plus className="w-5 h-5 mr-3" />
                    Nuevo Plan Comercial
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {plans.map((plan) => (
                    <motion.div 
                        key={plan.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-panel p-10 rounded-[3rem] border-white/5 group hover:border-amber-500/20 transition-all flex flex-col justify-between"
                    >
                        <div className="space-y-6">
                            <div className="flex justify-between">
                                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center p-3 border border-amber-500/20">
                                    <Zap className="w-6 h-6 text-amber-500" />
                                </div>
                                <span className="badge-active">Público</span>
                            </div>
                            
                            <div>
                                <h3 className="text-2xl font-display font-black text-white uppercase tracking-wider mb-1">{plan.name}</h3>
                                <p className="text-[10px] font-body text-neutral-500 uppercase tracking-widest leading-relaxed mb-6 h-10 overflow-hidden line-clamp-2">{plan.description || 'Sin descripción'}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                                    <span className="text-[10px] font-black uppercase text-neutral-500 tracking-widest font-body">Costo Mensual</span>
                                    <span className="text-xl font-display font-black text-white italic tracking-widest">${plan.price.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                                    <span className="text-[10px] font-black uppercase text-neutral-500 tracking-widest font-body">Vigencia</span>
                                    <span className="text-xs font-display font-black text-amber-500/60 uppercase tracking-[0.2em]">{plan.duration_days} Días</span>
                                </div>
                            </div>
                        </div>

                        <button className="flex-1 btn-secondary w-full mt-10 text-[10px]">Configurar Restricciones</button>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
                        <motion.div 
                          className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)}
                        />
                        <motion.div className="glass-panel w-full max-w-lg p-10 rounded-[3rem] relative z-10">
                            <h2 className="text-3xl font-display font-black text-white uppercase tracking-widest mb-8">Definir Membresía</h2>
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Nombre del Plan</label>
                                    <input className="form-input" value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Precio Final ($)</label>
                                        <input type="number" className="form-input" value={price} onChange={e => setPrice(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Duración (Días)</label>
                                        <input type="number" className="form-input" value={duration} onChange={e => setDuration(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Descripción Comercial</label>
                                    <textarea className="form-input h-24 resize-none" value={desc} onChange={e => setDesc(e.target.value)} />
                                </div>
                                <button type="submit" className="w-full btn-primary py-5 text-lg">Guardar Plan de Suscripción</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
