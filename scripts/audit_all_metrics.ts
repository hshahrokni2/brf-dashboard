import { query } from './src/lib/db';

async function auditAllMetrics() {
    console.log("=== COMPREHENSIVE METRIC AUDIT ===\n");

    // 1. Get all columns from all BRF tables
    const tables = [
        'brf_metadata',
        'brf_property',
        'brf_metrics',
        'brf_operational_costs',
        'brf_operating_costs_detail',
        'brf_governance',
        'brf_events',
        'brf_loans',
        'brf_suppliers',
        'buildings',
        'multi_year'
    ];

    const allColumns: Record<string, string[]> = {};
    let totalColumns = 0;

    for (const table of tables) {
        const result = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [table]);

        allColumns[table] = result.rows.map(r => `${r.column_name} (${r.data_type})`);
        totalColumns += result.rows.length;

        console.log(`\n${table.toUpperCase()}: ${result.rows.length} columns`);
        console.log(result.rows.map(r => `  - ${r.column_name} (${r.data_type})`).join('\n'));
    }

    console.log(`\n\n=== TOTAL AVAILABLE METRICS ===`);
    console.log(`Total Columns Across All Tables: ${totalColumns}`);

    // 2. List currently exposed metrics in the dashboard
    console.log(`\n\n=== CURRENTLY EXPOSED IN DASHBOARD ===`);

    const exposed = [
        // BrfOverview
        'zelda_id', 'brf_name', 'property_designation', 'district', 'energy_class',
        'energy_performance_kwh_sqm', 'solidarity_percent', 'debt_per_sqm_total',
        'built_year', 'height_m', 'latitude', 'longitude', 'address',
        'primary_auditor_name', 'primary_auditor_firm', 'total_apartments',
        'heating_type', 'chairman', 'board_size', 'latest_event_description',
        'latest_event_date', 'top_suppliers', 'electricity_cost', 'heating_cost',
        'water_cost', 'site_leasehold_fee', 'elevator_cost', 'property_tax',
        'history', 'events', 'loans', 'detailed_costs',

        // ScatterExplorer / Analytics
        'debt_sqm', 'fee_sqm', 'total_costs_sqm', 'waste_cost', 'cleaning_cost',

        // Statistical (getCostDistribution supports)
        'waste_management_cost',
    ];

    console.log(`Exposed Metrics Count: ${exposed.length}`);
    console.log(exposed.map(m => `  - ${m}`).join('\n'));

    // 3. Calculate gap
    console.log(`\n\n=== METRIC GAP ANALYSIS ===`);
    console.log(`Total Available: ${totalColumns}`);
    console.log(`Currently Exposed: ${exposed.length}`);
    console.log(`Unexposed: ${totalColumns - exposed.length}`);
    console.log(`Coverage: ${((exposed.length / totalColumns) * 100).toFixed(1)}%`);

    // 4. Sample unexposed metrics (from detailed tables)
    console.log(`\n\n=== SAMPLE UNEXPOSED METRICS ===`);

    const detailCategories = await query(`
    SELECT DISTINCT category
    FROM brf_operating_costs_detail
    ORDER BY category
    LIMIT 20
  `);

    console.log(`\nCost Categories in brf_operating_costs_detail (${detailCategories.rows.length} unique):`);
    console.log(detailCategories.rows.map(r => `  - ${r.category}`).join('\n'));

    const eventTypes = await query(`
    SELECT DISTINCT event_type, COUNT(*) as count
    FROM brf_events
    GROUP BY event_type
    ORDER BY count DESC
  `);

    console.log(`\nEvent Types in brf_events (${eventTypes.rows.length} unique):`);
    console.log(eventTypes.rows.map(r => `  - ${r.event_type} (${r.count} events)`).join('\n'));

    process.exit(0);
}

auditAllMetrics();
