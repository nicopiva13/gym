import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Plus, Zap, Edit2, Trash2, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EMPTY = { name: '', price: '', duration_days: '30', description: '' };

export default function MembershipPlans() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [form, setForm] = useState({ ...EMPTY });
    const [saving, setSaving] = useState(false);

    const fetchPlans = () => {
        setLoading(true);
        api.getMembershipPlans().then(res => { setPlans(res.data || []); setLoading(false); });
    };

    useEffect(() => { fetchPlans(); }, []);

    const openCreate = () => { setEditingPlan(null); setForm({ ...EMPTY }); setShowModal(true); };

    const openEdit = (p: any) => {
        setEditingPlan(p);
        setForm({ name: p.name, price: String(p.price), duration_days: String(p.duration_days), description: p.description || '' });
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = { name: form.name, price: parseFloat(form.price), duration_days: parseInt(form.duration_days), description: form.description };
        setSaving(true);
        try {
            if (editingPlan) {
                await api.updateMembershipPlan(editingPlan.id, data);
            } else {
                await api.createMembershipPlan(data);
            }
            setShowModal(false);
            fetchPlans();
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
        setSaving(false);
    };

    const handleDelete = async (p: any) => {
        if (!confirm(`¿Eliminar el plan "${p.name}"?`)) return;
        try { await api.deleteMembershipPlan(p.id); fetchPlans(); }
        catch (err: any) { alert('Error: ' + err.message); }
    };

    if (loading && plans.length === 0) return (
        <div className="text-amber-500 font-display animate-pulse p-20 text-3xl tracking-[0.5em] font-black uppercase text-center w-full">Sincronizando Planes...</div>
    );

    return (
        <div className="space-y-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-display font-black text-white uppercase tracking-widest mb-2">Planes de Membresía</h1>
                    <p className="text-sm font-body font-black text-neutral-500 uppercase tracking-widest">Suscripciones disponibles · {plans.length} planes</p>
                </div>
                <button onClick={openCreate} className="btn-primary flex items-center gap-3 shrink-0">
                    <Plus className="w-5 h-5" /> Nuevo Plan
                </button>
            </div>

            {plans.length === 0 ? (
                <div className="glass-panel p-16 rounded-[3rem] border-white/5 text-center">
                    <Zap className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                    <p className="text-[11px] font-black text-neutral-600 uppercase tracking-widest mb-6">No hay planes creados todavía</p>
                    <button onClick={openCreate} className="btn-primary">Crear primer Plan</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {plans.map((plan) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-panel p-8 rounded-[3rem] border-white/5 group hover:border-amber-500/20 transition-all flex flex-col justify-between"
                        >
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                                        <Zap className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <span className="badge-active">Activo</span>
                                </div>

                                <div>
                                    <h3 className="text-xl font-display font-black text-white uppercase tracking-wider mb-1">{plan.name}</h3>
                                    <p className="text-[10px] font-body text-neutral-500 uppercase tracking-widest leading-relaxed line-clamp-2 h-8">
                                        {plan.description || 'Sin descripción'}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                                        <span className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Precio</span>
                                        <span className="text-xl font-display font-black text-white italic">${parseFloat(plan.price).toLocaleString('es-AR')}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                                        <span className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Vigencia</span>
                                        <span className="text-xs font-display font-black text-amber-500/80 uppercase">{plan.duration_days} días</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => openEdit(plan)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-zinc-700 text-neutral-400 hover:text-white rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest"
                                >
                                    <Edit2 className="w-4 h-4" /> Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(plan)}
                                    className="p-3 bg-zinc-800 hover:bg-red-500/20 text-neutral-600 hover:text-red-500 rounded-2xl transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

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
                            className="glass-panel w-full max-w-md p-8 md:p-10 rounded-[3rem] relative z-10 border-white/10"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-display font-black text-white uppercase tracking-widest">
                                    {editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="p-3 bg-white/5 rounded-xl text-neutral-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSave} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="label-field">Nombre del Plan *</label>
                                    <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Ej: Musculación Mensual" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="label-field">Precio ($) *</label>
                                        <input type="number" min="0" step="0.01" className="form-input" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required placeholder="5000" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="label-field">Duración (días) *</label>
                                        <input type="number" min="1" className="form-input" value={form.duration_days} onChange={e => setForm({ ...form, duration_days: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="label-field">Descripción</label>
                                    <textarea className="form-input h-20 resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Beneficios incluidos..." />
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Cancelar</button>
                                    <button type="submit" disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-display font-black uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-2">
                                        <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar'}
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
