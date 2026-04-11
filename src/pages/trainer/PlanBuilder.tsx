import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { toast } from '../../utils/toast';
import {
    ArrowRight, ArrowLeft, Dumbbell,
    Save, Trash2, ChevronRight, Search, Plus, X, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_DAYS = [
    { day_of_week: 1, label: 'Lunes', exercises: [], _id: null },
    { day_of_week: 2, label: 'Martes', exercises: [], _id: null },
    { day_of_week: 3, label: 'Miércoles', exercises: [], _id: null },
    { day_of_week: 4, label: 'Jueves', exercises: [], _id: null },
    { day_of_week: 5, label: 'Viernes', exercises: [], _id: null },
];

export default function PlanBuilder() {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const isEditing = !!id;

    const [step, setStep] = useState(1);
    const [exercises, setExercises] = useState<any[]>([]);
    const [loading, setLoading] = useState(isEditing);

    // Plan state
    const [planName, setPlanName] = useState('');
    const [planDesc, setPlanDesc] = useState('');
    const [planStatus, setPlanStatus] = useState<'draft' | 'active'>('active');
    const [days, setDays] = useState<any[]>(DEFAULT_DAYS.map(d => ({ ...d })));
    const [activeDayIdx, setActiveDayIdx] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(false);
    const [mobileLibOpen, setMobileLibOpen] = useState(false);

    // Load exercise library
    useEffect(() => {
        api.getExercises().then(res => setExercises(res.data || []));
    }, []);

    // Load existing plan when editing
    useEffect(() => {
        if (!isEditing || !id) return;
        const loadPlan = async () => {
            setLoading(true);
            try {
                // Get plan details
                const plansRes = await api.getTrainingPlans();
                const planData = (plansRes.data || []).find((p: any) => p.id === parseInt(id));
                if (!planData) { navigate('/entrenador/planes'); return; }

                setPlanName(planData.name);
                setPlanDesc(planData.description || '');
                setPlanStatus(planData.status || 'active');

                // Get days
                const daysRes = await api.getPlanDays(parseInt(id));
                const planDays = daysRes.data || [];

                // Map days and load exercises for each
                const loadedDays = await Promise.all(
                    DEFAULT_DAYS.map(async (defDay) => {
                        const existingDay = planDays.find((d: any) => d.day_of_week == defDay.day_of_week);
                        if (!existingDay) return { ...defDay, exercises: [], _id: null };

                        const exRes = await api.getDayExercises(existingDay.id);
                        return {
                            ...defDay,
                            _id: existingDay.id,
                            exercises: (exRes.data || []).map((e: any) => ({
                                ...e,
                                exercise_id: e.exercise_id,
                                name: e.exercise_name,
                                weight_is_free: !!e.weight_is_free,
                                duration_value: e.duration_value ?? null,
                                duration_unit: e.duration_unit ?? 'seconds',
                                _exId: e.id, // plan_day_exercise id
                            }))
                        };
                    })
                );
                setDays(loadedDays);
            } catch {
                toast.error('Error cargando el plan');
                navigate('/entrenador/planes');
            }
            setLoading(false);
        };
        loadPlan();
    }, [id]);

    const addExerciseToDay = (ex: any) => {
        setDays(prev => {
            const updated = prev.map((d, i) => {
                if (i !== activeDayIdx) return d;
                return {
                    ...d,
                    exercises: [...d.exercises, {
                        ...ex,
                        exercise_id: ex.id,
                        name: ex.name,
                        sets: 3,
                        reps: ex.measurement_type !== 'time' ? 10 : null,
                        weight_kg: '',
                        weight_is_free: false,
                        duration_value: ex.measurement_type === 'time' ? 30 : null,
                        duration_unit: ex.measurement_type === 'time' ? 'seconds' : null,
                        rest_seconds: 60,
                        notes: '',
                        _exId: null, // new exercise in DB
                    }]
                };
            });
            return updated;
        });
        setMobileLibOpen(false);
    };

    const removeExerciseFromDay = (idx: number) => {
        setDays(prev => prev.map((d, i) => {
            if (i !== activeDayIdx) return d;
            const newEx = [...d.exercises];
            newEx.splice(idx, 1);
            return { ...d, exercises: newEx };
        }));
    };

    const updateExerciseInDay = (idx: number, field: string, value: any) => {
        setDays(prev => prev.map((d, i) => {
            if (i !== activeDayIdx) return d;
            const newEx = [...d.exercises];
            newEx[idx] = { ...newEx[idx], [field]: value };
            return { ...d, exercises: newEx };
        }));
    };

    const handleSavePlan = async (status: 'draft' | 'active' = planStatus) => {
        if (!planName.trim()) {
            toast.warning('El nombre del plan es obligatorio');
            setStep(1);
            return;
        }
        setSaving(true);
        try {
            let planId: number;

            if (isEditing && id) {
                // UPDATE existing plan metadata
                await api.updateTrainingPlan(parseInt(id), {
                    name: planName.trim(),
                    description: planDesc,
                    status
                });
                planId = parseInt(id);

                // Sync days: delete existing days and recreate (simplest approach)
                const existingDays = await api.getPlanDays(planId);
                for (const d of existingDays.data || []) {
                    await api.deletePlanDay(d.id);
                }
            } else {
                // CREATE new plan
                const planRes = await api.createTrainingPlan({
                    name: planName.trim(),
                    description: planDesc,
                    status
                });
                planId = planRes.id;
            }

            // Create days + exercises
            for (const day of days) {
                if (day.exercises.length === 0) continue;

                const dayRes = await api.storePlanDay(planId, {
                    day_of_week: day.day_of_week,
                    label: day.label
                });
                const dayId = dayRes.id;

                for (let i = 0; i < day.exercises.length; i++) {
                    const ex = day.exercises[i];
                    const isTime = ex.measurement_type === 'time';
                    await api.storeDayExercise(dayId, {
                        exercise_id: ex.exercise_id || ex.id,
                        sort_order: i,
                        sets: parseInt(ex.sets) || 3,
                        reps: isTime ? null : (parseInt(ex.reps) || null),
                        weight_kg: !isTime && !ex.weight_is_free ? (parseFloat(ex.weight_kg) || null) : null,
                        weight_is_free: !isTime && ex.weight_is_free ? 1 : 0,
                        duration_value: isTime ? (parseInt(ex.duration_value) || 30) : null,
                        duration_unit: isTime ? (ex.duration_unit || 'seconds') : null,
                        rest_seconds: parseInt(ex.rest_seconds) || 60,
                        notes: ex.notes || null
                    });
                }
            }

            toast.success(`Plan "${planName}" ${isEditing ? 'actualizado' : 'guardado'} correctamente`);
            navigate('/entrenador/planes');
        } catch (err: unknown) {
            toast.error('Error al guardar: ' + (err instanceof Error ? err.message : 'Error desconocido'));
        }
        setSaving(false);
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <span className="ml-4 text-orange-500 font-display font-black uppercase tracking-widest">Cargando plan...</span>
        </div>
    );

    const filteredExercises = exercises.filter(ex =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ex.muscle_group || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    const activeDay = days[activeDayIdx];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/entrenador/planes')} className="p-3 bg-white/5 rounded-xl hover:text-orange-500 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-4xl font-display font-black text-white italic tracking-widest uppercase">
                            {isEditing ? 'Editar Plan' : 'Plan Builder'}
                        </h1>
                        <p className="text-[10px] font-body font-black text-orange-500/60 uppercase tracking-[0.3em]">
                            {isEditing ? planName : 'Diseño de programas'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        disabled={saving}
                        onClick={() => handleSavePlan('draft')}
                        className="flex-1 sm:flex-none btn-secondary px-5 py-3 text-xs disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Borrador
                    </button>
                    <button
                        disabled={saving}
                        onClick={() => handleSavePlan('active')}
                        className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-display font-black uppercase tracking-widest py-3 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Activar Plan'}
                    </button>
                </div>
            </div>

            {/* Stepper */}
            <div className="flex gap-6 border-b border-white/5 pb-4">
                {[{ n: 1, label: 'Configuración' }, { n: 2, label: 'Ejercicios' }].map(({ n, label }) => (
                    <button
                        key={n}
                        onClick={() => { if (n === 2 && !planName.trim()) { toast.warning('Ingresá el nombre del plan'); return; } setStep(n); }}
                        className={`flex items-center gap-2 ${step === n ? 'text-white' : 'text-neutral-600'}`}
                    >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-bold border-2 transition-all text-sm ${step === n ? 'bg-orange-500 border-orange-500 text-black' : 'border-white/10'}`}>
                            {n}
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest hidden sm:block">{label}</span>
                        {n === 1 && <ChevronRight className="w-3 h-3 text-neutral-800 hidden sm:block" />}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* STEP 1: Config */}
                {step === 1 ? (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="glass-panel p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] max-w-2xl border-white/5 space-y-6"
                    >
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Nombre del Programa *</label>
                            <input
                                className="form-input text-lg md:text-2xl font-display font-bold italic tracking-wider text-orange-500 placeholder:text-neutral-800"
                                placeholder="Ej: HIPERTROFIA AVANZADA S1"
                                value={planName}
                                onChange={e => setPlanName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Descripción / Objetivo</label>
                            <textarea
                                className="form-input min-h-[100px] resize-none"
                                placeholder="De qué trata este entrenamiento..."
                                value={planDesc}
                                onChange={e => setPlanDesc(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => {
                                if (!planName.trim()) { toast.warning('El nombre del plan es obligatorio'); return; }
                                setStep(2);
                            }}
                            className="w-full btn-primary flex justify-center items-center gap-3 py-4"
                        >
                            Continuar al Cronograma <ArrowRight className="w-5 h-5" />
                        </button>
                    </motion.div>
                ) : (
                    /* STEP 2: Schedule */
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        {/* Day selector (horizontal scroll on mobile) */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                            {days.map((d, i) => (
                                <button
                                    key={d.day_of_week}
                                    onClick={() => setActiveDayIdx(i)}
                                    className={`flex-shrink-0 px-4 py-3 rounded-2xl flex flex-col items-center border transition-all min-w-[70px] ${
                                        activeDayIdx === i
                                            ? 'bg-orange-500 border-orange-500 text-black'
                                            : 'bg-zinc-900/50 border-white/5 text-neutral-500 hover:border-white/10'
                                    }`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest">{d.label.slice(0, 3)}</span>
                                    <span className={`text-base font-display font-black mt-1 ${activeDayIdx === i ? 'text-black/70' : 'text-neutral-700'}`}>
                                        {d.exercises.length}
                                    </span>
                                </button>
                            ))}
                            <button onClick={() => setStep(1)} className="flex-shrink-0 px-4 py-3 rounded-2xl border border-white/5 text-neutral-600 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                <ArrowLeft className="w-3 h-3" /> Volver
                            </button>
                        </div>

                        {/* Main editor + library */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            {/* Exercise Editor */}
                            <div className="lg:col-span-8 glass-panel p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] min-h-[400px]">
                                <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                                    <h3 className="text-base md:text-xl font-display font-black text-white uppercase tracking-widest">
                                        {activeDay.label}
                                    </h3>
                                    <button
                                        onClick={() => setMobileLibOpen(true)}
                                        className="lg:hidden bg-orange-500/10 border border-orange-500/20 text-orange-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                                    >
                                        <Plus className="w-3 h-3" /> Ejercicio
                                    </button>
                                </div>

                                {activeDay.exercises.length === 0 ? (
                                    <div className="py-12 md:py-20 text-center border-2 border-dashed border-white/[0.03] rounded-[2rem]">
                                        <Dumbbell className="w-10 h-10 text-neutral-800 mx-auto mb-3" />
                                        <p className="text-[10px] uppercase font-black tracking-widest text-neutral-700">
                                            Sin ejercicios para {activeDay.label}
                                        </p>
                                        <button
                                            onClick={() => setMobileLibOpen(true)}
                                            className="mt-4 lg:hidden text-[10px] font-black text-orange-500 uppercase tracking-widest"
                                        >
                                            + Agregar ejercicio
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {activeDay.exercises.map((ex: any, i: number) => (
                                            <div key={i} className="flex gap-3 p-4 bg-zinc-900 rounded-2xl border border-white/5">
                                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 flex-shrink-0">
                                                    <Dumbbell className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0 space-y-3">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div>
                                                            <p className="text-sm font-display font-bold uppercase tracking-widest text-white truncate">{ex.name || ex.exercise_name}</p>
                                                            <p className="text-[9px] text-orange-500/50 font-black uppercase tracking-widest">{ex.muscle_group}</p>
                                                        </div>
                                                        <button onClick={() => removeExerciseFromDay(i)} className="text-red-500/30 hover:text-red-500 flex-shrink-0 p-1">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    {/* Inputs — adapt based on measurement_type */}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                        <div>
                                                            <label className="text-[8px] font-black uppercase text-neutral-600 block mb-1">Series</label>
                                                            <input type="number" min="1"
                                                                className="bg-zinc-800 p-2 w-full rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500/30 text-white border-none"
                                                                value={ex.sets ?? ''}
                                                                onChange={e => updateExerciseInDay(i, 'sets', e.target.value)}
                                                            />
                                                        </div>
                                                        {ex.measurement_type !== 'time' ? (
                                                            <>
                                                                <div>
                                                                    <label className="text-[8px] font-black uppercase text-neutral-600 block mb-1">Reps</label>
                                                                    <input type="number" min="1"
                                                                        className="bg-zinc-800 p-2 w-full rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500/30 text-white border-none"
                                                                        value={ex.reps ?? ''}
                                                                        onChange={e => updateExerciseInDay(i, 'reps', e.target.value)}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[8px] font-black uppercase text-neutral-600 block mb-1">Kg</label>
                                                                    <input type="number" min="0" step="0.5"
                                                                        className="bg-zinc-800 p-2 w-full rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500/30 text-white border-none"
                                                                        value={ex.weight_kg ?? ''}
                                                                        onChange={e => updateExerciseInDay(i, 'weight_kg', e.target.value)}
                                                                        disabled={!!ex.weight_is_free}
                                                                    />
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div>
                                                                    <label className="text-[8px] font-black uppercase text-neutral-600 block mb-1">Duración</label>
                                                                    <input type="number" min="1"
                                                                        className="bg-zinc-800 p-2 w-full rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500/30 text-white border-none"
                                                                        value={ex.duration_value ?? ''}
                                                                        onChange={e => updateExerciseInDay(i, 'duration_value', e.target.value)}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[8px] font-black uppercase text-neutral-600 block mb-1">Unidad</label>
                                                                    <select
                                                                        className="bg-zinc-800 p-2 w-full rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500/30 text-white border-none"
                                                                        value={ex.duration_unit ?? 'seconds'}
                                                                        onChange={e => updateExerciseInDay(i, 'duration_unit', e.target.value)}
                                                                    >
                                                                        <option value="seconds">Seg</option>
                                                                        <option value="minutes">Min</option>
                                                                    </select>
                                                                </div>
                                                            </>
                                                        )}
                                                        <div>
                                                            <label className="text-[8px] font-black uppercase text-neutral-600 block mb-1">Desc (s)</label>
                                                            <input type="number" min="0"
                                                                className="bg-zinc-800 p-2 w-full rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500/30 text-white border-none"
                                                                value={ex.rest_seconds ?? ''}
                                                                onChange={e => updateExerciseInDay(i, 'rest_seconds', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    {/* Weight is free checkbox — only for reps exercises */}
                                                    {ex.measurement_type !== 'time' && (
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!ex.weight_is_free}
                                                                onChange={e => {
                                                                    updateExerciseInDay(i, 'weight_is_free', e.target.checked);
                                                                    if (e.target.checked) updateExerciseInDay(i, 'weight_kg', '');
                                                                }}
                                                                className="w-3.5 h-3.5 accent-orange-500"
                                                            />
                                                            <span className="text-[9px] font-black uppercase text-neutral-500 tracking-widest">Peso libre / corporal</span>
                                                        </label>
                                                    )}
                                                    <input
                                                        className="w-full bg-zinc-800 p-2 rounded-lg text-[10px] outline-none focus:ring-1 focus:ring-orange-500/30 text-neutral-400 placeholder:text-neutral-700 border-none"
                                                        placeholder="Nota (opcional)..."
                                                        value={ex.notes || ''}
                                                        onChange={e => updateExerciseInDay(i, 'notes', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Desktop Library */}
                            <div className="hidden lg:block lg:col-span-4 glass-panel p-6 rounded-3xl border-white/5 self-start sticky top-10">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-4">Añadir Ejercicio</h4>
                                <div className="relative mb-4">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                    <input
                                        className="form-input pl-10 py-3 text-[10px] placeholder:text-neutral-700"
                                        placeholder="Buscar..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                                    {filteredExercises.map(ex => (
                                        <button
                                            key={ex.id}
                                            onClick={() => addExerciseToDay(ex)}
                                            className="w-full p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-orange-500/30 text-left transition-all active:scale-95 group"
                                        >
                                            <p className="text-[11px] font-display font-bold uppercase tracking-widest text-white group-hover:text-orange-500 transition-colors">{ex.name}</p>
                                            <p className="text-[9px] font-body font-black text-neutral-600 uppercase mt-0.5 tracking-widest">{ex.muscle_group}</p>
                                        </button>
                                    ))}
                                    {filteredExercises.length === 0 && (
                                        <p className="text-[10px] text-neutral-700 font-black uppercase tracking-widest text-center py-6">Sin resultados</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Exercise Library Modal */}
            <AnimatePresence>
                {mobileLibOpen && (
                    <div className="fixed inset-0 z-[60] flex flex-col justify-end lg:hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/70"
                            onClick={() => setMobileLibOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative bg-zinc-900 rounded-t-[2rem] p-6 z-10 max-h-[70vh] flex flex-col"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-display font-black text-white uppercase tracking-widest">
                                    Agregar a {activeDay.label}
                                </h4>
                                <button onClick={() => setMobileLibOpen(false)} className="p-2 bg-white/5 rounded-xl">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="relative mb-4">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                <input
                                    className="form-input pl-10 py-3 text-sm"
                                    placeholder="Buscar ejercicio..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="overflow-y-auto space-y-2 flex-1">
                                {filteredExercises.map(ex => (
                                    <button
                                        key={ex.id}
                                        onClick={() => addExerciseToDay(ex)}
                                        className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 text-left active:bg-orange-500/20 active:border-orange-500/30 transition-all"
                                    >
                                        <p className="text-sm font-display font-bold uppercase tracking-widest text-white">{ex.name}</p>
                                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1">{ex.muscle_group}</p>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
