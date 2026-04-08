import Sidebar from '../components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-200">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="pl-64 min-h-screen relative">
                {/* Header Decoration */}
                <div className="absolute top-0 right-0 w-1/3 h-64 bg-amber-500/10 blur-[120px] rounded-full -z-10" />

                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="p-10"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
