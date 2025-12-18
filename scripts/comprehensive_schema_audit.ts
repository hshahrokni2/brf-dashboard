import { Pool } from 'pg';

const pool = new Pool({
    connectionString: "postgresql://postgres.hhcpkquyinnkrfgghpue:aseP4ss!@aws-1-eu-north-1.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

async function auditAllSchemas() {
    try {
        console.log('🔍 COMPREHENSIVE DATABASE SCHEMA AUDIT\n');
        console.log('='.repeat(80));

        // Get all BRF-related tables
        const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE '%brf%' OR table_name IN ('buildings', 'multi_year')
      ORDER BY table_name
    `);

        const tables = tablesResult.rows.map(r => r.table_name);
        console.log(`\nFound ${tables.length} tables:\n${tables.join(', ')}\n`);
        console.log('='.repeat(80));

        // For each table, get full schema
        for (const tableName of tables) {
            console.log(`\n📋 TABLE: ${tableName}`);
            console.log('-'.repeat(80));

            const columnsResult = await pool.query(`
        SELECT 
          column_name, 
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName]);

            console.log(`Columns (${columnsResult.rows.length}):\n`);
            columnsResult.rows.forEach(col => {
                const nullable = col.is_nullable === 'YES' ? '?' : '';
                const maxLen = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
                console.log(`  ✓ ${col.column_name}${nullable}: ${col.data_type}${maxLen}`);
            });

            // Sample data for first 2 rows
            try {
                const sampleResult = await pool.query(`SELECT * FROM ${tableName} LIMIT 2`);
                if (sampleResult.rows.length > 0) {
                    console.log(`\nSample data (${sampleResult.rows.length} rows):`);
                    console.log(JSON.stringify(sampleResult.rows[0], null, 2).substring(0, 500) + '...');
                }
            } catch (e) {
                console.log('  (Could not fetch sample data)');
            }

            console.log('');
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ AUDIT COMPLETE');
        console.log('='.repeat(80));

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

auditAllSchemas();
