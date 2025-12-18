"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, Sparkles, AlertCircle } from "lucide-react";

interface CategorySavings {
    category: string;
    yourCost: number;
    p25Cost: number;
    savingsPerSqm: number;
    totalSavings: number;
    percentile: number;
}

interface SavingsPotentialCardProps {
    totalSavingsPerYear: number;
    totalSavingsPerMonth: number;
    categorySavings: CategorySavings[];
    totalAreaSqm: number;
    categoriesAboveP25: number;
    totalCategories: number;
}

export function SavingsPotentialCard({
    totalSavingsPerYear,
    totalSavingsPerMonth,
    categorySavings,
    totalAreaSqm,
    categoriesAboveP25,
    totalCategories
}: SavingsPotentialCardProps) {

    if (categorySavings.length === 0) {
        return (
            <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-950/20 border-emerald-500/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-400">
                        <Sparkles className="w-5 h-5" />
                        Excellent Performance!
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-300">
                        Your BRF is already performing at or better than the top 25% across all cost categories.
                        Keep up the great work!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-gradient-to-br from-amber-900/20 to-orange-950/20 border-amber-500/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-400">
                    <TrendingDown className="w-5 h-5" />
                    Savings Potential
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Main Savings Number */}
                <div className="text-center p-6 bg-slate-900/50 rounded-lg border border-amber-500/20">
                    <div className="text-sm text-slate-400 mb-2">
                        Potential Annual Savings
                    </div>
                    <div className="text-5xl font-bold text-amber-400 mb-2">
                        {totalSavingsPerYear.toLocaleString('sv-SE', { maximumFractionDigits: 0 })} kr
                    </div>
                    <div className="text-lg text-slate-300">
                        {totalSavingsPerMonth.toLocaleString('sv-SE', { maximumFractionDigits: 0 })} kr/month
                    </div>
                    <div className="text-xs text-slate-500 mt-3">
                        If you matched the top 25% performers across all categories
                    </div>
                </div>

                {/* Performance Summary */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-slate-800/30 rounded-lg">
                        <div className="text-2xl font-bold text-amber-400">
                            {categoriesAboveP25}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            Categories to improve
                        </div>
                    </div>
                    <div className="text-center p-3 bg-slate-800/30 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-400">
                            {totalCategories - categoriesAboveP25}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            Already top 25%
                        </div>
                    </div>
                    <div className="text-center p-3 bg-slate-800/30 rounded-lg">
                        <div className="text-2xl font-bold text-sky-400">
                            {totalAreaSqm.toLocaleString('sv-SE', { maximumFractionDigits: 0 })} m²
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            Total area
                        </div>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm font-semibold text-slate-300">
                            Savings Breakdown by Category
                        </h3>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {categorySavings.map(cat => (
                            <div
                                key={cat.category}
                                className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-slate-200">
                                        {cat.category}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        Your cost: {cat.yourCost.toFixed(1)} kr/m² •
                                        Top 25%: {cat.p25Cost.toFixed(1)} kr/m² •
                                        Currently at {cat.percentile}th percentile
                                    </div>
                                </div>
                                <div className="text-right ml-4">
                                    <div className="text-sm font-bold text-amber-400">
                                        {cat.totalSavings.toLocaleString('sv-SE', { maximumFractionDigits: 0 })} kr/year
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {cat.savingsPerSqm.toFixed(2)} kr/m²
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="text-xs text-slate-500 p-3 bg-slate-900/30 rounded border border-slate-700">
                    <strong>Note:</strong> These savings are calculated by comparing your costs to the top 25% performing BRFs
                    in each category. Actual savings may vary based on building characteristics, service contracts, and other factors.
                </div>
            </CardContent>
        </Card>
    );
}
