import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { 
    Users, 
    UserCheck, 
    TrendingUp, 
    AlertCircle,
    ChevronRight,
    Target
} from 'lucide-react';
import StatCard from '../../components/StatCard';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function TrainerDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getTrainerDashboard().then(res => {
            setStats(res.data);
            setLoading(false);
        }).catch(() => {
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="text-orange-500 font-display animate-pulse p-20 text-3xl tracking-[0.5em] font-black uppercase text-center w-full">Sincronizando Mis Clientes...</div>;

    const summary = stats?.summary || { total: 0, active: 0, expired: 0, soon: 0 };
    const clients = stats?.clients || [];

    return (
        <div className="space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-5xl font-display font-black text-white uppercase tracking-widest mb-2 italic">Coach Dashboard</h1>
                <p className="text-xs font-body font-black text-orange-500/60 uppercase tracking-[0.3em]">Gestión de socios asignados y progreso</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Asignados" value={summary.total.toString()} icon={Users} />
                <StatCard title="Cuota al Día" value={summary.active.toString()} icon={UserCheck} />
                <StatCard title="Próximos a Vencer" value={summary.soon.toString()} icon={TrendingUp} />
                <StatCard title="Cuota Vencida" value={summary.expired.toString()} icon={AlertCircle} />
            </div>

            {/* Clients List */}
            <div className="glass-panel rounded-[2.5rem] overflow-hidden border-orange-500/10 shadow-[0_0_50px_rgba(249,115,22,0.05)]">
                <div className="p-10 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-2xl font-display font-black text-white uppercase tracking-wider">Mis Socios Activos</h3>
                    <div className="flex gap-4">
                        <Link to="/entrenador/clientes" className="text-[10px] font-black text-orange-500/70 hover:text-orange-500 uppercase tracking-widest transition-colors font-body">Ver todos los socios</Link>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    {clients.length === 0 ? (
                        <div className="p-16 text-center">
                            <p className="text-[11px] font-black text-neutral-600 uppercase tracking-widest">Aún no tenés socios asignados</p>
                        </div>
                    ) : (
                    <table className="w-full text-left font-body">
                        <thead>
                            <tr className="bg-zinc-900/50 text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-black">
                                <th className="px-10 py-6">Socio</th>
                                <th className="px-10 py-6">DNI</th>
                                <th className="px-10 py-6 text-center">Estado Membresía</th>
                                <th className="px-10 py-6 text-center">Plan Entrenamiento</th>
                                <th className="px-10 py-6 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {clients.map((c: any) => (
                                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center font-display font-bold text-orange-500/40 group-hover:bg-orange-500/10 group-hover:text-orange-500 transition-all">
                                                {c.name[0]}{c.lastname[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-display font-bold text-white uppercase tracking-widest">{c.name} {c.lastname}</p>
                                                <p className="text-[10px] text-neutral-500 uppercase font-black tracking-wider lowercase">{c.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-xs font-black text-neutral-400 font-display tracking-widest">{c.dni}</td>
                                    <td className="px-10 py-6 text-center">
                                        {c.v_status === 'active' && <span className="badge-active">Activa</span>}
                                        {c.v_status === 'soon' && <span className="badge-soon">Vence Pronto</span>}
                                        {c.v_status === 'expired' && <span className="badge-expired">Vencida</span>}
                                        {c.v_status === 'none' && <span className="badge-none">Sin Plan</span>}
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-white uppercase tracking-widest bg-white/5 py-2 px-4 rounded-xl border border-white/5">
                                            <Target className="w-3 h-3 text-orange-500" />
                                            {c.active_plan_name || 'Sin plan'}
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <Link 
                                          to={`/entrenador/clientes/${c.id}`} 
                                          className="inline-flex items-center gap-2 text-[10px] font-black text-neutral-500 hover:text-white uppercase tracking-widest transition-all p-3 hover:bg-orange-500 rounded-xl"
                                        >
                                            Ficha <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    )}
                </div>
            </div>
        </div>
    );
}
