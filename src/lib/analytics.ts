import { query } from "./db";

// Types
export interface LeaderboardItem {
    zelda_id: string;
    brf_name: string;
    value: number;
    district: string;
}

export interface SupplierItem {
    supplier: string;
    total_spend: number;
    category: string;
}

export interface CostCategory {
    category: string;
    avg_sqm: number;
    total: number;
}

export interface CostDistribution {
    category: string;
    mean: number;
    median: number;
    p10: number;
    p25: number;
    p75: number;
    p90: number;
    stddev: number;
    min: number;
    max: number;
    sampleSize: number;
    // Optional: if brfId provided
    yourValue?: number;
    yourPercentile?: number;
    yourZScore?: number;
}

// 1. Leaderboards (Top 20 / Bottom 20)
export async function getLeaderboard(
    metric: 'debt_per_sqm_total' | 'solidarity_percent' | 'energy_performance_kwh_sqm',
    order: 'ASC' | 'DESC' = 'ASC',
    limit: number = 20
): Promise<LeaderboardItem[]> {
    // Map metric to readable name if needed, but for SQL column injection we must be careful.
    // Whitelist columns to prevent injection.
    const allowedMetrics = ['debt_per_sqm_total', 'solidarity_percent', 'energy_performance_kwh_sqm'];
    if (!allowedMetrics.includes(metric)) throw new Error("Invalid metric");

    // Map metric to correct table alias
    let columnRef = `met.${metric}`;
    if (metric === 'energy_performance_kwh_sqm') {
        columnRef = `b.${metric}`;
    }


    const sql = `
        WITH building_energy AS (
            SELECT zelda_id, AVG(energy_performance_kwh_sqm) as energy_performance_kwh_sqm
            FROM buildings
            GROUP BY zelda_id
        )
        SELECT 
            m.zelda_id,
            m.brf_name,
            ${columnRef} as value,
            CASE 
                WHEN p.postal_code LIKE '120%' THEN 'Hammarby Sjöstad'
                WHEN p.postal_code LIKE '1154%' OR p.postal_code LIKE '1153%' THEN 'Hjorthagen'
                WHEN p.postal_code LIKE '1152%' THEN 'Norra Djurgårdsstaden'
                ELSE 'Other'
            END as district
        FROM brf_metrics met
        JOIN brf_metadata m USING (zelda_id)
        JOIN brf_property p USING (zelda_id)
        LEFT JOIN building_energy b USING (zelda_id)
        WHERE ${columnRef} IS NOT NULL
        ORDER BY ${columnRef} ${order}
        LIMIT $1
    `;
    const result = await query(sql, [limit]);
    return result.rows;
}

// 2. Cost Analysis Breakdown
export async function getCostBreakdown(): Promise<CostCategory[]> {
    // Aggregating costs from 'brf_operating_costs_detail'
    // This table likely has row-level items like "Avfallshantering: 45000"
    // We want to group by standardized category or raw category?
    // User requested "Waste" (Avfallshantering), "Cleaning" (Städning/Lokalvård).
    // Let's aggregate top 10 categories by total volume.
    const sql = `
        SELECT 
            category,
            SUM(amount_current) as total,
            COUNT(DISTINCT zelda_id) as brf_count
        FROM brf_operating_costs_detail
        WHERE amount_current > 0
        GROUP BY 1
        ORDER BY total DESC
        LIMIT 10
    `;
    const result = await query(sql);

    // Calculate avg per participating BRF (rough proxy for per sqm without joining area yet, 
    // but better to join area for true /sqm. Let's start with Total Volume).
    return result.rows;
}

// 3. Supplier Intelligence
export async function getTopSuppliers(limit: number = 10): Promise<SupplierItem[]> {
    const sql = `
        SELECT 
            company_name as supplier,
            COUNT(*) as total_spend,
            MAX(service_type) as category
        FROM brf_suppliers
        WHERE company_name IS NOT NULL
        GROUP BY company_name
        ORDER BY total_spend DESC
        LIMIT $1
    `;
    const result = await query(sql, [limit]);
    return result.rows.map(row => ({
        supplier: row.supplier,
        total_spend: parseInt(row.total_spend),
        category: row.category
    }));
}

