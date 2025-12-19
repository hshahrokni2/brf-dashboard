"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function MapBackButton() {
    const pathname = usePathname();
    const router = useRouter();

    if (pathname !== '/map') return null;

    return (
        <button
            onClick={() => router.push('/')}
            className="fixed top-4 right-4 z-50 px-4 py-2 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg text-slate-200 hover:bg-slate-800 hover:border-sky-500 transition-all shadow-lg flex items-center gap-2"
        >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Dashboard</span>
        </button>
    );
}
