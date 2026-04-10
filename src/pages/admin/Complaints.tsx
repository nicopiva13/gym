import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { MessageSquare, CheckCircle2, Clock, AlertCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente',
    reviewed: 'Revisado',
    resolved: 'Resuelto',
};

const STATUS_COLORS: Record<string, string> = {
    pending: 'badge-expired',
    reviewed: 'badge-soon',
    resolved: 'badge-active',
};

export default function Complaints() {
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [notes, setNotes] = useState<Record<number, string>>({});
    const [saving, setSaving] = useState<number | null>(null);

    const fetchComplaints = () => {
        setLoading(true);
        api.getComplaints().then(res => {
            setComplaints(res.data || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => { fetchComplaints(); }, []);

    const handleUpdate = async (id: number, status: string) => {
        setSaving(id);
        try {
            await api.updateComplaint(id, { status, admin_notes: notes[id] || '' });
            fetchComplaints();
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
        setSaving(null);
    };

    const counts = {
        total: complaints.length,
        pending: complaints.filter(c => c.status === 'pending').length,
        reviewed: complaints.filter(c => c.status === 'reviewed').length,
        resolved: complaints.filter(c => c.status === 'resolved').length,
    };

    if (loading && complaints.length === 0) return (
        <div className="text-amber-500 font-display animate-pulse p-20 text-3xl tracking-[0.5em] font-black uppercase text-center w-full">Sincronizando Quejas...</div>
    );

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-4xl md:text-5xl font-display font-black text-white uppercase tracking-widest mb-2">Quejas Anónimas</h1>
                <p className="text-xs font-body font-black text-neutral-500 uppercase tracking-[0.3em]">Comentarios y sugerencias de socios · Sin identificación de autor</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total', val: counts.total, icon: MessageSquare, color: 'text-neutral-400' },
                    { label: 'Pendientes', val: counts.pending, icon: AlertCircle, color: 'text-red-500' },
                    { label: 'Revisadas', val: counts.reviewed, icon: Clock, color: 'text-amber-500' },
                    { label: 'Resueltas', val: counts.resolved, icon: CheckCircle2, color: 'text-green-500' },
                ].map((s, i) => (
                    <div key={i} className="glass-panel p-5 rounded-3xl flex items-center gap-4 border-white/5">
                        <div className={`p-3 rounded-2xl bg-white/5 ${s.color}`}>
                            <s.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500">{s.label}</p>
                            <p className="text-xl font-display font-black text-white italic">{s.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Complaints List */}
            {complaints.length === 0 ? (
                <div className="glass-panel p-16 rounded-[3rem] border-white/5 text-center">
                    <MessageSquare className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                    <p className="text-[11px] font-black text-neutral-600 uppercase tracking-widest">No hay quejas registradas</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {complaints.map((c: any) => (
                        <motion.div
                            key={c.id}
                            layout
                            className="glass-panel rounded-[2rem] border-white/5 overflow-hidden"
                        >
                            <button
                                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                                className="w-full flex items-center justify-between p-6 text-left"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                                        <MessageSquare className="w-4 h-4 text-neutral-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-display font-bold text-white uppercase tracking-wider truncate">{c.subject}</p>
                                        <p className="text-[10px] text-neutral-500 font-body uppercase tracking-wider mt-0.5">
                                            {new Date(c.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                    <span className={STATUS_COLORS[c.status] || 'badge-expired'}>
                                        {STATUS_LABELS[c.status] || c.status}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${expandedId === c.id ? 'rotate-180' : ''}`} />
                                </div>
                            </button>

                            <AnimatePresence>
                                {expandedId === c.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 pb-6 space-y-5 border-t border-white/5 pt-5">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Mensaje</p>
                                                <p className="text-sm text-neutral-300 font-body leading-relaxed">{c.message}</p>
                                            </div>

                                            {c.admin_notes && (
                                                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Notas Previas</p>
                                                    <p className="text-xs text-neutral-400 font-body">{c.admin_notes}</p>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <label className="label-field">Notas internas (privadas)</label>
                                                <textarea
                                                    className="form-input resize-none h-20"
                                                    placeholder="Agregar notas sobre esta queja..."
                                                    value={notes[c.id] ?? (c.admin_notes || '')}
                                                    onChange={e => setNotes(prev => ({ ...prev, [c.id]: e.target.value }))}
                                                />
                                            </div>

                                            <div className="flex gap-3 flex-wrap">
                                                {['pending', 'reviewed', 'resolved'].map(status => (
                                                    <button
                                                        key={status}
                                                        disabled={saving === c.id || c.status === status}
                                                        onClick={() => handleUpdate(c.id, status)}
                                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 ${
                                                            c.status === status
                                                                ? 'bg-amber-500 text-black'
                                                                : 'bg-zinc-800 text-neutral-400 hover:bg-zinc-700 hover:text-white'
                                                        }`}
                                                    >
                                                        {saving === c.id ? '...' : STATUS_LABELS[status]}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
