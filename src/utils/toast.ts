type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastEvent {
    id: number;
    type: ToastType;
    message: string;
}

type Listener = (toast: ToastEvent) => void;

let listeners: Listener[] = [];
let counter = 0;

const emit = (type: ToastType, message: string) => {
    const event: ToastEvent = { id: ++counter, type, message };
    listeners.forEach(fn => fn(event));
};

export const toast = {
    success: (msg: string) => emit('success', msg),
    error:   (msg: string) => emit('error', msg),
    info:    (msg: string) => emit('info', msg),
    warning: (msg: string) => emit('warning', msg),
};

export const subscribeToast = (fn: Listener) => {
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
};

export type { ToastEvent };
