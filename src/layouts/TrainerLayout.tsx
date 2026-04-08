import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Users, LogOut, Dumbbell,
    ClipboardList, Menu, X
} from 'lucide-react';

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const menuItems = [
        { path: '/entrenador', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/entrenador/clientes', label: 'Mis Clientes', icon: Users },
        { path: '/entrenador/ejercicios', label: 'Biblioteca', icon: Dumbbell },
        { path: '/entrenador/planes', label: 'Planes Entrenamiento', icon: ClipboardList },
    ];

    const isActive = (path: string) =>
        path === '/entrenador'
            ? location.pathname === path
            : location.pathname.startsWith(path);

    const handleLogout = () => {
        logout();
        navigate('/trainer/login');
    };

    const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
        <div className="flex flex-col h-full bg-[#0c0c0e]">
            {/* Logo */}
            <div className="p-8">
                <h1 className="text-2xl font-display font-black text-white tracking-[0.2em]">
                    IRON<span className="text-orange-500">TRAINER</span>
                </h1>
            </div>

            {/* Navigation - flex-1 pushes the bottom section down */}
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        onClick={onNavClick}
                        className={`flex items-center gap-4 px-6 py-4 font-body font-bold uppercase tracking-widest text-[10px] rounded-2xl transition-all duration-300 ${
                            isActive(item.path)
                                ? 'bg-orange-500/10 text-orange-500 border-l-2 border-orange-500 shadow-[inset_10px_0_20px_rgba(249,115,22,0.05)]'
                                : 'text-neutral-500 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive(item.path) ? 'animate-pulse' : ''}`} />
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* User Profile Section at bottom */}
            <div className="p-6 border-t border-white/5 bg-black/20">
                <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-display font-bold text-black text-lg shadow-lg shadow-orange-500/20">
                        {user?.name?.[0]}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-display font-bold text-white uppercase tracking-wider truncate">{user?.name}</p>
                        <p className="text-[9px] font-body text-neutral-500 uppercase tracking-widest">Trainer Staff</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 text-neutral-500 hover:text-red-500 transition-all duration-300 font-body font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-red-500/5 group"
                >
                    <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#09090b] text-white">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block fixed left-0 top-0 bottom-0 w-72 border-r border-white/5 z-50">
                <SidebarContent />
            </aside>

            {/* Mobile Top Bar */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0c0c0e]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <h1 className="text-xl font-display font-black text-white tracking-[0.2em]">
                    IRON<span className="text-orange-500">TRAINER</span>
                </h1>
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 active:scale-95 transition-all"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </header>

            {/* Mobile Slide-in Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] md:hidden"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 bottom-0 w-[85%] max-w-sm bg-[#0c0c0e] z-[70] md:hidden shadow-2xl border-r border-white/10"
                        >
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 text-neutral-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <SidebarContent onNavClick={() => setMobileMenuOpen(false)} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="md:pl-72 min-h-screen pt-20 md:pt-0">
                {/* Background Glow */}
                <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 blur-[150px] rounded-full pointer-events-none -z-10" />
                
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="p-6 md:p-12 max-w-7xl mx-auto"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
