"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, MapPin, TrendingUp, LineChart, Settings, LogOut, BarChart3, Building2, Zap, Lightbulb, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/rankings", icon: Trophy, label: "Rankings" },
    { href: "/energy", icon: Zap, label: "Energy" },
    { href: "/measures", icon: Lightbulb, label: "Measures" },
    { href: "/events", icon: Calendar, label: "Events" },
    { href: "/benchmarking", icon: TrendingUp, label: "Benchmarking" },
    { href: "/suppliers", icon: Building2, label: "Suppliers" },
    { href: "/map", icon: MapPin, label: "Map" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col glass">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                    LocalLife
                </h1>
                <p className="text-xs text-slate-500 mt-1">BRF Intelligence Platform</p>
            </div>

            <nav className="flex-1 px-3 space-y-1">
                {navItems.map(({ href, icon: Icon, label }) => {
                    const isActive = pathname === href;

                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                                isActive
                                    ? "bg-slate-800/80 text-sky-400 shadow-lg shadow-sky-900/20 border border-slate-700/50"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors w-full">
                    <Settings className="w-5 h-5" />
                    Settings
                </button>
                <button
                    onClick={() => {
                        localStorage.removeItem("brf_dashboard_session");
                        window.location.href = "/login";
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-red-400/70 hover:text-red-400 text-sm font-medium transition-colors w-full"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </div>
    );
}
