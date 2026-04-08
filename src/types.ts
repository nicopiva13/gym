export interface Exercise {
    id: string;
    name: string;
    targetWeight: number; // kg
    sets: number;
    reps: number;
    restSeconds: number;
    videoUrl: string; // YouTube
}

export interface Routine {
    id: string;
    studentId: string;
    name: string;
    date: string; // ISO date string
    exercises: Exercise[];
    completed: boolean;
}

export interface Metric {
    date: string;
    weight: number;
}

export interface ExerciseProgress {
    exerciseName: string;
    history: Metric[];
}

export interface Attendance {
    date: string;
    attended: boolean;
}

export interface Student {
    id: string;
    name: string;
    avatar: string;
    age: number;
    goal: string;
    attendance: Attendance[];
    progress: ExerciseProgress[];
    complianceRate: number; // %
}
