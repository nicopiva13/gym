import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Plus, CreditCard, Clock, MoreVertical, CheckCircle2 } from 'lucide-react';

export default function PlansPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getPlans().then(res => {
            setPlans(res.data);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    return (
        <div className="space-y-10">
            <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-display uppercase tracking-widest text-white mb-2">Planes y Membresías</h1>
                  <p className="text-sm text-neutral-500 font-body uppercase tracking-widest font-bold">Gestión de productos y periodos de suscripción</p>
                </div>
                <button className="btn-primary flex items-center gap-2 px-6">
                    <Plus className="w-4 h-4" />
                    Nuevo Plan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full h-40 glass-panel animate-pulse flex items-center justify-center font-display text-amber-500 text-xl tracking-widest uppercase">Cargando planes...</div>
                ) : plans.length === 0 ? (
                    <div className="col-span-full h-40 glass-panel flex items-center justify-center font-body text-neutral-500 text-xl tracking-widest uppercase border-dashed">No hay planes vigentes</div>
                ) : (
                    plans.map((p, i) => (
                        <div key={i} className="glass-panel p-10 rounded-3xl group border-amber-500/10 hover:border-amber-500/40 transition-all flex flex-col justify-between h-full hover:-translate-y-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-[50px] -z-10 group-hover:bg-amber-500/10 transition-all" />
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-zinc-900 border border-white/5 rounded-2xl">
                                        <CreditCard className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <button className="p-2 text-neutral-700 hover:text-white transition-colors">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                                <div>
                                    <h4 className="text-2xl font-display text-white uppercase tracking-widest mb-2">{p.name}</h4>
                                    <p className="text-[10px] text-neutral-500 font-body uppercase tracking-widest font-extrabold flex items-center gap-2 mb-6">
                                       <Clock className="w-3.5 h-3.5" />
                                       Duración: {p.duration_days} días
                                    </p>
                                    <p className="text-xs text-neutral-500 font-body line-clamp-3 mb-8">{p.description}</p>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-[10px] text-zinc-300 font-bold uppercase tracking-widest">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> {p.includes_classes ? 'Clases Grupales Incluidas' : 'Sólo Musculación'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-10 border-t border-white/5 pt-8 flex justify-between items-end">
                                <div>
                                    <p className="text-[9px] uppercase font-black tracking-widest text-neutral-600">Precio Mensual</p>
                                    <p className="text-3xl font-display text-white tracking-widest">${parseFloat(p.price).toLocaleString()}</p>
                                </div>
                                <button className="btn-secondary text-[10px] px-6 py-3">Editar Plan</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
