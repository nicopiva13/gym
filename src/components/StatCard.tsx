import { type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
}

export default function StatCard({ title, value, icon: Icon, trend, trendUp }: StatCardProps) {
    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className="glass-panel p-6 rounded-2xl relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full -mr-12 -mt-12 group-hover:bg-amber-500/10 transition-colors" />
            
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-zinc-800 rounded-xl border border-white/5 group-hover:border-amber-500/30 transition-colors">
                    <Icon className="w-6 h-6 text-amber-500" />
                </div>
                {trend && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {trend}
                    </span>
                )}
            </div>

            <div>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-3xl font-display text-white tracking-widest">{value}</h3>
            </div>
        </motion.div>
    );
}
