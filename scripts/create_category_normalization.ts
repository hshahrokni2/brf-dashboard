import { Pool } from 'pg';

const pool = new Pool({
    connectionString: "postgresql://postgres.hhcpkquyinnkrfgghpue:aseP4ss!@aws-1-eu-north-1.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

async function analyzeCategories() {
    try {
        console.log('📊 Analyzing all cost categories for normalization...\n');

        // Get all unique categories with frequency
        const result = await pool.query(`
      SELECT 
        category,
        COUNT(*) as frequency,
        COUNT(DISTINCT zelda_id) as num_brfs
      FROM brf_operating_costs_detail
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY COUNT(DISTINCT zelda_id) DESC, category
    `);

        console.log(`Found ${result.rows.length} unique categories\n`);
        console.log('Top categories by BRF coverage:\n');

        // Group similar categories
        const categoryGroups = new Map();

        result.rows.forEach(row => {
            const cat = row.category.toLowerCase();

            // Determine normalized category
            let normalized = null;

            if (cat.includes('bredband') || cat.includes('internet') || cat.includes('kabel') || cat.includes('tv') || cat.includes('telefon')) {
                normalized = 'Internet & Communications';
            } else if (cat.includes('el ') || cat.includes('elektr') || cat === 'el') {
                normalized = 'Electricity';
            } else if (cat.includes('värme') || cat.includes('fjarrvarme') || cat.includes('fjärrvärme')) {
                normalized = 'Heating';
            } else if (cat.includes('vatten') || cat.includes('va-avgift')) {
                normalized = 'Water & Sewage';
            } else if (cat.includes('städ') || cat.includes('renhåll')) {
                normalized = 'Cleaning';
            } else if (cat.includes('drift') || cat.includes('fastighetsskötsel')) {
                normalized = 'Property Maintenance';
            } else if (cat.includes('reparation') || cat.includes('underhåll')) {
                normalized = 'Repairs & Maintenance';
            } else if (cat.includes('försäkring')) {
                normalized = 'Insurance';
            } else if (cat.includes('tomträtt') || cat.includes('arrende')) {
                normalized = 'Land Lease';
            } else if (cat.includes('hiss')) {
                normalized = 'Elevator';
            } else if (cat.includes('sophämt') || cat.includes('avfall')) {
                normalized = 'Waste Management';
            } else if (cat.includes('snöröj') || cat.includes('halkbekämp')) {
                normalized = 'Snow Removal';
            } else if (cat.includes('trädgård') || cat.includes('grönytor')) {
                normalized = 'Landscaping';
            }

            if (normalized) {
                if (!categoryGroups.has(normalized)) {
                    categoryGroups.set(normalized, []);
                }
                categoryGroups.get(normalized).push({
                    original: row.category,
                    frequency: row.frequency,
                    num_brfs: row.num_brfs
                });
            } else {
                console.log(`⚠️  Uncategorized: "${row.category}" (${row.num_brfs} BRFs)`);
            }
        });

        console.log('\n' + '='.repeat(80));
        console.log('NORMALIZATION GROUPS:');
        console.log('='.repeat(80));

        for (const [normalized, originals] of categoryGroups.entries()) {
            const totalBRFs = new Set(originals.flatMap(o => o.num_brfs)).size;
            console.log(`\n📦 ${normalized} (${originals.length} variants, ${totalBRFs}+ BRFs)`);
            originals.slice(0, 10).forEach(o => {
                console.log(`   "${o.original}" (${o.num_brfs} BRFs)`);
            });
            if (originals.length > 10) {
                console.log(`   ... and ${originals.length - 10} more variants`);
            }
        }

        // Generate SQL for normalization table
        console.log('\n' + '='.repeat(80));
        console.log('SQL TO CREATE NORMALIZATION TABLE:');
        console.log('='.repeat(80));

        console.log(`
CREATE TABLE IF NOT EXISTS category_normalization (
  id SERIAL PRIMARY KEY,
  original_category VARCHAR(255) UNIQUE NOT NULL,
  normalized_category VARCHAR(100) NOT NULL,
  category_group VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_original_cat ON category_normalization(original_category);
CREATE INDEX idx_normalized_cat ON category_normalization(normalized_category);

INSERT INTO category_normalization (original_category, normalized_category, category_group) VALUES`);

        let first = true;
        for (const [normalized, originals] of categoryGroups.entries()) {
            const group = normalized.split(' ')[0].toLowerCase();
            for (const o of originals) {
                if (!first) console.log(',');
                console.log(`  ('${o.original.replace(/'/g, "''")}', '${normalized}', '${group}')`);
                first = false;
            }
        }
        console.log(';');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

analyzeCategories();
