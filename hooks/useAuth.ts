import { useState, useEffect } from 'react';

export interface AuthUser {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
}

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/auth/user', { credentials: 'include' })
            .then(res => {
                if (res.status === 401) return null;
                if (!res.ok) throw new Error('Auth error');
                return res.json();
            })
            .then(data => {
                setUser(data);
            })
            .catch(() => {
                setUser(null);
            })
            .finally(() => setIsLoading(false));
    }, []);

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        displayName: user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || 'Nutzer' : null,
    };
}
