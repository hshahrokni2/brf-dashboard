import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const results: any = {};

    // 1. Check brf_operational_costs schema
    const costSchema = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'brf_operational_costs'
      ORDER BY ordinal_position
    `);
    results.costSchema = costSchema.rows;

    // 2. Check total_area_sqm availability
    const areaCheck = await query(`
      SELECT 
        COUNT(*) as total_brfs,
        COUNT(p.total_area_sqm) as brfs_with_area,
        ROUND(AVG(p.total_area_sqm)::numeric, 2) as avg_area
      FROM brf_property p
    `);
    results.areaCheck = areaCheck.rows[0];

    // 3. Sample BRF cost structure
    const sample = await query(`
      SELECT 
        m.brf_name,
        p.total_area_sqm,
        oc.heating_cost,
        oc.electricity_cost,
        oc.water_cost,
        oc.cleaning_cost,
        oc.total_operational_costs
      FROM brf_metadata m
      JOIN brf_property p USING (zelda_id)
      LEFT JOIN brf_operational_costs oc USING (zelda_id)
      WHERE p.total_area_sqm > 0
      LIMIT 3
    `);
    results.sample = sample.rows;

    // 4. Check detailed costs with area context
    const detailSample = await query(`
      SELECT 
        d.zelda_id,
        d.category,
        d.amount_current,
        p.total_area_sqm,
        CASE 
          WHEN p.total_area_sqm > 0 THEN ROUND((d.amount_current / p.total_area_sqm)::numeric, 2)
          ELSE NULL
        END as cost_per_sqm
      FROM brf_operating_costs_detail d
      LEFT JOIN brf_property p USING (zelda_id)
      WHERE d.amount_current > 0
      LIMIT 10
    `);
    results.detailSample = detailSample.rows;

    // 5. Statistical Analysis Example (Heating Cost)
    const stats = await query(`
      WITH cost_data AS (
        SELECT 
          oc.heating_cost,
          p.total_area_sqm,
          CASE 
            WHEN p.total_area_sqm > 0 THEN oc.heating_cost / p.total_area_sqm
            ELSE NULL
          END as heating_per_sqm
        FROM brf_operational_costs oc
        JOIN brf_property p USING (zelda_id)
        WHERE oc.heating_cost > 0 AND p.total_area_sqm > 0
      )
      SELECT 
        COUNT(*) as sample_size,
        ROUND(AVG(heating_per_sqm)::numeric, 2) as mean,
        ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY heating_per_sqm)::numeric, 2) as median,
        ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY heating_per_sqm)::numeric, 2) as p25,
        ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY heating_per_sqm)::numeric, 2) as p75,
        ROUND(STDDEV(heating_per_sqm)::numeric, 2) as stddev,
        ROUND(MIN(heating_cost)::numeric, 2) as min_absolute,
        ROUND(MAX(heating_cost)::numeric, 2) as max_absolute,
        ROUND(AVG(total_area_sqm)::numeric, 2) as avg_sqm
      FROM cost_data
    `);
    results.stats = stats.rows[0];

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
