import { useEffect, useState } from 'react';
import { 
    Users, 
    CreditCard, 
    TrendingUp, 
    AlertTriangle,
    BarChart3,
    ArrowUpRight,
    UsersRound
} from 'lucide-react';
import StatCard from '../../components/StatCard';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { api } from '../../api/client';
import { motion } from 'framer-motion';

const COLORS = ['#f59e0b', '#f97316', '#fbbf24', '#ea580c'];

export default function AdminDashboard() {
    const [stats, setStats] = useState<Record<string, Record<string, unknown>> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getOwnerDashboard().then(res => {
            setStats(res.data);
            setLoading(false);
        }).catch(() => {
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="min-h-[60vh] flex items-center justify-center p-20 text-amber-500 font-display text-2xl tracking-[0.3em] font-black animate-pulse uppercase">Sincronizando Métricas...</div>;

    const kpis = stats?.kpis || {};
    const charts = stats?.charts || {};

    return (
        <div className="space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-5xl font-display font-black text-white uppercase tracking-widest mb-2">Panel de Control</h1>
                <p className="text-xs font-body font-black text-neutral-500 uppercase tracking-[0.3em]">Gestión Integral del Gimnasio</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard title="Socios Activos" value={kpis.active_members?.toString() || '0'} icon={Users} />
                <StatCard title="Ingresos Mes" value={`$${kpis.monthly_income?.toLocaleString() || '0'}`} icon={CreditCard} />
                <StatCard title="Altas Mes" value={kpis.new_members?.toString() || '0'} icon={UsersRound} />
                <StatCard title="Por Vencer" value={kpis.expiring_soon?.toString() || '0'} icon={AlertTriangle} />
                <StatCard title="Deudores" value={kpis.debtors?.toString() || '0'} icon={TrendingUp} />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income Chart */}
                <div className="glass-panel p-8 rounded-[2rem] space-y-6">
                    <h3 className="text-xl font-display font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-amber-500" />
                        Ingresos Mensuales
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.income}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                <XAxis dataKey="month" stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '16px' }}
                                    itemStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Attendance Chart */}
                <div className="glass-panel p-8 rounded-[2rem] space-y-6">
                    <h3 className="text-xl font-display font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-amber-500" />
                        Asistencia por Día
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={charts.attendance}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                <XAxis dataKey="day" stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '16px' }}
                                    itemStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
                                />
                                <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={4} dot={{ r: 4, fill: '#f59e0b' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Plans Pie Chart */}
                <div className="glass-panel p-8 rounded-[2rem] space-y-6 flex flex-col justify-center items-center">
                    <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest w-full border-b border-white/5 pb-4">Planes Activos</h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={charts.plans}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="name"
                                >
                                    {charts.plans?.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                     contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '16px' }}
                                     itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-2 glass-panel p-8 rounded-[2rem] space-y-6">
                    <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest flex items-center justify-between">
                        Siguientes Vencimientos
                        <span className="text-[10px] font-body font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full uppercase">Próximos 7 días</span>
                    </h3>
                    <div className="space-y-4">
                        {(stats?.upcoming_expirations as Array<{ id: number; name: string; lastname: string; days_left: number }> | undefined)?.length ? (
                            (stats.upcoming_expirations as Array<{ id: number; name: string; lastname: string; days_left: number }>).map(member => (
                                <div key={member.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl group hover:bg-white/10 transition-all border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-display font-bold text-neutral-500">
                                            {String(member.name)[0]}{String(member.lastname)[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-display font-bold text-white uppercase tracking-widest">{member.name} {member.lastname}</p>
                                            <p className="text-[10px] text-neutral-500 font-body uppercase tracking-wider">Vence en {member.days_left} días</p>
                                        </div>
                                    </div>
                                    <button className="p-3 text-neutral-600 group-hover:text-amber-500 transition-colors">
                                        <ArrowUpRight className="w-5 h-5" />
                                    </button>
                                </div>
            ))
                        ) : (
                            <p className="text-[11px] text-neutral-600 font-body uppercase tracking-widest text-center py-6">No hay socios próximos a vencer</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
