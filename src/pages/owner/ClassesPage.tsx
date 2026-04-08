import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Users, Plus, MoreVertical, Clock } from 'lucide-react';

export default function ClassesPage() {
    const [schedule, setSchedule] = useState<any[]>([]);
    const [types, setTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([api.getSchedule(), api.getClasses()])
            .then(([sres, tres]) => {
                setSchedule(sres.data);
                setTypes(tres.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    return (
        <div className="space-y-10">
            <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-display uppercase tracking-widest text-white mb-2">Clases Grupales</h1>
                  <p className="text-sm text-neutral-500 font-body uppercase tracking-widest font-bold">Gestión de horarios, reservas y cupos</p>
                </div>
                <button className="btn-primary flex items-center gap-2 px-6">
                    <Plus className="w-4 h-4" />
                    Nueva Clase
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {types.map(type => (
                    <div key={type.id} className="glass-panel p-6 rounded-3xl group border-amber-500/10 hover:border-amber-500/30 transition-all cursor-pointer">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-2xl">
                                {type.emoji || '🏋️'}
                            </div>
                            <button className="p-2 text-neutral-700 hover:text-white transition-colors">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>
                        <div>
                            <h4 className="text-xl font-display text-white uppercase tracking-wider mb-1">{type.name}</h4>
                            <div className="flex items-center gap-2 text-neutral-500 text-[10px] uppercase font-bold tracking-widest">
                                <Users className="w-3 h-3" />
                                <span>Capacidad: {type.max_capacity}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass-panel p-8 rounded-3xl">
                <h3 className="text-xl font-display uppercase tracking-wider text-white mb-8 border-b border-white/5 pb-4">Calendario Semanal</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {days.map((day, i) => (
                        <div key={day} className="space-y-4">
                            <h5 className="text-[10px] uppercase font-bold text-amber-500 tracking-widest bg-amber-500/5 py-2 px-3 rounded-lg border border-amber-500/10 text-center">{day}</h5>
                            <div className="space-y-3">
                                {loading ? (
                                    <div className="h-20 bg-zinc-900/50 rounded-2xl animate-pulse" />
                                ) : (
                                    schedule.filter(s => s.day_of_week === (i + 1)).map(s => (
                                        <div key={s.id} className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl group hover:border-amber-500/20 transition-all cursor-pointer">
                                            <p className="text-[10px] font-bold text-white uppercase mb-1">{s.class_name}</p>
                                            <div className="flex items-center gap-2 text-[9px] text-neutral-500 font-body uppercase tracking-wider">
                                                <Clock className="w-3 h-3 text-amber-500" />
                                                <span>{s.start_time.substring(0, 5)}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
