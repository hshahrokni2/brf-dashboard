import { query } from './db';

export interface BrfBenchmarkData {
    zelda_id: string;
    brf_name: string;
    value: number;
}

// Get all BRFs' values for a specific category with flexible matching
export async function getBenchmarkData(
    normalizedCategory: string,
    district?: string | null
): Promise<BrfBenchmarkData[]> {
    // Map normalized categories to ILIKE patterns for flexible matching
    const categoryPatterns: Record<string, string[]> = {
        'Internet & Communications': ['%internet%', '%bredband%', '%tele%', '%fiber%', '%tv%', '%kommunikation%'],
        'Waste Management': ['%sopor%', '%avfall%', '%waste%', '%renhållning%', '%återvinning%'],
        'Cleaning': ['%städ%', '%clean%', '%trapp%'],
        'Electricity': ['%el%', '%elektr%', '%electricity%'],
        'Heating': ['%värme%', '%uppvärmning%', '%heat%', '%fjärrvärme%'],
        'Water & Sewage': ['%vatten%', '%water%', '%avlopp%'],
        'Property Maintenance': ['%fastighet%skötsel%', '%fastighetsskötsel%', '%property%maint%'],
        'Repairs & Maintenance': ['%reparation%', '%underhåll%', '%repair%', '%maintain%'],
        'Insurance': ['%försäkr%', '%insurance%'],
        'Property Tax': ['%skatt%', '%tax%', '%fastighetsskatt%'],
        'Elevator': ['%hiss%', '%elevator%'],
        'Snow Removal': ['%snö%', '%snow%'],
        'Landscaping & Grounds': ['%trädgård%', '%mark%', '%gård%', '%landscape%', '%gårds%'],
        'Land Lease': ['%tomträtt%', '%arrende%', '%land%lease%'],
    };

    const patterns = categoryPatterns[normalizedCategory] || [`%${normalizedCategory.toLowerCase()}%`];
    const patternConditions = patterns.map((_, i) => `LOWER(d.category) LIKE $${i + 1}`).join(' OR ');

    const sql = `
        SELECT 
            d.zelda_id,
            m.brf_name,
            SUM(d.amount_current) / NULLIF(p.total_area_sqm, 0) as value
        FROM brf_operating_costs_detail d
        JOIN brf_property p USING (zelda_id)
        JOIN brf_metadata m USING (zelda_id)
        WHERE (${patternConditions})
          AND d.amount_current > 0
          AND p.total_area_sqm > 0
        GROUP BY d.zelda_id, m.brf_name, p.total_area_sqm
        HAVING SUM(d.amount_current) / NULLIF(p.total_area_sqm, 0) > 0
        ORDER BY value
    `;

    const result = await query(sql, patterns);
    return result.rows.map(row => ({
        zelda_id: row.zelda_id,
        brf_name: row.brf_name,
        value: parseFloat(row.value)
    }));
}

// Get list of all BRFs for selector
export async function getAllBrfsForSelector() {
    const sql = `
        SELECT zelda_id, brf_name
        FROM brf_metadata m
        ORDER BY brf_name
    `;

    const result = await query(sql);
    return result.rows;
}
