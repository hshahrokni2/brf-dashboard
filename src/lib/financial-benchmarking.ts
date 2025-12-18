import { query } from './db';

export interface FinancialBenchmarkData {
    zelda_id: string;
    brf_name: string;
    value: number;
}

// Get interest rate distribution (stored as percentage e.g. 3.5 for 3.5%)
export async function getInterestRateBenchmark(district?: string | null): Promise<FinancialBenchmarkData[]> {
    const sql = `
        SELECT 
            l.zelda_id,
            m.brf_name,
            AVG(l.interest_rate) as value
        FROM brf_loans l
        JOIN brf_metadata m USING (zelda_id)
        WHERE l.interest_rate IS NOT NULL AND l.interest_rate > 0
        GROUP BY l.zelda_id, m.brf_name
        ORDER BY value
    `;

    const result = await query(sql, []);
    return result.rows.map(row => ({
        zelda_id: row.zelda_id,
        brf_name: row.brf_name,
        value: parseFloat(row.value)
    }));
}

// Get debt per sqm distribution from brf_metrics (has data for all BRFs)
export async function getLoanPerSqmBenchmark(district?: string | null): Promise<FinancialBenchmarkData[]> {
    const sql = `
        SELECT 
            met.zelda_id,
            m.brf_name,
            met.debt_per_sqm_total as value
        FROM brf_metrics met
        JOIN brf_metadata m USING (zelda_id)
        WHERE met.debt_per_sqm_total IS NOT NULL AND met.debt_per_sqm_total > 0
        ORDER BY value
    `;

    const result = await query(sql, []);
    return result.rows.map(row => ({
        zelda_id: row.zelda_id,
        brf_name: row.brf_name,
        value: parseFloat(row.value)
    }));
}

// Get monthly avgift (fee per sqm) from brf_metrics
export async function getAvgiftBenchmark(district?: string | null): Promise<FinancialBenchmarkData[]> {
    const sql = `
        SELECT 
            met.zelda_id,
            m.brf_name,
            met.monthly_fee_per_sqm as value
        FROM brf_metrics met
        JOIN brf_metadata m USING (zelda_id)
        WHERE met.monthly_fee_per_sqm IS NOT NULL AND met.monthly_fee_per_sqm > 0
        ORDER BY value
    `;

    const result = await query(sql, []);
    return result.rows.map(row => ({
        zelda_id: row.zelda_id,
        brf_name: row.brf_name,
        value: parseFloat(row.value)
    }));
}
