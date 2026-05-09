import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../lib/api';

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    phone2?: string;
    avatar?: string;
    role: 'customer' | 'admin' | 'trader';
    loyaltyPoints: number;
    traderBranding?: any;
    discountConfig?: any;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string, remember?: boolean) => Promise<void>;
    loginWithToken: (token: string, user: User) => void;
    register: (data: { name: string; email: string; phone: string; password: string }, remember?: boolean) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing token on app load
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (token) {
                try {
                    // Call /api/auth/me to validate token and get user data
                    const response = await api.get('/auth/me');
                    setUser(response.data); // The API returns the user object directly
                } catch (error) {
                    // Token is invalid or expired
                    console.error('Token validation failed:', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    sessionStorage.removeItem('token');
                    sessionStorage.removeItem('user');
                }
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string, remember: boolean = true) => {
        const response = await api.post('/auth/login', { email, password });
        const { token, user: userData } = response.data;

        const storage = remember ? localStorage : sessionStorage;
        storage.setItem('token', token);
        storage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const loginWithToken = (token: string, userData: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const register = async (data: { name: string; email: string; phone: string; password: string }, remember: boolean = true) => {
        const response = await api.post('/auth/register', {
            ...data,
            address: 'Cairo, Egypt',
        });

        const { token, user: userData } = response.data;

        if (token) {
            const storage = remember ? localStorage : sessionStorage;
            storage.setItem('token', token);
            storage.setItem('user', JSON.stringify(userData));
            setUser(userData);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setUser(null);
        // Redirect to home
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                loginWithToken,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
