import {
    getEnergyClassDistribution,
    getVentilationDistribution,
    getEnergyLeaderboard,
    getAggregatedSavingsPotential,
    getTopMeasuresByImpact
} from "@/lib/energy";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Wind, Lightbulb, TrendingDown, TrendingUp, Leaf, Building2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Energy class color mapping
const ENERGY_CLASS_COLORS: Record<string, string> = {
    'A': 'bg-green-500',
    'B': 'bg-green-400',
    'C': 'bg-lime-500',
    'D': 'bg-yellow-500',
    'E': 'bg-orange-500',
    'F': 'bg-red-500',
    'G': 'bg-red-600',
};

const ENERGY_CLASS_TEXT: Record<string, string> = {
    'A': 'text-green-500',
    'B': 'text-green-400',
    'C': 'text-lime-500',
    'D': 'text-yellow-500',
    'E': 'text-orange-500',
    'F': 'text-red-500',
    'G': 'text-red-600',
};

export default async function EnergyPage() {
    const [classDistribution, ventilationData, bestPerformers, worstPerformers, savingsPotential, topMeasures] = await Promise.all([
        getEnergyClassDistribution(),
        getVentilationDistribution(),
        getEnergyLeaderboard('ASC', 10),
        getEnergyLeaderboard('DESC', 10),
        getAggregatedSavingsPotential(),
        getTopMeasuresByImpact(5)
    ]);

    const totalBrfs = classDistribution.reduce((sum, c) => sum + c.count, 0);

    return (
        <div className="space-y-6 p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent flex items-center gap-3">
                    <Zap className="w-8 h-8 text-green-400" />
                    Energy Intelligence
                </h1>
                <p className="text-slate-400 mt-2">
                    Official Boverket energy declarations for {totalBrfs} BRFs • All 32 data columns available
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            BRFs with Declarations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-400">{totalBrfs}</div>
                        <div className="text-xs text-slate-500">100% coverage</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            BRFs with Measures
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-400">{savingsPotential?.brfs_with_measures || 0}</div>
                        <div className="text-xs text-slate-500">{savingsPotential?.total_measures || 0} recommendations</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-sky-500/10 to-sky-600/5 border-sky-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <TrendingDown className="w-4 h-4" />
                            Savings Potential
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-sky-400">
                            {savingsPotential?.total_savings_kwh
                                ? `${Math.round(savingsPotential.total_savings_kwh / 1000)}k`
                                : '0'}
                        </div>
                        <div className="text-xs text-slate-500">kWh/year</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <Wind className="w-4 h-4" />
                            With FTX Ventilation
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-400">
                            {ventilationData.find(v => v.ventilation_type === 'FTX')?.count || 0}
                        </div>
                        <div className="text-xs text-slate-500">heat recovery</div>
                    </CardContent>
                </Card>
            </div>

            {/* Energy Class Distribution + Ventilation */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Energy Class Distribution */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Leaf className="w-5 h-5 text-green-400" />
                            Energy Class Distribution
                        </CardTitle>
                        <CardDescription>A (best) to G (worst)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {classDistribution.map(item => {
                                const percentage = (item.count / totalBrfs) * 100;
                                return (
                                    <div key={item.energy_class} className="flex items-center gap-3">
                                        <Badge className={`${ENERGY_CLASS_COLORS[item.energy_class]} text-white w-8 justify-center`}>
                                            {item.energy_class}
                                        </Badge>
                                        <div className="flex-1">
                                            <div className="h-6 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${percentage}%`,
                                                        backgroundColor: item.color
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-sm text-slate-400 w-16 text-right">
                                            {item.count} ({percentage.toFixed(0)}%)
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Ventilation Types */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wind className="w-5 h-5 text-sky-400" />
                            Ventilation Types
                        </CardTitle>
                        <CardDescription>{ventilationData.reduce((sum, v) => sum + v.count, 0)} BRFs with ventilation data</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {ventilationData.map((item, index) => {
                                const maxCount = ventilationData[0]?.count || 1;
                                const percentage = (item.count / maxCount) * 100;
                                const colors = ['bg-sky-500', 'bg-cyan-500', 'bg-teal-500', 'bg-emerald-500'];
                                return (
                                    <div key={item.ventilation_type} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-300 truncate pr-2">{item.ventilation_type}</span>
                                            <span className="text-slate-400 font-mono">{item.count}</span>
                                        </div>
                                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${colors[index % colors.length]} rounded-full transition-all duration-500`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Measures */}
            {topMeasures && topMeasures.length > 0 && (
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-yellow-400" />
                            Top Recommended Measures by Savings Impact
                        </CardTitle>
                        <CardDescription>Aggregated across all BRFs with recommendations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topMeasures.map((measure: any, index: number) => {
                                const investmentLevel = measure.avg_cost_factor < 0.5 ? 'Låg' : measure.avg_cost_factor < 1.0 ? 'Medel' : 'Hög';
                                const investmentColor = measure.avg_cost_factor < 0.5 ? 'bg-green-500/20 text-green-400' : measure.avg_cost_factor < 1.0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400';
                                return (
                                    <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-200">{measure.measure_name}</div>
                                            <div className="text-xs text-slate-500">{measure.brf_count} BRFs</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge className={investmentColor}>{investmentLevel} investering</Badge>
                                            <div className="text-right">
                                                <div className="font-mono text-emerald-400">{Math.round(measure.total_savings_kwh).toLocaleString()}</div>
                                                <div className="text-xs text-slate-500">kWh/år</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 text-center">
                            <Link href="/measures" className="text-sm text-sky-400 hover:text-sky-300 transition-colors">
                                View all measures →
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Best and Worst Performers */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Best Performers */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-green-400" />
                            Best Performers
                        </CardTitle>
                        <CardDescription>Lowest energy consumption (kWh/m²)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {bestPerformers.map((brf: any, index: number) => (
                                <Link
                                    key={brf.zelda_id}
                                    href={`/brf/${brf.zelda_id}`}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-500 w-5 text-sm">{index + 1}.</span>
                                        <Badge className={`${ENERGY_CLASS_COLORS[brf.energy_class]} text-white`}>
                                            {brf.energy_class}
                                        </Badge>
                                        <span className="text-slate-200 truncate max-w-[150px]">{brf.brf_name}</span>
                                    </div>
                                    <span className="font-mono text-green-400">{brf.energy_kwh_per_sqm}</span>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Worst Performers (with improvement potential) */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-red-400" />
                            Improvement Potential
                        </CardTitle>
                        <CardDescription>Highest energy consumption (kWh/m²)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {worstPerformers.map((brf: any, index: number) => (
                                <Link
                                    key={brf.zelda_id}
                                    href={`/brf/${brf.zelda_id}`}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-500 w-5 text-sm">{index + 1}.</span>
                                        <Badge className={`${ENERGY_CLASS_COLORS[brf.energy_class]} text-white`}>
                                            {brf.energy_class}
                                        </Badge>
                                        <span className="text-slate-200 truncate max-w-[150px]">{brf.brf_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {brf.measure_count > 0 && (
                                            <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">
                                                {brf.measure_count} åtgärder
                                            </Badge>
                                        )}
                                        <span className="font-mono text-red-400">{brf.energy_kwh_per_sqm}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
