import { query } from './db';
import { getBenchmarkData } from './benchmarking';

export interface CategorySavings {
    category: string;
    yourCost: number;
    p25Cost: number;
    savingsPerSqm: number;
    totalSavings: number;
    percentile: number;
}

export interface SavingsPotential {
    totalSavingsPerYear: number;
    totalSavingsPerMonth: number;
    categorySavings: CategorySavings[];
    totalAreaSqm: number;
    categoriesAboveP25: number;
    totalCategories: number;
}

// Calculate savings potential for a BRF if they matched 25th percentile across all categories
export async function calculateSavingsPotential(
    zeldaId: string,
    district?: string | null
): Promise<SavingsPotential> {
    // Get BRF's total area
    const areaResult = await query(`
        SELECT total_area_sqm
        FROM brf_property
        WHERE zelda_id = $1
    `, [zeldaId]);

    if (areaResult.rows.length === 0) {
        throw new Error('BRF not found');
    }

    const totalAreaSqm = parseFloat(areaResult.rows[0].total_area_sqm);

    // All normalized categories to check
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

    // Fetch ALL benchmark data in parallel (avoid sequential DB connections)
    const benchmarkPromises = categories.map(cat =>
        getBenchmarkData(cat, district).catch(() => [])
    );
    const allBenchmarkData = await Promise.all(benchmarkPromises);

    const categorySavings: CategorySavings[] = [];
    let totalSavingsPerSqm = 0;

    for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        const benchmarkData = allBenchmarkData[i];

        if (benchmarkData.length === 0) continue;

        // Find this BRF's cost
        const brfData = benchmarkData.find(d => d.zelda_id === zeldaId);
        if (!brfData) continue;

        // Calculate 25th percentile (top performers)
        const sortedData = [...benchmarkData].sort((a, b) => a.value - b.value);
        const p25Index = Math.floor(sortedData.length * 0.25);
        const p25Cost = sortedData[p25Index].value;

        // Calculate percentile of this BRF
        const brfIndex = sortedData.findIndex(d => d.zelda_id === zeldaId);
        const percentile = Math.round((brfIndex / sortedData.length) * 100);

        // Only count as savings if BRF is above 25th percentile
        const savingsPerSqm = brfData.value > p25Cost ? brfData.value - p25Cost : 0;
        const totalCategorySavings = savingsPerSqm * totalAreaSqm;

        if (savingsPerSqm > 0) {
            categorySavings.push({
                category,
                yourCost: brfData.value,
                p25Cost,
                savingsPerSqm,
                totalSavings: totalCategorySavings,
                percentile
            });

            totalSavingsPerSqm += savingsPerSqm;
        }
    }

    const totalSavingsPerYear = totalSavingsPerSqm * totalAreaSqm;
    const totalSavingsPerMonth = totalSavingsPerYear / 12;

    return {
        totalSavingsPerYear,
        totalSavingsPerMonth,
        categorySavings: categorySavings.sort((a, b) => b.totalSavings - a.totalSavings),
        totalAreaSqm,
        categoriesAboveP25: categorySavings.length,
        totalCategories: categories.length
    };
}
