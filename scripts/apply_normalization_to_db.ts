import { Pool } from 'pg';
import * as fs from 'fs';

const pool = new Pool({
    connectionString: "postgresql://postgres.hhcpkquyinnkrfgghpue:aseP4ss!@aws-1-eu-north-1.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

async function createNormalizationTable() {
    try {
        console.log('🔧 Creating category normalization table in Supabase...\n');

        // Read the generated SQL
        const sql = fs.readFileSync('category_analysis.txt', 'utf8');
        const sqlStatements = sql.split('\n').filter(line =>
            line.trim().startsWith('CREATE TABLE') ||
            line.trim().startsWith('CREATE INDEX') ||
            line.trim().startsWith('INSERT INTO')
        ).join('\n');

        // Extract just the SQL portion
        const createTableSQL = `
CREATE TABLE IF NOT EXISTS category_normalization (
  id SERIAL PRIMARY KEY,
  original_category VARCHAR(255) UNIQUE NOT NULL,
  normalized_category VARCHAR(100) NOT NULL,
  category_group VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_original_cat ON category_normalization(original_category);
CREATE INDEX IF NOT EXISTS idx_normalized_cat ON category_normalization(normalized_category);
    `;

        console.log('Creating table...');
        await pool.query(createTableSQL);
        console.log('✅ Table created successfully\n');

        // Now insert the mappings (extract from file)
        const insertMatch = sql.match(/INSERT INTO category_normalization[\s\S]+?;/);
        if (insertMatch) {
            console.log('Inserting normalization mappings...');
            await pool.query(insertMatch[0]);
            console.log('✅ Mappings inserted successfully\n');

            // Verify
            const count = await pool.query('SELECT COUNT(*) FROM category_normalization');
            console.log(`📊 Total mappings: ${count.rows[0].count}`);

            const groups = await pool.query(`
        SELECT normalized_category, COUNT(*) as variant_count
        FROM category_normalization
        GROUP BY normalized_category
        ORDER BY variant_count DESC
      `);

            console.log('\nNormalized groups:');
            groups.rows.forEach(row => {
                console.log(`  ${row.normalized_category}: ${row.variant_count} variants`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

createNormalizationTable();
