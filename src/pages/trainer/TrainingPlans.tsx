import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { toast } from '../../utils/toast';
import ConfirmModal from '../../components/ConfirmModal';
import { 
    Plus, Search, ClipboardList, Dumbbell, Edit2, Trash2,
    Calendar, ChevronRight, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

export default function TrainingPlans() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deleting, setDeleting] = useState<number | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
    const navigate = useNavigate();

    useEffect(() => { fetchPlans(); }, []);

    const fetchPlans = () => {
        setLoading(true);
        api.getTrainingPlans()
            .then(res => setPlans(res.data || []))
            .catch(() => setPlans([]))
            .finally(() => setLoading(false));
    };

    const handleDelete = (id: number, name: string) => {
        setConfirmDelete({ id, name });
    };

    const doDelete = async () => {
        if (!confirmDelete) return;
        setDeleting(confirmDelete.id);
        setConfirmDelete(null);
        try {
            await api.deleteTrainingPlan(confirmDelete.id);
            setPlans(prev => prev.filter(p => p.id !== confirmDelete.id));
            toast.success('Plan eliminado correctamente');
        } catch (err: any) {
            toast.error('Error al eliminar: ' + (err.message || 'Intente de nuevo'));
        }
        setDeleting(null);
    };

    const filtered = plans.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description?.toLowerCase() || '').includes(search.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        if (status === 'active') return <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-green-400"><CheckCircle2 className="w-3 h-3"/>Activo</span>;
        if (status === 'draft') return <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-400"><Clock className="w-3 h-3"/>Borrador</span>;
        return <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-neutral-500"><AlertCircle className="w-3 h-3"/>Archivado</span>;
    };

    if (loading && plans.length === 0) return (
        <div className="text-orange-500 font-display animate-pulse p-20 text-2xl md:text-3xl tracking-[0.5em] font-black uppercase text-center w-full">
            Sincronizando Programas...
        </div>
    );

    return (
        <div className="space-y-6 md:space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-end">
                <div>
                    <h1 className="text-3xl md:text-5xl font-display font-black text-white italic uppercase tracking-widest mb-2">
                        Planes de Entrenamiento
                    </h1>
                    <p className="text-xs font-body font-black text-neutral-500 uppercase tracking-widest">
                        {plans.length} programa{plans.length !== 1 ? 's' : ''} creado{plans.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Link
                    to="/entrenador/planes/crear"
                    className="bg-orange-500 hover:bg-orange-600 text-black font-display font-black uppercase tracking-widest py-3 md:py-4 px-6 md:px-10 rounded-2xl transition-all shadow-orange-500/20 shadow-xl flex items-center gap-3 text-sm whitespace-nowrap"
                >
                    <Plus className="w-5 h-5" /> Crear Programa
                </Link>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                <input
                    className="form-input pl-14 py-4 md:py-6 text-sm tracking-widest rounded-2xl md:rounded-3xl"
                    placeholder="Buscar planes..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Empty State */}
            {filtered.length === 0 && (
                <div className="glass-panel p-16 rounded-[3rem] border-white/5 text-center">
                    <ClipboardList className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                    <p className="text-[11px] font-black text-neutral-600 uppercase tracking-widest mb-6">
                        {search ? 'No se encontraron planes' : 'Aún no creaste ningún plan'}
                    </p>
                    {!search && (
                        <Link to="/entrenador/planes/crear" className="bg-orange-500 hover:bg-orange-600 text-black font-display font-black uppercase tracking-widest py-3 px-8 rounded-2xl transition-all text-sm inline-flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Crear mi primer plan
                        </Link>
                    )}
                </div>
            )}

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8">
                <AnimatePresence>
                    {filtered.map((plan) => (
                        <motion.div
                            key={plan.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass-panel p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border-white/5 group hover:border-orange-500/20 transition-all flex flex-col justify-between relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[40px] rounded-full -z-10" />

                            <div className="space-y-5">
                                {/* Top row */}
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-[1.5rem] bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 p-3">
                                        <ClipboardList className="w-full h-full" />
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        {getStatusBadge(plan.status)}
                                        <button
                                            onClick={() => handleDelete(plan.id, plan.name)}
                                            disabled={deleting === plan.id}
                                            className="p-2 bg-white/5 rounded-xl text-red-500/30 hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                                            title="Eliminar plan"
                                        >
                                            {deleting === plan.id ? (
                                                <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Name & desc */}
                                <div>
                                    <h3 className="text-lg md:text-2xl font-display font-black text-white italic uppercase tracking-wider mb-2 line-clamp-1">
                                        {plan.name}
                                    </h3>
                                    <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest leading-relaxed line-clamp-2">
                                        {plan.description || 'Sin descripción definida.'}
                                    </p>
                                </div>

                                {/* Stats */}
                                <div className="flex gap-4 border-t border-white/5 pt-5">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3 h-3 text-orange-500/60" />
                                        <div>
                                            <p className="text-[8px] font-black uppercase text-neutral-600 tracking-widest">Días</p>
                                            <p className="text-xs font-display font-bold text-white">
                                                {plan.days_count ?? '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Dumbbell className="w-3 h-3 text-orange-500/60" />
                                        <div>
                                            <p className="text-[8px] font-black uppercase text-neutral-600 tracking-widest">Asignados</p>
                                            <p className="text-xs font-display font-bold text-white">
                                                {plan.assigned_count ?? 0} socios
                                            </p>
                                        </div>
                                    </div>
                                    <div className="ml-auto text-[9px] text-neutral-600 font-black uppercase tracking-widest self-end">
                                        {plan.created_at ? new Date(plan.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : ''}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-5 flex gap-3">
                                <button
                                    onClick={() => navigate(`/entrenador/planes/${plan.id}/editar`)}
                                    className="flex-1 btn-secondary text-[10px] flex items-center justify-center gap-2 py-3"
                                >
                                    <Edit2 className="w-3 h-3" /> Editar Plan
                                </button>
                                <button
                                    onClick={() => navigate(`/entrenador/planes/${plan.id}/editar`)}
                                    className="p-3 bg-orange-500 text-black rounded-2xl hover:bg-orange-600 transition-all flex items-center justify-center"
                                    title="Abrir editor"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>

        <ConfirmModal
            open={!!confirmDelete}
            title="Eliminar plan"
            message={`¿Eliminar el plan "${confirmDelete?.name}"? Esta acción no se puede deshacer.`}
            confirmLabel="Eliminar"
            danger
            onConfirm={doDelete}
            onCancel={() => setConfirmDelete(null)}
        />
    );
}
