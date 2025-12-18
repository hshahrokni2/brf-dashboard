"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/components/auth-guard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

export default function LoginPage() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (login(password)) {
            router.push("/");
        } else {
            setError(true);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1496442226666-8d4a0e62e6e9?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-10 blur-sm"></div>

            <Card className="w-full max-w-md relative z-10 bg-slate-900/80 backdrop-blur-xl border-slate-800 shadow-2xl">
                <div className="p-8 text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 border border-slate-700/50 mb-4">
                        <Lock className="w-8 h-8 text-sky-500" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                            LocalLife
                        </h1>
                        <p className="text-slate-400 text-sm">Validating Access Credentials</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Enter access code"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError(false);
                                }}
                                className={`bg-slate-950/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:ring-sky-500/50 h-11 text-center tracking-widest ${error ? "border-red-500/50 focus:border-red-500" : ""}`}
                            />
                            {error && <p className="text-xs text-red-400 animate-pulse">Access Denied: Invalid Code</p>}
                        </div>

                        <Button type="submit" className="w-full h-11 bg-sky-600 hover:bg-sky-500 text-white font-medium tracking-wide">
                            AUTHENTICATE
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
}
