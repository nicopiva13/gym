import { useEffect, useState } from 'react';
import { 
    Clock, 
    UserCheck, 
    Calendar, 
    AlertCircle,
    Users
} from 'lucide-react';
import StatCard from '../../components/StatCard';
import { api } from '../../api/client';

export default function EmployeeDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [schedule, setSchedule] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dni, setDni] = useState('');
    const [lastCheckin, setLastCheckin] = useState<any>(null);
    const [checkinStatus, setCheckinStatus] = useState<string>('Esperando validación...');

    const fetchData = async () => {
        try {
            const [sres, cres] = await Promise.all([api.getStats(), api.getSchedule()]);
            setStats(sres.data);
            setSchedule(cres.data.slice(0, 5)); // Mostrar primeras 5 clases
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCheckin = async () => {
        if (!dni) return;
        setCheckinStatus('Validando...');
        try {
            const res = await api.checkin({ dni });
            setLastCheckin(res.data);
            setCheckinStatus('¡Ingreso Exitoso!');
            setDni('');
            fetchData(); // Actualizar stats hoy
        } catch (err: any) {
            setCheckinStatus(err.message || 'Error al validar');
            setLastCheckin(null);
        }
    };

    if (loading) return <div className="text-amber-500 animate-pulse font-display text-2xl tracking-widest p-10">CARGANDO PANEL OPERATIVO...</div>;

    const kpis = stats?.kpis || { today_attendance: 0 };

    return (
        <div className="space-y-10">
            {/* Header */}
            <div>
              <h1 className="text-4xl font-display uppercase tracking-widest text-white mb-2">Panel Operativo</h1>
              <p className="text-sm text-neutral-500 font-body uppercase tracking-widest font-bold">Gestión diaria y check-ins</p>
            </div>

            {/* Quick Actions & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-panel p-8 rounded-3xl flex flex-col justify-between border-amber-500/10">
                    <div className="space-y-6">
                        <h3 className="text-xl font-display uppercase tracking-wider text-white">Check-in Rápido</h3>
                        <div className="flex gap-4">
                            <input 
                                className="form-input text-lg font-display tracking-widest h-14" 
                                placeholder="INGRESE DNI..." 
                                value={dni}
                                onChange={(e) => setDni(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCheckin()}
                            />
                            <button className="btn-primary px-8 h-14" onClick={handleCheckin}>Validar</button>
                        </div>
                        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center overflow-hidden">
                                  {lastCheckin ? (
                                      <span className="text-amber-500 font-display text-xl">{lastCheckin.client_id}</span>
                                  ) : (
                                      <Users className="w-6 h-6 text-neutral-600" />
                                  )}
                               </div>
                               <div>
                                  <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest">Resultado anterior</p>
                                  <p className={`text-sm font-bold ${checkinStatus.includes('Error') ? 'text-red-500' : 'text-white'}`}>{checkinStatus}</p>
                               </div>
                            </div>
                            {lastCheckin && (
                                <span className="text-xs uppercase tracking-widest font-bold text-green-500 bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20">MEMBRESIA ACTIVA</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 flex flex-col justify-between">
                    <StatCard title="Asistencias hoy" value={kpis.today_attendance.toString()} icon={UserCheck} />
                    <StatCard title="Clases activas" value={schedule.length.toString()} icon={Calendar} />
                </div>
            </div>

            {/* Daily Classes and Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-8 rounded-3xl">
                   <h3 className="text-xl font-display uppercase tracking-wider text-white mb-6">Clases del Día</h3>
                   <div className="space-y-4">
                        {schedule.length === 0 ? (
                            <p className="text-neutral-500 text-xs font-body italic">No hay clases programadas para hoy</p>
                        ) : (
                            schedule.map((c, i) => (
                                <div key={i} className="flex items-center justify-between p-5 bg-zinc-900/50 rounded-2xl border border-white/5 group hover:border-amber-500/20 transition-all">
                                    <div className="flex items-center gap-4">
                                       <div className="p-3 bg-zinc-800 rounded-xl">
                                          <Clock className="w-4 h-4 text-amber-500" />
                                       </div>
                                       <div>
                                          <p className="text-[11px] font-bold text-white uppercase tracking-wider">{c.class_name}</p>
                                          <p className="text-[10px] text-neutral-500 font-body uppercase tracking-wider text-amber-500/70">{c.start_time.substring(0,5)} • {c.room_name}</p>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-[11px] font-bold text-white">{c.capacity || '18/20'}</p>
                                       <p className="text-[9px] text-neutral-600 uppercase font-black tracking-widest">Capacidad</p>
                                    </div>
                                </div>
                            ))
                        )}
                   </div>
                </div>

                <div className="glass-panel p-8 rounded-3xl">
                   <h3 className="text-xl font-display uppercase tracking-wider text-white mb-6">Alertas de Socios</h3>
                   <div className="space-y-4">
                        {[
                            { name: 'Roberto Sanchez', reason: 'Falta pago cuota Octubre', type: 'error' },
                            { name: 'Lucia Ferreyra', reason: 'Plan próximo a vencer (3 días)', type: 'warning' },
                            { name: 'Marcos Gil', reason: 'Vencimiento mañana', type: 'warning' }
                        ].map((a, i) => (
                            <div key={i} className={`flex items-center gap-4 p-5 rounded-2xl border ${a.type === 'error' ? 'bg-red-500/5 border-red-500/10' : 'bg-yellow-500/5 border-yellow-500/10'}`}>
                                <AlertCircle className={`w-5 h-5 ${a.type === 'error' ? 'text-red-500' : 'text-yellow-500'}`} />
                                <div>
                                   <p className={`text-[11px] font-bold uppercase tracking-wider ${a.type === 'error' ? 'text-red-400' : 'text-yellow-400'}`}>{a.name}</p>
                                   <p className="text-[10px] text-neutral-500 font-body">{a.reason}</p>
                                </div>
                            </div>
                        ))}
                   </div>
                </div>
            </div>
        </div>
    );
}
