import { query } from './src/lib/db';

async function auditNormalization() {
    console.log("=== BENCHMARKING GAP ANALYSIS ===\n");

    // 1. Check if costs are already normalized per sqm in brf_operational_costs
    console.log("1. Checking brf_operational_costs schema:");
    const costSchema = await query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'brf_operational_costs'
    ORDER BY ordinal_position
  `);
    console.log(costSchema.rows);

    // 2. Check if we have total_area_sqm available for normalization
    console.log("\n2. Checking total_area_sqm availability:");
    const areaCheck = await query(`
    SELECT 
      COUNT(*) as total_brfs,
      COUNT(p.total_area_sqm) as brfs_with_area,
      ROUND(AVG(p.total_area_sqm), 2) as avg_area
    FROM brf_property p
  `);
    console.log(areaCheck.rows[0]);

    // 3. Sample a BRF to see current cost structure
    console.log("\n3. Sample BRF cost structure:");
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
    console.log(sample.rows);

    // 4. Check if detailed costs have area context
    console.log("\n4. Checking brf_operating_costs_detail:");
    const detailSample = await query(`
    SELECT 
      d.zelda_id,
      d.category,
      d.amount_current,
      p.total_area_sqm,
      CASE 
        WHEN p.total_area_sqm > 0 THEN ROUND(d.amount_current / p.total_area_sqm, 2)
        ELSE NULL
      END as cost_per_sqm
    FROM brf_operating_costs_detail d
    LEFT JOIN brf_property p USING (zelda_id)
    WHERE d.amount_current > 0
    LIMIT 10
  `);
    console.log(detailSample.rows);

    // 5. Statistical Context Check
    console.log("\n5. Statistical Analysis Example (Heating Cost):");
    const stats = await query(`
    WITH cost_data AS (
      SELECT 
        oc.heating_cost / NULLIF(p.total_area_sqm, 0) as heating_per_sqm
      FROM brf_operational_costs oc
      JOIN brf_property p USING (zelda_id)
      WHERE oc.heating_cost > 0 AND p.total_area_sqm > 0
    )
    SELECT 
      COUNT(*) as sample_size,
      ROUND(AVG(heating_per_sqm), 2) as mean,
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY heating_per_sqm), 2) as median,
      ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY heating_per_sqm), 2) as p25,
      ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY heating_per_sqm), 2) as p75,
      ROUND(STDDEV(heating_per_sqm), 2) as stddev
    FROM cost_data
  `);
    console.log(stats.rows[0]);

    console.log("\n=== KEY FINDINGS ===");
    console.log("✓ Check if all costs are ALREADY per sqm or ABSOLUTE totals");
    console.log("✓ Verify total_area_sqm coverage");
    console.log("✓ Determine if we need to JOIN property table for normalization");
    console.log("✓ Identify missing statistical context (percentiles, z-scores)");

    process.exit(0);
}

auditNormalization();
