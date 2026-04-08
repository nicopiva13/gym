import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type UserRole = 'owner' | 'trainer' | 'client';

export interface User {
    id: number;
    name: string;
    lastname?: string;
    email?: string;
    username?: string;
    role: UserRole;
    dni?: string;
    photo_url?: string;
    active?: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyAuth = async () => {
            const token = localStorage.getItem('gym_token');
            if (token) {
                try {
                    // We can verify the token here if needed with a /auth/me call
                    const response = await fetch('http://localhost:8000/api/auth/me', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (response.ok) {
                        const result = await response.json();
                        const userData = result.data;
                        // Ensure role is present — decode from token as fallback
                        if (userData && !userData.role) {
                            try {
                                const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
                                userData.role = payload.role;
                            } catch (_) {}
                        }
                        setUser(userData);
                    } else {
                        localStorage.removeItem('gym_token');
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Session error', error);
                    localStorage.removeItem('gym_token');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        verifyAuth();
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem('gym_token', token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('gym_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
