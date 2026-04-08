import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { 
    Calendar, Dumbbell, Clock, PlayCircle, Info,
    CheckCircle2, AlertCircle, Timer, Weight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const DAY_NAMES  = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function ClientDashboard() {
    const [membership, setMembership] = useState<any>(null);
    const [plan, setPlan] = useState<any>(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const [membRes, planRes] = await Promise.all([
                    api.getMyMembership(),
                    api.getMyPlan()
                ]);

                setMembership(membRes.data || null);

                const planData = planRes.data || null;
                setPlan(planData);

                // Auto-select today's day (Monday=1 from JS getDay, but plan days are 1-7)
                if (planData?.days?.length > 0) {
                    const jsDay = new Date().getDay(); // 0=Sunday, 1=Monday... 6=Saturday
                    const gymDay = jsDay === 0 ? 6 : jsDay - 1; // Convert to 0-based Mon=0...Sat=5
                    // Find day in plan matching today
                    const todayPlanIdx = planData.days.findIndex((d: any) => d.day_of_week - 1 === gymDay);
                    setSelectedDayIndex(todayPlanIdx >= 0 ? todayPlanIdx : 0);
                }
            } catch (err: any) {
                setError(err.message || 'Error al cargar datos');
            }
            setLoading(false);
        };
        load();
    }, []);

    if (loading) return (
        <div className="text-amber-500 font-display animate-pulse p-10 text-xl tracking-[0.3em] font-black uppercase text-center w-full">
            Preparando tu entrenamiento...
        </div>
    );

    if (error) return (
        <div className="text-red-400 p-10 text-center font-body">{error}</div>
    );

    const membershipDaysLeft = membership?.days_remaining !== undefined
        ? membership.days_remaining
        : (membership?.end_date
            ? Math.ceil((new Date(membership.end_date).getTime() - Date.now()) / 86400000)
            : null);

    const selectedDay = plan?.days?.[selectedDayIndex] ?? null;

    return (
        <div className="space-y-8">
            {/* Membership Card */}
            {membership ? (
                <div className={`p-6 rounded-[2.5rem] border flex items-center justify-between overflow-hidden relative ${
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
                            {membershipDaysLeft! < 0 ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                        </div>
                        <div>
                            <h4 className="text-xs font-body font-black uppercase tracking-widest text-white">{membership.plan_name}</h4>
                            <p className={`text-[10px] font-body font-black uppercase tracking-[0.1em] mt-1 ${
                                membershipDaysLeft! < 0 ? 'text-red-400' :
                                membershipDaysLeft! <= 7 ? 'text-amber-400' : 'text-green-400'
                            }`}>
                                {membershipDaysLeft! < 0 ? 'Membresía vencida — Consultá con tu entrenador o en recepción para renovar' :
                                 membershipDaysLeft! === 0 ? 'Vence hoy' :
                                 `Vence en ${membershipDaysLeft} días — ${new Date(membership.end_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                            </p>
                            {membership.price && (
                                <p className="text-[10px] font-body font-black uppercase tracking-[0.1em] mt-1 text-white/50">
                                    Próxima cuota: ${parseFloat(membership.price).toLocaleString('es-AR')}
                                </p>
                            )}
                        </div>
                    </div>
                    {membershipDaysLeft! <= 7 && membershipDaysLeft! >= 0 && (
                        <span className="badge-soon">¡Renovar pronto!</span>
                    )}
                </div>
            ) : (
                <div className="p-6 rounded-[2.5rem] border border-neutral-800 bg-zinc-900/50 flex items-center gap-4">
                    <AlertCircle className="w-6 h-6 text-neutral-500" />
                    <span className="text-xs font-body font-black uppercase tracking-widest text-neutral-500">Sin membresía activa</span>
                </div>
            )}

            {/* Training Plan View */}
            {!plan ? (
                <div className="glass-panel p-20 rounded-[3rem] border-white/5 text-center">
                    <Dumbbell className="w-16 h-16 text-neutral-700 mx-auto mb-6" />
                    <h3 className="text-2xl font-display font-black text-white uppercase tracking-widest mb-3">Sin Programa Asignado</h3>
                    <p className="text-[11px] font-body text-neutral-500 uppercase tracking-widest">
                        Tu entrenador todavía no te asignó un plan de entrenamiento. Hablá con él para comenzar.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                        <h2 className="text-2xl font-display font-black text-white uppercase tracking-widest flex items-center gap-3 italic">
                            <Calendar className="w-5 h-5 text-amber-500" /> Mi Semana
                        </h2>
                        <span className="text-[10px] font-body font-black text-amber-500/60 uppercase tracking-widest">{plan.name}</span>
                    </div>

                    {/* Day Selector */}
                    {(() => {
                        const jsDay = new Date().getDay();
                        const todayDow = jsDay === 0 ? 7 : jsDay; // 1=Mon...7=Sun
                        return (
                            <div className="flex gap-2">
                                {plan.days.map((day: any, idx: number) => {
                                    const dayNum = day.day_of_week; // 1=Monday...7=Sunday
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
                                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                                                : 'bg-zinc-900 text-neutral-500 border border-white/5 hover:bg-white/5'
                                            }`}
                                        >
                                            <span className="text-lg font-display font-black tracking-widest">{DAY_LABELS[labelIdx] ?? labelIdx + 1}</span>
                                            {day.exercises?.length > 0 && (
                                                <div className={`w-1.5 h-1.5 rounded-full mt-1 ${selectedDayIndex === idx ? 'bg-black/40' : 'bg-amber-500/50'}`} />
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

                    {/* Selected Day Header */}
                    <div className="px-2">
                        <h3 className="text-xs font-body font-black text-amber-500/60 uppercase tracking-[0.4em]">
                            {selectedDay ? `${selectedDay.label}: ${selectedDay.exercises?.length || 0} ejercicios` : 'Día de descanso'}
                        </h3>
                    </div>

                    {/* Day Exercises */}
                    <AnimatePresence mode="wait">
                        {selectedDay?.exercises?.length > 0 ? (
                            <motion.div
                                key={selectedDayIndex}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-4"
                            >
                                {selectedDay.exercises.map((ex: any, i: number) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                                        className="glass-panel p-5 rounded-[2rem] border-white/5 hover:border-amber-500/20 transition-all group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center border border-white/5 group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-all shrink-0">
                                                    <Dumbbell className="w-5 h-5 text-amber-500" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-display font-bold text-white uppercase tracking-widest">{ex.exercise_name}</h4>
                                                    <p className="text-[10px] text-amber-500/50 font-black uppercase tracking-widest mt-0.5">{ex.muscle_group}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {ex.youtube_url && (
                                                    <a href={ex.youtube_url} target="_blank" rel="noreferrer"
                                                        className="p-2.5 bg-zinc-900 rounded-xl text-red-500/50 hover:text-red-400 transition-colors">
                                                        <PlayCircle className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex gap-3 mt-4 flex-wrap">
                                            {ex.sets && ex.reps && (
                                                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-xl border border-white/5">
                                                    <Clock className="w-3 h-3 text-amber-500" />
                                                    {ex.sets} × {ex.reps} reps
                                                </span>
                                            )}
                                            {ex.duration_value && (
                                                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-xl border border-white/5">
                                                    <Timer className="w-3 h-3 text-amber-500" />
                                                    {ex.sets} × {ex.duration_value}{ex.duration_unit === 'minutes' ? 'min' : 'seg'}
                                                </span>
                                            )}
                                            {ex.weight_kg > 0 && !ex.weight_is_free && (
                                                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-amber-500">
                                                    <Weight className="w-3 h-3" />
                                                    {ex.weight_kg} kg
                                                </span>
                                            )}
                                            {ex.weight_is_free == 1 && (
                                                <span className="text-[10px] font-black uppercase tracking-widest bg-zinc-900 px-3 py-1.5 rounded-xl border border-white/5 text-neutral-400">
                                                    Peso corporal
                                                </span>
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
                                className="p-16 text-center border-2 border-dashed border-white/5 rounded-[3rem]"
                            >
                                <Clock className="w-10 h-10 text-neutral-700 mx-auto mb-4" />
                                <p className="text-[11px] font-body font-black text-neutral-600 uppercase tracking-widest">
                                    Día de descanso — Recargá energías
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
