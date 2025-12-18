"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface DistributionData {
    category: string;
    mean: number;
    median: number;
    p10: number;
    p25: number;
    p75: number;
    p90: number;
    stddev: number;
    min: number;
    max: number;
    sampleSize: number;
    yourValue?: number;
    yourPercentile?: number;
    yourZScore?: number;
}

interface CostDistributionChartProps {
    distribution: DistributionData;
    label: string;
    unit?: string;
    higherIsBetter?: boolean;
}

// Helper: Create histogram bins from distribution data
function createHistogramBins(dist: DistributionData, binCount: number = 10) {
    const range = dist.max - dist.min;
    const binSize = range / binCount;

    const bins = Array.from({ length: binCount }, (_, i) => ({
        binStart: dist.min + i * binSize,
        binEnd: dist.min + (i + 1) * binSize,
        count: 0,
        label: `${Math.round(dist.min + i * binSize)}-${Math.round(dist.min + (i + 1) * binSize)}`,
    }));

    // Estimate distribution using normal distribution assumption
    // This is a proxy since we don't have raw data points
    // Better: fetch actual histogram data from backend
    const totalSample = dist.sampleSize;
    bins.forEach(bin => {
        const binMid = (bin.binStart + bin.binEnd) / 2;
        // Rough estimate: if value is near mean, higher count
        const zScore = (binMid - dist.mean) / (dist.stddev || 1);
        const normalDensity = Math.exp(-0.5 * zScore * zScore) / Math.sqrt(2 * Math.PI);
        bin.count = Math.max(1, Math.round(normalDensity * totalSample * 0.5));
    });

    return bins;
}

export function CostDistributionChart({ distribution, label, unit = "kr/m²", higherIsBetter = false }: CostDistributionChartProps) {
    const bins = createHistogramBins(distribution, 8);

    // Determine "your" bin for highlighting
    let yourBinIndex = -1;
    if (distribution.yourValue !== undefined) {
        yourBinIndex = bins.findIndex(b => distribution.yourValue! >= b.binStart && distribution.yourValue! < b.binEnd);
    }

    // Performance indicator
    const getPerformanceIndicator = () => {
        if (distribution.yourPercentile === undefined) return null;

        const percentile = distribution.yourPercentile;
        const isGood = higherIsBetter ? percentile >= 75 : percentile <= 25;
        const isBad = higherIsBetter ? percentile <= 25 : percentile >= 75;

        if (isGood) {
            return { icon: <TrendingUp className="w-4 h-4" />, color: "text-emerald-400", label: `Top ${100 - percentile}%` };
        } else if (isBad) {
            return { icon: <TrendingDown className="w-4 h-4" />, color: "text-rose-400", label: `Bottom ${100 - percentile}%` };
        } else {
            return { icon: <Minus className="w-4 h-4" />, color: "text-slate-400", label: `${percentile.toFixed(0)}th percentile` };
        }
    };

    const perfIndicator = getPerformanceIndicator();

    return (
        <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{label} Distribution</CardTitle>
                        <CardDescription className="text-xs mt-1">
                            {distribution.sampleSize} BRFs analyzed • Median: {distribution.median} {unit}
                        </CardDescription>
                    </div>
                    {perfIndicator && distribution.yourValue !== undefined && (
                        <Badge variant="outline" className={`${perfIndicator.color} border-current flex items-center gap-1`}>
                            {perfIndicator.icon}
                            {perfIndicator.label}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={bins} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                            <XAxis
                                dataKey="label"
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                angle={-15}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} label={{ value: 'BRFs', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                                itemStyle={{ color: '#e2e8f0' }}
                            />
                            <ReferenceLine x={bins.find(b => distribution.median >= b.binStart && distribution.median < b.binEnd)?.label} stroke="#38bdf8" strokeDasharray="3 3" label={{ value: 'Median', fill: '#38bdf8', fontSize: 10 }} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {bins.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={index === yourBinIndex ? '#34d399' : '#6366f1'}
                                        fillOpacity={index === yourBinIndex ? 1 : 0.7}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-4 gap-4 mt-4 text-xs">
                    <div className="text-center">
                        <div className="text-slate-500">Min</div>
                        <div className="text-slate-200 font-mono">{Number(distribution.min).toFixed(1)}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-slate-500">P25</div>
                        <div className="text-slate-200 font-mono">{Number(distribution.p25).toFixed(1)}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-slate-500">P75</div>
                        <div className="text-slate-200 font-mono">{Number(distribution.p75).toFixed(1)}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-slate-500">Max</div>
                        <div className="text-slate-200 font-mono">{Number(distribution.max).toFixed(1)}</div>
                    </div>
                </div>

                {distribution.yourValue !== undefined && (
                    <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Your {label}:</span>
                            <span className="text-emerald-400 font-mono font-bold">{Number(distribution.yourValue).toFixed(2)} {unit}</span>
                        </div>
                        {distribution.yourZScore !== undefined && (
                            <div className="flex justify-between text-xs mt-2 text-slate-500">
                                <span>Z-Score:</span>
                                <span className="font-mono">{Number(distribution.yourZScore).toFixed(2)} σ</span>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
