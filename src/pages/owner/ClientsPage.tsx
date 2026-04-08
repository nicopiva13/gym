import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { User, Search, Plus, Filter, MoreVertical, Mail, Phone } from 'lucide-react';

export default function ClientsPage() {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getClients().then(res => {
            setClients(res.data);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-display uppercase tracking-widest text-white mb-2">Gestión de Clientes</h1>
                  <p className="text-sm text-neutral-500 font-body uppercase tracking-widest font-bold">Listado completo de socios y estados</p>
                </div>
                <button className="btn-primary flex items-center gap-2 px-6">
                    <Plus className="w-4 h-4" />
                    Nuevo Socio
                </button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input className="form-input pl-11" placeholder="Buscar por nombre, DNI o email..." />
                </div>
                <button className="px-4 py-3 bg-zinc-900 border border-white/5 rounded-xl text-neutral-400 hover:text-white transition-colors">
                    <Filter className="w-4 h-4" />
                </button>
            </div>

            <div className="glass-panel rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-body">
                        <thead>
                            <tr className="bg-zinc-900/50 text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
                                <th className="px-8 py-4">Socio</th>
                                <th className="px-8 py-4">DNI</th>
                                <th className="px-8 py-4">Contacto</th>
                                <th className="px-8 py-4">Estado</th>
                                <th className="px-8 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="px-8 py-20 text-center text-amber-500 animate-pulse font-display text-xl uppercase tracking-widest">Cargando socios...</td></tr>
                            ) : clients.length === 0 ? (
                                <tr><td colSpan={5} className="px-8 py-20 text-center text-neutral-500 font-body uppercase tracking-widest">No hay socios registrados</td></tr>
                            ) : (
                                clients.map((client) => (
                                    <tr key={client.id} className="hover:bg-zinc-900 transition-colors text-xs font-bold">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-amber-500" />
                                                </div>
                                                <div>
                                                    <p className="text-white uppercase tracking-wider">{client.name} {client.lastname}</p>
                                                    <p className="text-[10px] text-neutral-500 font-normal lowercase">{client.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-neutral-400">{client.dni}</td>
                                        <td className="px-8 py-5">
                                            <div className="flex gap-3 text-neutral-500">
                                                <Mail className="w-3.5 h-3.5" />
                                                <Phone className="w-3.5 h-3.5" />
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-2 py-1 rounded-md text-[9px] uppercase tracking-wider ${client.active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {client.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="p-2 text-neutral-600 hover:text-white transition-colors">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
