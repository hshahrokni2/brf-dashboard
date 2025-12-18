import { getTopSuppliers, getSuppliersByServiceType, getServiceTypes, getSupplierStats } from "@/lib/suppliers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, TrendingUp, Users, Package } from "lucide-react";

export const dynamic = "force-dynamic";

interface SuppliersPageProps {
    searchParams: { type?: string };
}

export default async function SuppliersPage({ searchParams }: SuppliersPageProps) {
    const selectedType = searchParams.type || "all";

    // Fetch data in parallel
    const [topSuppliers, serviceTypes, stats] = await Promise.all([
        getTopSuppliers(20),
        getServiceTypes(),
        getSupplierStats()
    ]);

    // Get suppliers for selected service type
    const filteredSuppliers = selectedType === "all"
        ? topSuppliers
        : await getSuppliersByServiceType(selectedType);

    // Group service types into categories (using exact names from brf_suppliers.service_type)
    const categoryMap: Record<string, string[]> = {
        "Fjärrvärme": ["fjärrvärme"],
        "Elnät": ["elnät"],
        "El": ["el", "elleverans"],
        "Bredband/Kabel/Telefon": ["telecom", "fiber", "bredband", "telefon", "antennplats"],
        "Försäkring": ["försäkring"],
        "Fastighetslån": ["fastighetslån"],
        "Revision": ["revision"],
        "Ekonomisk förvaltning": ["ekonomisk förvaltning"],
        "Fastighetsskötsel": ["fastighetsskötsel", "teknisk förvaltning"],
        "Hissservice": ["hissservice"],
        "Trädgårdsskötsel": ["trädgårdsskötsel"],
        "Sophämtning": ["sophämtning", "sopsug"],
        "Snöröjning": ["snöröjning"],
        "Städning": ["städning"],
        "Laddstolpar": ["laddstolpar"],
        "Access Systems": ["porttelefon", "passersystem", "lås", "inpassering", "nyckelsystem"],
        "IMD": ["mättjänst", "mätning", "imd", "elförbrukning"],
        "Solceller": ["solceller", "solar", "solpanel", "energieffektivisering"],
        "Drift": ["webbhotell", "hemsida", "drift"]
    };

    return (
        <div className="space-y-6 p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                    Supplier Intelligence
                </h1>
                <p className="text-slate-400 mt-2">
                    Market analysis of {stats.total_suppliers} suppliers serving {stats.brfs_with_suppliers} BRFs
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-sky-500/10 to-sky-600/5 border-sky-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Total Suppliers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-sky-400">{stats.total_suppliers}</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            BRFs Tracked
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-400">{stats.brfs_with_suppliers}</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Service Types
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-400">{stats.service_types}</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Total Records
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-400">{stats.total_records}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Service Type Tabs */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle>Filter by Service Type</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <a
                            href="/suppliers?type=all"
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedType === "all"
                                ? "bg-sky-500 text-white"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                }`}
                        >
                            All Suppliers
                        </a>
                        {Object.keys(categoryMap).map(category => (
                            <a
                                key={category}
                                href={`/suppliers?type=${categoryMap[category][0]}`}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${categoryMap[category].some(t => selectedType.toLowerCase().includes(t))
                                    ? "bg-emerald-500 text-white"
                                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                    }`}
                            >
                                {category}
                            </a>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Top Suppliers Table */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle>
                        {selectedType === "all" ? "Top Suppliers" : `${selectedType} Suppliers`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Rank</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Supplier</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Service Type</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-400">BRFs Served</th>
                                    {selectedType === "all" && (
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-400">Market Share</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSuppliers.map((supplier, index) => (
                                    <tr key={`${supplier.company_name}-${supplier.service_type}`} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                        <td className="py-3 px-4">
                                            <div className={`text-center w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? "bg-amber-500/20 text-amber-400" :
                                                index === 1 ? "bg-slate-400/20 text-slate-300" :
                                                    index === 2 ? "bg-orange-500/20 text-orange-400" :
                                                        "bg-slate-700/50 text-slate-400"
                                                }`}>
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-semibold text-slate-200">{supplier.company_name}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-1 bg-sky-500/10 text-sky-400 rounded text-xs">
                                                {supplier.service_type || "Unknown"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="font-mono text-emerald-400">{supplier.brf_count}</div>
                                        </td>
                                        {selectedType === "all" && supplier.market_share && (
                                            <td className="py-3 px-4 text-right">
                                                <div className="font-mono text-purple-400">{supplier.market_share.toFixed(1)}%</div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Service Type Distribution */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle>Service Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {serviceTypes.slice(0, 10).map(type => {
                            const maxCount = serviceTypes[0]?.count || 1;
                            const percentage = (type.count / maxCount) * 100;

                            return (
                                <div key={type.service_type} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-300">{type.service_type}</span>
                                        <span className="text-slate-400 font-mono">{type.count} records</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500"
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
    );
}
