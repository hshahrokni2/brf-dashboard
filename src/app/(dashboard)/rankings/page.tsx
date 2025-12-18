import { getBrfOverviewList } from "@/lib/data";
import { DataTable } from "@/components/rankings/data-table";
import { columns } from "@/components/rankings/columns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function RankingsPage() {
    const data = await getBrfOverviewList();

    // Logic for Top/Bottom 20%
    // Sort by Financial Health (solidarity_percent)
    const sortedByHealth = [...data]
        .filter(d => d.solidarity_percent !== null)
        .sort((a, b) => (b.solidarity_percent || 0) - (a.solidarity_percent || 0));

    const top20Count = Math.ceil(sortedByHealth.length * 0.2);
    const topPerformers = sortedByHealth.slice(0, top20Count);
    const bottomPerformers = sortedByHealth.slice(-top20Count).reverse(); // Worst first

    return (
        <div className="space-y-8 p-8">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">BRF Rankings</h1>
                <p className="text-slate-400 mt-2">
                    Compare key performance metrics across all associations.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                    <CardHeader>
                        <CardTitle className="text-emerald-400">Top Performers (Financial Health)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={columns} data={topPerformers.slice(0, 10)} />
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                    <CardHeader>
                        <CardTitle className="text-red-400">Needs Attention (Financial Health)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={columns} data={bottomPerformers.slice(0, 10)} />
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle>All Associations</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable columns={columns} data={data} />
                </CardContent>
            </Card>
        </div>
    );
}
