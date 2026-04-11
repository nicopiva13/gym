import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { toast } from '../../utils/toast';
import {
    Plus, Search, Dumbbell, Youtube,
    Edit2, PlayCircle, ChevronDown, ChevronRight,
    Zap, Activity, Target, Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Cardio', 'Otros'];

export default function ExerciseLibrary() {
    const [exercises, setExercises] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingEx, setEditingEx] = useState<any>(null);
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['Pecho']); // Pecho abierto por defecto
    
    // Form State
    const [name, setName] = useState('');
    const [muscle, setMuscle] = useState('Pecho');
    const [measure, setMeasure] = useState('reps');
    const [desc, setDesc] = useState('');
    const [yt, setYt] = useState('');

    useEffect(() => {
        fetchExercises();
    }, []);

    const fetchExercises = () => {
        setLoading(true);
        api.getExercises().then(res => {
            setExercises(res.data || []);
            setLoading(false);
        });
    };

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev => 
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = { name, muscle_group: muscle, measurement_type: measure, description: desc, youtube_url: yt };

        try {
            if (editingEx) {
                await api.updateExercise(editingEx.id, data);
            } else {
                await api.createExercise(data);
            }
            setShowModal(false);
            fetchExercises();
            resetForm();
        } catch (err) {
            toast.error('Error al guardar el ejercicio');
        }
    };

    const handleArchive = async (ex: any) => {
        if (!confirm(`¿Archivar el ejercicio "${ex.name}"? Ya no aparecerá en la biblioteca.`)) return;
        try {
            await api.deleteExercise(ex.id);
            fetchExercises();
        } catch (err: any) {
            toast.error('Error al archivar: ' + (err.message || 'Intente de nuevo'));
        }
    };

    const resetForm = () => {
        setName('');
        setMuscle('Pecho');
        setMeasure('reps');
        setDesc('');
        setYt('');
        setEditingEx(null);
    };

    // Agrupar ejercicios por categoría
    const groupedExercises = CATEGORIES.reduce((acc: any, cat) => {
        acc[cat] = exercises.filter(ex => {
            const matchesCategory = ex.muscle_group === cat || (cat === 'Otros' && !CATEGORIES.includes(ex.muscle_group));
            const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
            return matchesCategory && matchesSearch;
        });
        return acc;
    }, {});

    if (loading && exercises.length === 0) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-orange-500 font-display font-black uppercase tracking-[0.5em] text-xl">Sincronizando Biblioteca...</p>
        </div>
    );

    return (
        <div className="space-y-12 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="w-6 h-6 text-orange-500" />
                    <h1 className="text-4xl md:text-6xl font-display font-black text-white italic uppercase tracking-tighter">
                        Workshop <span className="text-orange-500">Ejercicios</span>
                    </h1>
                  </div>
                  <p className="text-xs font-body font-black text-neutral-500 uppercase tracking-[0.3em]">Gestión de equipamiento y biomecánica</p>
                </div>
                <button 
                  onClick={() => { resetForm(); setShowModal(true); }}
                  className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 active:scale-95 text-black font-display font-black uppercase tracking-widest py-5 px-10 rounded-2xl transition-all shadow-[0_10px_30px_-10px_rgba(249,115,22,0.5)] flex items-center justify-center gap-3"
                >
                    <Plus className="w-5 h-5 stroke-[3px]" />
                    Nuevo Ejercicio
                </button>
            </div>

            {/* Search - Glassmorphism style */}
            <div className="relative group">
                <Search className="w-5 h-5 absolute left-8 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-orange-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="BUSCAR POR NOMBRE (EJ: PRESS BARRA, SENTADILLA...)" 
                  className="w-full bg-[#111113] border-2 border-white/5 focus:border-orange-500/50 outline-none pl-20 pr-8 py-7 text-sm tracking-widest rounded-[2rem] text-white font-black placeholder:text-neutral-700 transition-all shadow-2xl"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Categorized Content */}
            <div className="space-y-4">
                {CATEGORIES.map((category) => {
                    const categoryExercises = groupedExercises[category];
                    const isExpanded = expandedCategories.includes(category);
                    
                    if (categoryExercises.length === 0 && search !== '') return null;

                    return (
                        <div key={category} className="overflow-hidden">
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(category)}
                                className={`w-full flex items-center justify-between p-6 md:p-8 rounded-[2rem] transition-all border-2 ${
                                    isExpanded 
                                    ? 'bg-orange-500/5 border-orange-500/20' 
                                    : 'bg-[#111113] border-white/5 hover:border-white/10'
                                }`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`p-4 rounded-2xl transition-all ${isExpanded ? 'bg-orange-500 text-black' : 'bg-white/5 text-neutral-500'}`}>
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <h2 className={`text-xl md:text-2xl font-display font-black uppercase tracking-widest ${isExpanded ? 'text-white' : 'text-neutral-500'}`}>
                                            {category}
                                        </h2>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 mt-1">
                                            {categoryExercises.length} Ejercicios disponibles
                                        </p>
                                    </div>
                                </div>
                                {isExpanded ? <ChevronDown className="text-orange-500" /> : <ChevronRight className="text-neutral-800" />}
                            </button>

                            {/* Exercises Grid for Category */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "circOut" }}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6 md:px-2">
                                            {categoryExercises.length === 0 ? (
                                                <div className="col-span-full py-10 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                                                    <Dumbbell className="w-8 h-8 text-neutral-800 mx-auto mb-3" />
                                                    <p className="text-[10px] font-black uppercase text-neutral-700 tracking-widest">No hay ejercicios en esta categoría</p>
                                                </div>
                                            ) : (
                                                categoryExercises.map((ex: any) => (
                                                    <motion.div 
                                                        key={ex.id}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="bg-[#161618] p-6 rounded-[2rem] border border-white/5 hover:border-orange-500/30 transition-all group relative overflow-hidden flex flex-col justify-between"
                                                    >
                                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                            <button
                                                              onClick={() => handleArchive(ex)}
                                                              className="p-3 bg-zinc-700 rounded-2xl text-neutral-400 hover:bg-red-500/20 hover:text-red-400 active:scale-95 transition-all"
                                                              title="Archivar ejercicio"
                                                            >
                                                                <Archive className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                              onClick={() => { setEditingEx(ex); setName(ex.name); setMuscle(ex.muscle_group); setMeasure(ex.measurement_type); setDesc(ex.description||''); setYt(ex.youtube_url||''); setShowModal(true); }}
                                                              className="p-3 bg-orange-500 rounded-2xl text-black hover:scale-110 active:scale-95 transition-all shadow-lg shadow-orange-500/20"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-4">
                                                                <Activity className="w-6 h-6" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-display font-black text-white uppercase tracking-widest leading-tight mb-1">{ex.name}</h3>
                                                                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                                                    Métrica: {ex.measurement_type === 'reps' ? 'Repeticiones' : ex.measurement_type === 'time' ? 'Tiempo' : ex.measurement_type}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                                                            {ex.youtube_url ? (
                                                                <a 
                                                                    href={ex.youtube_url} 
                                                                    target="_blank" 
                                                                    rel="noreferrer" 
                                                                    className="flex items-center gap-2 text-[10px] font-black uppercase text-red-500 hover:text-red-400 transition-colors"
                                                                >
                                                                    <PlayCircle className="w-4 h-4" /> Ver Tutorial
                                                                </a>
                                                            ) : (
                                                                <span className="text-[9px] font-black text-neutral-800 uppercase tracking-widest">Sin video</span>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Modal - Same as before but polished */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-black/90 backdrop-blur-md" 
                          onClick={() => setShowModal(false)} 
                        />
                        <motion.div 
                          initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }}
                          className="bg-[#111113] w-full max-w-lg p-10 rounded-[3rem] relative z-10 border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                        >
                            <h2 className="text-3xl font-display font-black text-white uppercase tracking-tighter italic mb-8">
                                {editingEx ? 'Editar' : 'Registro'} <span className="text-orange-500">Ejercicio</span>
                            </h2>
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-2">Nombre Pro</label>
                                    <input className="form-input" value={name} onChange={e => setName(e.target.value)} required placeholder="Ej: Press de Banca Plano" />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-2">Fuerza / Zona</label>
                                        <select className="form-input appearance-none bg-[#161618]" value={muscle} onChange={e => setMuscle(e.target.value)}>
                                            {CATEGORIES.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-2">Objetivo</label>
                                        <select className="form-input appearance-none bg-[#161618]" value={measure} onChange={e => setMeasure(e.target.value)}>
                                            <option value="reps">Repeticiones</option>
                                            <option value="time">Tiempo / Cardio</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-2">YouTube Reference</label>
                                    <div className="relative">
                                        <Youtube className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-red-600" />
                                        <input className="form-input pl-16 border-red-500/10 focus:border-red-500/50" value={yt} onChange={e => setYt(e.target.value)} placeholder="URL del video..." />
                                    </div>
                                </div>
                                <div className="pt-8 flex gap-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 rounded-[1.5rem] font-display font-black uppercase tracking-widest text-xs text-neutral-500 hover:text-white transition-colors">Volver</button>
                                    <button type="submit" className="flex-1 bg-orange-500 text-black py-5 rounded-[1.5rem] font-display font-black uppercase tracking-widest text-xs shadow-lg shadow-orange-500/20 active:scale-95 transition-all">Sincronizar</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
