import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { subscribeToast } from '../utils/toast';
import type { ToastEvent } from '../utils/toast';

const icons = {
    success: CheckCircle,
    error:   XCircle,
    warning: AlertTriangle,
    info:    Info,
};

const colors = {
    success: 'border-green-500/30 bg-green-500/10 text-green-400',
    error:   'border-red-500/30 bg-red-500/10 text-red-400',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    info:    'border-blue-500/30 bg-blue-500/10 text-blue-400',
};

const iconColors = {
    success: 'text-green-500',
    error:   'text-red-500',
    warning: 'text-amber-500',
    info:    'text-blue-500',
};

function ToastItem({ toast, onRemove }: { toast: ToastEvent; onRemove: () => void }) {
    const Icon = icons[toast.type];

    useEffect(() => {
        const t = setTimeout(onRemove, 4000);
        return () => clearTimeout(t);
    }, [onRemove]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className={`flex items-start gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl max-w-sm w-full ${colors[toast.type]}`}
        >
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColors[toast.type]}`} />
            <p className="text-[11px] font-body font-bold uppercase tracking-wider flex-1 leading-relaxed">
                {toast.message}
            </p>
            <button
                onClick={onRemove}
                className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

export default function Toast() {
    const [toasts, setToasts] = useState<ToastEvent[]>([]);

    useEffect(() => {
        return subscribeToast((t) => {
            setToasts(prev => [...prev, t]);
        });
    }, []);

    const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

    return createPortal(
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
            <AnimatePresence mode="sync">
                {toasts.map(t => (
                    <div key={t.id} className="pointer-events-auto">
                        <ToastItem toast={t} onRemove={() => remove(t.id)} />
                    </div>
                ))}
            </AnimatePresence>
        </div>,
        document.body
    );
}
