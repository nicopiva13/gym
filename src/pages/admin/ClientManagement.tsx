import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { 
    Users, 
    Search, 
    Plus, 
    Filter, 
    Mail, 
    CreditCard, 
    Trophy,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClientManagement() {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        api.getClients().then(res => {
            setClients(res.data || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const filtered = clients.filter(c => 
        `${c.name} ${c.lastname}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.dni.includes(searchTerm)
    );

    if (loading && clients.length === 0) return <div className="text-amber-500 font-display animate-pulse p-20 text-3xl tracking-[0.5em] font-black uppercase text-center w-full">Sincronizando Socios...</div>;

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-5xl font-display font-black text-white italic uppercase tracking-widest mb-2">Padrón de Socios</h1>
                  <p className="text-sm font-body font-black text-neutral-500 uppercase tracking-widest">Base de datos centralizada de atletas</p>
                </div>
                <button className="btn-primary flex items-center gap-3 px-10">
                    <Plus className="w-5 h-5" />
                    Nuevo Atleta
                </button>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Socios Registrados', val: clients.length.toString(), icon: Users },
                    { label: 'Con Plan Activo', val: clients.filter(c => !c.end_date || new Date(c.end_date) > new Date()).length.toString(), icon: CreditCard },
                    { label: 'Con Plan Activo', val: clients.filter(c => !!c.active_plan_name).length.toString(), icon: Trophy },
                    { label: 'Vencidos', val: clients.filter(c => c.v_status === 'expired').length.toString(), icon: Filter },
                ].map((s, i) => (
                    <div key={i} className="glass-panel p-6 rounded-3xl flex items-center gap-5 border-white/5">
                        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/10">
                            <s.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-neutral-500">{s.label}</h4>
                            <p className="text-xl font-display font-black text-white italic tracking-widest leading-none">{s.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600" />
                    <input 
                      className="form-input pl-16 py-6 text-sm tracking-widest rounded-3xl" 
                      placeholder="BUSCAR POR NOMBRE, APELLIDO O DNI..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="px-8 bg-zinc-900 border border-white/5 text-neutral-500 rounded-3xl hover:text-white transition-all uppercase font-black text-[10px] tracking-widest flex items-center gap-3">
                    <Filter className="w-4 h-4" /> Filtros Avanzados
                </button>
            </div>

            {/* List Table */}
            <div className="glass-panel rounded-[3rem] overflow-hidden border-white/5 shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-body">
                        <thead>
                            <tr className="bg-zinc-900/50 text-[10px] uppercase tracking-[0.3em] text-neutral-600 font-black">
                                <th className="px-10 py-6">Ficha Socio</th>
                                <th className="px-10 py-6">Documento</th>
                                <th className="px-10 py-6">Entrenador Responsable</th>
                                <th className="px-10 py-6 text-center">Estado Membresía</th>
                                <th className="px-10 py-6 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.map((c: any) => (
                                <tr key={c.id} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-10 py-7">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center font-display font-black text-amber-500/40 group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-all">
                                                {c.name[0]}{c.lastname?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-display font-bold text-white uppercase tracking-widest">{c.name} {c.lastname}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                   <Mail className="w-3 h-3 text-neutral-700" />
                                                   <span className="text-[10px] text-neutral-600 font-black uppercase tracking-wider">{c.email || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-7">
                                        <div className="bg-zinc-900 py-1 px-3 rounded-lg border border-white/5 inline-block text-[11px] font-display font-black text-white/50 tracking-widest group-hover:text-white transition-colors">
                                            {c.dni}
                                        </div>
                                    </td>
                                    <td className="px-10 py-7">
                                        <div className="flex items-center gap-3 text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                            <div className="w-2 h-2 rounded-full bg-amber-500/40" />
                                            {c.trainer_name ? `${c.trainer_name} ${c.trainer_lastname}` : 'Sin Asignar'}
                                        </div>
                                    </td>
                                    <td className="px-10 py-7 text-center">
                                        {c.v_status === 'active' && <span className="badge-active">Activo</span>}
                                        {c.v_status === 'soon' && <span className="badge-soon">Por Vencer</span>}
                                        {c.v_status === 'expired' && <span className="badge-expired">Vencido</span>}
                                        {c.v_status === 'none' && <span className="badge-none">Sin Membresía</span>}
                                    </td>
                                    <td className="px-10 py-7 text-right">
                                        <button className="inline-flex items-center gap-2 text-[10px] font-black py-3 px-6 bg-zinc-900 hover:bg-amber-500 text-neutral-500 hover:text-black rounded-xl transition-all uppercase tracking-widest">
                                           Detalles <ArrowRight className="w-4 h-4 ml-1" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
