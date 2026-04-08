import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { 
    ArrowLeft, User, Calendar, Trophy, ClipboardList, Save,
    Clock, AlertCircle, UserCheck, Hash, CheckCircle2, XCircle,
    Dumbbell, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ClientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState<any>(null);
    const [membership, setMembership] = useState<any>(null);
    const [activePlan, setActivePlan] = useState<any>(null);
    const [availablePlans, setAvailablePlans] = useState<any[]>([]);
    const [attendances, setAttendances] = useState<any[]>([]);
    const [weeklyGoals, setWeeklyGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [saving, setSaving] = useState(false);
    const [checkingIn, setCheckingIn] = useState(false);
    
    // Weekly goal form
    const [metGoal, setMetGoal] = useState(false);
    const [goalNote, setGoalNote] = useState('');
    const [savingGoal, setSavingGoal] = useState(false);

    const weekStart = (() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        return monday.toISOString().split('T')[0];
    })();

    const loadData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const clientId = parseInt(id);
            const [cres, plansRes, attRes, goalsRes, memRes] = await Promise.all([
                api.getClient(clientId),
                api.getTrainingPlans(),
                api.getAttendances(clientId),
                api.getWeeklyGoals(clientId),
                api.getClientMembership(clientId),
            ]);

            setClient(cres.data);
            setAvailablePlans(plansRes.data || []);
            setAttendances(attRes.data || []);
            setWeeklyGoals(goalsRes.data || []);
            setMembership(memRes.data || null);

            // Determine active plan from client data
            const clientData = cres.data;
            if (clientData?.active_plan_id) {
                setActivePlan({ id: clientData.active_plan_id, name: clientData.active_plan_name });
            }

            // Pre-fill current week goal
            const currentGoal = (goalsRes.data || []).find((g: any) => g.week_start === weekStart);
            if (currentGoal) {
                setMetGoal(!!currentGoal.met_goal);
                setGoalNote(currentGoal.note || '');
            }
        } catch {
            // Error silenced intentionally — no exponer datos en consola
        }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [id, weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleAssignPlan = async () => {
        if (!selectedPlanId || !id) return;
        setSaving(true);
        try {
            await api.assignPlan(parseInt(selectedPlanId), { client_id: parseInt(id) });
            alert('✅ Plan asignado correctamente');
            setSelectedPlanId('');
            await loadData();
        } catch (err: unknown) {
            alert('Error: ' + (err instanceof Error ? err.message : 'No se pudo asignar'));
        }
        setSaving(false);
    };

    const handleCheckin = async () => {
        if (!id) return;
        setCheckingIn(true);
        try {
            await api.createAttendance({ client_id: parseInt(id) });
            alert('Asistencia registrada');
            await loadData();
        } catch (err: unknown) {
            alert('Error: ' + (err instanceof Error ? err.message : 'No se pudo registrar'));
        }
        setCheckingIn(false);
    };

    const handleSaveGoal = async () => {
        if (!id) return;
        setSavingGoal(true);
        try {
            await api.setWeeklyGoal({ client_id: parseInt(id), week_start: weekStart, met_goal: metGoal ? 1 : 0, note: goalNote });
            alert('Objetivo semanal guardado');
            await loadData();
        } catch (err: unknown) {
            alert('Error: ' + (err instanceof Error ? err.message : 'No se pudo guardar'));
        }
        setSavingGoal(false);
    };

    if (loading) return <div className="text-orange-500 font-display animate-pulse p-20 text-3xl tracking-[0.5em] font-black uppercase text-center w-full">Cargando Atleta...</div>;
    if (!client) return <div className="text-red-500 p-20 text-center font-body">Cliente no encontrado</div>;

    const currentWeekGoal = weeklyGoals.find(g => g.week_start === weekStart);
    const membershipDaysLeft = membership ? Math.ceil((new Date(membership.end_date).getTime() - Date.now()) / 86400000) : null;

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="p-4 bg-white/5 rounded-2xl hover:text-orange-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-display font-black text-white italic uppercase tracking-widest">{client.name} {client.lastname}</h1>
                        <p className="text-xs font-body font-black text-orange-500/60 uppercase tracking-[0.4em]">DNI: {client.dni} • Ficha de Seguimiento</p>
                    </div>
                </div>
                <button 
                    onClick={handleCheckin} 
                    disabled={checkingIn}
                    className="btn-secondary flex items-center gap-2 px-8 uppercase font-black text-[10px] tracking-widest disabled:opacity-50"
                >
                    <UserCheck className="w-4 h-4" /> {checkingIn ? 'Registrando...' : 'Marcar Asistencia'}
                </button>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Left: Profile + Membership */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    {/* Profile */}
                    <div className="glass-panel p-8 rounded-[3rem] border-white/5 text-center flex flex-col items-center">
                        <div className="w-24 h-24 rounded-[2rem] bg-zinc-800 flex items-center justify-center mb-6 border-2 border-orange-500/10">
                            <User className="w-12 h-12 text-orange-500/30" />
                        </div>
                        <h3 className="text-xl font-display font-black text-white uppercase tracking-wider mb-1">{client.name} {client.lastname}</h3>
                        <p className="text-[10px] text-neutral-500 font-body uppercase tracking-widest mb-6">{client.email}</p>
                        
                        {client.goal && (
                            <div className="w-full p-4 bg-white/5 rounded-2xl border border-white/5 text-left">
                                <p className="text-[8px] font-black uppercase text-orange-500 tracking-widest mb-1 flex items-center gap-1">
                                    <Trophy className="w-3 h-3" /> Objetivo
                                </p>
                                <p className="text-[10px] font-body text-white/70 leading-relaxed">{client.goal}</p>
                            </div>
                        )}
                    </div>

                    {/* Membership Status */}
                    <div className={`glass-panel p-6 rounded-3xl border ${
                        !membership ? 'border-neutral-800' :
                        membershipDaysLeft! < 0 ? 'border-red-500/20' :
                        membershipDaysLeft! <= 7 ? 'border-amber-500/20' :
                        'border-green-500/20'
                    }`}>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Estado Membresía
                        </h4>
                        {membership ? (
                            <div className="space-y-3">
                                <p className="text-lg font-display font-black text-white">{membership.plan_name}</p>
                                <div className="flex justify-between">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                                        membershipDaysLeft! < 0 ? 'text-red-400' :
                                        membershipDaysLeft! <= 7 ? 'text-amber-400' : 'text-green-400'
                                    }`}>
                                        {membershipDaysLeft! < 0 ? 'VENCIDA' : 
                                         membershipDaysLeft! <= 7 ? `Vence en ${membershipDaysLeft} días` :
                                         `${membershipDaysLeft} días restantes`}
                                    </span>
                                </div>
                                <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Vence: {new Date(membership.end_date).toLocaleDateString('es-AR')}</p>
                                <p className="text-sm font-display font-bold text-orange-500">${parseFloat(membership.price).toLocaleString()}/mes</p>
                            </div>
                        ) : (
                            <p className="text-[11px] text-neutral-500 font-body uppercase tracking-widest">Sin membresía activa</p>
                        )}
                    </div>

                    {/* Attendance History */}
                    <div className="glass-panel p-6 rounded-3xl border-white/5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                            <Activity className="w-3 h-3" /> Últimas Asistencias
                        </h4>
                        {attendances.length === 0 ? (
                            <p className="text-[11px] text-neutral-600 font-body uppercase tracking-widest">Sin asistencias registradas</p>
                        ) : (
                            <div className="space-y-2">
                                {attendances.slice(0, 8).map((a: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-[10px] font-body border-b border-white/5 pb-2 last:border-0">
                                        <span className="text-white font-black uppercase tracking-widest">
                                            {new Date(a.check_in).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </span>
                                        <span className="text-neutral-500">{new Date(a.check_in).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Operations */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    {/* Weekly Goal */}
                    <div className="glass-panel p-8 rounded-[3rem] border-white/5 space-y-6">
                        <h3 className="text-xl font-display font-black text-white uppercase tracking-widest flex items-center gap-4">
                            <Trophy className="w-5 h-5 text-orange-500" /> Objetivo Semanal
                            <span className="text-[10px] text-neutral-500 font-body normal-case">(semana del {weekStart})</span>
                        </h3>
                        
                        {/* History */}
                        <div className="flex gap-3">
                            {weeklyGoals.slice(0, 6).map((g: any, i: number) => (
                                <div key={i} className={`flex flex-col items-center gap-1 p-3 rounded-2xl border ${g.week_start === weekStart ? 'border-orange-500/30 bg-orange-500/5' : 'border-white/5 bg-white/5'}`}>
                                    {g.met_goal ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-500/50" />
                                    )}
                                    <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest whitespace-nowrap">
                                        {new Date(g.week_start + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Current week toggle */}
                        <div className="space-y-4 border-t border-white/5 pt-6">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => setMetGoal(!metGoal)}
                                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all font-display font-black text-[11px] uppercase tracking-widest ${
                                        metGoal ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-white/5 border-white/5 text-neutral-400'
                                    }`}
                                >
                                    {metGoal ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                    {metGoal ? 'Objetivo Cumplido' : 'Marcar como Cumplido'}
                                </button>
                            </div>
                            <textarea 
                                value={goalNote}
                                onChange={e => setGoalNote(e.target.value)}
                                placeholder="Nota opcional (logros, dificultades...)"
                                className="form-input resize-none h-20 text-sm"
                            />
                            <button 
                                onClick={handleSaveGoal}
                                disabled={savingGoal}
                                className="bg-orange-500 hover:bg-orange-600 text-black font-display font-black uppercase tracking-widest py-3 px-8 rounded-2xl transition-all flex items-center gap-2 text-[11px] disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {savingGoal ? 'Guardando...' : 'Guardar Objetivo Semana'}
                            </button>
                        </div>
                    </div>

                    {/* Plan Assignment */}
                    <div className="glass-panel p-8 rounded-[3rem] border-white/5 space-y-6">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <h3 className="text-xl font-display font-black text-white uppercase tracking-widest flex items-center gap-4">
                                <ClipboardList className="w-5 h-5 text-orange-500" /> Asignación de Programa
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 block">Seleccionar Rutina</label>
                                <div className="relative">
                                    <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                    <select 
                                        className="form-input pl-12 appearance-none"
                                        value={selectedPlanId}
                                        onChange={e => setSelectedPlanId(e.target.value)}
                                    >
                                        <option value="">Seleccioná un plan...</option>
                                        {availablePlans.map((p: any) => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <button 
                                onClick={handleAssignPlan}
                                disabled={saving || !selectedPlanId}
                                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-display font-black uppercase tracking-widest py-4 px-10 rounded-2xl transition-all flex items-center gap-3"
                            >
                                <Dumbbell className="w-5 h-5" />
                                {saving ? 'Asignando...' : 'Asignar Plan'}
                            </button>

                            <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-center gap-4">
                                <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                                <p className="text-[10px] font-body text-white/50 uppercase tracking-widest leading-relaxed">
                                    Al asignar un nuevo plan, el anterior se archiva automáticamente. El cliente verá el nuevo plan de inmediato en su portal.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Weekly Goals History */}
                    <div className="glass-panel p-8 rounded-[3rem] border-white/5">
                        <h3 className="text-xl font-display font-black text-white uppercase tracking-widest flex items-center gap-4 mb-6">
                            <Clock className="w-5 h-5 text-orange-500" /> Historial de Objetivos
                        </h3>
                        {weeklyGoals.length === 0 ? (
                            <p className="text-[11px] text-neutral-600 uppercase tracking-widest font-body">Sin historial de objetivos aún</p>
                        ) : (
                            <div className="space-y-3">
                                {weeklyGoals.map((g: any, i: number) => (
                                    <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${g.met_goal ? 'border-green-500/10 bg-green-500/5' : 'border-white/5 bg-white/5'}`}>
                                        <div className="flex items-center gap-4">
                                            {g.met_goal ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-red-500/50" />
                                            )}
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-widest text-white">
                                                    Semana del {new Date(g.week_start + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                                                </p>
                                                {g.note && <p className="text-[10px] text-neutral-500 font-body mt-1">{g.note}</p>}
                                            </div>
                                        </div>
                                        <span className={`badge-${g.met_goal ? 'active' : 'expired'}`}>
                                            {g.met_goal ? 'Cumplido' : 'No cumplido'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
