import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Save, Bell, Shield, Database, Layout, Mail, Phone, Globe, DollarSign } from 'lucide-react';

export default function SettingsPage() {
    const [settings, setSettings] = useState<any>({
        gym_name: '',
        address: '',
        phone: '',
        email: '',
        currency: 'ARS'
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.getSettings().then(res => {
            if (res.data) setSettings(res.data);
        }).catch(err => {
            console.error(err);
        });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.updateSettings(settings);
            alert('Configuración guardada exitosamente');
        } catch (err) {
            alert('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-10">
            <div>
              <h1 className="text-4xl font-display uppercase tracking-widest text-white mb-2">Configuración</h1>
              <p className="text-sm text-neutral-500 font-body uppercase tracking-widest font-bold">Administración global del gimnasio y sistema</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-4">
                    {[
                        { icon: Layout, label: 'General', active: true },
                        { icon: Shield, label: 'Seguridad', active: false },
                        { icon: Bell, label: 'Notificaciones', active: false },
                        { icon: Database, label: 'Backups', active: false }
                    ].map(item => (
                        <button key={item.label} className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all ${item.active ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 font-bold' : 'bg-transparent border-white/5 text-neutral-500 hover:text-white hover:border-white/10'}`}>
                            <item.icon className="w-4 h-4" />
                            <span className="text-[10px] uppercase font-bold tracking-widest">{item.label}</span>
                        </button>
                    ))}
                </div>

                <div className="lg:col-span-3 glass-panel p-8 rounded-3xl">
                    <form onSubmit={handleSave} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest flex items-center gap-2 mb-2"><Globe className="w-3.5 h-3.5" /> Nombre del Gimnasio</label>
                                <input value={settings.gym_name} onChange={e => setSettings({...settings, gym_name: e.target.value})} className="form-input" placeholder="Ej: Iron Core Gym HQ" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest flex items-center gap-2 mb-2"><DollarSign className="w-3.5 h-3.5" /> Moneda</label>
                                <select value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})} className="form-input">
                                    <option value="ARS">ARS - Peso Argentino</option>
                                    <option value="USD">USD - Dólar Estadounidense</option>
                                    <option value="MXN">MXN - Peso Mexicano</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest flex items-center gap-2 mb-2"><Mail className="w-3.5 h-3.5" /> Email Contacto</label>
                                <input value={settings.email} onChange={e => setSettings({...settings, email: e.target.value})} className="form-input" placeholder="gym@example.com" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest flex items-center gap-2 mb-2"><Phone className="w-3.5 h-3.5" /> Teléfono</label>
                                <input value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} className="form-input" placeholder="+54 11..." />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest flex items-center gap-2 mb-2">Dirección Física</label>
                                <input value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} className="form-input" placeholder="Calle, Número, Ciudad..." />
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5 flex justify-end">
                            <button type="submit" className="btn-primary flex items-center gap-2 px-10 py-4 uppercase tracking-widest font-black" disabled={saving}>
                                <Save className="w-4 h-4" />
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
