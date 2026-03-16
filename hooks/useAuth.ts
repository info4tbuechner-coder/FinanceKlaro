import { useState, useEffect } from 'react';

export interface AuthUser {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
}

const AUTH_CACHE_KEY = 'klaro_auth_user';
const AUTH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedUser(): AuthUser | null {
    try {
        const raw = sessionStorage.getItem(AUTH_CACHE_KEY);
        if (!raw) return null;
        const { user, ts } = JSON.parse(raw);
        if (Date.now() - ts > AUTH_CACHE_TTL) {
            sessionStorage.removeItem(AUTH_CACHE_KEY);
            return null;
        }
        return user;
    } catch {
        return null;
    }
}

function setCachedUser(user: AuthUser | null) {
    try {
        if (user) {
            sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ user, ts: Date.now() }));
        } else {
            sessionStorage.removeItem(AUTH_CACHE_KEY);
        }
    } catch {}
}

export function useAuth() {
    const cached = getCachedUser();
    const [user, setUser] = useState<AuthUser | null | undefined>(
        cached !== null ? cached : undefined
    );
    const [isLoading, setIsLoading] = useState(cached === null);

    useEffect(() => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        fetch('/api/auth/user', {
            credentials: 'include',
            signal: controller.signal,
        })
            .then(res => {
                if (res.status === 401) return null;
                if (!res.ok) throw new Error(`Auth check failed: ${res.status}`);
                return res.json() as Promise<AuthUser>;
            })
            .then(data => {
                setUser(data);
                setCachedUser(data);
            })
            .catch(err => {
                if (err.name === 'AbortError') return;
                setUser(cached ?? null);
            })
            .finally(() => {
                clearTimeout(timeout);
                setIsLoading(false);
            });

        return () => {
            controller.abort();
            clearTimeout(timeout);
        };
    }, []);

    const displayName = user
        ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || 'Nutzer'
        : null;

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        displayName,
    };
}
