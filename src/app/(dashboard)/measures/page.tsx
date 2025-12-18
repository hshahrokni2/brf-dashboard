import {
    getRecommendedMeasures,
    getAggregatedSavingsPotential,
    getTopMeasuresByImpact
} from "@/lib/energy";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingDown, Building2, BatteryCharging, Flame, Wind, Droplets, Sun } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Measure type categories with icons
const MEASURE_CATEGORIES: Record<string, { icon: any; label: string; color: string }> = {
    'AtgForslagIsolTak': { icon: Building2, label: 'Tak', color: 'text-orange-400' },
    'AtgForslagIsolVagg': { icon: Building2, label: 'Väggar', color: 'text-orange-400' },
    'AtgForslagByteFonster': { icon: Building2, label: 'Fönster', color: 'text-blue-400' },
    'AtgForslagJustVarme': { icon: Flame, label: 'Värme', color: 'text-red-400' },
    'AtgForslagStyrVarme': { icon: Flame, label: 'Värmestyrning', color: 'text-red-400' },
    'AtgForslagNyVentil': { icon: Wind, label: 'Ventilation', color: 'text-cyan-400' },
    'AtgForslagAterVent': { icon: Wind, label: 'FTX', color: 'text-cyan-400' },
    'AtgForslagEffektivBelys': { icon: Lightbulb, label: 'Belysning', color: 'text-yellow-400' },
    'AtgForslagInstSolceller': { icon: Sun, label: 'Solceller', color: 'text-amber-400' },
    'AtgForslagSparaVatten': { icon: Droplets, label: 'Vatten', color: 'text-blue-400' },
};

function getInvestmentBadge(costFactor: number | null) {
    if (costFactor === null) return { label: 'Okänd', class: 'bg-slate-500/20 text-slate-400' };
    if (costFactor < 0.5) return { label: '🟢 Låg investering', class: 'bg-green-500/20 text-green-400' };
    if (costFactor < 1.0) return { label: '🟡 Medel investering', class: 'bg-yellow-500/20 text-yellow-400' };
    return { label: '🔴 Hög investering', class: 'bg-red-500/20 text-red-400' };
}

export default async function MeasuresPage() {
    const [allMeasures, savingsPotential, topMeasures] = await Promise.all([
        getRecommendedMeasures(),
        getAggregatedSavingsPotential(),
        getTopMeasuresByImpact(15)
    ]);

    // Group measures by investment level
    const lowInvestment = allMeasures.filter(m => m.estimated_cost_factor !== null && m.estimated_cost_factor < 0.5);
    const mediumInvestment = allMeasures.filter(m => m.estimated_cost_factor !== null && m.estimated_cost_factor >= 0.5 && m.estimated_cost_factor < 1.0);
    const highInvestment = allMeasures.filter(m => m.estimated_cost_factor !== null && m.estimated_cost_factor >= 1.0);

    return (
        <div className="space-y-6 p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent flex items-center gap-3">
                    <Lightbulb className="w-8 h-8 text-yellow-400" />
                    Rekommenderade Åtgärder
                </h1>
                <p className="text-slate-400 mt-2">
                    Energieffektiviseringsförslag från officiella energideklarationer
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            BRFs med åtgärder
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-yellow-400">{savingsPotential?.brfs_with_measures || 0}</div>
                        <div className="text-xs text-slate-500">av 113 totalt</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <TrendingDown className="w-4 h-4" />
                            Total besparing
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-400">
                            {savingsPotential?.total_savings_kwh
                                ? `${Math.round(savingsPotential.total_savings_kwh).toLocaleString()}`
                                : '0'}
                        </div>
                        <div className="text-xs text-slate-500">kWh/år</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-sky-500/10 to-sky-600/5 border-sky-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Antal åtgärder
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-sky-400">{savingsPotential?.total_measures || 0}</div>
                        <div className="text-xs text-slate-500">rekommendationer</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <BatteryCharging className="w-4 h-4" />
                            Åtgärdstyper
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-400">{savingsPotential?.unique_measure_types || 0}</div>
                        <div className="text-xs text-slate-500">unika typer</div>
                    </CardContent>
                </Card>
            </div>

            {/* Investment Level Summary */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle>Åtgärder per investeringsnivå</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
                            <div className="text-3xl font-bold text-green-400">{lowInvestment.length}</div>
                            <div className="text-sm text-slate-400 mt-1">🟢 Låg investering</div>
                            <div className="text-xs text-slate-500">Snabb återbetalningstid</div>
                        </div>
                        <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20 text-center">
                            <div className="text-3xl font-bold text-yellow-400">{mediumInvestment.length}</div>
                            <div className="text-sm text-slate-400 mt-1">🟡 Medel investering</div>
                            <div className="text-xs text-slate-500">3-7 års återbetalningstid</div>
                        </div>
                        <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20 text-center">
                            <div className="text-3xl font-bold text-red-400">{highInvestment.length}</div>
                            <div className="text-sm text-slate-400 mt-1">🔴 Hög investering</div>
                            <div className="text-xs text-slate-500">Långsiktig investering</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Top Measures by Impact */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-emerald-400" />
                        Åtgärder sorterade efter besparingspotential
                    </CardTitle>
                    <CardDescription>Total besparing i kWh/år när alla BRFs genomför åtgärden</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {topMeasures.map((measure: any, index: number) => {
                            const investment = getInvestmentBadge(measure.avg_cost_factor);
                            return (
                                <div key={index} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="text-2xl font-bold text-slate-500 w-8">{index + 1}</div>
                                        <div>
                                            <div className="font-medium text-slate-200">{measure.measure_name}</div>
                                            <div className="text-sm text-slate-500">{measure.brf_count} BRFs med denna rekommendation</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge className={investment.class}>{investment.label}</Badge>
                                        <div className="text-right min-w-[100px]">
                                            <div className="font-mono text-xl text-emerald-400">{Math.round(measure.total_savings_kwh).toLocaleString()}</div>
                                            <div className="text-xs text-slate-500">kWh/år totalt</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* All Measures by BRF */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle>Alla rekommendationer per BRF</CardTitle>
                    <CardDescription>{allMeasures.length} totala rekommendationer</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-800 text-slate-400 uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="p-3 text-left">BRF</th>
                                    <th className="p-3 text-left">Åtgärd</th>
                                    <th className="p-3 text-right">Besparing</th>
                                    <th className="p-3 text-center">Investering</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {allMeasures.slice(0, 50).map((measure, index) => {
                                    const investment = getInvestmentBadge(measure.estimated_cost_factor);
                                    return (
                                        <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="p-3">
                                                <Link href={`/brf/${measure.zelda_id}`} className="text-sky-400 hover:text-sky-300">
                                                    {measure.brf_name}
                                                </Link>
                                            </td>
                                            <td className="p-3 text-slate-300">{measure.measure_name}</td>
                                            <td className="p-3 text-right font-mono text-emerald-400">
                                                {measure.estimated_energy_reduction_kwh?.toLocaleString() || '-'}
                                            </td>
                                            <td className="p-3 text-center">
                                                <Badge className={investment.class}>{investment.label}</Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {allMeasures.length > 50 && (
                            <div className="text-center text-slate-500 text-sm mt-4">
                                Visar 50 av {allMeasures.length} rekommendationer
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
