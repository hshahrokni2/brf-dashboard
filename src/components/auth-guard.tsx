"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SESSION_KEY = "brf_dashboard_session";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const session = localStorage.getItem(SESSION_KEY);
        if (!session) {
            router.push("/login");
            return;
        }

        try {
            const { timestamp } = JSON.parse(session);
            if (Date.now() - timestamp > SESSION_DURATION) {
                localStorage.removeItem(SESSION_KEY);
                router.push("/login");
                return;
            }
            setIsAuthenticated(true);
        } catch {
            localStorage.removeItem(SESSION_KEY);
            router.push("/login");
        }
    }, [router]);

    if (!isAuthenticated) {
        return null; // Or a loading spinner
    }

    return <>{children}</>;
}

export function login(password: string): boolean {
    if (password === "LocalLife") {
        const session = { timestamp: Date.now() };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return true;
    }
    return false;
}