export async function getAllBrfComparisonData() {
    // Fetches a flat list of all BRFs with their key metrics for the Scatter Explorer
    const sql = `
        SELECT 
            m.zelda_id,
            m.brf_name,
            CASE 
                WHEN p.postal_code LIKE '120%' OR p.address ILIKE '%Hammarby%' OR p.address ILIKE '%Sickla%' THEN 'Hammarby Sjöstad'
                WHEN p.postal_code LIKE '1154%' OR p.postal_code LIKE '1153%' OR p.address ILIKE '%Hjorthagen%' THEN 'Hjorthagen'
                WHEN p.postal_code LIKE '1152%' OR p.address ILIKE '%Djurgårdsstaden%' THEN 'Norra Djurgårdsstaden'
                ELSE 'Other'
            END as district,
            p.built_year,
            met.solidarity_percent,
            met.debt_per_sqm_total as debt_sqm,
            COALESCE(met.monthly_fee_per_sqm, 0) as monthly_fee_per_sqm,
            COALESCE(oc.total_operational_costs, 0) as total_costs_sqm,
            COALESCE(oc.heating_cost, 0) as heating_cost,
            COALESCE(oc.water_cost, 0) as water_cost,
            COALESCE(oc.electricity_cost, 0) as electricity_cost,
            COALESCE(oc.waste_management_cost, 0) as waste_cost,
            COALESCE(oc.cleaning_cost, 0) as cleaning_cost,
            COALESCE(oc.elevator_cost, 0) as elevator_cost,
            COALESCE(oc.property_tax, 0) as property_tax,
            COALESCE(oc.site_leasehold_fee, 0) as site_leasehold_fee
        FROM brf_metadata m
        JOIN brf_property p USING (zelda_id)
        LEFT JOIN brf_metrics met USING (zelda_id)
        LEFT JOIN brf_operational_costs oc USING (zelda_id)
        WHERE met.debt_per_sqm_total IS NOT NULL
    `;
    const result = await query(sql);
    return result.rows;
}

/**
 * Get statistical distribution for a specific cost category
 * @param category - Cost category name (from brf_operating_costs_detail or brf_operational_costs)
 * @param brfId - Optional zelda_id to get "where you stand" metrics
 */
