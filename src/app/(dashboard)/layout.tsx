"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Sidebar } from "@/components/sidebar";
import { SearchCommand } from "@/components/search-command";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <div className="flex min-h-screen bg-slate-950 text-slate-200">
                <Sidebar />
                <SearchCommand />
                <main className="flex-1 overflow-auto">
                    {/* Header / Top Bar context could go here */}
                    <div className="p-8">
                        {children}
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
