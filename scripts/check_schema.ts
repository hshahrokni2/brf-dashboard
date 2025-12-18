import { Pool } from 'pg';

const connectionString = "postgresql://postgres.hhcpkquyinnkrfgghpue:aseP4ss!@aws-1-eu-north-1.pooler.supabase.com:5432/postgres";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function checkMultiYearSchema() {
    try {
        console.log('Checking multi_year table schema...\n');

        const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'multi_year' 
      ORDER BY ordinal_position;
    `);

        console.log('multi_year columns:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type})`);
        });

        // Check specifically for medlem-related columns
        console.log('\n\nSearching for medlem* columns:');
        const medlemResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'multi_year' AND column_name LIKE '%medlem%'
    `);

        console.log('Medlem columns found:', medlemResult.rows);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

checkMultiYearSchema();
