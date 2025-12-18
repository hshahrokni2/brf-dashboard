import { Pool } from 'pg';

const pool = new Pool({
    connectionString: "postgresql://postgres.hhcpkquyinnkrfgghpue:aseP4ss!@aws-1-eu-north-1.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

async function checkAllColumns() {
    console.log('🔍 CHECKING ALL TABLE COLUMNS\n');

    const tables = [
        'brf_metadata',
        'brf_property',
        'brf_governance',
        'brf_income_statement',
        'brf_balance_sheet',
        'brf_metrics',
        'brf_operational_costs',
        'brf_loans',
        'brf_board_members',
        'brf_multi_year'
    ];

    for (const table of tables) {
        console.log(`\n📋 ${table.toUpperCase()}:`);
        const result = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = $1 
            ORDER BY ordinal_position
        `, [table]);
        console.log(result.rows.map(r => r.column_name).join(', '));
    }

    await pool.end();
}

checkAllColumns().catch(console.error);
