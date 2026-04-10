import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Users, CreditCard, Settings,
    LogOut, UserCheck, Calendar, Menu, X, MessageSquare
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const menuItems = [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/trainers', label: 'Entrenadores', icon: UserCheck },
        { path: '/admin/clients', label: 'Socios', icon: Users },
        { path: '/admin/plans', label: 'Planes', icon: Calendar },
        { path: '/admin/payments', label: 'Pagos / Caja', icon: CreditCard },
        { path: '/admin/complaints', label: 'Quejas', icon: MessageSquare },
        { path: '/admin/settings', label: 'Configuración', icon: Settings },
    ];

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
        <div className="flex flex-col h-full bg-[#0c0c0e]">
            {/* Logo */}
            <div className="p-8">
                <h1 className="text-2xl font-display font-black text-white tracking-[0.2em]">
                    IRON<span className="text-amber-500">GYM</span>
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        onClick={onNavClick}
                        className={`flex items-center gap-4 px-6 py-4 font-body font-bold uppercase tracking-widest text-[10px] rounded-2xl transition-all duration-300 ${
                            location.pathname === item.path
                                ? 'bg-amber-500 text-black shadow-[0_10px_20px_-10px_rgba(245,158,11,0.5)]'
                                : 'text-neutral-500 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* Profile Section */}
            <div className="p-6 border-t border-white/5 bg-black/20">
                <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-amber-500/20 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-display font-bold text-black text-lg shadow-lg shadow-amber-500/20">
                        {user?.name?.[0]}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-display font-bold text-white uppercase tracking-wider truncate">{user?.name}</p>
                        <p className="text-[9px] font-body text-neutral-500 uppercase tracking-widest leading-none mt-1">Admin Owner</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 text-neutral-500 hover:text-red-500 transition-all duration-300 font-body font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl"
                >
                    <LogOut className="w-4 h-4" /> Cerrar Sesión
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
            <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0c0c0e]/95 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <h1 className="text-xl font-display font-black text-white tracking-[0.2em]">
                    IRON<span className="text-amber-500">GYM</span>
                </h1>
                <button onClick={() => setMobileMenuOpen(true)} className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Menu className="w-6 h-6" />
                </button>
            </header>

            {/* Mobile Menu Overlay & Drawer */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] md:hidden"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 bottom-0 w-[85%] max-w-sm bg-[#0c0c0e] z-[70] md:hidden shadow-2xl border-r border-white/10"
                        >
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 text-neutral-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <SidebarContent onNavClick={() => setMobileMenuOpen(false)} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="md:pl-72 min-h-screen pt-20 md:pt-0 relative overflow-hidden">
                <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none -z-10" />
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.25 }}
                        className="p-6 md:p-12"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
