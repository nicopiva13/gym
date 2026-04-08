import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Users, 
    CreditCard, 
    Calendar, 
    Settings, 
    LogOut, 
    Dumbbell, 
    UserCircle,
    UserCheck,
    Briefcase
} from 'lucide-react';
import { useAuth, type UserRole } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

import type { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
    path: string;
    icon: LucideIcon;
    label: string;
    active: boolean;
}

const SidebarItem = ({ path, icon: Icon, label, active }: SidebarItemProps) => {
    return (
        <Link to={path}>
            <motion.div 
                whileHover={{ x: 5 }}
                className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-body text-sm font-medium border border-transparent",
                    active 
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/10 shadow-lg shadow-amber-500/5" 
                        : "text-neutral-500 hover:text-neutral-200 hover:bg-zinc-900"
                )}
            >
                <Icon className={cn("w-5 h-5", active ? "text-amber-500" : "text-neutral-600")} />
                <span className="tracking-wide uppercase font-bold text-[11px] tracking-[0.1em]">{label}</span>
            </motion.div>
        </Link>
    );
};

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const roleBasePaths: Record<UserRole, string> = {
        owner: '/admin',
        trainer: '/entrenador',
        client: '/usuario'
    };

    const basePath = roleBasePaths[user?.role || 'client'];

    const getMenuItems = () => {
        if (!user) return [];

        const items = [];

        const isStaff = user.role === 'owner' || user.role === 'trainer';
        const adminPath = '/admin';

        // Dashboard
        items.push({ path: basePath, icon: LayoutDashboard, label: 'Dashboard' });

        // Modules for both Owner and Employee
        if (isStaff) {
            items.push({ path: `${adminPath}/clients`, icon: Users, label: 'Clientes' });
            items.push({ path: `${adminPath}/attendance`, icon: UserCheck, label: 'Asistencia' });
            items.push({ path: `${adminPath}/classes`, icon: Calendar, label: 'Clases' });
            items.push({ path: `${adminPath}/payments`, icon: CreditCard, label: 'Pagos' });
            items.push({ path: `${adminPath}/plans`, icon: Dumbbell, label: 'Planes' });
        }

        // Owner only modules
        if (user.role === 'owner') {
           items.push({ path: `${adminPath}/staff`, icon: Briefcase, label: 'Staff' });
           items.push({ path: `${adminPath}/settings`, icon: Settings, label: 'Configuración' });
        }

        if (user.role === 'client') {
            items.push({ path: `${basePath}/profile`, icon: UserCircle, label: 'Mi Perfil' });
            items.push({ path: `${basePath}/classes`, icon: Calendar, label: 'Reservar' });
            items.push({ path: `${basePath}/history`, icon: CreditCard, label: 'Mis Pagos' });
        }

        return items;
    };

    const handleLogout = () => {
        logout();
        navigate('/usuario/login');
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-zinc-950 border-r border-white/5 p-6 flex flex-col z-50">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10 px-2">
                <Dumbbell className="w-8 h-8 text-amber-500" />
                <h1 className="text-2xl font-display uppercase tracking-widest text-white">
                    IRON<span className="text-amber-500">GYM</span>
                </h1>
            </div>

            {/* Menu */}
            <nav className="flex-1 space-y-2 custom-scrollbar overflow-y-auto">
                {getMenuItems().map((item) => (
                    <SidebarItem 
                        key={item.path} 
                        {...item} 
                        active={location.pathname === item.path || (item.path !== basePath && location.pathname.startsWith(item.path))} 
                    />
                ))}
            </nav>

            {/* User Profile Info */}
            <div className="mt-auto pt-6 border-t border-white/10">
                <div className="flex items-center gap-4 mb-6 px-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center overflow-hidden">
                        {user?.photo_url ? (
                            <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <UserCircle className="w-6 h-6 text-neutral-600" />
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-white truncate">{user?.name} {user?.lastname}</span>
                        <span className="text-[9px] font-bold text-amber-500/70 uppercase tracking-widest">{user?.role}</span>
                    </div>
                </div>

                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-neutral-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all font-body text-[11px] font-bold uppercase tracking-widest"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}
