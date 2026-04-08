import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Clock, UserCheck, AlertCircle, Calendar } from 'lucide-react';

export default function AttendancePage() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dni, setDni] = useState('');
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const fetchHistory = async () => {
        try {
            const res = await api.getAttendance();
            setHistory(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleCheckin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.checkin({ dni });
            setStatus({ type: 'success', message: res.message || 'Ingreso exitoso' });
            setDni('');
            fetchHistory();
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'Error al validar' });
        }
    };

    return (
        <div className="space-y-10">
            <div>
              <h1 className="text-4xl font-display uppercase tracking-widest text-white mb-2">Control de Asistencia</h1>
              <p className="text-sm text-neutral-500 font-body uppercase tracking-widest font-bold">Validación de socios y registro de ingresos</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 glass-panel p-8 rounded-3xl space-y-6">
                    <h3 className="text-xl font-display uppercase tracking-wider text-white">Check-in Rápido</h3>
                    <form onSubmit={handleCheckin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest px-1">DNI del Socio</label>
                            <input 
                                className="form-input text-lg font-display tracking-widest py-4"
                                value={dni}
                                onChange={(e) => setDni(e.target.value)}
                                placeholder="00000000"
                            />
                        </div>
                        <button type="submit" className="btn-primary w-full py-4 uppercase tracking-widest font-bold">Validar Ingreso</button>
                    </form>

                    {status && (
                        <div className={`p-4 rounded-2xl flex items-center gap-3 border ${status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                            {status.type === 'success' ? <UserCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <p className="text-xs font-bold uppercase tracking-wider">{status.message}</p>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 glass-panel rounded-3xl overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-xl font-display uppercase tracking-wider text-white">Ingresos Hoy</h3>
                        <Calendar className="w-5 h-5 text-neutral-700" />
                    </div>
                    <div className="overflow-hidden">
                        <table className="w-full text-left font-body">
                            <thead>
                                <tr className="bg-zinc-900/50 text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
                                    <th className="px-8 py-4">Socio</th>
                                    <th className="px-8 py-4">DNI</th>
                                    <th className="px-8 py-4">Hora</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan={3} className="px-8 py-10 text-center animate-pulse text-amber-500">Cargando...</td></tr>
                                ) : history.length === 0 ? (
                                    <tr><td colSpan={3} className="px-8 py-10 text-center text-neutral-500">Sin ingresos hoy</td></tr>
                                ) : (
                                    history.map((record, i) => (
                                        <tr key={i} className="hover:bg-zinc-900 transition-colors">
                                            <td className="px-8 py-4 font-bold text-white text-xs uppercase tracking-wider">{record.name} {record.lastname}</td>
                                            <td className="px-8 py-4 font-bold text-neutral-500 text-xs">{record.dni}</td>
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-2 text-amber-500">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-bold">{new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
