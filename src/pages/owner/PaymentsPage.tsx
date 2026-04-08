import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Plus, Search, Filter, DollarSign, Calendar, TrendingUp, CreditCard } from 'lucide-react';
import StatCard from '../../components/StatCard';

export default function PaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getPayments().then(res => {
            setPayments(res.data);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    const totalIngresos = payments.reduce((acc, curr) => acc + parseFloat(curr.final_amount), 0);

    return (
        <div className="space-y-10">
            <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-display uppercase tracking-widest text-white mb-2">Pagos y Caja</h1>
                  <p className="text-sm text-neutral-500 font-body uppercase tracking-widest font-bold">Registro histórico de transacciones e ingresos</p>
                </div>
                <button className="btn-primary flex items-center gap-2 px-6">
                    <Plus className="w-4 h-4" />
                    Registrar Cobro
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Transado" value={`$${totalIngresos.toLocaleString()}`} icon={DollarSign} trend="+12%" trendUp={true} />
                <StatCard title="Pagos (Mes)" value={payments.length.toString()} icon={CreditCard} trend="+5%" trendUp={true} />
                <StatCard title="Tasa de Cobro" value="98%" icon={TrendingUp} trend="+1%" trendUp={true} />
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input className="form-input pl-11" placeholder="Buscar por socio, plan o fecha..." />
                </div>
                <button className="px-4 py-3 bg-zinc-900 border border-white/5 rounded-xl text-neutral-400 hover:text-white transition-colors">
                    <Filter className="w-4 h-4" />
                </button>
            </div>

            <div className="glass-panel rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-body">
                        <thead>
                            <tr className="bg-zinc-900/50 text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
                                <th className="px-8 py-4">Socio</th>
                                <th className="px-8 py-4">Plan Actualizado</th>
                                <th className="px-8 py-4">Fecha Pago</th>
                                <th className="px-8 py-4">Monto</th>
                                <th className="px-8 py-4">Método</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="px-8 py-20 text-center text-amber-500 animate-pulse font-display text-xl uppercase tracking-widest">Cargando pagos...</td></tr>
                            ) : payments.length === 0 ? (
                                <tr><td colSpan={5} className="px-8 py-20 text-center text-neutral-500 font-body uppercase tracking-widest">Sin transacciones registradas</td></tr>
                            ) : (
                                payments.map((p, i) => (
                                    <tr key={i} className="hover:bg-zinc-900 transition-colors text-xs font-bold">
                                        <td className="px-8 py-5 text-white uppercase tracking-wider">{p.name} {p.lastname}</td>
                                        <td className="px-8 py-5 text-neutral-500">{p.plan_name}</td>
                                        <td className="px-8 py-5 text-neutral-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{new Date(p.payment_date).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-amber-500 text-lg">${parseFloat(p.final_amount).toLocaleString()}</td>
                                        <td className="px-8 py-5">
                                            <span className="px-2 py-1 rounded-md text-[9px] uppercase tracking-widest bg-zinc-800 text-neutral-400 font-bold border border-white/5">
                                                {p.payment_method}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
