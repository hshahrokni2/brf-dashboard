"use client";

import { useState, useMemo, useEffect } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, SlidersHorizontal, Search } from "lucide-react";
import { BrfComparisonData } from "@/types";

interface ScatterExplorerProps {
    data: BrfComparisonData[];
}

const STANDARD_METRICS = [
    { value: "debt_sqm", label: "Debt / m²", unit: "kr", higherIsBetter: false },
    { value: "fee_sqm", label: "Annual Fee / m²", unit: "kr", higherIsBetter: false },
    { value: "solidarity_percent", label: "Soliditet", unit: "%", higherIsBetter: true },
    { value: "heating_cost", label: "Heating Cost", unit: "kr/m²", higherIsBetter: false },
    { value: "waste_cost", label: "Waste Cost", unit: "kr/m²", higherIsBetter: false },
    { value: "water_cost", label: "Water Cost", unit: "kr/m²", higherIsBetter: false },
    { value: "cleaning_cost", label: "Cleaning Cost", unit: "kr/m²", higherIsBetter: false },
    { value: "elevator_cost", label: "Elevator Cost", unit: "kr/m²", higherIsBetter: false },
    { value: "total_costs_sqm", label: "Total Op. Costs / m²", unit: "kr", higherIsBetter: false },
    { value: "property_tax", label: "Property Tax", unit: "kr/m²", higherIsBetter: false },
    { value: "site_leasehold_fee", label: "Tomträttsavgäld", unit: "kr/m²", higherIsBetter: false },
    { value: "built_year", label: "Built Year", unit: "", higherIsBetter: null },
];

export function ScatterExplorer({ data }: ScatterExplorerProps) {
    const [xMetric, setXMetric] = useState<string>("debt_sqm");
    const [yMetric, setYMetric] = useState<string>("fee_sqm");
    const [showTop, setShowTop] = useState(false);
    const [costCategories, setCostCategories] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch all available cost categories
    useEffect(() => {
        fetch('/api/cost-categories')
            .then(res => res.json())
            .then(data => {
                if (data.categories) {
                    setCostCategories(data.categories);
                }
            })
            .catch(err => console.error('Failed to fetch cost categories:', err));
    }, []);

    // Combine standard metrics with cost categories
    const allMetrics = useMemo(() => {
        const categoryMetrics = costCategories.map(cat => ({
            value: cat,
            label: cat,
            unit: "kr/m²",
            higherIsBetter: false,
        }));
        return [...STANDARD_METRICS, ...categoryMetrics];
    }, [costCategories]);

    // Filter metrics by search term
    const filteredMetrics = useMemo(() => {
        if (!searchTerm) return allMetrics;
        const term = searchTerm.toLowerCase();
        return allMetrics.filter(m => m.label.toLowerCase().includes(term));
    }, [allMetrics, searchTerm]);

    // Filter data to ensure both X and Y exist
    const plotData = useMemo(() => {
        return data.filter(d => {
            const x = d[xMetric as keyof BrfComparisonData];
            const y = d[yMetric as keyof BrfComparisonData];
            return x !== undefined && x !== null && y !== undefined && y !== null && !isNaN(Number(x)) && !isNaN(Number(y));
        }).map(d => ({
            ...d,
            x: Number(d[xMetric as keyof BrfComparisonData]),
            y: Number(d[yMetric as keyof BrfComparisonData]),
        }));
    }, [data, xMetric, yMetric]);

    // Calculate Top 20% threshold
    const topPerformers = useMemo(() => {
        if (!showTop) return new Set<string>();
        const xMetricObj = allMetrics.find(m => m.value === xMetric);
        const sortedData = [...plotData].sort((a, b) => {
            if (xMetricObj?.higherIsBetter) return b.x - a.x;
            if (xMetricObj?.higherIsBetter === false) return a.x - b.x;
            return 0;
        });
        const top20Count = Math.ceil(sortedData.length * 0.2);
        return new Set(sortedData.slice(0, top20Count).map(d => d.zelda_id));
    }, [plotData, xMetric, showTop, allMetrics]);

    const xMetricLabel = allMetrics.find(m => m.value === xMetric)?.label || xMetric;
    const yMetricLabel = allMetrics.find(m => m.value === yMetric)?.label || yMetric;

    return (
        <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                    The Analyst: Correlation Explorer
                </CardTitle>
                <CardDescription>
                    Compare any two metrics • {plotData.length} BRFs plotted • {allMetrics.length} metrics available
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* X-Axis Selector */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">X-Axis</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search metrics..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-800 text-slate-200 text-sm rounded-lg pl-10 pr-3 py-2 border border-slate-700 focus:outline-none focus:border-sky-500 mb-2"
                            />
                        </div>
                        <select
                            value={xMetric}
                            onChange={(e) => setXMetric(e.target.value)}
                            className="w-full bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-sky-500 max-h-40 overflow-y-auto"
                            size={6}
                        >
                            {filteredMetrics.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Y-Axis Selector */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">Y-Axis</label>
                        <div className="h-[38px]"></div> {/* Spacer to align with X-axis */}
                        <select
                            value={yMetric}
                            onChange={(e) => setYMetric(e.target.value)}
                            className="w-full bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-sky-500 max-h-40 overflow-y-auto"
                            size={6}
                        >
                            {filteredMetrics.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filter */}
                    <div className="space-y-4">
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showTop}
                                    onChange={(e) => setShowTop(e.target.checked)}
                                    className="w-4 h-4 text-sky-500 bg-slate-800 border-slate-600 rounded focus:ring-sky-500"
                                />
                                <span className="text-sm text-slate-300">Highlight Top 20%</span>
                            </label>
                        </div>
                        <div className="pt-2 border-t border-slate-700">
                            <div className="text-xs text-slate-500 mb-2">Quick Stats</div>
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Total Metrics:</span>
                                    <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">
                                        {allMetrics.length}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Cost Categories:</span>
                                    <Badge variant="outline" className="text-sky-400 border-sky-400/30">
                                        {costCategories.length}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">BRFs Plotted:</span>
                                    <Badge variant="outline" className="text-purple-400 border-purple-400/30">
                                        {plotData.length}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="h-[500px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                            <XAxis
                                type="number"
                                dataKey="x"
                                name={xMetricLabel}
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                label={{ value: xMetricLabel, position: 'bottom', offset: 40, fill: '#64748b', fontSize: 12 }}
                            />
                            <YAxis
                                type="number"
                                dataKey="y"
                                name={yMetricLabel}
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                label={{ value: yMetricLabel, angle: -90, position: 'left', offset: 40, fill: '#64748b', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                                itemStyle={{ color: '#e2e8f0' }}
                                cursor={{ strokeDasharray: '3 3' }}
                                formatter={(value: any, name: string) => [
                                    Number(value).toLocaleString('sv-SE', { maximumFractionDigits: 1 }),
                                    name
                                ]}
                                labelFormatter={(label) => `BRF`}
                            />
                            <Scatter data={plotData} fill="#6366f1">
                                {plotData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={topPerformers.has(entry.zelda_id) ? '#34d399' : '#6366f1'}
                                        fillOpacity={topPerformers.has(entry.zelda_id) ? 0.9 : 0.6}
                                    />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>

                {/* Info */}
                <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 flex items-start gap-2">
                    <Info className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-400">
                        <strong className="text-slate-300">Dynamic Metrics:</strong> Use the search box to find specific cost categories like "Bredband", "Fastighetsskötsel", or "Sophämtning". All {costCategories.length} available cost categories are now searchable and plottable.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
