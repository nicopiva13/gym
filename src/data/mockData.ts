import type { Student, Routine } from "../types";

export const MOCK_STUDENTS: Student[] = [
    {
        id: "s1",
        name: "Alex V.",
        avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
        age: 26,
        goal: "Hipertrofia - Tren Superior",
        complianceRate: 85,
        attendance: Array.from({ length: 30 }).map((_, i) => ({
            date: new Date(Date.now() - (30 - i) * 86400000).toISOString().split("T")[0],
            attended: Math.random() > 0.3
        })),
        progress: [
            {
                exerciseName: "Press de Banca",
                history: [
                    { date: "2024-01-01", weight: 60 },
                    { date: "2024-01-15", weight: 65 },
                    { date: "2024-02-01", weight: 70 },
                    { date: "2024-02-15", weight: 75 },
                    { date: "2024-03-01", weight: 80 }
                ]
            },
            {
                exerciseName: "Dominadas",
                history: [
                    { date: "2024-01-01", weight: 0 },
                    { date: "2024-01-15", weight: 5 },
                    { date: "2024-02-01", weight: 10 },
                    { date: "2024-02-15", weight: 12.5 },
                    { date: "2024-03-01", weight: 15 }
                ]
            }
        ]
    },
    {
        id: "s2",
        name: "Mariana R.",
        avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d",
        age: 30,
        goal: "Fuerza y Acondicionamiento",
        complianceRate: 92,
        attendance: Array.from({ length: 30 }).map((_, i) => ({
            date: new Date(Date.now() - (30 - i) * 86400000).toISOString().split("T")[0],
            attended: Math.random() > 0.1
        })),
        progress: [
            {
                exerciseName: "Sentadilla Back Squat",
                history: [
                    { date: "2024-01-01", weight: 50 },
                    { date: "2024-01-15", weight: 55 },
                    { date: "2024-02-01", weight: 60 },
                    { date: "2024-02-15", weight: 65 },
                    { date: "2024-03-01", weight: 70 }
                ]
            }
        ]
    }
];

export const MOCK_ROUTINES: Routine[] = [
    {
        id: "r1",
        studentId: "s1",
        name: "Día 1: Empuje (Fuerza)",
        date: new Date().toISOString().split("T")[0],
        completed: false,
        exercises: [
            {
                id: "e1",
                name: "Press de Banca Plano",
                targetWeight: 80,
                sets: 4,
                reps: 6,
                restSeconds: 120,
                videoUrl: "https://www.youtube.com/embed/rT7DgCr-3pg"
            },
            {
                id: "e2",
                name: "Press Militar con Mancuernas",
                targetWeight: 24,
                sets: 3,
                reps: 10,
                restSeconds: 90,
                videoUrl: "https://www.youtube.com/embed/qEwKCR5JCog"
            },
            {
                id: "e3",
                name: "Fondos en Paralelas",
                targetWeight: 15, // lastradas
                sets: 3,
                reps: 8,
                restSeconds: 90,
                videoUrl: "https://www.youtube.com/embed/jB3z7nENqD0"
            }
        ]
    },
    {
        id: "r2",
        studentId: "s1",
        name: "Día 2: Tirón (Hipertrofia)",
        date: new Date(Date.now() - 86400000).toISOString().split("T")[0], // Yesterday
        completed: true,
        exercises: [
            {
                id: "e4",
                name: "Dominadas Lastradas",
                targetWeight: 15,
                sets: 4,
                reps: 8,
                restSeconds: 120,
                videoUrl: "https://www.youtube.com/embed/eGo4IYtlbpU"
            }
        ]
    }
];
