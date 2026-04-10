import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import {
    ArrowLeft, User, Calendar, Trophy, ClipboardList, Save,
    Clock, AlertCircle, UserCheck, Hash, CheckCircle2, XCircle,
    Dumbbell, Activity, CreditCard, Bell, Wallet, ReceiptText
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ClientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState<any>(null);
    const [membership, setMembership] = useState<any>(null);
    const [activePlan, setActivePlan] = useState<any>(null);
    const [availablePlans, setAvailablePlans] = useState<any[]>([]);
    const [membershipPlans, setMembershipPlans] = useState<any[]>([]);
    const [attendances, setAttendances] = useState<any[]>([]);
    const [weeklyGoals, setWeeklyGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [saving, setSaving] = useState(false);
    const [checkingIn, setCheckingIn] = useState(false);
    const [metGoal, setMetGoal] = useState(false);
    const [goalNote, setGoalNote] = useState('');
    const [savingGoal, setSavingGoal] = useState(false);

    // Membership assignment + payment
    const [selectedMembershipPlanId, setSelectedMembershipPlanId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Efectivo');
    const [paymentDiscount, setPaymentDiscount] = useState('0');
    const [savingMembership, setSavingMembership] = useState(false);

    // Send notification
    const [notifMessage, setNotifMessage] = useState('');
    const [sendingNotif, setSendingNotif] = useState(false);

    const weekStart = (() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(new Date().setDate(diff));
        return monday.toISOString().split('T')[0];
    })();

    const loadData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const clientId = parseInt(id);
            const [cres, plansRes, attRes, goalsRes, memRes, memPlansRes] = await Promise.all([
                api.getClient(clientId),
                api.getTrainingPlans(),
                api.getAttendances(clientId),
                api.getWeeklyGoals(clientId),
                api.getClientMembership(clientId),
                api.getMembershipPlans(),
            ]);

            setClient(cres.data);
            setAvailablePlans(plansRes.data || []);
            setAttendances(attRes.data || []);
            setWeeklyGoals(goalsRes.data || []);
            setMembership(memRes.data || null);
            setMembershipPlans(memPlansRes.data || []);

            const clientData = cres.data;
            if (clientData?.active_plan_id) {
                setActivePlan({ id: clientData.active_plan_id, name: clientData.active_plan_name });
            }

            const currentGoal = (goalsRes.data || []).find((g: any) => g.week_start === weekStart);
            if (currentGoal) { setMetGoal(!!currentGoal.met_goal); setGoalNote(currentGoal.note || ''); }
        } catch { /* silenced */ }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [id]); // eslint-disable-line

    const handleAssignPlan = async () => {
        if (!selectedPlanId || !id) return;
        setSaving(true);
        try {
            await api.assignPlan(parseInt(selectedPlanId), { client_id: parseInt(id) });
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
            await loadData();
        } catch (err: unknown) {
            alert('Error: ' + (err instanceof Error ? err.message : 'No se pudo guardar'));
        }
        setSavingGoal(false);
    };

    const handleAssignMembership = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMembershipPlanId || !id) return;
        setSavingMembership(true);
        try {
            const plan = membershipPlans.find(p => p.id === parseInt(selectedMembershipPlanId));
            const discount = parseFloat(paymentDiscount) || 0;
            const finalAmount = plan ? Math.max(0, parseFloat(plan.price) - discount) : 0;

            // 1. Assign membership
            await api.assignMembership({
                client_id: parseInt(id),
                plan_id: parseInt(selectedMembershipPlanId),
                start_date: new Date().toISOString().split('T')[0],
            });

            // 2. Register payment
            await api.createPayment({
                client_id: parseInt(id),
                amount: plan ? parseFloat(plan.price) : finalAmount,
                discount,
                final_amount: finalAmount,
                method: paymentMethod,
                notes: `Plan: ${plan?.name}`,
            });

            setSelectedMembershipPlanId('');
            setPaymentDiscount('0');
            await loadData();
            alert('✅ Membresía y pago registrados correctamente');
        } catch (err: unknown) {
            alert('Error: ' + (err instanceof Error ? err.message : 'No se pudo registrar'));
        }
        setSavingMembership(false);
    };

    const handleSendNotification = async () => {
        if (!notifMessage.trim() || !id) return;
        setSendingNotif(true);
        try {
            await api.sendNotification({
                recipient_id: parseInt(id),
                title: 'Mensaje de tu Coach',
                message: notifMessage.trim(),
            });
            setNotifMessage('');
            alert('✅ Notificación enviada al socio');
        } catch (err: unknown) {
            alert('Error: ' + (err instanceof Error ? err.message : 'No se pudo enviar'));
        }
        setSendingNotif(false);
    };

    const handlePaymentReminder = async () => {
        if (!id) return;
        try {
            const daysLeft = membership ? Math.ceil((new Date(membership.end_date).getTime() - Date.now()) / 86400000) : null;
            const msg = daysLeft !== null && daysLeft >= 0
                ? `Tu membresía "${membership.plan_name}" vence en ${daysLeft} días. Recordá renovarla para seguir entrenando.`
                : `Tu membresía ha vencido. Acercate a renovarla para seguir entrenando.`;
            await api.sendNotification({ recipient_id: parseInt(id), title: '⚠️ Recordatorio de Pago', message: msg });
            alert('✅ Recordatorio enviado');
        } catch (err: unknown) {
            alert('Error: ' + (err instanceof Error ? err.message : 'No se pudo enviar'));
        }
    };

    if (loading) return (
        <div className="text-orange-500 font-display animate-pulse p-20 text-3xl tracking-[0.5em] font-black uppercase text-center w-full">Cargando Atleta...</div>
    );
    if (!client) return <div className="text-red-500 p-20 text-center font-body">Cliente no encontrado</div>;

    const membershipDaysLeft = membership ? Math.ceil((new Date(membership.end_date).getTime() - Date.now()) / 86400000) : null;

    // Computed stats
    const totalAttendances = attendances.length;
    const totalGoals = weeklyGoals.length;
    const metGoalsCount = weeklyGoals.filter((g: any) => g.met_goal).length;
    const goalCompletionRate = totalGoals > 0 ? Math.round((metGoalsCount / totalGoals) * 100) : 0;

    // Current streak: consecutive weeks with met_goal from most recent backwards
    const sortedGoals = [...weeklyGoals].sort((a: any, b: any) => b.week_start.localeCompare(a.week_start));
    let currentStreak = 0;
    for (const g of sortedGoals) {
        if (g.met_goal) currentStreak++;
        else break;
    }

    // Membership history: derive from current membership data
    const membershipHistory = membership ? [
        {
            plan_name: membership.plan_name,
            start_date: membership.start_date,
            end_date: membership.end_date,
            price: membership.price,
            isCurrent: true,
        }
    ] : [];

    const selectedMemPlan = membershipPlans.find(p => p.id === parseInt(selectedMembershipPlanId));
    const discount = parseFloat(paymentDiscount) || 0;
    const finalAmount = selectedMemPlan ? Math.max(0, parseFloat(selectedMemPlan.price) - discount) : 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-2xl hover:text-orange-500 transition-colors shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-display font-black text-white italic uppercase tracking-widest leading-none">
                            {client.name} {client.lastname}
                        </h1>
                        <p className="text-xs font-body font-black text-orange-500/60 uppercase tracking-[0.4em] mt-1">
                            DNI: {client.dni}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handlePaymentReminder}
                        className={`p-3 rounded-2xl transition-all ${
                            membershipDaysLeft !== null && membershipDaysLeft <= 7
                                ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 animate-pulse'
                                : 'bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20'
                        }`}
                        title="Enviar recordatorio de pago"
                    >
                        <Bell className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleCheckin}
                        disabled={checkingIn}
                        className="btn-secondary flex items-center gap-2 px-6 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                    >
                        <UserCheck className="w-4 h-4" /> {checkingIn ? 'Registrando...' : 'Marcar Asistencia'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COLUMN */}
                <div className="lg:col-span-4 space-y-5">
                    {/* Profile */}
                    <div className="glass-panel p-6 rounded-[2.5rem] border-white/5 text-center flex flex-col items-center">
                        <div className="w-20 h-20 rounded-[1.5rem] bg-zinc-800 flex items-center justify-center mb-5 border-2 border-orange-500/10">
                            <User className="w-10 h-10 text-orange-500/30" />
                        </div>
                        <h3 className="text-xl font-display font-black text-white uppercase tracking-wider mb-1">{client.name} {client.lastname}</h3>
                        <p className="text-[10px] text-neutral-500 font-body uppercase tracking-widest mb-4">{client.email}</p>

                        {/* Info pills */}
                        <div className="w-full space-y-2 text-left">
                            {client.phone && (
                                <div className="flex justify-between items-center text-[10px] p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-neutral-500 font-black uppercase tracking-widest">Tel.</span>
                                    <span className="text-white font-bold">{client.phone}</span>
                                </div>
                            )}
                            {client.birthdate && (
                                <div className="flex justify-between items-center text-[10px] p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-neutral-500 font-black uppercase tracking-widest">Nac.</span>
                                    <span className="text-white font-bold">{new Date(client.birthdate + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                            )}
                            {client.weight_kg && (
                                <div className="flex justify-between items-center text-[10px] p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-neutral-500 font-black uppercase tracking-widest">Peso</span>
                                    <span className="text-white font-bold">{client.weight_kg} kg</span>
                                </div>
                            )}
                            {client.height_cm && (
                                <div className="flex justify-between items-center text-[10px] p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-neutral-500 font-black uppercase tracking-widest">Altura</span>
                                    <span className="text-white font-bold">{client.height_cm} cm</span>
                                </div>
                            )}
                        </div>

                        {client.goal && (
                            <div className="w-full mt-3 p-4 bg-white/5 rounded-2xl border border-white/5 text-left">
                                <p className="text-[8px] font-black uppercase text-orange-500 tracking-widest mb-1 flex items-center gap-1">
                                    <Trophy className="w-3 h-3" /> Objetivo
                                </p>
                                <p className="text-[10px] font-body text-white/70 leading-relaxed">{client.goal}</p>
                            </div>
                        )}

                        {client.medical_conditions && (
                            <div className="w-full mt-3 p-4 bg-red-500/5 rounded-2xl border border-red-500/10 text-left">
                                <p className="text-[8px] font-black uppercase text-red-400 tracking-widest mb-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Condiciones médicas
                                </p>
                                <p className="text-[10px] font-body text-white/70 leading-relaxed">{client.medical_conditions}</p>
                            </div>
                        )}
                    </div>

                    {/* Membership Status */}
                    <div className={`glass-panel p-6 rounded-3xl border ${
                        !membership ? 'border-neutral-800' :
                        membershipDaysLeft! < 0 ? 'border-red-500/30' :
                        membershipDaysLeft! <= 7 ? 'border-amber-500/30' :
                        'border-green-500/30'
                    }`}>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                            <CreditCard className="w-3 h-3" /> Estado Membresía
                        </h4>
                        {membership ? (
                            <div className="space-y-2">
                                <p className="text-lg font-display font-black text-white">{membership.plan_name}</p>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${
                                    membershipDaysLeft! < 0 ? 'text-red-400' :
                                    membershipDaysLeft! <= 7 ? 'text-amber-400' : 'text-green-400'
                                }`}>
                                    {membershipDaysLeft! < 0 ? '⚠️ VENCIDA' :
                                     membershipDaysLeft! <= 7 ? `⏳ Vence en ${membershipDaysLeft} días` :
                                     `✅ ${membershipDaysLeft} días restantes`}
                                </div>
                                <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
                                    Vence: {new Date(membership.end_date).toLocaleDateString('es-AR')}
                                </p>
                                <p className="text-sm font-display font-bold text-orange-500">
                                    ${parseFloat(membership.price).toLocaleString('es-AR')}/período
                                </p>
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

                {/* RIGHT COLUMN */}
                <div className="lg:col-span-8 space-y-5">
                    {/* Assign Membership + Register Payment */}
                    <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] border-white/5 space-y-5">
                        <h3 className="text-lg font-display font-black text-white uppercase tracking-widest flex items-center gap-3 border-b border-white/5 pb-5">
                            <CreditCard className="w-5 h-5 text-orange-500" /> Registrar Membresía y Pago
                        </h3>
                        <form onSubmit={handleAssignMembership} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="label-field">Plan de Membresía *</label>
                                    <select
                                        className="form-input"
                                        value={selectedMembershipPlanId}
                                        onChange={e => setSelectedMembershipPlanId(e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccioná un plan...</option>
                                        {membershipPlans.map((p: any) => (
                                            <option key={p.id} value={p.id}>{p.name} — ${parseFloat(p.price).toLocaleString('es-AR')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="label-field">Método de Pago</label>
                                    <select className="form-input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                        <option value="Efectivo">Efectivo</option>
                                        <option value="Transferencia">Transferencia</option>
                                        <option value="Tarjeta">Tarjeta</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="label-field">Descuento ($)</label>
                                    <input type="number" min="0" className="form-input" value={paymentDiscount} onChange={e => setPaymentDiscount(e.target.value)} placeholder="0" />
                                </div>
                                {selectedMemPlan && (
                                    <div className="space-y-2">
                                        <label className="label-field">Total a cobrar</label>
                                        <div className="form-input bg-amber-500/10 border-amber-500/20 text-amber-400 font-display font-black text-lg">
                                            ${finalAmount.toLocaleString('es-AR')}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={savingMembership || !selectedMembershipPlanId}
                                className="flex items-center gap-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-display font-black uppercase tracking-widest py-4 px-8 rounded-2xl transition-all text-[11px]"
                            >
                                <ReceiptText className="w-4 h-4" />
                                {savingMembership ? 'Registrando...' : 'Registrar Membresía + Pago'}
                            </button>
                        </form>
                    </div>

                    {/* Weekly Goal */}
                    <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] border-white/5 space-y-5">
                        <h3 className="text-lg font-display font-black text-white uppercase tracking-widest flex items-center gap-3">
                            <Trophy className="w-5 h-5 text-orange-500" /> Objetivo Semanal
                            <span className="text-[10px] text-neutral-500 font-body normal-case">(sem. {weekStart})</span>
                        </h3>

                        <div className="flex gap-2 flex-wrap">
                            {weeklyGoals.slice(0, 6).map((g: any, i: number) => (
                                <div key={i} className={`flex flex-col items-center gap-1 p-3 rounded-2xl border ${g.week_start === weekStart ? 'border-orange-500/30 bg-orange-500/5' : 'border-white/5 bg-white/5'}`}>
                                    {g.met_goal ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500/50" />}
                                    <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest whitespace-nowrap">
                                        {new Date(g.week_start + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4 border-t border-white/5 pt-4">
                            <button
                                onClick={() => setMetGoal(!metGoal)}
                                className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all font-display font-black text-[11px] uppercase tracking-widest ${
                                    metGoal ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-white/5 border-white/5 text-neutral-400'
                                }`}
                            >
                                {metGoal ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                {metGoal ? 'Objetivo Cumplido' : 'Marcar como Cumplido'}
                            </button>
                            <textarea
                                value={goalNote}
                                onChange={e => setGoalNote(e.target.value)}
                                placeholder="Nota opcional..."
                                className="form-input resize-none h-16 text-sm"
                            />
                            <button
                                onClick={handleSaveGoal}
                                disabled={savingGoal}
                                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-display font-black uppercase tracking-widest py-3 px-6 rounded-2xl transition-all flex items-center gap-2 text-[11px]"
                            >
                                <Save className="w-4 h-4" /> {savingGoal ? 'Guardando...' : 'Guardar Objetivo'}
                            </button>
                        </div>
                    </div>

                    {/* Plan Assignment */}
                    <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] border-white/5 space-y-5">
                        <h3 className="text-lg font-display font-black text-white uppercase tracking-widest flex items-center gap-3">
                            <ClipboardList className="w-5 h-5 text-orange-500" /> Plan de Entrenamiento
                        </h3>
                        {activePlan && (
                            <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                                <Dumbbell className="w-5 h-5 text-orange-500 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-500/60">Plan actual</p>
                                    <p className="text-sm font-display font-bold text-white uppercase">{activePlan.name}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <select
                                className="form-input flex-1"
                                value={selectedPlanId}
                                onChange={e => setSelectedPlanId(e.target.value)}
                            >
                                <option value="">Seleccioná un plan de entrenamiento...</option>
                                {availablePlans.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
                                ))}
                            </select>
                            <button
                                onClick={handleAssignPlan}
                                disabled={saving || !selectedPlanId}
                                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-display font-black uppercase tracking-widest py-3 px-6 rounded-2xl transition-all flex items-center gap-2 text-[11px] shrink-0"
                            >
                                <Dumbbell className="w-4 h-4" /> {saving ? 'Asignando...' : 'Asignar Plan'}
                            </button>
                        </div>
                    </div>

                    {/* Client Stats */}
                    <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] border-white/5 space-y-5">
                        <h3 className="text-lg font-display font-black text-white uppercase tracking-widest flex items-center gap-3 border-b border-white/5 pb-5">
                            <Activity className="w-5 h-5 text-orange-500" /> Estadísticas del Socio
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                <p className="text-2xl font-display font-black text-orange-500">{totalAttendances}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 mt-1">Asistencias</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                <p className="text-2xl font-display font-black text-green-400">{goalCompletionRate}%</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 mt-1">Objetivos Cumplidos</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                <p className="text-2xl font-display font-black text-amber-400">{currentStreak}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 mt-1">Racha Actual</p>
                            </div>
                            <div className={`p-4 rounded-2xl border text-center ${
                                !membership ? 'bg-white/5 border-white/5' :
                                membershipDaysLeft! < 0 ? 'bg-red-500/10 border-red-500/20' :
                                membershipDaysLeft! <= 7 ? 'bg-amber-500/10 border-amber-500/20' :
                                'bg-green-500/10 border-green-500/20'
                            }`}>
                                <p className={`text-sm font-display font-black leading-tight ${
                                    !membership ? 'text-neutral-500' :
                                    membershipDaysLeft! < 0 ? 'text-red-400' :
                                    membershipDaysLeft! <= 7 ? 'text-amber-400' : 'text-green-400'
                                }`}>
                                    {!membership ? 'Sin Plan' :
                                     membershipDaysLeft! < 0 ? 'VENCIDA' :
                                     membershipDaysLeft! <= 7 ? 'POR VENCER' : 'ACTIVA'}
                                </p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 mt-1">Membresía</p>
                            </div>
                        </div>
                        {totalGoals > 0 && (
                            <p className="text-[10px] text-neutral-500 font-body uppercase tracking-widest">
                                {metGoalsCount} de {totalGoals} semanas con objetivo cumplido
                            </p>
                        )}
                    </div>

                    {/* Plan History */}
                    <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] border-white/5 space-y-5">
                        <h3 className="text-lg font-display font-black text-white uppercase tracking-widest flex items-center gap-3 border-b border-white/5 pb-5">
                            <Clock className="w-5 h-5 text-orange-500" /> Historial de Membresía
                        </h3>
                        {membershipHistory.length === 0 ? (
                            <p className="text-[11px] text-neutral-600 font-body uppercase tracking-widest">Sin historial de membresía</p>
                        ) : (
                            <div className="space-y-3">
                                {membershipHistory.map((item, i) => (
                                    <div key={i} className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                        item.isCurrent
                                            ? 'bg-orange-500/5 border-orange-500/20'
                                            : 'bg-white/5 border-white/5'
                                    }`}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-sm font-display font-black text-white uppercase">{item.plan_name}</p>
                                                {item.isCurrent && (
                                                    <span className="text-[8px] font-black uppercase tracking-widest bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                                                        Plan Actual
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-neutral-500 font-body uppercase tracking-widest">
                                                {item.start_date
                                                    ? new Date(item.start_date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
                                                    : '—'}
                                                {' → '}
                                                {item.end_date
                                                    ? new Date(item.end_date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
                                                    : '—'}
                                            </p>
                                        </div>
                                        <p className="text-sm font-display font-bold text-orange-500 shrink-0">
                                            ${parseFloat(item.price).toLocaleString('es-AR')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Send Notification */}
                    <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] border-white/5 space-y-4">
                        <h3 className="text-lg font-display font-black text-white uppercase tracking-widest flex items-center gap-3">
                            <Bell className="w-5 h-5 text-orange-500" /> Enviar Mensaje al Socio
                        </h3>
                        <textarea
                            value={notifMessage}
                            onChange={e => setNotifMessage(e.target.value)}
                            placeholder="Escribí un mensaje para el socio..."
                            className="form-input resize-none h-20"
                        />
                        <button
                            onClick={handleSendNotification}
                            disabled={sendingNotif || !notifMessage.trim()}
                            className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white font-display font-black uppercase tracking-widest py-3 px-6 rounded-2xl transition-all text-[11px]"
                        >
                            <Bell className="w-4 h-4" /> {sendingNotif ? 'Enviando...' : 'Enviar Notificación'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
