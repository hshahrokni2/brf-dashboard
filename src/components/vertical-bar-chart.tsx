"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface BrfBarData {
    zelda_id: string;
    brf_name: string;
    value: number;
}

interface VerticalBarChartProps {
    data: BrfBarData[];
    selectedBrfId?: string;
    category: string;
    unit: string;
}

export function VerticalBarChart({ data, selectedBrfId, category, unit }: VerticalBarChartProps) {
    const router = useRouter();
    const [hoveredBrf, setHoveredBrf] = useState<string | null>(null);

    if (data.length === 0) {
        return (
            <div className="text-center text-slate-500 py-12">
                No data available for this category
            </div>
        );
    }

    // Sort by value for consistent ordering
    const sortedData = [...data].sort((a, b) => a.value - b.value);

    // Find max value for scaling
    const maxValue = Math.max(...sortedData.map(d => d.value));

    // Calculate statistics
    const mean = sortedData.reduce((sum, d) => sum + d.value, 0) / sortedData.length;
    const p25 = sortedData[Math.floor(sortedData.length * 0.25)]?.value || 0;
    const p75 = sortedData[Math.floor(sortedData.length * 0.75)]?.value || 0;

    const handleBarClick = (brfId: string) => {
        router.push(`/?brf=${brfId}`);
    };

    const getBarColor = (brfId: string, value: number) => {
        if (brfId === selectedBrfId) {
            return 'bg-cyan-400'; // Bright cyan for selected (matches site)
        }
        if (value <= p25) {
            return 'bg-emerald-500'; // Emerald for top performers (site theme)
        }
        if (value >= p75) {
            return 'bg-amber-500/80'; // Amber for poor performers (warmer than red, site theme)
        }
        return 'bg-sky-600/60'; // Sky-blue for middle (site theme)
    };

    const hoveredData = hoveredBrf ? sortedData.find(d => d.zelda_id === hoveredBrf) : null;

    return (
        <Card className="bg-slate-900/50 border-slate-800 h-full">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-sky-400" />
                        <span>{category}</span>
                    </div>
                    <div className="text-sm font-normal text-slate-400">
                        {sortedData.length} BRFs
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Legend */}
                <div className="flex items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-cyan-400 rounded" />
                        <span>Your BRF</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded" />
                        <span>Top 25%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-sky-600/60 rounded" />
                        <span>Middle 50%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-amber-500/80 rounded" />
                        <span>Bottom 25%</span>
                    </div>
                </div>

                {/* Bar Chart Container */}
                <div className="relative bg-slate-950/50 rounded-lg p-4 border border-slate-800">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-slate-500 pr-2">
                        <span>{maxValue.toFixed(0)}</span>
                        <span>{(maxValue * 0.75).toFixed(0)}</span>
                        <span>{(maxValue * 0.5).toFixed(0)}</span>
                        <span>{(maxValue * 0.25).toFixed(0)}</span>
                        <span>0</span>
                    </div>

                    {/* Reference lines */}
                    <div className="absolute left-16 right-4 top-4 bottom-4">
                        <div className="absolute w-full border-t border-dashed border-slate-700" style={{ top: '0%' }} />
                        <div className="absolute w-full border-t border-dashed border-slate-800" style={{ top: '25%' }} />
                        <div className="absolute w-full border-t border-dashed border-slate-800" style={{ top: '50%' }} />
                        <div className="absolute w-full border-t border-dashed border-slate-800" style={{ top: '75%' }} />

                        {/* Mean line */}
                        <div
                            className="absolute w-full border-t border-amber-500/50"
                            style={{ bottom: `${(mean / maxValue) * 100}%` }}
                        >
                            <span className="absolute -right-12 -top-2 text-[10px] text-amber-500">
                                Mean
                            </span>
                        </div>
                    </div>

                    {/* Bars */}
                    <div className="relative ml-16 mr-4 h-64 flex items-end gap-[1px] overflow-x-auto">
                        {sortedData.map((brf) => {
                            const heightPercent = (brf.value / maxValue) * 100;
                            const isSelected = brf.zelda_id === selectedBrfId;
                            const isHovered = brf.zelda_id === hoveredBrf;

                            return (
                                <div
                                    key={brf.zelda_id}
                                    className={`flex-shrink-0 w-2 ${getBarColor(brf.zelda_id, brf.value)} cursor-pointer transition-all hover:opacity-100 ${isSelected ? 'w-3' : 'hover:w-3'
                                        }`}
                                    style={{ height: `${heightPercent}%` }}
                                    onClick={() => handleBarClick(brf.zelda_id)}
                                    onMouseEnter={() => setHoveredBrf(brf.zelda_id)}
                                    onMouseLeave={() => setHoveredBrf(null)}
                                    title={`${brf.brf_name}: ${brf.value.toFixed(1)} ${unit}`}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Hover Tooltip */}
                {hoveredData && (
                    <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                        <div className="text-sm font-semibold text-slate-200 truncate">
                            {hoveredData.brf_name}
                        </div>
                        <div className="text-lg font-bold text-sky-400 mt-1">
                            {hoveredData.value.toFixed(1)} {unit}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            Click to view details
                        </div>
                    </div>
                )}

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 bg-slate-800/50 rounded">
                        <div className="text-slate-500">Min</div>
                        <div className="font-mono text-emerald-400">{sortedData[0].value.toFixed(1)}</div>
                    </div>
                    <div className="p-2 bg-slate-800/50 rounded">
                        <div className="text-slate-500">Mean</div>
                        <div className="font-mono text-amber-400">{mean.toFixed(1)}</div>
                    </div>
                    <div className="p-2 bg-slate-800/50 rounded">
                        <div className="text-slate-500">Max</div>
                        <div className="font-mono text-red-400">{sortedData[sortedData.length - 1].value.toFixed(1)}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
