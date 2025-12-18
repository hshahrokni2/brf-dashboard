import { Pool } from 'pg';

const pool = new Pool({
    connectionString: "postgresql://postgres.hhcpkquyinnkrfgghpue:aseP4ss!@aws-1-eu-north-1.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

async function fixNormalization() {
    try {
        console.log('🔧 FIXING INCORRECT ELECTRICITY MAPPINGS\n');

        // Drop and recreate with correct logic
        await pool.query('DROP TABLE IF EXISTS category_normalization CASCADE');

        const result = await pool.query(`
      SELECT category, COUNT(DISTINCT zelda_id) as num_brfs
      FROM brf_operating_costs_detail
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY COUNT(DISTINCT zelda_id) DESC
    `);

        const mappings: Array<{ original: string, normalized: string, group: string }> = [];

        result.rows.forEach(row => {
            const cat = row.category.toLowerCase();
            let normalized = null;
            let group = null;

            // FIXED: More precise matching
            if (cat.includes('bredband') || cat.includes('internet') || cat.includes('kabel') || cat.includes('tv') || cat.includes('telefon') || cat.includes('mattvätt')) {
                normalized = 'Internet & Communications';
                group = 'internet';
            } else if (cat === 'el' || cat === 'el garage' || cat.includes('elavgift') || cat.includes('fastighetsels')) {
                // FIXED: Only exact "el" or electricity-specific terms
                normalized = 'Electricity';
                group = 'electricity';
            } else if (cat.includes('värme') || cat.includes('fjarrvarme') || cat.includes('fjärrvärme') || cat.includes('uppvärmning')) {
                normalized = 'Heating';
                group = 'heating';
            } else if (cat.includes('vatten') || cat.includes('va-avgift') || cat.includes('avlopp')) {
                normalized = 'Water & Sewage';
                group = 'water';
            } else if (cat.includes('städ') || cat.includes('renhåll') || cat.includes('lokalvård')) {
                normalized = 'Cleaning';
                group = 'cleaning';
            } else if (cat.includes('fastighetsskötsel') || cat.includes('drift ') || cat === 'drift' || cat.includes('driftkostnad')) {
                // FIXED: Fastighetsskötsel is Property Maintenance!
                normalized = 'Property Maintenance';
                group = 'property';
            } else if (cat.includes('reparation') || cat.includes('underhåll')) {
                normalized = 'Repairs & Maintenance';
                group = 'repairs';
            } else if (cat.includes('försäkring')) {
                normalized = 'Insurance';
                group = 'insurance';
            } else if (cat.includes('tomträtt') || cat.includes('arrende')) {
                normalized = 'Land Lease';
                group = 'land';
            } else if (cat.includes('hiss')) {
                normalized = 'Elevator';
                group = 'elevator';
            } else if (cat.includes('sophämt') || cat.includes('avfall') || cat.includes('sophantering')) {
                normalized = 'Waste Management';
                group = 'waste';
            } else if (cat.includes('snöröj') || cat.includes('halkbekämp') || cat.includes('sandning')) {
                normalized = 'Snow Removal';
                group = 'snow';
            } else if (cat.includes('trädgård') || cat.includes('grönytor') || cat.includes('yttre skötsel')) {
                normalized = 'Landscaping & Grounds';
                group = 'landscaping';
            } else if (cat.includes('fastighetsskatt') || cat.includes('fastighetsavgift')) {
                normalized = 'Property Tax';
                group = 'tax';
            } else if (cat.includes('serviceavtal') || cat.includes('besiktning')) {
                normalized = 'Service & Inspections';
                group = 'service';
            }

            if (normalized) {
                mappings.push({
                    original: row.category,
                    normalized,
                    group
                });
            }
        });

        // Create table
        await pool.query(`
      CREATE TABLE category_normalization (
        id SERIAL PRIMARY KEY,
        original_category VARCHAR(255) UNIQUE NOT NULL,
        normalized_category VARCHAR(100) NOT NULL,
        category_group VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX idx_original_cat ON category_normalization(original_category);
      CREATE INDEX idx_normalized_cat ON category_normalization(normalized_category);
    `);

        // Insert mappings
        for (const m of mappings) {
            await pool.query(
                'INSERT INTO category_normalization (original_category, normalized_category, category_group) VALUES ($1, $2, $3)',
                [m.original, m.normalized, m.group]
            );
        }

        console.log(`✅ Fixed! Inserted ${mappings.length} correct mappings\n`);

        // Show corrected groupings
        const groups = await pool.query(`
      SELECT normalized_category, COUNT(*) as variants
      FROM category_normalization
      GROUP BY normalized_category
      ORDER BY variants DESC
    `);

        console.log('Corrected groups:');
        groups.rows.forEach(r => {
            console.log(`  ${r.normalized_category}: ${r.variants} variants`);
        });

        // Verify electricity group specifically
        console.log('\n🔍 Electricity group contents:');
        const elGroup = await pool.query(`
      SELECT original_category
      FROM category_normalization
      WHERE normalized_category = 'Electricity'
      ORDER BY original_category
    `);
        elGroup.rows.forEach(r => console.log(`  - ${r.original_category}`));

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

fixNormalization();
