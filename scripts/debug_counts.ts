
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
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("--- Investigating BRF Counts ---");

        // 1. Total Count in brf_metadata
        const metaCount = await pool.query("SELECT COUNT(*) FROM brf_metadata");
        console.log("Total in brf_metadata:", metaCount.rows[0].count);

        // 2. Count with Join (Logic in getBrfOverviewList)
        // Wait, the logic in getBrfOverviewList uses LEFT JOINs mostly, but JOIN brf_property
        const listCount = await pool.query(`
            SELECT COUNT(*) 
            FROM brf_metadata m
            JOIN brf_property p USING(zelda_id)
        `);
        console.log("Count compliant with getBrfOverviewList (Inner Join Property):", listCount.rows[0].count);

        // 3. District Summary Logic
        const summarySql = `
         WITH brf_stats AS (
        SELECT 
            m.zelda_id,
            CASE 
                WHEN p.postal_code LIKE '120%' THEN 'Hammarby Sjöstad'
                WHEN p.postal_code LIKE '1154%' OR p.postal_code LIKE '1153%' THEN 'Hjorthagen'
                WHEN p.postal_code LIKE '1152%' THEN 'Norra Djurgårdsstaden'
                ELSE 'Other'
            END as district
        FROM brf_metadata m
        JOIN brf_property p USING (zelda_id)
        JOIN brf_metrics met USING (zelda_id)
        LEFT JOIN buildings b USING (zelda_id)
        GROUP BY 1, 2
    )
    SELECT 
        district,
        COUNT(zelda_id)::int as brf_count
    FROM brf_stats
    GROUP BY 1
    ORDER BY district
        `;
        const summary = await pool.query(summarySql);
        console.log("District Summary Counts:", summary.rows);

        const totalSummarized = summary.rows.reduce((acc, r) => acc + r.brf_count, 0);
        console.log("Total from Summary:", totalSummarized);

        // 4. Dump Postal Codes
        const postals = await pool.query("SELECT postal_code, COUNT(*) FROM brf_property GROUP BY 1 ORDER BY 2 DESC LIMIT 50");
        console.log("Top Postal Codes:", postals.rows);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

run();
