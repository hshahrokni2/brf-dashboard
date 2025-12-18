
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Manual .env parser
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
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("Running District Summary Query...");
        const sql = `
    WITH brf_stats AS (
        SELECT 
            m.zelda_id,
            CASE 
                WHEN p.postal_code LIKE '120%' THEN 'Hammarby Sjöstad'
                WHEN p.postal_code LIKE '1154%' OR p.postal_code LIKE '1153%' THEN 'Hjorthagen'
                WHEN p.postal_code LIKE '1152%' THEN 'Norra Djurgårdsstaden'
                ELSE 'Other'
            END as district,
            met.solidarity_percent,
            met.debt_per_sqm_total,
            AVG(b.energy_performance_kwh_sqm) as brf_energy
        FROM brf_metadata m
        JOIN brf_property p USING (zelda_id)
        JOIN brf_metrics met USING (zelda_id)
        LEFT JOIN buildings b USING (zelda_id)
        GROUP BY 1, 2, 3, 4
    )
    SELECT 
        district,
        COUNT(zelda_id) as brf_count,
        ROUND(AVG(solidarity_percent), 1) as avg_solidarity,
        ROUND(AVG(brf_energy), 0) as avg_energy,
        ROUND(AVG(debt_per_sqm_total), 0) as avg_debt_sqm
    FROM brf_stats
    GROUP BY 1
    ORDER BY district
      `;

        // Note: I fixed 'b.postal_code' to 'p.postal_code' in the query above for the debug run.
        // If the original code has 'b.postal_code', that might be the bug too (grouping on nulls?).

        console.log("\nExecuting Query...");
        const res = await pool.query(sql);
        console.log("Query Results:", res.rows);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

run();
