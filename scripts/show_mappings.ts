import { Pool } from 'pg';

const pool = new Pool({
    connectionString: "postgresql://postgres.hhcpkquyinnkrfgghpue:aseP4ss!@aws-1-eu-north-1.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

async function showMappings() {
    try {
        console.log('📋 CATEGORY NORMALIZATION MAPPING TABLE\n');
        console.log('='.repeat(100));

        // Get groupings
        const groups = await pool.query(`
      SELECT 
        normalized_category,
        category_group,
        COUNT(*) as variant_count,
        STRING_AGG(original_category, ', ' ORDER BY original_category) as variants
      FROM category_normalization
      GROUP BY normalized_category, category_group
      ORDER BY variant_count DESC, normalized_category
    `);

        groups.rows.forEach(row => {
            console.log(`\n🏷️  ${row.normalized_category} (${row.category_group})`);
            console.log(`   Variants: ${row.variant_count}`);
            console.log(`   Examples: ${row.variants.substring(0, 200)}${row.variants.length > 200 ? '...' : ''}`);
        });

        console.log('\n' + '='.repeat(100));
        console.log(`\n✅ Total: ${groups.rows.length} normalized categories mapping ${await pool.query('SELECT COUNT(*) FROM category_normalization').then(r => r.rows[0].count)} variants\n`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

showMappings();
