import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { toast } from '../../utils/toast';
import {
    Calendar, Dumbbell, Clock, Play,
    CheckCircle2, AlertCircle, Timer, Weight,
    Bell, X, UserCheck, MessageSquarePlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import VideoModal from '../../components/VideoModal';

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function ClientDashboard() {
    const [membership, setMembership] = useState<any>(null);
    const [plan, setPlan] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [checkedInToday, setCheckedInToday] = useState(false);
    const [checkingIn, setCheckingIn] = useState(false);
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [showComplaintForm, setShowComplaintForm] = useState(false);
    const [complaint, setComplaint] = useState({ subject: '', message: '' });
    const [sendingComplaint, setSendingComplaint] = useState(false);
    const [videoModal, setVideoModal] = useState<{ isOpen: boolean; exercise: any }>({ isOpen: false, exercise: null });

    // Notification popup (first unread)
    const [popup, setPopup] = useState<any>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [membRes, planRes, notifRes] = await Promise.all([
                    api.getMyMembership(),
                    api.getMyPlan(),
                    api.getMyNotifications(),
                ]);

                setMembership(membRes.data || null);
                const planData = planRes.data || null;
                setPlan(planData);

                const notifList = notifRes.data || [];
                setNotifications(notifList);

                // Show popup for first unread
                const unread = notifList.find((n: any) => !n.is_read);
                if (unread) setPopup(unread);

                if (planData?.days?.length > 0) {
                    const jsDay = new Date().getDay();
                    const gymDay = jsDay === 0 ? 6 : jsDay - 1;
                    const todayIdx = planData.days.findIndex((d: any) => d.day_of_week - 1 === gymDay);
                    setSelectedDayIndex(todayIdx >= 0 ? todayIdx : 0);
                }
            } catch { /* silenced */ }
            setLoading(false);
        };
        load();
    }, []);

    // Auto-popup: membership expiry warning
    useEffect(() => {
        if (!membership || popup) return;
        const daysLeft = Math.ceil((new Date(membership.end_date).getTime() - Date.now()) / 86400000);
        if (daysLeft <= 7 && daysLeft >= 0) {
            setPopup({
                id: null,
                title: '⚠️ Tu membresía está por vencer',
                message: `Tu membresía "${membership.plan_name}" vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}. Acercate a renovarla para seguir entrenando.`,
                type: 'membership_expiry',
            });
        }
    }, [membership]);

    const handleCheckin = async () => {
        setCheckingIn(true);
        try {
            await api.clientSelfCheckin();
            setCheckedInToday(true);
        } catch (err: any) {
            if (err.message?.includes('409') || err.message?.includes('hoy')) {
                setCheckedInToday(true);
            } else {
                toast.error('Error al registrar asistencia: ' + err.message);
            }
        }
        setCheckingIn(false);
    };

    const handleClosePopup = async () => {
        if (popup?.id) {
            try { await api.markNotificationRead(popup.id); } catch { /* silenced */ }
        }
        setPopup(null);
    };

    const handleSendComplaint = async (e: React.FormEvent) => {
        e.preventDefault();
        setSendingComplaint(true);
        try {
            await api.submitComplaint(complaint);
            setComplaint({ subject: '', message: '' });
            setShowComplaintForm(false);
            toast.success('Comentario enviado de forma anónima. Gracias por tu feedback!');
        } catch (err: any) {
            toast.error('Error al enviar: ' + err.message);
        }
        setSendingComplaint(false);
    };

    if (loading) return (
        <div className="text-amber-500 font-display animate-pulse p-10 text-xl tracking-[0.3em] font-black uppercase text-center w-full">
            Preparando tu entrenamiento...
        </div>
    );

    const membershipDaysLeft = membership?.days_remaining !== undefined
        ? membership.days_remaining
        : (membership?.end_date ? Math.ceil((new Date(membership.end_date).getTime() - Date.now()) / 86400000) : null);

    const selectedDay = plan?.days?.[selectedDayIndex] ?? null;
    const unreadCount = notifications.filter((n: any) => !n.is_read).length;

    return (
        <div className="space-y-6">
            {/* Notification Popup */}
            <AnimatePresence>
                {popup && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 left-4 right-4 z-[80] max-w-md mx-auto"
                    >
                        <div className={`p-5 rounded-[2rem] shadow-2xl border ${
                            popup.type === 'membership_expiry'
                                ? 'bg-amber-500/20 border-amber-500/40 backdrop-blur-xl'
                                : 'bg-zinc-900 border-white/10 backdrop-blur-xl'
                        }`}>
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex items-start gap-3">
                                    <Bell className={`w-5 h-5 mt-0.5 shrink-0 ${popup.type === 'membership_expiry' ? 'text-amber-400' : 'text-white'}`} />
                                    <div>
                                        <p className="text-sm font-display font-black text-white uppercase tracking-widest mb-1">{popup.title}</p>
                                        <p className="text-[11px] font-body text-white/70 leading-relaxed">{popup.message}</p>
                                    </div>
                                </div>
                                <button onClick={handleClosePopup} className="p-1.5 rounded-xl bg-white/10 text-white/60 hover:text-white shrink-0">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Action Buttons Row */}
            <div className="flex gap-3">
                {/* Check-in Button */}
                <button
                    onClick={handleCheckin}
                    disabled={checkingIn || checkedInToday}
                    className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[2rem] font-display font-black uppercase tracking-widest text-sm transition-all ${
                        checkedInToday
                            ? 'bg-green-500/20 border border-green-500/30 text-green-400 cursor-default'
                            : 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_30px_rgba(245,158,11,0.2)] disabled:opacity-50'
                    }`}
                >
                    <UserCheck className="w-5 h-5" />
                    {checkedInToday ? '¡Ya registraste asistencia hoy!' : (checkingIn ? 'Registrando...' : 'Confirmar Asistencia')}
                </button>

                {/* Notifications */}
                <button
                    onClick={() => setShowNotifPanel(!showNotifPanel)}
                    className="relative p-5 bg-zinc-900 border border-white/10 rounded-[2rem] text-neutral-400 hover:text-white transition-all"
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-black text-[9px] font-black rounded-full flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </button>

                {/* Complaint */}
                <button
                    onClick={() => setShowComplaintForm(true)}
                    className="p-5 bg-zinc-900 border border-white/10 rounded-[2rem] text-neutral-400 hover:text-white transition-all"
                    title="Enviar comentario o queja"
                >
                    <MessageSquarePlus className="w-5 h-5" />
                </button>
            </div>

            {/* Notification Panel */}
            <AnimatePresence>
                {showNotifPanel && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass-panel rounded-[2rem] border-white/5 overflow-hidden"
                    >
                        <div className="p-5 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-sm font-display font-black text-white uppercase tracking-widest">Notificaciones</h3>
                            <button
                                onClick={async () => { await api.markAllNotificationsRead(); setNotifications(n => n.map(x => ({ ...x, is_read: 1 }))); }}
                                className="text-[9px] font-black uppercase tracking-widest text-amber-500/60 hover:text-amber-500 transition-colors"
                            >
                                Marcar todas como leídas
                            </button>
                        </div>
                        <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                            {notifications.length === 0 ? (
                                <p className="text-[11px] text-neutral-600 uppercase tracking-widest font-black p-6 text-center">Sin notificaciones</p>
                            ) : notifications.map((n: any) => (
                                <div key={n.id} className={`p-4 ${!n.is_read ? 'bg-amber-500/5' : ''}`}>
                                    <div className="flex justify-between items-start gap-3">
                                        <div>
                                            <p className={`text-[11px] font-black uppercase tracking-widest ${!n.is_read ? 'text-white' : 'text-neutral-400'}`}>{n.title}</p>
                                            <p className="text-[10px] font-body text-neutral-500 mt-1 leading-relaxed">{n.message}</p>
                                        </div>
                                        {!n.is_read && (
                                            <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Membership Card */}
            {membership ? (
                <div className={`p-5 rounded-[2rem] border flex items-center justify-between overflow-hidden relative ${
                    membershipDaysLeft! < 0 ? 'bg-red-500/10 border-red-500/20' :
                    membershipDaysLeft! <= 7 ? 'bg-amber-500/10 border-amber-500/20' :
                    'bg-green-500/10 border-green-500/20'
                }`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${
                            membershipDaysLeft! < 0 ? 'bg-red-500/20 text-red-500' :
                            membershipDaysLeft! <= 7 ? 'bg-amber-500/20 text-amber-500' :
                            'bg-green-500/20 text-green-500'
                        }`}>
                            {membershipDaysLeft! < 0 ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                        </div>
                        <div>
                            <h4 className="text-xs font-body font-black uppercase tracking-widest text-white">{membership.plan_name}</h4>
                            <p className={`text-[10px] font-body font-black uppercase tracking-[0.1em] mt-1 ${
                                membershipDaysLeft! < 0 ? 'text-red-400' :
                                membershipDaysLeft! <= 7 ? 'text-amber-400' : 'text-green-400'
                            }`}>
                                {membershipDaysLeft! < 0 ? 'Membresía vencida — Hablá con recepción para renovar' :
                                 membershipDaysLeft! === 0 ? 'Vence hoy' :
                                 `Vence en ${membershipDaysLeft} días — ${new Date(membership.end_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                            </p>
                        </div>
                    </div>
                    {membershipDaysLeft! <= 7 && membershipDaysLeft! >= 0 && (
                        <span className="badge-soon shrink-0">¡Renovar!</span>
                    )}
                </div>
            ) : (
                <div className="p-5 rounded-[2rem] border border-neutral-800 bg-zinc-900/50 flex items-center gap-4">
                    <AlertCircle className="w-5 h-5 text-neutral-500" />
                    <span className="text-xs font-body font-black uppercase tracking-widest text-neutral-500">Sin membresía activa — Hablá con tu entrenador</span>
                </div>
            )}

            {/* Training Plan */}
            {!plan ? (
                <div className="glass-panel p-16 rounded-[3rem] border-white/5 text-center">
                    <Dumbbell className="w-14 h-14 text-neutral-700 mx-auto mb-5" />
                    <h3 className="text-2xl font-display font-black text-white uppercase tracking-widest mb-3">Sin Programa Asignado</h3>
                    <p className="text-[11px] font-body text-neutral-500 uppercase tracking-widest">
                        Tu entrenador todavía no te asignó un plan. Hablá con él para comenzar.
                    </p>
                </div>
            ) : (
                <div className="space-y-5">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-xl font-display font-black text-white uppercase tracking-widest flex items-center gap-3 italic">
                            <Calendar className="w-5 h-5 text-amber-500" /> Mi Semana
                        </h2>
                        <span className="text-[10px] font-body font-black text-amber-500/60 uppercase tracking-widest">{plan.name}</span>
                    </div>

                    {/* Day Selector */}
                    {(() => {
                        const jsDay = new Date().getDay();
                        const todayDow = jsDay === 0 ? 7 : jsDay;
                        return (
                            <div className="flex gap-2">
                                {plan.days.map((day: any, idx: number) => {
                                    const dayNum = day.day_of_week;
                                    const labelIdx = (dayNum - 1) % 7;
                                    const isToday = dayNum === todayDow;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedDayIndex(idx)}
                                            className={`flex-1 aspect-square rounded-2xl flex flex-col items-center justify-center transition-all relative ${
                                                selectedDayIndex === idx
                                                    ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                                                    : isToday
                                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                                    : 'bg-zinc-900 text-neutral-500 border border-white/5 hover:bg-white/5'
                                            }`}
                                        >
                                            <span className="text-sm font-display font-black">{DAY_LABELS[labelIdx]}</span>
                                            {day.exercises?.length > 0 && (
                                                <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${selectedDayIndex === idx ? 'bg-black/40' : 'bg-amber-500/50'}`} />
                                            )}
                                            {isToday && selectedDayIndex !== idx && (
                                                <span className="absolute -top-1 -right-1 text-[6px] font-black bg-amber-500 text-black rounded-full px-1">HOY</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })()}

                    <p className="text-xs font-body font-black text-amber-500/60 uppercase tracking-[0.4em] px-1">
                        {selectedDay ? `${selectedDay.label || 'Día'}: ${selectedDay.exercises?.length || 0} ejercicios` : 'Día de descanso'}
                    </p>

                    {/* Exercises */}
                    <AnimatePresence mode="wait">
                        {selectedDay?.exercises?.length > 0 ? (
                            <motion.div
                                key={selectedDayIndex}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-3"
                            >
                                {selectedDay.exercises.map((ex: any, i: number) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                                        className="glass-panel p-5 rounded-[2rem] border-white/5 hover:border-amber-500/20 transition-all group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center border border-white/5 group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-all shrink-0">
                                                    <Dumbbell className="w-5 h-5 text-amber-500" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-display font-bold text-white uppercase tracking-widest">{ex.exercise_name}</h4>
                                                    <p className="text-[10px] text-amber-500/50 font-black uppercase tracking-widest mt-0.5">{ex.muscle_group}</p>
                                                </div>
                                            </div>
                                            {ex.youtube_url && (
                                                <button
                                                    onClick={() => setVideoModal({ isOpen: true, exercise: ex })}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 border border-white/5 hover:border-red-500/20"
                                                >
                                                    <Play className="w-3.5 h-3.5 fill-current" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Ver video</span>
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex gap-2 mt-4 flex-wrap">
                                            {ex.sets && ex.reps && (
                                                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-xl border border-white/5">
                                                    <Clock className="w-3 h-3 text-amber-500" /> {ex.sets} × {ex.reps} reps
                                                </span>
                                            )}
                                            {ex.duration_value && (
                                                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-xl border border-white/5">
                                                    <Timer className="w-3 h-3 text-amber-500" /> {ex.sets} × {ex.duration_value}{ex.duration_unit === 'minutes' ? 'min' : 'seg'}
                                                </span>
                                            )}
                                            {ex.weight_kg > 0 && !ex.weight_is_free && (
                                                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-amber-500">
                                                    <Weight className="w-3 h-3" /> {ex.weight_kg} kg
                                                </span>
                                            )}
                                            {ex.weight_is_free == 1 && (
                                                <span className="text-[10px] font-black uppercase tracking-widest bg-zinc-900 px-3 py-1.5 rounded-xl border border-white/5 text-neutral-400">Peso corporal</span>
                                            )}
                                            {ex.rest_seconds && (
                                                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-xl border border-white/5 text-neutral-500">
                                                    Descanso: {ex.rest_seconds >= 60 ? `${Math.floor(ex.rest_seconds / 60)}min` : `${ex.rest_seconds}s`}
                                                </span>
                                            )}
                                        </div>
                                        {ex.notes && (
                                            <p className="mt-3 text-[10px] font-body text-neutral-500 italic border-l-2 border-amber-500/20 pl-3">{ex.notes}</p>
                                        )}
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-14 text-center border-2 border-dashed border-white/5 rounded-[3rem]"
                            >
                                <Clock className="w-10 h-10 text-neutral-700 mx-auto mb-4" />
                                <p className="text-[11px] font-body font-black text-neutral-600 uppercase tracking-widest">Día de descanso — Recargá energías</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Complaint Modal */}
            <AnimatePresence>
                {showComplaintForm && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowComplaintForm(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="glass-panel w-full max-w-md p-8 rounded-[3rem] relative z-10 border-white/10"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-display font-black text-white uppercase tracking-widest">Enviar Feedback</h2>
                                    <p className="text-[10px] font-body text-neutral-500 uppercase tracking-widest mt-1">Anónimo — Tu identidad es confidencial</p>
                                </div>
                                <button onClick={() => setShowComplaintForm(false)} className="p-2.5 bg-white/5 rounded-xl text-neutral-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSendComplaint} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="label-field">Asunto *</label>
                                    <input className="form-input" value={complaint.subject} onChange={e => setComplaint({ ...complaint, subject: e.target.value })} required placeholder="Ej: Sugerencia sobre el horario" />
                                </div>
                                <div className="space-y-2">
                                    <label className="label-field">Mensaje *</label>
                                    <textarea className="form-input resize-none h-28" value={complaint.message} onChange={e => setComplaint({ ...complaint, message: e.target.value })} required placeholder="Escribí tu comentario o queja aquí..." />
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={() => setShowComplaintForm(false)} className="flex-1 btn-secondary">Cancelar</button>
                                    <button type="submit" disabled={sendingComplaint} className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-display font-black uppercase tracking-widest py-4 rounded-2xl transition-all text-sm">
                                        {sendingComplaint ? 'Enviando...' : 'Enviar Anónimo'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Video Modal */}
            <VideoModal
                isOpen={videoModal.isOpen}
                exercise={videoModal.exercise}
                onClose={() => setVideoModal({ isOpen: false, exercise: null })}
            />
        </div>
    );
}
