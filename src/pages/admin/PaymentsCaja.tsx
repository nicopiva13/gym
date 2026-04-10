import { useEffect, useState, useMemo } from 'react';
import { api } from '../../api/client';
import {
    Plus, Search, DollarSign, CreditCard, Wallet,
    ArrowRightLeft, FileText, TrendingUp, ShieldCheck, X, Save,
    Filter, Users, BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import StatCard from '../../components/StatCard';

export default function PaymentsCaja() {
    const [payments, setPayments] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [clients, setClients] = useState<any[]>([]);
    const [membershipPlans, setMembershipPlans] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterTrainer, setFilterTrainer] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Payment form
    const [form, setForm] = useState({
        client_id: '',
        plan_id: '',
        amount: '',
        discount: '0',
        method: 'Efectivo',
        notes: '',
    });

    const fetchData = () => {
        const today = new Date().toISOString().split('T')[0];
        Promise.all([
            api.getPayments(),
            api.getDailySummary(today),
            api.getClients(),
            api.getMembershipPlans(),
            api.getStaff(),
        ]).then(([payRes, sumRes, clientsRes, plansRes, staffRes]) => {
            setPayments(payRes.data || []);
            setSummary(sumRes.data);
            setClients(clientsRes.data || []);
            setMembershipPlans(plansRes.data || []);
            setStaff(staffRes.data || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    // Build set of client_ids belonging to selected trainer
    const trainerClientIds = useMemo(() => {
        if (!filterTrainer) return null;
        const tid = parseInt(filterTrainer);
        return new Set(clients.filter(c => c.trainer_id === tid).map(c => c.id));
    }, [filterTrainer, clients]);

    const filtered = useMemo(() => {
        return payments.filter(p => {
            const name = `${p.name} ${p.lastname}`.toLowerCase();
            const matchSearch = !search || name.includes(search.toLowerCase()) || String(p.id).includes(search);
            const matchMonth = !filterMonth || p.created_at?.startsWith(filterMonth);
            const matchTrainer = !trainerClientIds || trainerClientIds.has(p.client_id);
            return matchSearch && matchMonth && matchTrainer;
        });
    }, [payments, search, filterMonth, trainerClientIds]);

    const totalFiltered = filtered.reduce((acc, p) => acc + parseFloat(p.final_amount || 0), 0);

    // Stats
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);
    const totalAllTime = payments.reduce((a, p) => a + parseFloat(p.final_amount || 0), 0);
    const totalThisMonth = payments.filter(p => p.created_at?.startsWith(thisMonth)).reduce((a, p) => a + parseFloat(p.final_amount || 0), 0);
    const totalToday = payments.filter(p => p.created_at?.startsWith(today)).reduce((a, p) => a + parseFloat(p.final_amount || 0), 0);

    // Per-method breakdown (all time)
    const methodBreakdown = useMemo(() => {
        const map: Record<string, number> = {};
        payments.forEach(p => {
            const m = p.method || 'Otro';
            map[m] = (map[m] || 0) + parseFloat(p.final_amount || 0);
        });
        return Object.entries(map).map(([method, total]) => ({ method, total }));
    }, [payments]);

    // Monthly chart data (last 6 months)
    const monthlyChartData = useMemo(() => {
        const map: Record<string, number> = {};
        payments.forEach(p => {
            if (!p.created_at) return;
            const m = p.created_at.substring(0, 7);
            map[m] = (map[m] || 0) + parseFloat(p.final_amount || 0);
        });
        const sorted = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
        const last6 = sorted.slice(-6);
        return last6.map(([month, total]) => ({
            month: month.replace(/^(\d{4})-(\d{2})$/, (_, y, m) => {
                const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
                return `${names[parseInt(m) - 1]} ${y.slice(2)}`;
            }),
            total,
        }));
    }, [payments]);

    const selectedPlan = membershipPlans.find(p => p.id === parseInt(form.plan_id));
    const discount = parseFloat(form.discount) || 0;
    const baseAmount = selectedPlan ? parseFloat(selectedPlan.price) : parseFloat(form.amount) || 0;
    const finalAmount = Math.max(0, baseAmount - discount);

    const handleSavePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.client_id || !finalAmount) { alert('Socio y monto son obligatorios'); return; }
        setSaving(true);
        try {
            const paymentData: Record<string, unknown> = {
                client_id: parseInt(form.client_id),
                amount: baseAmount,
                discount,
                final_amount: finalAmount,
                method: form.method,
                notes: form.notes || null,
            };
            if (form.plan_id) {
                await api.assignMembership({
                    client_id: parseInt(form.client_id),
                    plan_id: parseInt(form.plan_id),
                    start_date: new Date().toISOString().split('T')[0],
                });
                paymentData.notes = `Plan: ${selectedPlan?.name}${form.notes ? ' — ' + form.notes : ''}`;
            }
            await api.createPayment(paymentData);
            setShowModal(false);
            setForm({ client_id: '', plan_id: '', amount: '', discount: '0', method: 'Efectivo', notes: '' });
            fetchData();
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
        setSaving(false);
    };

    // Month options from existing payments
    const monthOptions = useMemo(() => {
        const months = new Set<string>();
        payments.forEach(p => { if (p.created_at) months.add(p.created_at.substring(0, 7)); });
        return Array.from(months).sort().reverse();
    }, [payments]);

    // Trainers from staff
    const trainers = useMemo(() => staff.filter(s => s.role === 'trainer' || s.role === 'entrenador' || true), [staff]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass-panel px-4 py-3 rounded-2xl border-amber-500/20 text-xs">
                    <p className="font-black uppercase tracking-widest text-amber-400 mb-1">{label}</p>
                    <p className="font-display font-black text-white italic">${payload[0].value.toLocaleString('es-AR')}</p>
                </div>
            );
        }
        return null;
    };

    if (loading) return (
        <div className="text-amber-500 font-display animate-pulse p-20 text-3xl tracking-[0.5em] font-black uppercase text-center w-full">
            Sincronizando Caja...
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-display font-black text-white italic uppercase tracking-widest mb-2">Monitor de Caja</h1>
                    <p className="text-sm font-body font-black text-neutral-500 uppercase tracking-widest">Auditoría de ingresos y cobros</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-3 shrink-0">
                    <Plus className="w-5 h-5" /> Registrar Cobro
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard title="Recaudado Hoy" value={`$${totalToday.toLocaleString('es-AR')}`} icon={DollarSign} />
                <StatCard title="Recaudado Este Mes" value={`$${totalThisMonth.toLocaleString('es-AR')}`} icon={TrendingUp} />
                <StatCard title="Total Histórico" value={`$${totalAllTime.toLocaleString('es-AR')}`} icon={ShieldCheck} />
                <StatCard title="Total Transacciones" value={payments.length.toString()} icon={ArrowRightLeft} />
            </div>

            {/* Daily Summary + Method Breakdown + Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Daily summary */}
                <div className="glass-panel p-7 rounded-[2.5rem] bg-amber-500/5 border-amber-500/10 flex flex-col justify-between">
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-2">Resumen del Día</h4>
                        <p className="text-4xl font-display font-black text-white italic tracking-widest">
                            ${summary?.total?.toLocaleString('es-AR') || '0'}
                        </p>
                    </div>
                    <div className="pt-5 border-t border-white/5 space-y-2 mt-4">
                        {summary?.breakdown?.map((b: any) => (
                            <div key={b.method} className="flex justify-between items-center">
                                <span className="text-[9px] font-black uppercase text-neutral-500 tracking-widest">{b.method}</span>
                                <span className="text-xs font-display font-bold text-white">${parseFloat(b.total).toLocaleString('es-AR')}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Per-method all time */}
                <div className="glass-panel p-7 rounded-[2.5rem] flex flex-col justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-4">Por Método (Total)</h4>
                    <div className="space-y-3 flex-1">
                        {methodBreakdown.map(({ method, total }) => (
                            <div key={method} className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        {method === 'Efectivo' ? <Wallet className="w-3 h-3 text-emerald-500" /> : <CreditCard className="w-3 h-3 text-blue-400" />}
                                        <span className="text-[9px] font-black uppercase text-neutral-400 tracking-widest">{method}</span>
                                    </div>
                                    <span className="text-xs font-display font-bold text-white">${total.toLocaleString('es-AR')}</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-500/60 rounded-full"
                                        style={{ width: `${totalAllTime ? (total / totalAllTime) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Monthly chart */}
                <div className="glass-panel p-7 rounded-[2.5rem] flex flex-col">
                    <div className="flex items-center gap-3 mb-5">
                        <BarChart2 className="w-4 h-4 text-amber-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Ingresos por Mes</h4>
                    </div>
                    <div className="flex-1 min-h-[140px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyChartData} barCategoryGap="30%">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fill: '#525252', fontSize: 9, fontWeight: 900, letterSpacing: 1 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: '#525252', fontSize: 8, fontWeight: 900 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                                    width={40}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(245,158,11,0.05)' }} />
                                <Bar dataKey="total" fill="rgba(245,158,11,0.7)" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600" />
                    <input
                        className="form-input pl-14 py-4"
                        placeholder="Buscar por socio o ID..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600" />
                    <select
                        className="form-input pl-12 pr-6 py-4"
                        value={filterMonth}
                        onChange={e => setFilterMonth(e.target.value)}
                    >
                        <option value="">Todos los meses</option>
                        {monthOptions.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>
                <div className="relative">
                    <Users className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600" />
                    <select
                        className="form-input pl-12 pr-6 py-4"
                        value={filterTrainer}
                        onChange={e => setFilterTrainer(e.target.value)}
                    >
                        <option value="">Todos los entrenadores</option>
                        {trainers.map((t: any) => (
                            <option key={t.id} value={t.id}>{t.name} {t.lastname}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="glass-panel rounded-[2.5rem] overflow-hidden border-white/5">
                <div className="p-6 md:p-8 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="text-xl font-display font-black text-white uppercase tracking-widest">Histórico de Cobros</h3>
                    {(search || filterMonth || filterTrainer) && (
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                            {filtered.length} resultados · Total: ${totalFiltered.toLocaleString('es-AR')}
                        </span>
                    )}
                </div>

                {filtered.length === 0 ? (
                    <div className="p-16 text-center">
                        <DollarSign className="w-10 h-10 text-neutral-700 mx-auto mb-4" />
                        <p className="text-[11px] font-black text-neutral-600 uppercase tracking-widest">Sin transacciones registradas</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-body">
                            <thead>
                                <tr className="bg-zinc-900/50 text-[9px] uppercase tracking-[0.3em] text-neutral-600 font-black">
                                    <th className="px-6 md:px-8 py-5">Ref.</th>
                                    <th className="px-6 md:px-8 py-5">Socio</th>
                                    <th className="px-6 md:px-8 py-5 hidden md:table-cell">Concepto</th>
                                    <th className="px-6 md:px-8 py-5">Monto</th>
                                    <th className="px-6 md:px-8 py-5 hidden sm:table-cell">Método</th>
                                    <th className="px-6 md:px-8 py-5 hidden lg:table-cell">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filtered.map((p: any) => (
                                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 md:px-8 py-5">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                                <FileText className="w-3 h-3 text-amber-500/30" />
                                                #{String(p.id).padStart(5, '0')}
                                            </div>
                                        </td>
                                        <td className="px-6 md:px-8 py-5">
                                            <p className="text-sm font-display font-bold text-white uppercase tracking-wider">{p.name} {p.lastname}</p>
                                        </td>
                                        <td className="px-6 md:px-8 py-5 hidden md:table-cell">
                                            <span className="text-[10px] font-black uppercase text-amber-500/60 tracking-widest">{p.plan_name || p.notes || '—'}</span>
                                        </td>
                                        <td className="px-6 md:px-8 py-5">
                                            <span className="text-base font-display font-black text-white italic">${parseFloat(p.final_amount).toLocaleString('es-AR')}</span>
                                        </td>
                                        <td className="px-6 md:px-8 py-5 hidden sm:table-cell">
                                            <div className="flex items-center gap-2">
                                                {p.method === 'Efectivo' ? <Wallet className="w-3 h-3 text-emerald-500" /> : <CreditCard className="w-3 h-3 text-blue-500" />}
                                                <span className="text-[9px] font-black uppercase text-neutral-400 tracking-widest">{p.method}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 md:px-8 py-5 hidden lg:table-cell">
                                            <span className="text-[10px] font-body text-neutral-500">
                                                {new Date(p.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Register Payment Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="glass-panel w-full max-w-lg p-8 md:p-10 rounded-[3rem] relative z-10 border-white/10 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-display font-black text-white uppercase tracking-widest">Registrar Cobro</h2>
                                <button onClick={() => setShowModal(false)} className="p-3 bg-white/5 rounded-xl text-neutral-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSavePayment} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="label-field">Socio *</label>
                                    <select className="form-input" value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} required>
                                        <option value="">Seleccioná un socio...</option>
                                        {clients.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.name} {c.lastname} — DNI: {c.dni}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="label-field">Plan de Membresía (opcional)</label>
                                    <select className="form-input" value={form.plan_id} onChange={e => setForm({ ...form, plan_id: e.target.value })}>
                                        <option value="">Sin plan asociado / Otro concepto</option>
                                        {membershipPlans.map((p: any) => (
                                            <option key={p.id} value={p.id}>{p.name} — ${parseFloat(p.price).toLocaleString('es-AR')}</option>
                                        ))}
                                    </select>
                                    {form.plan_id && <p className="text-[9px] text-amber-500/60 uppercase tracking-widest font-black">Se asignará esta membresía al socio automáticamente</p>}
                                </div>

                                {!form.plan_id && (
                                    <div className="space-y-2">
                                        <label className="label-field">Monto Base ($) *</label>
                                        <input type="number" min="0" step="0.01" className="form-input" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="5000" />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="label-field">Descuento ($)</label>
                                        <input type="number" min="0" className="form-input" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="label-field">Método de Pago</label>
                                        <select className="form-input" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
                                            <option>Efectivo</option>
                                            <option>Transferencia</option>
                                            <option>Tarjeta</option>
                                            <option>Otro</option>
                                        </select>
                                    </div>
                                </div>

                                {finalAmount > 0 && (
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/70">Total a cobrar</span>
                                        <span className="text-xl font-display font-black text-amber-400 italic">${finalAmount.toLocaleString('es-AR')}</span>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="label-field">Notas</label>
                                    <input className="form-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Observaciones..." />
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Cancelar</button>
                                    <button type="submit" disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-display font-black uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-2">
                                        <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Registrar Cobro'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
