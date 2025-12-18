
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
        console.log("--- Inspecting Cost Columns ---");

        // 1. Check Operational Costs columns
        const cols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'brf_metrics'
        `);
        console.log("Metrics Columns:", cols.rows.map(c => c.column_name).sort());

        // 2. Check Raw Extraction Data for hidden gems (sample)
        // Look for keys in the 'data' JSONB column that contain "cable", "tv", "garden", "trädgård"
        const rawSample = await pool.query(`
            SELECT data 
            FROM extraction_data 
            LIMIT 5
        `);

        if (rawSample.rows.length > 0) {
            console.log("\n--- Searching Raw Data Sample ---");
            rawSample.rows.forEach((row, i) => {
                const keys = JSON.stringify(row.data);
                // Simple text search in keys
                const matches = [];
                if (keys.match(/kabel/i)) matches.push("kabel");
                if (keys.match(/tv/i)) matches.push("tv");
                if (keys.match(/trädgård/i)) matches.push("trädgård");
                if (keys.match(/mark/i)) matches.push("mark (ground/garden?)");
                if (keys.match(/bredband/i)) matches.push("bredband");

                if (matches.length > 0) {
                    console.log(`Row ${i}: Found potential keys: ${matches.join(', ')}`);
                    // Try to print the context
                    const obj = row.data;
                    // Recursive search for keys
                    function findKeys(obj: any, search: RegExp) {
                        for (const k in obj) {
                            if (search.test(k)) console.log(`  Match: ${k} = ${obj[k]}`);
                            if (typeof obj[k] === 'object' && obj[k] !== null) findKeys(obj[k], search);
                        }
                    }
                    findKeys(obj, /(kabel|tv|trädgård|bredband|mark)/i);
                }
            });
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

run();
