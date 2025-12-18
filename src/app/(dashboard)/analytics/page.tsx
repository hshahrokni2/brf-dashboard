import { getLeaderboard, getCostBreakdown, getTopSuppliers, getAllBrfComparisonData } from "@/lib/analytics";
import { LeaderboardChart, CostChart } from "@/components/analytics-charts";
import { ScatterExplorer } from "@/components/scatter-explorer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ArrowDown, ArrowUp, DollarSign, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
    // Fetch all data in parallel
    const [
        topSoliditet,
        lowDebt,
        topEnergy,
        costs,
        suppliers,
        comparisonData
    ] = await Promise.all([
        getLeaderboard('solidarity_percent', 'DESC', 10),
        getLeaderboard('debt_per_sqm_total', 'ASC', 10),
        getLeaderboard('energy_performance_kwh_sqm', 'ASC', 10), // Lower is better for energy
        getCostBreakdown(),
        getTopSuppliers(10),
        getAllBrfComparisonData()
    ]);

    return (
        <div className="space-y-8 p-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                    Analytics Deep Dive
                </h1>
                <p className="text-slate-400 mt-2">Comprehensive operational and financial intelligence across all {topSoliditet.length}+ BRFs.</p>
            </div>

            {/* The Analyst - Scatter Explorer */}
            <ScatterExplorer data={comparisonData || []} />

            {/* Operating Costs */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="w-6 h-6 text-purple-400" />
                    <h2 className="text-xl font-bold text-slate-200">Operating Cost Breakdown</h2>
                </div>
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="pt-6">
                        <CostChart data={costs || []} />
                    </CardContent>
                </Card>
            </section>

            {/* Leaderboards */}
            <section className="grid md:grid-cols-2 gap-6">
                {/* Soliditet */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-emerald-400" />
                            Top Soliditet
                        </CardTitle>
                        <CardDescription>Highest equity ratios in the district</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LeaderboardChart data={topSoliditet || []} color="#34d399" />
                    </CardContent>
                </Card>

                {/* Low Debt */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ArrowDown className="w-5 h-5 text-sky-400" />
                            Lowest Debt / m²
                        </CardTitle>
                        <CardDescription>Most financially secure (low leverage)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LeaderboardChart data={lowDebt || []} color="#38bdf8" />
                    </CardContent>
                </Card>
            </section>

            {/* Supplier Intelligence */}
            <section>
                <div className="flex items-center gap-3 mb-4 mt-8">
                    <Users className="w-6 h-6 text-amber-400" />
                    <h2 className="text-xl font-bold text-slate-200">Top Suppliers by Volume</h2>
                </div>
                <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-800 text-slate-400 uppercase tracking-wider text-xs font-semibold">
                                <tr>
                                    <th className="p-4">Supplier</th>
                                    <th className="p-4">Category Intent</th>
                                    <th className="p-4 text-right">Total Spend</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {(suppliers || []).map((s) => (
                                    <tr key={s.supplier} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4 font-medium text-slate-200">{s.supplier}</td>
                                        <td className="p-4 text-slate-400">{s.category || 'Uncategorized'}</td>
                                        <td className="p-4 text-right font-mono text-emerald-400">
                                            {new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(s.total_spend)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </section>
        </div>
    );
}
