import { getBenchmarkData, getAllBrfsForSelector } from "@/lib/benchmarking";
import { getInterestRateBenchmark, getLoanPerSqmBenchmark, getAvgiftBenchmark } from "@/lib/financial-benchmarking";
import { calculateSavingsPotential } from "@/lib/savings";
import { InteractiveBenchmarkChart } from "@/components/interactive-benchmark-chart";
import { BrfSelector } from "@/components/brf-selector";
import { SavingsPotentialCard } from "@/components/savings-potential-card";
import { DistrictFilter } from "@/components/district-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

interface BenchmarkingPageProps {
    searchParams: { brf?: string; district?: string };
}

export default async function BenchmarkingPage({ searchParams }: BenchmarkingPageProps) {
    const selectedBrfId = searchParams.brf;
    const selectedDistrict = searchParams.district;

    // Calculate savings potential if BRF is selected
    let savingsPotential = null;
    if (selectedBrfId) {
        try {
            savingsPotential = await calculateSavingsPotential(selectedBrfId, selectedDistrict);
        } catch (error) {
            console.error('Error calculating savings:', error);
        }
    }

    // Define all normalized categories to benchmark
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

    // Fetch benchmark data for all categories in parallel with district filter
    const benchmarkDataPromises = categories.map(category =>
        getBenchmarkData(category, selectedDistrict).catch(() => [])
    );
    const benchmarkData = await Promise.all(benchmarkDataPromises);

    // Fetch financial benchmarking data in parallel
    const [interestData, loanPerSqmData, avgiftData] = await Promise.all([
        getInterestRateBenchmark(selectedDistrict).catch(() => []),
        getLoanPerSqmBenchmark(selectedDistrict).catch(() => []),
        getAvgiftBenchmark(selectedDistrict).catch(() => []),
    ]);

    // Get all BRFs for selector
    const allBrfs = await getAllBrfsForSelector();
    const selectedBrf = allBrfs.find((b: { zelda_id: string }) => b.zelda_id === selectedBrfId);

    return (
        <div className="space-y-8 p-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                    Interactive Benchmarking
                </h1>
                <p className="text-slate-400 mt-2">
                    Select your BRF to see where you stand across all cost categories. Click any bar to explore that BRF.
                </p>
            </div>

            {/* BRF Selector */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-sky-400" />
                        Select Your BRF
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <BrfSelector allBrfs={allBrfs} selectedBrfId={selectedBrfId} />
                    <DistrictFilter />
                    {selectedBrf && (
                        <div className="mt-4 p-4 bg-sky-500/10 border border-sky-500/30 rounded-lg">
                            <div className="text-sm text-slate-400">Selected BRF:</div>
                            <div className="text-lg font-semibold text-sky-400">{selectedBrf.brf_name}</div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Savings Potential Card */}
            {savingsPotential && (
                <SavingsPotentialCard {...savingsPotential} />
            )}

            {/* Benchmark Charts Grid - All Categories */}
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-slate-200">
                    Cost Benchmarks Across All Categories
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                    {categories.map((category, index) => {
                        const data = benchmarkData[index];
                        if (data.length === 0) return null;

                        return (
                            <InteractiveBenchmarkChart
                                key={category}
                                category={category}
                                data={data}
                                selectedBrfId={selectedBrfId}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Financial Benchmarking */}
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-slate-200">
                    Financial Benchmarks
                </h2>
                <div className="grid gap-6 md:grid-cols-3">
                    {interestData.length > 0 && (
                        <InteractiveBenchmarkChart
                            category="Interest Rate"
                            data={interestData}
                            selectedBrfId={selectedBrfId}
                            unit="%"
                        />
                    )}
                    {loanPerSqmData.length > 0 && (
                        <InteractiveBenchmarkChart
                            category="Loan per Sqm"
                            data={loanPerSqmData}
                            selectedBrfId={selectedBrfId}
                            unit="kr/m²"
                        />
                    )}
                    {avgiftData.length > 0 && (
                        <InteractiveBenchmarkChart
                            category="Monthly Avgift"
                            data={avgiftData}
                            selectedBrfId={selectedBrfId}
                            unit="kr/m²"
                        />
                    )}
                </div>
            </div>

            {/* Summary Stats */}
            {selectedBrfId && (
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle>Your Performance Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            {categories.map((category, index) => {
                                const data = benchmarkData[index];
                                const brfData = data.find((d: { zelda_id: string }) => d.zelda_id === selectedBrfId);
                                if (!brfData) return null;

                                const sortedData = [...data].sort((a: { value: number }, b: { value: number }) => a.value - b.value);
                                const brfIndex = sortedData.findIndex((d: { zelda_id: string }) => d.zelda_id === selectedBrfId);
                                const percentile = Math.round((brfIndex / sortedData.length) * 100);

                                return (
                                    <div key={category} className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                                        <div className="text-xs text-slate-500 mb-2">{category}</div>
                                        <div className="text-xl font-mono text-slate-200">
                                            {brfData.value.toFixed(1)} kr/m²
                                        </div>
                                        <div className={`text-xs mt-2 font-semibold ${percentile < 25 ? 'text-emerald-400' :
                                            percentile < 50 ? 'text-sky-400' :
                                                percentile < 75 ? 'text-amber-400' :
                                                    'text-red-400'
                                            }`}>
                                            {percentile}th percentile
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
