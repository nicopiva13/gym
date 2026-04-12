import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import {
    BarChart2, Users, TrendingUp, Calendar, Dumbbell,
    RefreshCw, AlertCircle, ChevronDown,
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { motion } from 'framer-motion';

const RANGE_OPTIONS = [
    { value: 'month',   label: 'Este mes' },
    { value: '3months', label: 'Últimos 3 meses' },
    { value: '6months', label: 'Últimos 6 meses' },
    { value: 'year',    label: 'Este año' },
];

const PIE_COLORS = ['#f59e0b', '#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

function SectionCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
    return (
        <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] border-white/5 space-y-5">
            <h3 className="text-lg font-display font-black text-white uppercase tracking-widest flex items-center gap-3 border-b border-white/5 pb-5">
                <Icon className="w-5 h-5 text-amber-500" /> {title}
            </h3>
            {children}
        </div>
    );
}

function KpiCard({ label, value, sub, color = 'text-amber-500' }: { label: string; value: string | number; sub?: string; color?: string }) {
    return (
        <div className="p-5 bg-white/5 rounded-2xl border border-white/5 text-center">
            <p className={`text-3xl font-display font-black italic ${color}`}>{value}</p>
            {sub && <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1">{sub}</p>}
            <p className="text-[9px] font-black uppercase tracking-widest text-neutral-600 mt-1">{label}</p>
        </div>
    );
}

const tooltipStyle = {
    contentStyle: { background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' },
    cursor: { fill: 'rgba(245,158,11,0.08)' },
};

export default function AdminStats() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [range, setRange] = useState('month');
    const [staff, setStaff] = useState<any[]>([]);
    const [trainerId, setTrainerId] = useState('');

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const res = await api.getDashboardStats({
                range,
                trainer_id: trainerId ? parseInt(trainerId) : undefined,
            });
            setData(res.data);
        } catch {
            setError(true);
        }
        setLoading(false);
    }, [range, trainerId]);

    useEffect(() => {
        api.getStaff().then(r => setStaff(r.data || [])).catch(() => {});
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const monthLabel = (m: string) =>
        new Date(m + '-01').toLocaleString('es-AR', { month: 'short' });

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <div>
                    <h1 className="text-5xl font-display font-black text-white italic uppercase tracking-widest mb-2">
                        Estadísticas
                    </h1>
                    <p className="text-sm font-body font-black text-neutral-500 uppercase tracking-widest">
                        Métricas y tendencias del gimnasio
                    </p>
                </div>
                <button
                    onClick={fetchStats}
                    disabled={loading}
                    className="p-3 bg-zinc-900 border border-white/5 rounded-2xl text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="relative">
                    <select
                        value={range}
                        onChange={e => setRange(e.target.value)}
                        className="form-input pr-10 appearance-none cursor-pointer text-[11px] font-black uppercase tracking-widest"
                    >
                        {RANGE_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                </div>
                <div className="relative">
                    <select
                        value={trainerId}
                        onChange={e => setTrainerId(e.target.value)}
                        className="form-input pr-10 appearance-none cursor-pointer text-[11px] font-black uppercase tracking-widest"
                    >
                        <option value="">Todos los entrenadores</option>
                        {staff.filter((s: any) => s.role === 'employee').map((s: any) => (
                            <option key={s.id} value={s.id}>{s.name} {s.lastname}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                </div>
            </div>

            {loading && (
                <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-panel rounded-[2.5rem] border-white/5 h-64 animate-pulse" />
                    ))}
                </div>
            )}

            {error && (
                <div className="flex items-center gap-4 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <div>
                        <p className="font-display font-black uppercase tracking-widest">Error al cargar estadísticas</p>
                        <p className="text-sm font-body mt-1 text-red-300/70">Verificá la conexión con el servidor e intentá de nuevo.</p>
                    </div>
                </div>
            )}

            {data && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

                    {/* 1. Retención */}
                    <SectionCard title="Retención del período" icon={TrendingUp}>
                        <div className="flex flex-col sm:flex-row items-center gap-8">
                            <div className="text-center shrink-0">
                                <p className="text-6xl font-display font-black italic text-amber-500">{data.retention.rate_percent}%</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mt-2">Tasa de retención</p>
                            </div>
                            <div className="flex-1 w-full">
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Renovaron', value: data.retention.renewed },
                                                { name: 'No renovaron', value: data.retention.churned },
                                            ]}
                                            cx="50%" cy="50%"
                                            innerRadius={50} outerRadius={70}
                                            dataKey="value"
                                        >
                                            <Cell fill="#10b981" />
                                            <Cell fill="#ef4444" />
                                        </Pie>
                                        <Tooltip {...tooltipStyle} />
                                        <Legend
                                            formatter={(v) => <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{v}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex justify-center gap-6 mt-2">
                                    <div className="text-center">
                                        <p className="text-xl font-display font-black text-green-400">{data.retention.renewed}</p>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-600">Renovaron</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xl font-display font-black text-red-400">{data.retention.churned}</p>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-600">No renovaron</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    {/* 2. Evolución de ingresos */}
                    <SectionCard title="Evolución de Ingresos" icon={TrendingUp}>
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={data.income_by_month.map((m: any) => ({ ...m, label: monthLabel(m.month) }))}>
                                <defs>
                                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                                <Tooltip {...tooltipStyle} formatter={(v: any) => [`$${Number(v).toLocaleString('es-AR')}`, 'Ingresos']} />
                                <Area type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} fill="url(#incomeGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </SectionCard>

                    {/* 3. Evolución socios activos */}
                    <SectionCard title="Socios Activos por Mes" icon={Users}>
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={data.active_clients_by_month.map((m: any) => ({ ...m, label: monthLabel(m.month) }))}>
                                <defs>
                                    <linearGradient id="clientGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip {...tooltipStyle} formatter={(v: any) => [v, 'Socios activos']} />
                                <Area type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={2} fill="url(#clientGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </SectionCard>

                    {/* 4. Ingresos por entrenador */}
                    {data.income_by_trainer?.length > 0 && (
                        <SectionCard title="Ingresos por Entrenador" icon={BarChart2}>
                            <ResponsiveContainer width="100%" height={Math.max(200, data.income_by_trainer.length * 52)}>
                                <BarChart data={data.income_by_trainer} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                                    <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                                    <YAxis type="category" dataKey="trainer_name" tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} width={120} />
                                    <Tooltip {...tooltipStyle} formatter={(v: any) => [`$${Number(v).toLocaleString('es-AR')}`, 'Ingresos']} />
                                    <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                                        {data.income_by_trainer.map((_: any, i: number) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </SectionCard>
                    )}

                    {/* 5. Asistencia por día */}
                    {data.attendance_by_weekday?.length > 0 && (
                        <SectionCard title="Asistencia por Día de la Semana" icon={Calendar}>
                            {(() => {
                                const maxDay = data.attendance_by_weekday.reduce((a: any, b: any) => b.count > a.count ? b : a, data.attendance_by_weekday[0]);
                                return (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={data.attendance_by_weekday}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                            <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis hide />
                                            <Tooltip {...tooltipStyle} formatter={(v: any) => [v, 'Asistencias']} />
                                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                                {data.attendance_by_weekday.map((d: any, i: number) => (
                                                    <Cell key={i} fill={d.day === maxDay.day ? '#f97316' : '#f59e0b'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                );
                            })()}
                            {data.attendance_by_weekday.length > 0 && (
                                <p className="text-[10px] font-black uppercase tracking-widest text-orange-500/60">
                                    Pico: {data.attendance_by_weekday.reduce((a: any, b: any) => b.count > a.count ? b : a).day}
                                </p>
                            )}
                        </SectionCard>
                    )}

                    {/* 6. Planes populares */}
                    {data.popular_plans?.length > 0 && (
                        <SectionCard title="Planes más Populares" icon={Dumbbell}>
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="w-full md:w-64 shrink-0">
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie
                                                data={data.popular_plans}
                                                cx="50%" cy="50%"
                                                innerRadius={55} outerRadius={80}
                                                dataKey="count"
                                                nameKey="plan_name"
                                            >
                                                {data.popular_plans.map((_: any, i: number) => (
                                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip {...tooltipStyle} formatter={(v: any) => [v, 'Socios']} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex-1 space-y-2 w-full">
                                    {data.popular_plans.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[11px] font-black text-white uppercase tracking-widest truncate">{p.plan_name}</span>
                                                    <span className="text-[11px] font-black text-neutral-400 ml-2 shrink-0">{p.count}</span>
                                                </div>
                                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            background: PIE_COLORS[i % PIE_COLORS.length],
                                                            width: `${Math.round((p.count / data.popular_plans[0].count) * 100)}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </SectionCard>
                    )}

                    {/* 7. Sin plan */}
                    <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] border-white/5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-neutral-500/10 border border-neutral-500/20 text-neutral-400">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-4xl font-display font-black italic text-white">{data.clients_without_plan}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mt-1">Socios sin plan de entrenamiento</p>
                            </div>
                        </div>
                        <Link
                            to="/admin/clients"
                            className="btn-secondary text-[10px] font-black uppercase tracking-widest px-6 shrink-0"
                        >
                            Ver socios
                        </Link>
                    </div>

                </motion.div>
            )}
        </div>
    );
}
