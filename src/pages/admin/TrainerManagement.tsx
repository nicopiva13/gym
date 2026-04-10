import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
    UserCheck, Plus, Mail, Phone, X, Save, Edit2, Trash2,
    Users, Shield, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Trainer {
    id: number;
    name: string;
    lastname: string;
    email: string;
    phone?: string;
    role: string;
    active: number;
}

const EMPTY_FORM = {
    name: '', lastname: '', email: '', phone: '', password: '', role: 'employee'
};

export default function TrainerManagement() {
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
    const [formData, setFormData] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const fetchTrainers = () => {
        setLoading(true);
        api.getStaff()
            .then(res => {
                // Backend returns employees with role='employee' — show all staff
                setTrainers((res.data || []).filter((u: Trainer) => u.role === 'employee' || u.role === 'owner'));
            })
            .catch(() => setTrainers([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchTrainers(); }, []);

    const openCreate = () => {
        setEditingTrainer(null);
        setFormData({ ...EMPTY_FORM });
        setError('');
        setShowModal(true);
    };

    const openEdit = (t: Trainer) => {
        setEditingTrainer(t);
        setFormData({ name: t.name, lastname: t.lastname, email: t.email, phone: t.phone || '', password: '', role: t.role });
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email) { setError('Nombre y email son obligatorios'); return; }
        if (!editingTrainer && !formData.password) { setError('La contraseña es obligatoria para nuevos coaches'); return; }
        setSaving(true);
        setError('');
        try {
            if (editingTrainer) {
                const updateData: Record<string, unknown> = { name: formData.name, lastname: formData.lastname, email: formData.email };
                if (formData.phone) updateData.phone = formData.phone;
                await api.updateStaff(editingTrainer.id, updateData);
            } else {
                await api.createStaff({
                    name: formData.name,
                    lastname: formData.lastname,
                    email: formData.email,
                    phone: formData.phone || null,
                    password: formData.password,
                    role: formData.role,
                });
            }
            setShowModal(false);
            fetchTrainers();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al guardar');
        }
        setSaving(false);
    };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`¿Dar de baja a ${name}? Esta acción desactivará su acceso.`)) return;
        try {
            await api.deleteStaff(id);
            fetchTrainers();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Error al eliminar');
        }
    };

    if (loading) return (
        <div className="text-amber-500 font-display animate-pulse p-20 text-3xl tracking-[0.5em] font-black uppercase text-center w-full">
            Sincronizando Staff...
        </div>
    );

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-display font-black text-white uppercase tracking-widest mb-2">
                        Staff de Coaches
                    </h1>
                    <p className="text-sm font-body font-black text-neutral-500 uppercase tracking-widest">
                        {trainers.length} coach{trainers.length !== 1 ? 'es' : ''} registrado{trainers.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button onClick={openCreate} className="btn-primary flex items-center gap-3 px-8 shrink-0">
                    <Plus className="w-5 h-5" /> Nuevo Coach
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                    { label: 'Total Coaches', val: trainers.length, color: 'text-amber-500' },
                    { label: 'Activos', val: trainers.filter(t => t.active).length, color: 'text-green-400' },
                    { label: 'Inactivos', val: trainers.filter(t => !t.active).length, color: 'text-red-400' },
                ].map((s, i) => (
                    <div key={i} className="glass-panel p-5 rounded-3xl border-white/5 flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-white/5">
                            <Users className={`w-5 h-5 ${s.color}`} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500">{s.label}</p>
                            <p className={`text-2xl font-display font-black italic ${s.color}`}>{s.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Grid */}
            {trainers.length === 0 ? (
                <div className="glass-panel p-16 rounded-[3rem] border-white/5 text-center">
                    <UserCheck className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                    <p className="text-[11px] font-black text-neutral-600 uppercase tracking-widest">
                        No hay coaches registrados aún
                    </p>
                    <button onClick={openCreate} className="mt-6 btn-primary">Crear primer Coach</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trainers.map((t) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`glass-panel p-8 rounded-[3rem] relative group border-white/5 hover:border-amber-500/20 transition-all overflow-hidden ${!t.active ? 'opacity-60' : ''}`}
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-[40px] rounded-full -z-10" />

                            <div className="flex flex-col items-center text-center gap-5">
                                <div className="w-20 h-20 rounded-[2rem] bg-zinc-800 flex items-center justify-center border-2 border-white/5 group-hover:border-amber-500/30 transition-all">
                                    <UserCheck className="w-10 h-10 text-amber-500/60" />
                                </div>

                                <div className="w-full">
                                    <h3 className="text-xl font-display font-black text-white uppercase tracking-wider">
                                        {t.name} {t.lastname}
                                    </h3>
                                    <div className="flex justify-center gap-2 mt-2">
                                        <span className={t.active ? 'badge-active' : 'badge-expired'}>
                                            {t.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                        <span className="text-[9px] font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded-full text-neutral-500">
                                            {t.role === 'owner' ? 'Owner' : 'Coach'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3 w-full">
                                    <div className="flex items-center gap-3 text-xs font-body text-neutral-400 bg-white/5 p-3 rounded-2xl border border-white/5">
                                        <Mail className="w-4 h-4 text-amber-500/50 shrink-0" />
                                        <span className="truncate text-left">{t.email}</span>
                                    </div>
                                    {t.phone && (
                                        <div className="flex items-center gap-3 text-xs font-body text-neutral-400 bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <Phone className="w-4 h-4 text-amber-500/50 shrink-0" />
                                            <span>{t.phone}</span>
                                        </div>
                                    )}
                                </div>

                                {t.role !== 'owner' && (
                                    <div className="flex gap-3 w-full">
                                        <button
                                            onClick={() => openEdit(t)}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-zinc-700 text-neutral-400 hover:text-white rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest"
                                        >
                                            <Edit2 className="w-4 h-4" /> Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(t.id, t.name)}
                                            className="p-3 bg-zinc-800 hover:bg-red-500/20 text-neutral-600 hover:text-red-500 rounded-2xl transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal */}
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
                                <h2 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-widest">
                                    {editingTrainer ? 'Editar Coach' : 'Nuevo Coach'}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="p-3 bg-white/5 rounded-xl text-neutral-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[11px] font-black uppercase tracking-widest">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="label-field">Nombre *</label>
                                        <input className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="Juan" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="label-field">Apellido</label>
                                        <input className="form-input" value={formData.lastname} onChange={e => setFormData({ ...formData, lastname: e.target.value })} placeholder="Pérez" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="label-field">Email *</label>
                                    <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required placeholder="coach@gym.com" />
                                </div>

                                <div className="space-y-2">
                                    <label className="label-field">Teléfono</label>
                                    <input className="form-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="351 555 5555" />
                                </div>

                                {!editingTrainer && (
                                    <div className="space-y-2">
                                        <label className="label-field">Contraseña *</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className="form-input pr-12"
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                required
                                                placeholder="Mínimo 6 caracteres"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {!editingTrainer && (
                                    <div className="space-y-2">
                                        <label className="label-field">Rol</label>
                                        <select className="form-input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                            <option value="employee">Coach / Entrenador</option>
                                            <option value="owner">Administrador</option>
                                        </select>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-display font-black uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-3"
                                    >
                                        <Save className="w-5 h-5" />
                                        {saving ? 'Guardando...' : (editingTrainer ? 'Actualizar' : 'Crear Coach')}
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
