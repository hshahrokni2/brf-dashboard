import { Pool } from 'pg';

const pool = new Pool({
    connectionString: "postgresql://postgres.hhcpkquyinnkrfgghpue:aseP4ss!@aws-1-eu-north-1.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

async function fixWithUserCorrections() {
    try {
        console.log('🔧 APPLYING USER CORRECTIONS TO NORMALIZATION\n');

        // Drop and recreate
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
            const original = row.category;
            let normalized = null;
            let group = null;

            // USER CORRECTIONS APPLIED:

            // 1. Mattvätt is NOT internet - it's laundry
            if (original === 'Mattvätt' || original === 'Mattvätt/Hyrmattor') {
                normalized = 'Laundry & Mats';
                group = 'laundry';
            }
            // 2. Porttelefon is NOT internet - it's building phone systems
            else if (cat.includes('porttelefon') || cat.includes('hisstelefon')) {
                normalized = 'Building Phone Systems';
                group = 'phone_systems';
            }
            // 3. Internet/Broadband/TV (excluding above)
            else if (cat.includes('bredband') || cat.includes('internet') || cat.includes('kabel') || cat.includes('tv') || cat.includes('telefoni')) {
                normalized = 'Internet & Communications';
                group = 'internet';
            }
            // 4. Electricity - including Fastighetsel
            else if (cat === 'el' || cat === 'el garage' || cat.includes('elavgift') || cat === 'fastighetsel' || cat.includes('fastighetsels')) {
                normalized = 'Electricity';
                group = 'electricity';
            }
            // 5. Heating - including Uppvärmning
            else if (cat.includes('värme') || cat.includes('fjarrvarme') || cat.includes('fjärrvärme') || cat.includes('uppvärmning')) {
                normalized = 'Heating';
                group = 'heating';
            }
            // 6. Water & Sewage
            else if (cat.includes('vatten') || cat.includes('va-avgift') || cat.includes('avlopp')) {
                normalized = 'Water & Sewage';
                group = 'water';
            }
            // 7. Waste Management - INCLUDING Renhållning, sophämtning, sopsug
            else if (cat.includes('sophämt') || cat.includes('avfall') || cat.includes('sophantering') ||
                cat.includes('renhållning') || cat.includes('återvinning') ||
                cat.includes('sopsug') || cat.includes('grovsopor')) {
                normalized = 'Waste Management';
                group = 'waste';
            }
            // 8. Cleaning - EXCLUDING waste-related items
            else if (cat.includes('städ') && !cat.includes('renhållning')) {
                normalized = 'Cleaning';
                group = 'cleaning';
            }
            // 9. Property Maintenance - including serviceavtal
            else if (cat.includes('fastighetsskötsel') || cat.includes('drift ') || cat === 'drift' ||
                cat.includes('driftkostnad') || cat.includes('serviceavtal') || cat.includes('förvaltningsarvode')) {
                normalized = 'Property Maintenance';
                group = 'property';
            }
            // 10. Repairs & Maintenance
            else if (cat.includes('reparation') || cat.includes('underhåll')) {
                normalized = 'Repairs & Maintenance';
                group = 'repairs';
            }
            // 11. Insurance
            else if (cat.includes('försäkring')) {
                normalized = 'Insurance';
                group = 'insurance';
            }
            // 12. Property Tax - including Fastighetsskatt
            else if (cat.includes('tomträtt') || cat.includes('arrende')) {
                normalized = 'Land Lease';
                group = 'land';
            }
            else if (cat.includes('fastighetsskatt') || cat.includes('fastighetsavgift') || cat.includes('kommunal avgift')) {
                normalized = 'Property Tax';
                group = 'tax';
            }
            // 13. Elevator
            else if (cat.includes('hiss')) {
                normalized = 'Elevator';
                group = 'elevator';
            }
            // 14. Snow Removal
            else if (cat.includes('snöröj') || cat.includes('halkbekämp') || cat.includes('sandning')) {
                normalized = 'Snow Removal';
                group = 'snow';
            }
            // 15. Landscaping
            else if (cat.includes('trädgård') || cat.includes('grönytor') || cat.includes('yttre skötsel')) {
                normalized = 'Landscaping & Grounds';
                group = 'landscaping';
            }
            // 16. Service & Inspections
            else if (cat.includes('besiktning') || cat.includes('kontroll') || cat.includes('tillsyn') || cat.includes('ovk')) {
                normalized = 'Service & Inspections';
                group = 'service';
            }
            // 17. Other - Förbrukningsmaterial, etc.
            else if (cat.includes('förbrukningsmaterial') || cat.includes('förbrukningsinventarier') ||
                cat.includes('övrig') || cat === 'övrigt' || cat.includes('gemensamhetsanläggning') ||
                cat.includes('samfällighet')) {
                normalized = 'Other';
                group = 'other';
            }

            if (normalized) {
                mappings.push({
                    original: row.category,
                    normalized,
                    group
                });
            } else {
                // Log uncategorized for review
                if (row.num_brfs >= 2) {
                    console.log(`⚠️  Uncategorized: "${row.category}" (${row.num_brfs} BRFs)`);
                }
            }
        });

        // Create table with corrected mappings
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

        for (const m of mappings) {
            await pool.query(
                'INSERT INTO category_normalization (original_category, normalized_category, category_group) VALUES ($1, $2, $3)',
                [m.original, m.normalized, m.group]
            );
        }

        console.log(`\n✅ Corrected! Inserted ${mappings.length} mappings\n`);

        // Show groups
        const groups = await pool.query(`
      SELECT normalized_category, COUNT(*) as variants
      FROM category_normalization
      GROUP BY normalized_category
      ORDER BY variants DESC
    `);

        console.log('Final normalized groups:');
        groups.rows.forEach(r => {
            console.log(`  ${r.normalized_category}: ${r.variants} variants`);
        });

        // Verify key corrections
        console.log('\n🔍 Verification of user corrections:');

        console.log('\nWaste Management (should include Renhållning):');
        const waste = await pool.query(`SELECT original_category FROM category_normalization WHERE normalized_category = 'Waste Management' ORDER BY original_category`);
        waste.rows.forEach(r => console.log(`  - ${r.original_category}`));

        console.log('\nCleaning (should NOT include Renhållning):');
        const cleaning = await pool.query(`SELECT original_category FROM category_normalization WHERE normalized_category = 'Cleaning' ORDER BY original_category`);
        cleaning.rows.forEach(r => console.log(`  - ${r.original_category}`));

        console.log('\nElectricity (should include Fastighetsel):');
        const elec = await pool.query(`SELECT original_category FROM category_normalization WHERE normalized_category = 'Electricity' ORDER BY original_category`);
        elec.rows.forEach(r => console.log(`  - ${r.original_category}`));

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

fixWithUserCorrections();