export async function getCostDistribution(
    category: string,
    brfId?: string
): Promise<CostDistribution> {
    // Query using normalized categories - join with normalization table
    const detailSql = `
        WITH cost_per_sqm AS (
            SELECT 
                d.zelda_id,
                d.amount_current / NULLIF(p.total_area_sqm, 0) as cost_value
            FROM brf_operating_costs_detail d
            JOIN brf_property p USING (zelda_id)
            LEFT JOIN category_normalization cn ON d.category = cn.original_category
            WHERE COALESCE(cn.normalized_category, d.category) = $1 
              AND d.amount_current > 0 
              AND p.total_area_sqm > 0
        )
        SELECT 
            COUNT(*) as sample_size,
            ROUND(AVG(cost_value)::numeric, 2) as mean,
            ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cost_value)::numeric, 2) as median,
            ROUND(PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY cost_value)::numeric, 2) as p10,
            ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY cost_value)::numeric, 2) as p25,
            ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY cost_value)::numeric, 2) as p75,
            ROUND(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY cost_value)::numeric, 2) as p90,
            ROUND(STDDEV(cost_value)::numeric, 2) as stddev,
            ROUND(MIN(cost_value)::numeric, 2) as min,
            ROUND(MAX(cost_value)::numeric, 2) as max
        FROM cost_per_sqm
    `;

    let result = await query(detailSql, [category]);
    let stats = result.rows[0];

    // If no data found in detail table, try standard operational_costs columns
    if (!stats || Number(stats.sample_size) === 0) {
        // Validate category against known operational_costs columns
        const allowedColumns = ['heating_cost', 'electricity_cost', 'water_cost', 'cleaning_cost', 'waste_management_cost', 'elevator_cost', 'property_tax', 'site_leasehold_fee'];
        if (!allowedColumns.includes(category)) {
            // Return empty distribution
            return {
                category,
                mean: 0,
                median: 0,
                p10: 0,
                p25: 0,
                p75: 0,
                p90: 0,
                stddev: 0,
                min: 0,
                max: 0,
                sampleSize: 0,
            };
        }

        const operationalSql = `
            WITH cost_per_sqm AS (
                SELECT 
                    oc.zelda_id,
                    oc.${category} / NULLIF(p.total_area_sqm, 0) as cost_value
                FROM brf_operational_costs oc
                JOIN brf_property p USING (zelda_id)
                WHERE oc.${category} > 0 AND p.total_area_sqm > 0
            )
            SELECT 
                COUNT(*) as sample_size,
                ROUND(AVG(cost_value)::numeric, 2) as mean,
                ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cost_value)::numeric, 2) as median,
                ROUND(PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY cost_value)::numeric, 2) as p10,
                ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY cost_value)::numeric, 2) as p25,
                ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY cost_value)::numeric, 2) as p75,
                ROUND(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY cost_value)::numeric, 2) as p90,
                ROUND(STDDEV(cost_value)::numeric, 2) as stddev,
                ROUND(MIN(cost_value)::numeric, 2) as min,
                ROUND(MAX(cost_value)::numeric, 2) as max
            FROM cost_per_sqm
        `;
        result = await query(operationalSql);
        stats = result.rows[0];
    }

    const distribution: CostDistribution = {
        category,
        mean: stats.mean || 0,
        median: stats.median || 0,
        p10: stats.p10 || 0,
        p25: stats.p25 || 0,
        p75: stats.p75 || 0,
        p90: stats.p90 || 0,
        stddev: stats.stddev || 0,
        min: stats.min || 0,
        max: stats.max || 0,
        sampleSize: Number(stats.sample_size) || 0,
    };

    // If brfId provided, calculate "where you stand"
    if (brfId) {
        // Try detail table first
        let brfSql = `
            WITH cost_per_sqm AS(
            SELECT 
                    d.zelda_id,
            d.amount_current / NULLIF(p.total_area_sqm, 0) as cost_value
                FROM brf_operating_costs_detail d
                JOIN brf_property p USING(zelda_id)
                WHERE d.category = $1 AND d.amount_current > 0 AND p.total_area_sqm > 0
        ),
        ranked AS(
            SELECT 
                    zelda_id,
            cost_value,
            PERCENT_RANK() OVER(ORDER BY cost_value) as percentile
                FROM cost_per_sqm
        )
    SELECT
    ROUND(cost_value:: numeric, 2) as your_value,
        ROUND((percentile * 100):: numeric, 2) as your_percentile
            FROM ranked
            WHERE zelda_id = $2
        `;
        let brfResult = await query(brfSql, [category, brfId]);

        // If not found in detail, try operational_costs
        if (brfResult.rows.length === 0) {
            const allowedColumns = ['heating_cost', 'electricity_cost', 'water_cost', 'cleaning_cost', 'waste_management_cost', 'elevator_cost', 'property_tax', 'site_leasehold_fee'];
            if (allowedColumns.includes(category)) {
                brfSql = `
                    WITH cost_per_sqm AS(
            SELECT 
                            oc.zelda_id,
            oc.${category} / NULLIF(p.total_area_sqm, 0) as cost_value
                        FROM brf_operational_costs oc
                        JOIN brf_property p USING(zelda_id)
                        WHERE oc.${category} > 0 AND p.total_area_sqm > 0
        ),
        ranked AS(
            SELECT 
                            zelda_id,
            cost_value,
            PERCENT_RANK() OVER(ORDER BY cost_value) as percentile
                        FROM cost_per_sqm
        )
    SELECT
    ROUND(cost_value:: numeric, 2) as your_value,
        ROUND((percentile * 100):: numeric, 2) as your_percentile
                    FROM ranked
                    WHERE zelda_id = $1
        `;
                brfResult = await query(brfSql, [brfId]);
            }
        }

        if (brfResult.rows.length > 0) {
            distribution.yourValue = brfResult.rows[0].your_value;
            distribution.yourPercentile = brfResult.rows[0].your_percentile;
            // Z-score calculation
            if (distribution.stddev > 0 && distribution.yourValue !== undefined) {
                distribution.yourZScore = Number(
                    ((distribution.yourValue - distribution.mean) / distribution.stddev).toFixed(2)
                );
            }
        }
    }

    return distribution;
}
