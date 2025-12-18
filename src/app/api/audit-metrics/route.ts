import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
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

        const allColumns: Record<string, any[]> = {};
        let totalColumns = 0;

        for (const table of tables) {
            const result = await query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);

            allColumns[table] = result.rows;
            totalColumns += result.rows.length;
        }

        // 2. Currently exposed metrics
        const exposed = [
            'zelda_id', 'brf_name', 'property_designation', 'district', 'energy_class',
            'energy_performance_kwh_sqm', 'solidarity_percent', 'debt_per_sqm_total',
            'built_year', 'height_m', 'latitude', 'longitude', 'address',
            'auditor', 'auditor_firm', 'total_apartments',
            'chairman', 'board_size', 'latest_event_description',
            'top_suppliers', 'electricity_cost', 'heating_cost',
            'water_cost', 'site_leasehold_fee', 'elevator_cost', 'property_tax',
            'history', 'events', 'loans', 'detailed_costs', 'debt_sqm', 'fee_sqm',
            'total_costs_sqm', 'waste_cost', 'cleaning_cost', 'waste_management_cost',
        ];

        // 3. Get cost categories
        const detailCategories = await query(`
      SELECT DISTINCT category
      FROM brf_operating_costs_detail
      ORDER BY category
    `);

        // 4. Get event types
        const eventTypes = await query(`
      SELECT DISTINCT event_type, COUNT(*) as count
      FROM brf_events
      GROUP BY event_type
      ORDER BY count DESC
    `);

        return NextResponse.json({
            totalColumns,
            exposedCount: exposed.length,
            unexposed: totalColumns - exposed.length,
            coverage: ((exposed.length / totalColumns) * 100).toFixed(1) + '%',
            tables: allColumns,
            detailCategories: detailCategories.rows,
            eventTypes: eventTypes.rows,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
