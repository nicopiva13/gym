import { useEffect, useState } from 'react';
import { 
    Users, 
    TrendingUp, 
    CalendarCheck, 
    AlertTriangle,
    CreditCard,
    ArrowUpRight,
    Search
} from 'lucide-react';
import StatCard from '../../components/StatCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../api/client';

const fallbackData = [
    { name: 'Lun', total: 0 },
    { name: 'Mar', total: 0 },
    { name: 'Mie', total: 0 },
    { name: 'Jue', total: 0 },
    { name: 'Vie', total: 0 },
    { name: 'Sab', total: 0 },
    { name: 'Dom', total: 0 },
];

export default function OwnerDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.getStats();
                setStats(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="text-amber-500 animate-pulse font-display text-2xl tracking-widest">CARGANDO MÉTRICAS...</div>;

    const kpis = stats?.kpis || { active_clients: 0, monthly_revenue: 0, today_attendance: 0, upcoming_expirations: 0 };
    const chartData = stats?.chart?.length > 0 ? stats.chart : fallbackData;

    return (
        <div className="space-y-10">
            {/* Page Header */}
            <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-display uppercase tracking-widest text-white mb-2">Resumen Ejecutivo</h1>
                  <p className="text-sm text-neutral-500 font-body uppercase tracking-widest font-bold">Estado general del gimnasio al día de hoy</p>
                </div>
                <div className="flex gap-4">
                   <div className="relative">
                      <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input className="bg-zinc-900 border border-white/5 rounded-xl py-3 pl-11 pr-6 text-xs text-white outline-none focus:border-amber-500/50 transition-all font-body uppercase tracking-widest font-bold" placeholder="Buscar socio..." />
                   </div>
                   <button className="btn-primary flex items-center gap-2">
                       <Users className="w-4 h-4" />
                       Nuevo Socio
                   </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Socios Activos" value={kpis.active_clients.toString()} icon={Users} trend="+12%" trendUp={true} />
                <StatCard title="Ingresos (Mes)" value={`$${kpis.monthly_revenue.toLocaleString()}`} icon={CreditCard} trend="+8%" trendUp={true} />
                <StatCard title="Visitas (Hoy)" value={kpis.today_attendance.toString()} icon={TrendingUp} trend="-2%" trendUp={false} />
                <StatCard title="Próximos Vencimientos" value={kpis.upcoming_expirations.toString()} icon={CalendarCheck} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-panel p-8 rounded-3xl space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-display uppercase tracking-wider text-white">Ingresos Recientes</h3>
                        <div className="flex gap-2">
                           <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-lg border border-amber-500/10">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              <span className="text-[10px] uppercase font-bold text-amber-500">Actual</span>
                           </div>
                        </div>
                    </div>
                    
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                <XAxis dataKey="dia" stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#121212', border: '1px solid #ffffff10', borderRadius: '12px' }}
                                    itemStyle={{ color: '#f59e0b', fontSize: '12px' }}
                                    labelStyle={{ color: '#fff', marginBottom: '4px', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-3xl flex flex-col justify-between">
                    <div className="space-y-6">
                        <h3 className="text-xl font-display uppercase tracking-wider text-white">Notificaciones</h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-white/5 group hover:border-amber-500/20 transition-all cursor-pointer">
                                    <div className="p-2 h-fit bg-red-500/10 rounded-lg">
                                       <AlertTriangle className="w-4 h-4 text-red-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold text-white mb-1 uppercase tracking-wider">Plan Vencido: Socio #{i}24</p>
                                        <p className="text-[10px] text-neutral-500 font-body">Venció hace poco. Pago pendiente.</p>
                                    </div>
                                    <ArrowUpRight className="ml-auto w-4 h-4 text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <button className="btn-secondary w-full mt-6 text-[10px]">Ver todas</button>
                </div>
            </div>

            {/* Recent Activity Table (Simplified) */}
            <div className="glass-panel rounded-3xl overflow-hidden">
                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-xl font-display uppercase tracking-wider text-white">Altas Recientes</h3>
                    <button className="text-[11px] font-bold text-amber-500/70 hover:text-amber-500 uppercase tracking-widest transition-colors">Ver todos</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-body">
                        <thead>
                            <tr className="bg-zinc-900/50 text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
                                <th className="px-8 py-4">Socio</th>
                                <th className="px-8 py-4">Plan</th>
                                <th className="px-8 py-4">Fecha</th>
                                <th className="px-8 py-4">Estado</th>
                                <th className="px-8 py-4">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {[
                                { name: 'Juan Perez', plan: 'Musculación', date: '20 Oct 2024', status: 'Activo', amount: '$3.500' },
                                { name: 'Maria Lopez', plan: 'Full Pass', date: '19 Oct 2024', status: 'Activo', amount: '$5.000' },
                                { name: 'Carlos Gomez', plan: 'Yoga', date: '18 Oct 2024', status: 'Pendiente', amount: '$3.200' },
                                { name: 'Ana Ruiz', plan: 'Musculación', date: '18 Oct 2024', status: 'Activo', amount: '$3.500' }
                            ].map((row, i) => (
                                <tr key={i} className="hover:bg-zinc-900 transition-colors text-xs font-bold">
                                    <td className="px-8 py-5 text-white">{row.name}</td>
                                    <td className="px-8 py-5 text-neutral-400">{row.plan}</td>
                                    <td className="px-8 py-5 text-neutral-500">{row.date}</td>
                                    <td className="px-8 py-5">
                                        <span className={`px-2 py-1 rounded-md text-[9px] uppercase tracking-wider ${row.status === 'Activo' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-amber-500">{row.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
