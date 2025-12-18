import { getDistrictSummary, getBrfOverviewList } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Wallet, Zap, LayoutList, Map as MapIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const summary = await getDistrictSummary();
  const brfList = await getBrfOverviewList();

  const totalBrfs = summary.reduce((acc, curr) => acc + Number(curr.brf_count), 0);
  const avgSolidarity = Math.round(
    summary.reduce((acc, curr) => acc + (curr.avg_solidarity || 0), 0) / summary.length
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">My Portfolio</h1>
        <p className="text-slate-400">
          Monitor performance across Hammarby Sjöstad, Hjorthagen, and Norra Djurgårdsstaden.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total BRFs", value: totalBrfs, sub: "Across 3 districts", icon: Building2, color: "text-sky-400" },
          { title: "Avg Soliditet", value: `${avgSolidarity}%`, sub: "Equity ratio", icon: Users, color: "text-emerald-400" },
          { title: "Avg Energy", value: `${Math.round(summary.reduce((acc, c) => acc + (c.avg_energy || 0), 0) / summary.length)} kWh/m²`, sub: "Performance", icon: Zap, color: "text-amber-400" },
          { title: "Avg Debt", value: `${Math.round(summary.reduce((acc, c) => acc + (c.avg_debt_sqm || 0), 0) / summary.length).toLocaleString()} kr/m²`, sub: "Per sqm", icon: Wallet, color: "text-rose-400" }
        ].map((stat, i) => (
          <Card key={i} className="glass-card border-none text-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-slate-500">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* District Breakdown */}
      <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
        <LayoutList className="w-5 h-5 text-sky-500" />
        District Performance
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {summary.map((district) => (
          <Card key={district.district} className="glass-card border-none text-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-sky-300">{district.district}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm border-b border-slate-800 pb-2">
                <span className="text-slate-500">BRFs</span>
                <span className="font-mono text-slate-300">{district.brf_count}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-slate-800 pb-2">
                <span className="text-slate-500">Soliditet</span>
                <span className="font-mono text-slate-300">{district.avg_solidarity}%</span>
              </div>
              <div className="flex justify-between text-sm border-b border-slate-800 pb-2">
                <span className="text-slate-500">Energy</span>
                <span className="font-mono text-slate-300">{district.avg_energy} <span className="text-xs text-slate-500">kWh/m²</span></span>
              </div>
              <div className="flex justify-between text-sm pt-1">
                <span className="text-slate-500">Debt</span>
                <span className="font-mono text-slate-300">{Number(district.avg_debt_sqm).toLocaleString()} <span className="text-xs text-slate-500">kr/m²</span></span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Map Component */}
      <div className="w-full glass rounded-xl overflow-hidden border border-slate-800 p-1">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-emerald-500" />
            Live 3D City View
          </h2>
          <div className="flex gap-2 text-xs">
            <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded">Energy Class</span>
            <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded">Height Extrusion</span>
          </div>
        </div>
        <DistrictMapWrapper brfs={brfList} />
      </div>
    </div>
  );
}

// Dynamic Import for Map
import dynamicMap from "next/dynamic";
const DistrictMapWrapper = dynamicMap(() => import("@/components/map/CityMap3D"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full bg-slate-900/50 rounded-lg flex items-center justify-center text-slate-500 border border-slate-800">
      Initializing 3D Engine...
    </div>
  ),
});
