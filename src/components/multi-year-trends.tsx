"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface HistoryDataPoint {
    year: number;
    solidarity: number | null;
    debt_sqm: number | null;
    fee_sqm: number | null;
    revenue?: number | null;
    result?: number | null;
    savings_sqm?: number | null;
    members?: number | null;
    apartments?: number | null;
    total_income?: number | null;
    total_costs?: number | null;
    association_fund?: number | null;
    repair_fund?: number | null;
    solidarity_sek?: number | null;
    long_term_debt?: number | null;
    total_area?: number | null;
    debt_total?: number | null;
    equity?: number | null;
}

interface MultiYearTrendsProps {
    history: HistoryDataPoint[] | null;
    brfName?: string;
}

const METRICS = [
    { key: "solidarity", label: "Soliditet (%)", color: "#38bdf8", unit: "%" },
    { key: "debt_sqm", label: "Debt / m²", color: "#fb7185", unit: "kr/m²" },
    { key: "fee_sqm", label: "Annual Fee / m²", color: "#a78bfa", unit: "kr/m²" },
    { key: "revenue", label: "Revenue", color: "#34d399", unit: "kr" },
    { key: "result", label: "Annual Result", color: "#fbbf24", unit: "kr" },
    { key: "savings_sqm", label: "Savings / m²", color: "#10b981", unit: "kr/m²" },
    { key: "members", label: "Members", color: "#6366f1", unit: "" },
    { key: "total_income", label: "Total Income", color: "#14b8a6", unit: "kr" },
    { key: "total_costs", label: "Total Costs", color: "#f59e0b", unit: "kr" },
    { key: "association_fund", label: "Association Fund", color: "#8b5cf6", unit: "kr" },
    { key: "repair_fund", label: "Repair Fund", color: "#ec4899", unit: "kr" },
    { key: "long_term_debt", label: "Long-term Debt", color: "#ef4444", unit: "kr" },
    { key: "equity", label: "Equity", color: "#10b981", unit: "kr" },
];

export function MultiYearTrends({ history, brfName }: MultiYearTrendsProps) {
    const [selectedMetric, setSelectedMetric] = useState("solidarity");

    if (!history || history.length === 0) {
        return (
            <div className="text-center py-10 text-slate-500 italic">
                No multi-year data available
            </div>
        );
    }

    const metric = METRICS.find(m => m.key === selectedMetric);
    if (!metric) return null;

    // Filter data to only include years with the selected metric
    const filteredData = history.filter(h => h[selectedMetric as keyof HistoryDataPoint] != null);

    return (
        <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-400" />
                            Multi-Year Trends
                        </CardTitle>
                        <CardDescription className="mt-1">
                            {brfName ? `${brfName} - ` : ''}Financial performance over time
                        </CardDescription>
                    </div>
                    <select
                        value={selectedMetric}
                        onChange={(e) => setSelectedMetric(e.target.value)}
                        className="bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-sky-500"
                    >
                        {METRICS.map(m => (
                            <option key={m.key} value={m.key}>{m.label}</option>
                        ))}
                    </select>
                </div>
            </CardHeader>
            <CardContent>
                {filteredData.length > 0 ? (
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={filteredData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                                <XAxis
                                    dataKey="year"
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    axisLine={{ stroke: '#475569' }}
                                />
                                <YAxis
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    axisLine={{ stroke: '#475569' }}
                                    label={{
                                        value: metric.unit ? `${metric.label} (${metric.unit})` : metric.label,
                                        angle: -90,
                                        position: 'insideLeft',
                                        fill: '#64748b',
                                        fontSize: 11
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                                    itemStyle={{ color: metric.color }}
                                    labelStyle={{ color: '#cbd5e1' }}
                                    formatter={(value: any) => {
                                        const num = Number(value);
                                        if (metric.unit === "%" || metric.unit === "kr/m²") {
                                            return num.toFixed(1) + ` ${metric.unit}`;
                                        }
                                        return new Intl.NumberFormat('sv-SE').format(num) + ` ${metric.unit}`;
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey={selectedMetric}
                                    stroke={metric.color}
                                    strokeWidth={3}
                                    dot={{ fill: metric.color, r: 4 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-500 italic">
                        No data available for {metric.label}
                    </div>
                )}

                {/* Summary Stats */}
                {filteredData.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-800">
                        <div className="text-center">
                            <div className="text-xs text-slate-500">First Year</div>
                            <div className="text-sm text-slate-200 font-mono mt-1">
                                {filteredData[0].year}: {Number(filteredData[0][selectedMetric as keyof HistoryDataPoint]).toLocaleString()} {metric.unit}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-slate-500">Latest</div>
                            <div className="text-sm text-emerald-400 font-mono mt-1">
                                {filteredData[filteredData.length - 1].year}: {Number(filteredData[filteredData.length - 1][selectedMetric as keyof HistoryDataPoint]).toLocaleString()} {metric.unit}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-slate-500">Change</div>
                            <div className={`text-sm font-mono mt-1 ${Number(filteredData[filteredData.length - 1][selectedMetric as keyof HistoryDataPoint]) > Number(filteredData[0][selectedMetric as keyof HistoryDataPoint])
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
                                }`}>
                                {(((Number(filteredData[filteredData.length - 1][selectedMetric as keyof HistoryDataPoint]) - Number(filteredData[0][selectedMetric as keyof HistoryDataPoint])) / Number(filteredData[0][selectedMetric as keyof HistoryDataPoint])) * 100).toFixed(1)}%
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
