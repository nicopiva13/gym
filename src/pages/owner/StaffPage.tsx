import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { User, Plus, MoreVertical, Briefcase, Mail, Phone, Calendar } from 'lucide-react';

export default function StaffPage() {
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getStaff().then(res => {
            setStaff(res.data);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    return (
        <div className="space-y-10">
            <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-display uppercase tracking-widest text-white mb-2">Personal y Staff</h1>
                  <p className="text-sm text-neutral-500 font-body uppercase tracking-widest font-bold">Gestión de empleados y roles del sistema</p>
                </div>
                <button className="btn-primary flex items-center gap-2 px-6">
                    <Plus className="w-4 h-4" />
                    Nuevo Empleado
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full h-40 glass-panel animate-pulse flex items-center justify-center font-display text-amber-500 text-xl tracking-widest uppercase">Cargando staff...</div>
                ) : (
                    staff.map((employee, i) => (
                        <div key={i} className="glass-panel p-8 rounded-3xl group border-amber-500/10 hover:border-amber-500/30 transition-all flex flex-col items-center text-center">
                            <div className="relative mb-6">
                                <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-white/5 p-1 group-hover:border-amber-500/30 transition-all">
                                    <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
                                        <User className="w-12 h-12 text-neutral-600" />
                                    </div>
                                </div>
                                <div className="absolute bottom-0 right-0 p-2 bg-amber-500 rounded-lg border-2 border-[#050505] shadow-xl">
                                    <Briefcase className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            
                            <h4 className="text-xl font-display text-white uppercase tracking-widest mb-1">{employee.name} {employee.lastname}</h4>
                            <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest mb-6 px-3 py-1 bg-amber-500/5 rounded-md border border-amber-500/10">{employee.role}</p>

                            <div className="w-full space-y-4 pt-6 border-t border-white/5">
                                <div className="flex justify-center gap-3">
                                    <button className="p-3 bg-zinc-900 border border-white/5 rounded-xl text-neutral-600 hover:text-white hover:border-amber-500/30 transition-all"><Mail className="w-4 h-4" /></button>
                                    <button className="p-3 bg-zinc-900 border border-white/5 rounded-xl text-neutral-600 hover:text-white hover:border-amber-500/30 transition-all"><Phone className="w-4 h-4" /></button>
                                    <button className="p-3 bg-zinc-900 border border-white/5 rounded-xl text-neutral-600 hover:text-white hover:border-amber-500/30 transition-all"><Calendar className="w-4 h-4" /></button>
                                </div>
                                <div className="pt-2">
                                    <p className="text-[9px] uppercase font-black tracking-widest text-neutral-700">En el equipo desde: {new Date(employee.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <button className="mt-8 text-[11px] font-bold text-neutral-500 hover:text-amber-500 uppercase tracking-widest transition-colors flex items-center gap-2">
                                <MoreVertical className="w-3.5 h-3.5" />
                                Opciones Perfil
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
