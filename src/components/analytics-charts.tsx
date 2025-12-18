"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { LeaderboardItem, CostCategory } from "@/lib/analytics";

export function LeaderboardChart({ data, color = "#38bdf8" }: { data: LeaderboardItem[], color?: string }) {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="brf_name" width={150} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                        itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} barSize={20}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export function CostChart({ data }: { data: CostCategory[] }) {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.slice(0, 8)}>
                    <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                        itemStyle={{ color: '#e2e8f0' }}
                        formatter={(value: number) => new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(value)}
                    />
                    <Bar dataKey="total" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
