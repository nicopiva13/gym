import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { toast } from '../../utils/toast';
import { 
    Settings, 
    Globe, 
    MapPin, 
    Phone, 
    Instagram, 
    AlertCircle,
    EyeOff,
    CheckCircle2,
    Save,
    ImagePlus
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function GymSettings() {
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.getSettings().then(res => {
            setSettings(res.data);
            setLoading(false);
        });
    }, []);

    const handleChange = (key: string, value: string) => {
        setSettings({ ...settings, [key]: value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.updateSettings(settings);
            toast.success('Configuración guardada exitosamente');
        } catch (err) { toast.error('Error al guardar la configuración'); }
        setSaving(false);
    };

    if (loading) return <div className="text-amber-500 font-display animate-pulse p-20 text-3xl tracking-[0.5em] font-black uppercase text-center w-full">Sincronizando Core...</div>;

    return (
        <form onSubmit={handleSave} className="space-y-12">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                        <Settings className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-display font-black text-white italic uppercase tracking-widest leading-none">Core Business</h1>
                        <p className="text-xs font-body font-black text-amber-500/60 uppercase tracking-[0.4em] mt-2">Configuración Global del Establecimiento</p>
                    </div>
                </div>
                <button 
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-3 px-12 group"
                >
                    <Save className={`w-5 h-5 transition-transform ${saving ? 'animate-spin' : 'group-hover:rotate-12'}`} />
                    {saving ? 'Aplicando...' : 'Aplicar Cambios'}
                </button>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Branding Section */}
                <div className="col-span-12 lg:col-span-8 space-y-8">
                    <div className="glass-panel p-10 rounded-[3rem] border-white/5 space-y-10">
                        <h3 className="text-2xl font-display font-black text-white uppercase tracking-wider flex items-center gap-4">
                            <Globe className="w-6 h-6 text-amber-500" />
                            Identidad & Branding
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Nombre Oficial del Gimnasio</label>
                                <input className="form-input" value={settings.gym_name || 'IRON GYM'} onChange={e => handleChange('gym_name', e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Dirección Local</label>
                                <div className="relative">
                                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                    <input className="form-input pl-14" value={settings.gym_address || ''} onChange={e => handleChange('gym_address', e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Teléfono Atención</label>
                                <div className="relative">
                                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                    <input className="form-input pl-14" value={settings.gym_phone || ''} onChange={e => handleChange('gym_phone', e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Instagram / Redes</label>
                                <div className="relative">
                                    <Instagram className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                    <input className="form-input pl-14" value={settings.gym_social || ''} onChange={e => handleChange('gym_social', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5 space-y-6">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Logotipo / Imagotipo</label>
                            <div className="flex items-center gap-10">
                                <div className="w-32 h-32 rounded-[2rem] bg-zinc-900 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-neutral-700 hover:border-amber-500/30 hover:text-amber-500 transition-all cursor-pointer">
                                    <ImagePlus className="w-8 h-8 mb-2" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Subir PNG</span>
                                </div>
                                <div className="max-w-xs">
                                    <p className="text-xs font-body font-bold text-neutral-400 mb-2">IRON GYM (Default Logo)</p>
                                    <p className="text-[9px] font-body text-neutral-600 uppercase tracking-widest font-black leading-relaxed">Recomendamos formato PNG transparente con resolución mínima de 512x512 para visualización premium.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Automation & Rules */}
                <div className="col-span-12 lg:col-span-4 space-y-8">
                    <div className="glass-panel p-10 rounded-[3rem] border-white/5 space-y-10">
                        <h3 className="text-2xl font-display font-black text-white uppercase tracking-wider flex items-center gap-4">
                            <AlertCircle className="w-6 h-6 text-amber-500" />
                            Reglas & Automatización
                        </h3>

                        <div className="space-y-8">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Umbral de Alerta Vencimiento</label>
                                    <span className="text-amber-500 font-display font-bold text-lg">{settings.alert_days || '7'} Días</span>
                                </div>
                                <input 
                                    type="range" min="1" max="15" 
                                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                    value={settings.alert_days || '7'}
                                    onChange={e => handleChange('alert_days', e.target.value)}
                                />
                                <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest leading-relaxed">Días de antelación para mostrar el socio en "Próximos a Vencer".</p>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-white/5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Métodos de Cobro Habilitados</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {['Efectivo', 'Tarjeta', 'Transferencia', 'MercadoPago'].map(method => (
                                        <button 
                                          key={method}
                                          type="button"
                                          className={`p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition-all ${settings.disabled_methods?.includes(method) ? 'bg-zinc-900 border-white/5 text-neutral-700' : 'bg-amber-500/5 border-amber-500/20 text-white'}`}
                                          onClick={() => {
                                             const disabled = settings.disabled_methods ? JSON.parse(settings.disabled_methods) : [];
                                             const newDisabled = disabled.includes(method) ? disabled.filter((m:any) => m !== method) : [...disabled, method];
                                             handleChange('disabled_methods', JSON.stringify(newDisabled));
                                          }}
                                        >
                                            {method}
                                            {!(settings.disabled_methods?.includes(method)) ? <CheckCircle2 className="w-4 h-4 text-amber-500" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-zinc-900/40 border border-white/5">
                        <p className="text-[10px] text-neutral-500 font-body items-center flex gap-3 uppercase tracking-widest font-black italic">
                            <AlertCircle className="w-4 h-4 text-amber-500/30" />
                            Los cambios afectan a todos los portales globalmente de forma inmediata.
                        </p>
                    </div>
                </div>
            </div>
        </form>
    );
}
