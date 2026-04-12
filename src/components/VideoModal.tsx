import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, VideoOff } from 'lucide-react';
import { extractYouTubeId, buildEmbedUrl } from '../utils/youtube';

const MUSCLE_GROUP_COLORS: Record<string, string> = {
    'Pecho': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Espalda': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Hombros': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Bíceps': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Tríceps': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Piernas': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Glúteos': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'Abdomen': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'Cardio': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    'Funcional': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
};

function getMuscleGroupColor(group: string): string {
    return MUSCLE_GROUP_COLORS[group] ?? 'bg-zinc-800 text-neutral-400 border-white/10';
}

interface VideoModalProps {
    isOpen: boolean;
    exercise: {
        exercise_name?: string;
        name?: string;
        muscle_group?: string;
        youtube_url?: string;
        notes?: string;
    } | null;
    onClose: () => void;
}

// 16:9 video container
function VideoFrame({ videoId }: { videoId: string | null }) {
    if (!videoId) {
        return (
            <div className="relative w-full bg-zinc-900 flex items-center justify-center" style={{ paddingTop: '56.25%' }}>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <VideoOff className="w-12 h-12 text-neutral-600" />
                    <p className="text-sm font-display font-black text-neutral-400 uppercase tracking-widest">Video no disponible</p>
                    <p className="text-[11px] font-body text-neutral-600 text-center px-6">El link del video no es válido. Consultá con tu entrenador.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <iframe
                src={buildEmbedUrl(videoId)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
            />
        </div>
    );
}

// ── MOBILE: Bottom Sheet ──────────────────────────────────────────────────────

function MobileSheet({ exercise, onClose }: { exercise: NonNullable<VideoModalProps['exercise']>; onClose: () => void }) {
    const name = exercise.exercise_name || exercise.name || 'Ejercicio';
    const videoId = extractYouTubeId(exercise.youtube_url || '');
    const overlayRef = useRef<HTMLDivElement>(null);

    return (
        <div className="fixed inset-0 z-[90] flex flex-col justify-end">
            {/* Overlay */}
            <motion.div
                ref={overlayRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/75"
                onClick={onClose}
            />

            {/* Sheet */}
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                drag="y"
                dragConstraints={{ top: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                    if (info.velocity.y > 500 || info.offset.y > 150) onClose();
                }}
                className="relative z-10 bg-zinc-950 rounded-t-2xl overflow-hidden flex flex-col"
                style={{ height: '85vh' }}
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2 shrink-0">
                    <div className="w-10 h-1 bg-zinc-600 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 pb-3 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <h2 className="text-base font-display font-black text-white uppercase tracking-widest truncate">{name}</h2>
                        {exercise.muscle_group && (
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0 ${getMuscleGroupColor(exercise.muscle_group)}`}>
                                {exercise.muscle_group}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-xl text-neutral-400 hover:text-white transition-colors shrink-0 ml-3">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Video */}
                <div className="shrink-0">
                    <VideoFrame videoId={videoId} />
                </div>

                {/* Info (scrollable) */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    <h3 className="text-lg font-display font-black text-white uppercase tracking-widest">{name}</h3>
                    {exercise.muscle_group && (
                        <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${getMuscleGroupColor(exercise.muscle_group)}`}>
                            {exercise.muscle_group}
                        </span>
                    )}
                    {exercise.notes && (
                        <div className="flex gap-3 pt-2">
                            <div className="w-0.5 bg-amber-500/30 rounded-full shrink-0" />
                            <div>
                                <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest mb-1">Notas del entrenador</p>
                                <p className="text-sm font-body text-neutral-300 leading-relaxed">{exercise.notes}</p>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// ── DESKTOP: Centered Modal ───────────────────────────────────────────────────

function DesktopModal({ exercise, onClose }: { exercise: NonNullable<VideoModalProps['exercise']>; onClose: () => void }) {
    const name = exercise.exercise_name || exercise.name || 'Ejercicio';
    const videoId = extractYouTubeId(exercise.youtube_url || '');

    // Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 bg-zinc-950 rounded-2xl overflow-hidden w-full max-w-2xl mx-4 shadow-2xl border border-white/10"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <h2 className="text-base font-display font-black text-white uppercase tracking-widest truncate">{name}</h2>
                        {exercise.muscle_group && (
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0 ${getMuscleGroupColor(exercise.muscle_group)}`}>
                                {exercise.muscle_group}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-xl text-neutral-400 hover:text-white transition-colors shrink-0 ml-3">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Video */}
                <VideoFrame videoId={videoId} />

                {/* Footer with notes */}
                {exercise.notes && (
                    <div className="p-4 bg-zinc-900/60 border-t border-white/5 flex gap-3">
                        <div className="w-0.5 bg-amber-500/30 rounded-full shrink-0" />
                        <div>
                            <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest mb-1">Notas del entrenador</p>
                            <p className="text-sm font-body text-neutral-300 leading-relaxed">{exercise.notes}</p>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

// ── Public Component ──────────────────────────────────────────────────────────

export default function VideoModal({ isOpen, exercise, onClose }: VideoModalProps) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Lock body scroll while open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && exercise && (
                isMobile
                    ? <MobileSheet exercise={exercise} onClose={onClose} />
                    : <DesktopModal exercise={exercise} onClose={onClose} />
            )}
        </AnimatePresence>
    );
}
