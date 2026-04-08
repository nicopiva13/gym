import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/usuario/login');
    };

    return (
        <div className="min-h-screen bg-[#09090b] pb-12">
            {/* Header - sticky, slim */}
            <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-white/5 px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                        <h1 className="text-sm md:text-base font-display font-black text-white uppercase tracking-widest leading-none">
                            {user?.name}
                        </h1>
                        <p className="text-[9px] font-body font-black text-amber-500 uppercase tracking-widest leading-none mt-0.5">
                            Mi Perfil Socio
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="p-2.5 bg-white/5 rounded-xl text-neutral-500 hover:text-red-500 transition-colors"
                    title="Cerrar sesión"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </header>

            <main className="max-w-xl mx-auto px-4 py-6 md:py-8 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
