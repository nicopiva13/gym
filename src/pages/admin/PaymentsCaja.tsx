import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { 
    Plus, 
    Search, 
    DollarSign, 
    Calendar, 
    CreditCard, 
    Wallet, 
    ArrowRightLeft,
    FileText,
    TrendingUp,
    ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatCard from '../../components/StatCard';

export default function PaymentsCaja() {
    const [payments, setPayments] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        Promise.all([
            api.getPayments(),
            api.getDailySummary(today)
        ]).then(([payRes, sumRes]) => {
            setPayments(payRes.data);
            setSummary(sumRes.data);
            setLoading(false);
        }).catch(() => {
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="text-amber-500 font-display animate-pulse p-20 text-3xl tracking-[0.5em] font-black uppercase text-center w-full">Sincronizando Caja...</div>;

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-5xl font-display font-black text-white italic uppercase tracking-widest mb-2">Monitor de Caja</h1>
                  <p className="text-sm font-body font-black text-neutral-500 uppercase tracking-widest">Auditoría de ingresos y desgloses de venta</p>
                </div>
                <button className="btn-primary flex items-center gap-3 px-10">
                    <Plus className="w-5 h-5" />
                    Registrar Venta
                </button>
            </div>

            {/* Daily Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 glass-panel p-8 rounded-[2.5rem] bg-amber-500/5 border-amber-500/10 flex flex-col justify-between">
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-2">Total Recaudado Hoy</h4>
                        <p className="text-4xl font-display font-black text-white italic tracking-widest">${summary?.total?.toLocaleString() || '0'}</p>
                    </div>
                    <div className="pt-6 border-t border-white/5 space-y-3">
                        {summary?.breakdown?.map((b: any) => (
                            <div key={b.method} className="flex justify-between items-center">
                                <span className="text-[9px] font-black uppercase text-neutral-500 tracking-widest">{b.method}</span>
                                <span className="text-xs font-display font-bold text-white">${b.total.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                   <StatCard title="Transacciones (Mes)" value={payments.length.toString()} icon={ArrowRightLeft} />
                   <StatCard title="Ticket Promedio" value={`$${(summary?.total / (payments.filter((p:any) => p.created_at.includes(new Date().toISOString().split('T')[0])).length || 1)).toLocaleString()}`} icon={TrendingUp} />
                   <StatCard title="Pagos Auditados" value="100%" icon={ShieldCheck} />
                </div>
            </div>

            {/* Transaction List */}
            <div className="glass-panel rounded-[3rem] overflow-hidden border-white/5 shadow-2xl">
                <div className="p-10 border-b border-white/5 flex justify-between items-center bg-zinc-900/30">
                    <h3 className="text-2xl font-display font-black text-white uppercase tracking-widest">Histórico de Cobros</h3>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" />
                        <input className="bg-zinc-800 border-none rounded-xl py-3 pl-12 pr-6 text-[10px] text-white font-black uppercase tracking-widest placeholder:text-neutral-700 outline-none" placeholder="Buscar transacción..." />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left font-body">
                        <thead>
                            <tr className="bg-zinc-900/50 text-[10px] uppercase tracking-[0.3em] text-neutral-600 font-black">
                                <th className="px-10 py-6">Referencia</th>
                                <th className="px-10 py-6">Socio Emisor</th>
                                <th className="px-10 py-6">Plan / Concepto</th>
                                <th className="px-10 py-6">Monto Final</th>
                                <th className="px-10 py-6">Método Pago</th>
                                <th className="px-10 py-6 text-right">Audit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {payments.map((p: any) => (
                                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-3 text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                            <FileText className="w-4 h-4 text-amber-500/30" />
                                            #{p.id.toString().padStart(6, '0')}
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <p className="text-sm font-display font-bold text-white uppercase tracking-widest">{p.name} {p.lastname}</p>
                                        <p className="text-[9px] text-neutral-600 font-black uppercase tracking-wider">ID Socio: {p.client_id}</p>
                                    </td>
                                    <td className="px-10 py-6">
                                        <span className="text-[10px] font-black uppercase text-amber-500/60 tracking-widest">{p.plan_name}</span>
                                    </td>
                                    <td className="px-10 py-6">
                                        <span className="text-lg font-display font-black text-white italic">${parseFloat(p.final_amount).toLocaleString()}</span>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-3">
                                            {p.method === 'Efectivo' ? <Wallet className="w-4 h-4 text-emerald-500" /> : <CreditCard className="w-4 h-4 text-blue-500" />}
                                            <span className="text-[9px] font-black uppercase text-neutral-400 tracking-widest">{p.method}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <button className="text-[9px] font-black text-neutral-600 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2 ml-auto">
                                            Ver recibo <Calendar className="w-4 h-4" />
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
