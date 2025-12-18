import { getBenchmarkData, getAllBrfsForSelector } from "@/lib/benchmarking";
import { VerticalBarChart } from "@/components/vertical-bar-chart";
import { BrfSelector } from "@/components/brf-selector";
import { DistrictFilter } from "@/components/district-filter";
import { CategorySelector } from "@/components/category-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

interface TimelinePageProps {
    searchParams: { brf?: string; district?: string; category?: string };
}

export default async function TimelinePage({ searchParams }: TimelinePageProps) {
    const selectedBrfId = searchParams.brf;
    const selectedDistrict = searchParams.district;
    const selectedCategory = searchParams.category || 'Heating';

    // All normalized categories available
    const categories = [
        'Internet & Communications',
        'Waste Management',
        'Cleaning',
        'Electricity',
        'Heating',
        'Water & Sewage',
        'Property Maintenance',
        'Repairs & Maintenance',
        'Insurance',
        'Property Tax',
        'Elevator',
        'Snow Removal',
        'Landscaping & Grounds',
        'Land Lease',
    ];

    // Fetch benchmark data for selected category
    const benchmarkData = await getBenchmarkData(selectedCategory, selectedDistrict).catch(() => []);

    // Get all BRFs for selector
    const allBrfs = await getAllBrfsForSelector();
    const selectedBrf = allBrfs.find((b: { zelda_id: string }) => b.zelda_id === selectedBrfId);

    return (
        <div className="space-y-6 p-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                    All BRF Benchmarks
                </h1>
                <p className="text-slate-400 mt-2">
                    Compare all BRFs side-by-side across cost categories. Each vertical bar represents one BRF. Click any bar to see details.
                </p>
            </div>

            {/* Controls */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-sky-400" />
                        Filters & Selection
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <BrfSelector allBrfs={allBrfs} selectedBrfId={selectedBrfId} />
                        <DistrictFilter currentPath="/timeline" />
                    </div>

                    {/* Category Dropdown */}
                    <CategorySelector categories={categories} currentPath="/timeline" />

                    {selectedBrf && (
                        <div className="p-4 bg-sky-500/10 border border-sky-500/30 rounded-lg">
                            <div className="text-sm text-slate-400">Selected BRF:</div>
                            <div className="text-lg font-semibold text-sky-400">{selectedBrf.brf_name}</div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Vertical Bar Chart */}
            <VerticalBarChart
                data={benchmarkData}
                selectedBrfId={selectedBrfId}
                category={selectedCategory}
                unit="kr/m²"
            />
        </div>
    );
}
