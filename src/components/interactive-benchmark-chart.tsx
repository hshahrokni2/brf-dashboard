"use client";

import { useRouter } from 'next/navigation';
import { Bar, BarChart, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BrfDataPoint {
    zelda_id: string;
    brf_name: string;
    value: number;
}

interface InteractiveBenchmarkChartProps {
    category: string;
    data: BrfDataPoint[];
    selectedBrfId?: string;
    unit?: string;
}

export function InteractiveBenchmarkChart({
    category,
    data,
    selectedBrfId,
    unit = 'kr/m²'
}: InteractiveBenchmarkChartProps) {
    const router = useRouter();

    // Sort by value for histogram effect
    const sortedData = [...data].sort((a, b) => a.value - b.value);

    // Find selected BRF position
    const selectedIndex = sortedData.findIndex(d => d.zelda_id === selectedBrfId);
    const selectedValue = selectedIndex >= 0 ? sortedData[selectedIndex].value : null;

    // Calculate percentile
    const percentile = selectedIndex >= 0 ? Math.round((selectedIndex / sortedData.length) * 100) : null;

    const handleBarClick = (entry: BrfDataPoint) => {
        // Navigate to homepage with BRF selected (which opens drill-down panel)
        router.push(`/?brf=${entry.zelda_id}`);
    };

    return (
        <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                    <span>{category}</span>
                    {selectedValue !== null && (
                        <div className="flex items-center gap-3 text-sm">
                            <span className="text-slate-400">Your BRF:</span>
                            <span className="font-mono text-cyan-400 font-bold">{selectedValue.toFixed(1)} {unit}</span>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${percentile! < 25 ? 'bg-emerald-500/20 text-emerald-400' :
                                percentile! < 50 ? 'bg-sky-500/20 text-sky-400' :
                                    percentile! < 75 ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-red-500/20 text-red-400'
                                }`}>
                                {percentile}th percentile
                            </span>
                        </div>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={sortedData} barGap={0} barCategoryGap={0}>
                        <XAxis
                            dataKey="value"
                            type="number"
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            tickFormatter={(val) => `${val.toFixed(0)}`}
                        />
                        <YAxis hide />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                            }}
                            labelFormatter={(value: number) => {
                                return <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{value.toFixed(1)}</span>;
                            }}
                            formatter={(value: number, name: string, props: any) => {
                                return [
                                    <span style={{ color: '#ffffff' }}>{props.payload.brf_name}</span>,
                                    <span style={{ color: '#94a3b8' }}>{value.toFixed(1)} {unit}</span>
                                ];
                            }}
                            cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                        />
                        <Bar
                            dataKey="value"
                            radius={[0, 0, 0, 0]}
                            onClick={(_data, index) => handleBarClick(sortedData[index])}
                            cursor="pointer"
                            minPointSize={5}
                            barSize={5}
                        >
                            {sortedData.map((entry, index) => {
                                const isSelected = entry.zelda_id === selectedBrfId;

                                return (
                                    <Cell
                                        key={entry.zelda_id}
                                        fill={isSelected
                                            ? '#22d3ee'  // Bright cyan-400 for selected
                                            : selectedBrfId
                                                ? '#e2e8f0'  // Very bright slate-200 when something selected
                                                : '#f8fafc'  // Almost white (slate-50) when nothing selected
                                        }
                                        fillOpacity={1}
                                        stroke={isSelected ? '#22d3ee' : '#94a3b8'}
                                        strokeWidth={isSelected ? 2 : 1}
                                        style={isSelected ? {
                                            filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 1))'
                                        } : {}}
                                    />
                                );
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 text-xs text-slate-500 text-center">
                    {sortedData.length} BRFs • Click any bar to view details
                </div>
            </CardContent>
        </Card>
    );
}
