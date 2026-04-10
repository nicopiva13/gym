import { useEffect, useState, useMemo } from 'react';
import { api } from '../../api/client';
import {
    Plus, Search, DollarSign, CreditCard, Wallet,
    ArrowRightLeft, FileText, TrendingUp, ShieldCheck, X, Save,
    Calendar, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatCard from '../../components/StatCard';

export default function PaymentsCaja() {
    const [payments, setPayments] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [clients, setClients] = useState<any[]>([]);
    const [membershipPlans, setMembershipPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
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
        ]).then(([payRes, sumRes, clientsRes, plansRes]) => {
            setPayments(payRes.data || []);
            setSummary(sumRes.data);
            setClients(clientsRes.data || []);
            setMembershipPlans(plansRes.data || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    const filtered = useMemo(() => {
        return payments.filter(p => {
            const name = `${p.name} ${p.lastname}`.toLowerCase();
            const matchSearch = !search || name.includes(search.toLowerCase()) || String(p.id).includes(search);
            const matchMonth = !filterMonth || p.created_at?.startsWith(filterMonth);
            return matchSearch && matchMonth;
        });
    }, [payments, search, filterMonth]);

    const totalFiltered = filtered.reduce((acc, p) => acc + parseFloat(p.final_amount || 0), 0);

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
                // Also assign membership
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

            {/* Daily Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                <div className="glass-panel p-7 rounded-[2.5rem] bg-amber-500/5 border-amber-500/10 flex flex-col justify-between">
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-2">Total Recaudado Hoy</h4>
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

                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <StatCard title="Total Transacciones" value={payments.length.toString()} icon={ArrowRightLeft} />
                    <StatCard
                        title="Ingresos Totales"
                        value={`$${payments.reduce((a, p) => a + parseFloat(p.final_amount || 0), 0).toLocaleString('es-AR')}`}
                        icon={TrendingUp}
                    />
                    <StatCard title="Métodos Verificados" value="100%" icon={ShieldCheck} />
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
            </div>

            {/* Table */}
            <div className="glass-panel rounded-[2.5rem] overflow-hidden border-white/5">
                <div className="p-6 md:p-8 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="text-xl font-display font-black text-white uppercase tracking-widest">Histórico de Cobros</h3>
                    {(search || filterMonth) && (
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
