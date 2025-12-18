
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
        console.log("--- AUDITING EVENTS & DETAILED COSTS ---");

        // 1. Events (Renovations?)
        console.log("\n--- EVENTS SAMPLE ---");
        const events = await pool.query(`
            SELECT event_date, description, event_type 
            FROM brf_events 
            ORDER BY event_date DESC 
            LIMIT 10
        `);
        console.table(events.rows);

        // 2. Cost Details (Categories)
        console.log("\n--- COST CATEGORIES ---");
        const costs = await pool.query(`
            SELECT category, COUNT(*) as count, SUM(amount_current) as total_sek
            FROM brf_operating_costs_detail
            GROUP BY category
            ORDER BY total_sek DESC
            LIMIT 20
        `);
        console.table(costs.rows);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

run();
