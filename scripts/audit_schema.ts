import { Pool } from 'pg';

const pool = new Pool({
    connectionString: "postgresql://postgres.hhcpkquyinnkrfgghpue:aseP4ss!@aws-1-eu-north-1.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

async function auditSchema() {
    console.log('🔍 AUDITING ACTUAL DATABASE SCHEMA\n');

    // Check brf_governance columns
    console.log('1️⃣ BRF_GOVERNANCE TABLE:');
    const govColumns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'brf_governance'
        ORDER BY ordinal_position
    `);
    console.log(govColumns.rows);

    // Check brf_property columns
    console.log('\n2️⃣ BRF_PROPERTY TABLE:');
    const propColumns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'brf_property'
        ORDER BY ordinal_position
    `);
    console.log(propColumns.rows);

    // Check brf_operational_costs columns
    console.log('\n3️⃣ BRF_OPERATIONAL_COSTS TABLE:');
    const costsColumns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'brf_operational_costs'
        ORDER BY ordinal_position
    `);
    console.log(costsColumns.rows);

    // Check brf_loans columns
    console.log('\n4️⃣ BRF_LOANS TABLE:');
    const loansColumns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'brf_loans'
        ORDER BY ordinal_position
    `);
    console.log(loansColumns.rows);

    // Sample data to see actual values
    console.log('\n5️⃣ SAMPLE BRF_GOVERNANCE DATA:');
    const govSample = await pool.query(`SELECT * FROM brf_governance LIMIT 1`);
    console.log(govSample.rows[0]);

    await pool.end();
}

auditSchema().catch(console.error);
