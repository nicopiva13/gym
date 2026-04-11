import { useEffect, useState, useCallback } from 'react';
import { toast } from '../../utils/toast';
import ConfirmModal from '../../components/ConfirmModal';
import {
    Users, CreditCard, TrendingUp, AlertTriangle,
    BarChart3, ArrowUpRight, UsersRound, Bell
} from 'lucide-react';
import StatCard from '../../components/StatCard';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { api } from '../../api/client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const COLORS = ['#f59e0b', '#f97316', '#fbbf24', '#ea580c'];

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sendingReminders, setSendingReminders] = useState(false);
    const [confirmReminders, setConfirmReminders] = useState(false);

    useEffect(() => {
        api.getOwnerDashboard().then(res => {
            setStats(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleSendReminders = () => {
        const expiring = stats?.upcoming_expirations || [];
        if (expiring.length === 0) { toast.info('No hay socios próximos a vencer'); return; }
        setConfirmReminders(true);
    };

    const doSendReminders = useCallback(async () => {
        setConfirmReminders(false);
        const expiring = stats?.upcoming_expirations || [];
        setSendingReminders(true);
        try {
            const ids = expiring.map((m: any) => m.id);
            await api.sendBulkNotification({
                recipient_ids: ids,
                title: 'Tu membresía está por vencer',
                message: 'Tu membresía vence pronto. Recordá renovarla para seguir entrenando sin interrupciones.',
                type: 'membership_expiry',
            });
            toast.success(`Recordatorios enviados a ${ids.length} socios`);
        } catch (err: any) {
            toast.error('Error al enviar recordatorios: ' + err.message);
        }
        setSendingReminders(false);
    }, [stats]);

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center text-amber-500 font-display text-2xl tracking-[0.3em] font-black animate-pulse uppercase">
            Sincronizando Métricas...
        </div>
    );

    const kpis = stats?.kpis || {};
    const charts = stats?.charts || {};
    const upcoming = stats?.upcoming_expirations || [];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl md:text-5xl font-display font-black text-white uppercase tracking-widest mb-2">Panel de Control</h1>
                <p className="text-xs font-body font-black text-neutral-500 uppercase tracking-[0.3em]">Gestión Integral del Gimnasio</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard title="Socios Activos" value={String(kpis.active_members ?? 0)} icon={Users} />
                <StatCard title="Ingresos Mes" value={`$${Number(kpis.monthly_income ?? 0).toLocaleString('es-AR')}`} icon={CreditCard} />
                <StatCard title="Altas Mes" value={String(kpis.new_members ?? 0)} icon={UsersRound} />
                <StatCard title="Por Vencer" value={String(kpis.expiring_soon ?? 0)} icon={AlertTriangle} />
                <StatCard title="Sin Membresía" value={String(kpis.debtors ?? 0)} icon={TrendingUp} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="glass-panel p-6 md:p-8 rounded-[2rem] space-y-5">
                    <h3 className="text-lg font-display font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-amber-500" /> Ingresos Mensuales
                    </h3>
                    <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.income}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                <XAxis dataKey="month" stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '16px' }} itemStyle={{ color: '#f59e0b', fontWeight: 'bold' }} />
                                <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel p-6 md:p-8 rounded-[2rem] space-y-5">
                    <h3 className="text-lg font-display font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-amber-500" /> Asistencia por Día
                    </h3>
                    <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={charts.attendance}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                <XAxis dataKey="day" stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '16px' }} itemStyle={{ color: '#f59e0b', fontWeight: 'bold' }} />
                                <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={4} dot={{ r: 4, fill: '#f59e0b' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Plans Pie */}
                <div className="glass-panel p-6 md:p-8 rounded-[2rem] space-y-5 flex flex-col justify-center items-center">
                    <h3 className="text-lg font-display font-bold text-white uppercase tracking-widest w-full border-b border-white/5 pb-4">Planes Activos</h3>
                    {charts.plans?.length > 0 ? (
                        <>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={charts.plans} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="count" nameKey="name">
                                            {charts.plans.map((_: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '16px' }} itemStyle={{ color: '#fff' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full space-y-2">
                                {charts.plans.map((p: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                            <span className="text-neutral-400">{p.name}</span>
                                        </div>
                                        <span className="text-white">{p.count}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="text-[11px] text-neutral-600 uppercase tracking-widest font-black py-10">Sin datos de planes</p>
                    )}
                </div>

                {/* Upcoming Expirations */}
                <div className="lg:col-span-2 glass-panel p-6 md:p-8 rounded-[2rem] space-y-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-display font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            Próximos Vencimientos
                        </h3>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-body font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full uppercase">
                                {upcoming.length} en 7 días
                            </span>
                            {upcoming.length > 0 && (
                                <button
                                    onClick={handleSendReminders}
                                    disabled={sendingReminders}
                                    className="p-2 bg-amber-500/10 text-amber-500 rounded-xl hover:bg-amber-500/20 transition-all disabled:opacity-50"
                                    title="Enviar recordatorio a todos"
                                >
                                    <Bell className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {upcoming.length > 0 ? upcoming.map((member: any) => (
                            <motion.div
                                key={member.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-between p-4 bg-white/5 rounded-2xl group hover:bg-white/10 transition-all border border-white/5"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-display font-bold text-neutral-500 shrink-0 text-sm">
                                        {member.name[0]}{member.lastname[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-display font-bold text-white uppercase tracking-widest">{member.name} {member.lastname}</p>
                                        <p className="text-[9px] text-neutral-500 font-body uppercase tracking-wider">{member.plan_name} · Vence en {member.days_left} días</p>
                                    </div>
                                </div>
                                <Link to="/admin/clients" className="p-2.5 text-neutral-600 group-hover:text-amber-500 transition-colors">
                                    <ArrowUpRight className="w-4 h-4" />
                                </Link>
                            </motion.div>
                        )) : (
                            <p className="text-[11px] text-neutral-600 font-body uppercase tracking-widest text-center py-8">
                                No hay socios próximos a vencer esta semana
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <ConfirmModal
            open={confirmReminders}
            title="Enviar recordatorios"
            message={`Se enviará una notificación a ${stats?.upcoming_expirations?.length || 0} socios cuya membresía está por vencer.`}
            confirmLabel="Enviar"
            onConfirm={doSendReminders}
            onCancel={() => setConfirmReminders(false)}
        />
    );
}
