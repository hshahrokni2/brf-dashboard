
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const [key, ...values] = line.split('=');
            if (key && values.length > 0) {
                const val = values.join('=').trim().replace(/^["']|["']$/g, '');
                process.env[key.trim()] = val;
            }
        });
    } catch (e) {
        console.error("Could not load .env.local", e);
    }
}
loadEnv();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("--- STARTING METRICS GAP AUDIT ---");

        // 1. Audit Table Columns
        const tables = [
            'brf_metadata', 'brf_property', 'brf_metrics',
            'brf_operational_costs', 'brf_governance', 'brf_loans',
            'multi_year', 'buildings', 'brf_energy_declarations'
        ];

        const columnMap: Record<string, string[]> = {};

        for (const table of tables) {
            const res = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [table]);
            columnMap[table] = res.rows.map(r => r.column_name);
        }

        console.log("\n--- SQL COLUMNS FOUND ---");
        Object.entries(columnMap).forEach(([table, cols]) => {
            console.log(`\nTable: ${table} (${cols.length} cols)`);
            console.log(cols.join(', '));
        });

        // 2. Audit Extraction Data Keys (The "400+" Source?)
        console.log("\n--- AUDITING EXTRACTION_DATA JSON KEYS ---");
        // We'll scan a large sample to collect all distinct top-level keys
        const jsonScan = await pool.query(`
            SELECT DISTINCT jsonb_object_keys(data) as key
            FROM extraction_data
        `);

        const distinctKeys = jsonScan.rows.map(r => r.key).sort();
        console.log(`\nFound ${distinctKeys.length} unique keys in extraction_data (sample):`);
        console.log(distinctKeys.join(', '));

        // 3. Investigate "Multiple Lines" Bug
        // Check uniqueness of multi_year
        console.log("\n--- INTEGRITY CHECK: Multi-Year Duplicates ---");
        const dupes = await pool.query(`
            SELECT zelda_id, data_year, COUNT(*) 
            FROM multi_year 
            GROUP BY 1, 2 
            HAVING COUNT(*) > 1 
            LIMIT 5
        `);
        if (dupes.rows.length > 0) {
            console.log("WARNING: Found duplicates in multi_year (causing multi-line charts?):");
            console.table(dupes.rows);
        } else {
            console.log("PASS: Multi-year data is unique per (zelda_id, year).");
        }

        // Check Buildings Join cardinality
        console.log("\n--- INTEGRITY CHECK: Building Count per Property ---");
        const buildingCounts = await pool.query(`
            SELECT zelda_id, COUNT(*) 
            FROM buildings 
            GROUP BY 1 
            ORDER BY 2 DESC 
            LIMIT 5
        `);
        console.log("Top BRFs by Building Count (if > 1, JOINs might look like duplicates):");
        console.table(buildingCounts.rows);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

run();
