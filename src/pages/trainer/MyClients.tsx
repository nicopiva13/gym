import { useEffect, useState, useRef } from 'react';
import { api } from '../../api/client';
import { toast } from '../../utils/toast';
import {
    Users, Search, Plus, ChevronRight, CheckCircle2, Clock, AlertCircle, X, Save, Edit2, Camera, ToggleLeft, ToggleRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const EMPTY_FORM = {
    name: '', lastname: '', dni: '', email: '', phone: '', birthdate: '',
    goal: '', weight_kg: '', height_cm: '', medical_conditions: '',
    emergency_contact: '', address: '', photo_url: ''
};

export default function MyClients() {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [togglingId, setTogglingId] = useState<number | null>(null);

    // Form state
    const [formData, setFormData] = useState({ ...EMPTY_FORM });
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    // Membership selection (create only)
    const [plans, setPlans] = useState<any[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Transferencia' | 'Tarjeta'>('Efectivo');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchClients = () => {
        setLoading(true);
        api.getClients().then(res => {
            setClients(res.data || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchClients();
        api.getMembershipPlans().then(res => setPlans(res.data || [])).catch(() => {});
    }, []);

    const filtered = clients.filter(c =>
        `${c.name} ${c.lastname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.dni || '').includes(searchTerm)
    );

    const getMembershipBadge = (c: any) => {
        if (!c.end_date) return <span className="badge-expired">Sin Membresía</span>;
        const days = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000);
        if (days < 0) return <span className="badge-expired">Vencida</span>;
        if (days <= 7) return <span className="badge-soon">Vence en {days}d</span>;
        return <span className="badge-active">Al Día</span>;
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setPhotoPreview(base64);
            setFormData(prev => ({ ...prev, photo_url: base64 }));
        };
        reader.readAsDataURL(file);
    };

    const openCreateModal = () => {
        setEditingClient(null);
        setFormData({ ...EMPTY_FORM });
        setPhotoPreview(null);
        setSelectedPlanId('');
        setPaymentMethod('Efectivo');
        setShowModal(true);
    };

    const openEditModal = (c: any) => {
        setEditingClient(c);
        setFormData({
            name: c.name || '',
            lastname: c.lastname || '',
            dni: c.dni || '',
            email: c.email || '',
            phone: c.phone || '',
            birthdate: c.birthdate ? c.birthdate.split('T')[0] : '',
            goal: c.goal || '',
            weight_kg: c.weight_kg ? String(c.weight_kg) : '',
            height_cm: c.height_cm ? String(c.height_cm) : '',
            medical_conditions: c.medical_conditions || '',
            emergency_contact: c.emergency_contact || '',
            address: c.address || '',
            photo_url: c.photo_url || '',
        });
        setPhotoPreview(c.photo_url || null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingClient(null);
        setPhotoPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.lastname || !formData.dni) {
            toast.warning('Nombre, apellido y DNI son obligatorios');
            return;
        }
        setSaving(true);
        try {
            if (editingClient) {
                await api.updateClient(editingClient.id, formData as Record<string, unknown>);
            } else {
                const res = await api.createClient(formData as Record<string, unknown>);
                // Assign membership if a plan was selected
                if (selectedPlanId) {
                    const clientId = res?.data?.id || res?.id;
                    const plan = plans.find(p => String(p.id) === selectedPlanId);
                    const today = new Date().toISOString().split('T')[0];
                    if (clientId && plan) {
                        await api.assignMembership({ client_id: clientId, plan_id: plan.id, start_date: today });
                        await api.createPayment({
                            client_id: clientId,
                            amount: plan.price,
                            discount: 0,
                            final_amount: plan.price,
                            method: paymentMethod,
                            notes: `Alta con plan ${plan.name}`,
                        });
                    }
                }
            }
            closeModal();
            fetchClients();
        } catch (err: any) {
            toast.error((editingClient ? 'Error al actualizar: ' : 'Error al crear: ') + (err.message || 'Intente de nuevo'));
        }
        setSaving(false);
    };

    const handleToggleActive = async (c: any) => {
        setTogglingId(c.id);
        try {
            await api.updateClient(c.id, { ...c, active: c.active ? 0 : 1 } as Record<string, unknown>);
            fetchClients();
        } catch {
            toast.error('Error al cambiar estado del socio');
        }
        setTogglingId(null);
    };

    const selectedPlan = plans.find(p => String(p.id) === selectedPlanId);

    if (loading && clients.length === 0) return (
        <div className="text-orange-500 font-display animate-pulse p-20 text-3xl tracking-[0.5em] font-black uppercase text-center w-full">Sincronizando Socios...</div>
    );

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[2rem] bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-display font-black text-white italic uppercase tracking-widest leading-none">Mis Socios</h1>
                        <p className="text-xs font-body font-black text-orange-500/60 uppercase tracking-[0.4em] mt-2">{clients.length} atletas asignados</p>
                    </div>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-orange-500 hover:bg-orange-600 text-black font-display font-black uppercase tracking-widest py-4 px-10 rounded-2xl transition-all shadow-orange-500/20 shadow-xl flex items-center gap-3"
                >
                    <Plus className="w-5 h-5" /> Nuevo Socio
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total', val: clients.length, icon: Users, color: 'text-orange-500' },
                    { label: 'Al Día', val: clients.filter(c => c.end_date && Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000) > 7).length, icon: CheckCircle2, color: 'text-green-500' },
                    { label: 'Por Vencer', val: clients.filter(c => c.end_date && Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000) <= 7 && Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000) >= 0).length, icon: Clock, color: 'text-amber-500' },
                    { label: 'Vencida', val: clients.filter(c => !c.end_date || Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000) < 0).length, icon: AlertCircle, color: 'text-red-500' },
                ].map((s, i) => (
                    <div key={i} className="glass-panel p-5 rounded-3xl flex items-center gap-4 border-white/5">
                        <div className={`p-3 rounded-2xl bg-white/5 ${s.color}`}>
                            <s.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-neutral-500">{s.label}</h4>
                            <p className="text-xl font-display font-black text-white italic">{s.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600" />
                <input
                    className="form-input pl-16 py-6 text-sm tracking-widest rounded-3xl"
                    placeholder="Buscar por nombre o DNI..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="glass-panel p-16 rounded-[3rem] border-white/5 text-center">
                    <Users className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                    <p className="text-[11px] font-black text-neutral-600 uppercase tracking-widest">
                        {searchTerm ? 'No se encontraron socios' : 'Aún no hay socios asignados'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {filtered.map((c: any) => (
                        <motion.div
                            key={c.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: c.active === 0 ? 0.5 : 1, scale: 1 }}
                            className="glass-panel p-8 rounded-[3rem] border-white/5 group hover:border-orange-500/20 transition-all flex flex-col justify-between"
                        >
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    {/* Avatar / Photo */}
                                    <div className="w-14 h-14 rounded-[1.5rem] overflow-hidden bg-zinc-800 flex items-center justify-center font-display font-black text-orange-500/40 group-hover:text-orange-500 transition-all text-lg flex-shrink-0">
                                        {c.photo_url ? (
                                            <img src={c.photo_url} alt={c.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{c.name?.[0]}{c.lastname?.[0]}</span>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        {getMembershipBadge(c)}
                                        <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mt-2">{c.dni}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-display font-black text-white italic uppercase tracking-wider">{c.name} {c.lastname}</h3>
                                    <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1">{c.goal || 'Sin objetivo definido'}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                                        <p className="text-[8px] font-black uppercase text-neutral-600 tracking-widest mb-1">Vence</p>
                                        <p className="text-[11px] font-display font-bold text-white uppercase">
                                            {c.end_date ? new Date(c.end_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                                        <p className="text-[8px] font-black uppercase text-neutral-600 tracking-widest mb-1">Plan</p>
                                        <p className="text-[11px] font-display font-bold text-orange-500 uppercase truncate">
                                            {c.active_plan_name || 'Sin plan'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex gap-3 items-center">
                                {/* Enable/Disable toggle */}
                                <button
                                    onClick={() => handleToggleActive(c)}
                                    disabled={togglingId === c.id}
                                    title={c.active === 0 ? 'Activar socio' : 'Desactivar socio'}
                                    className={`p-3 rounded-2xl transition-all flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${c.active === 0 ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                                >
                                    {c.active === 0 ? <ToggleLeft className="w-5 h-5" /> : <ToggleRight className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={() => openEditModal(c)}
                                    className="p-4 bg-zinc-800 hover:bg-zinc-700 text-neutral-400 hover:text-white rounded-2xl transition-all"
                                    title="Editar socio"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <Link
                                    to={`/entrenador/clientes/${c.id}`}
                                    className="flex-1 flex items-center justify-center gap-3 text-[10px] font-black py-4 px-6 bg-zinc-900 hover:bg-orange-500 text-neutral-500 hover:text-black rounded-2xl transition-all uppercase tracking-widest"
                                >
                                    Ver Ficha <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={closeModal}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="glass-panel w-full max-w-lg p-8 md:p-10 rounded-[3rem] relative z-10 border-white/10 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-3xl font-display font-black text-white uppercase tracking-widest">
                                    {editingClient ? 'Editar Socio' : 'Nuevo Socio'}
                                </h2>
                                <button onClick={closeModal} className="p-3 bg-white/5 rounded-xl text-neutral-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">

                                {/* Photo Upload */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Foto del Socio</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 rounded-[1.5rem] bg-zinc-800 border border-white/10 overflow-hidden flex items-center justify-center text-neutral-600 flex-shrink-0">
                                            {photoPreview ? (
                                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <Camera className="w-8 h-8" />
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-[10px] font-black uppercase tracking-widest py-3 px-5 bg-zinc-800 hover:bg-zinc-700 text-neutral-300 rounded-xl transition-all flex items-center gap-2"
                                            >
                                                <Camera className="w-4 h-4" /> {photoPreview ? 'Cambiar foto' : 'Subir foto'}
                                            </button>
                                            {photoPreview && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setPhotoPreview(null); setFormData(prev => ({ ...prev, photo_url: '' })); }}
                                                    className="text-[9px] font-black uppercase tracking-widest py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
                                                >
                                                    Quitar foto
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={handlePhotoChange}
                                    />
                                </div>

                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Nombre *</label>
                                        <input className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="Juan" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Apellido *</label>
                                        <input className="form-input" value={formData.lastname} onChange={e => setFormData({ ...formData, lastname: e.target.value })} required placeholder="Pérez" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">DNI *</label>
                                        <input className="form-input" value={formData.dni} onChange={e => setFormData({ ...formData, dni: e.target.value.replace(/\D/g, '') })} required placeholder="33333333" maxLength={10} readOnly={!!editingClient} disabled={!!editingClient} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Teléfono</label>
                                        <input className="form-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="1155555555" />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Email</label>
                                        <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="juan@email.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Fecha Nac.</label>
                                        <input type="date" className="form-input" value={formData.birthdate} onChange={e => setFormData({ ...formData, birthdate: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Objetivo</label>
                                    <textarea className="form-input resize-none h-16" value={formData.goal} onChange={e => setFormData({ ...formData, goal: e.target.value })} placeholder="Ej: Ganar masa muscular..." />
                                </div>

                                {/* Physical & Medical */}
                                <div className="border-t border-white/5 pt-5">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-neutral-600 mb-4">Datos Físicos y Médicos</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Peso (kg)</label>
                                            <input type="number" step="0.1" min="0" className="form-input" value={formData.weight_kg} onChange={e => setFormData({ ...formData, weight_kg: e.target.value })} placeholder="75.5" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Altura (cm)</label>
                                            <input type="number" min="0" className="form-input" value={formData.height_cm} onChange={e => setFormData({ ...formData, height_cm: e.target.value })} placeholder="175" />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Condiciones Médicas</label>
                                            <textarea className="form-input resize-none h-14" value={formData.medical_conditions} onChange={e => setFormData({ ...formData, medical_conditions: e.target.value })} placeholder="Ej: Hipertensión, diabetes..." />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Contacto de Emergencia</label>
                                            <input className="form-input" value={formData.emergency_contact} onChange={e => setFormData({ ...formData, emergency_contact: e.target.value })} placeholder="Nombre y teléfono" />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Dirección</label>
                                            <input className="form-input" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Calle y número" />
                                        </div>
                                    </div>
                                </div>

                                {/* Membership — only on create */}
                                {!editingClient && (
                                    <div className="border-t border-white/5 pt-5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-600 mb-4">Membresía Inicial (Opcional)</p>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Plan</label>
                                                <select
                                                    className="form-input"
                                                    value={selectedPlanId}
                                                    onChange={e => setSelectedPlanId(e.target.value)}
                                                >
                                                    <option value="">Sin plan por ahora</option>
                                                    {plans.map(p => (
                                                        <option key={p.id} value={String(p.id)}>
                                                            {p.name} — {p.duration_days}d — ${p.price}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {selectedPlanId && selectedPlan && (
                                                <AnimatePresence>
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="space-y-4"
                                                    >
                                                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex justify-between items-center">
                                                            <div>
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-orange-500/60">Precio del plan</p>
                                                                <p className="text-2xl font-display font-black text-orange-500 italic">${selectedPlan.price}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-600">Duración</p>
                                                                <p className="text-sm font-display font-black text-white">{selectedPlan.duration_days} días</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Método de Pago</label>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {(['Efectivo', 'Transferencia', 'Tarjeta'] as const).map(method => (
                                                                    <button
                                                                        key={method}
                                                                        type="button"
                                                                        onClick={() => setPaymentMethod(method)}
                                                                        className={`py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${paymentMethod === method ? 'bg-orange-500 text-black' : 'bg-zinc-800 text-neutral-400 hover:bg-zinc-700'}`}
                                                                    >
                                                                        {method}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </AnimatePresence>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={closeModal} className="flex-1 btn-secondary">Cancelar</button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-display font-black uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-3"
                                    >
                                        <Save className="w-5 h-5" /> {saving ? 'Guardando...' : (editingClient ? 'Actualizar' : 'Crear Socio')}
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
