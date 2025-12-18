
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
        console.log("--- Inspecting Suppliers for Proxies ---");

        // 1. Cable TV / Broadband
        const cable = await pool.query(`
            SELECT supplier_name, description, amount 
            FROM brf_suppliers 
            WHERE 
                description ILIKE '%tv%' OR 
                description ILIKE '%bredband%' OR 
                description ILIKE '%media%' OR
                supplier_name ILIKE '%telia%' OR
                supplier_name ILIKE '%telenor%' OR
                supplier_name ILIKE '%tele2%' OR
                supplier_name ILIKE '%com hem%'
            LIMIT 10
        `);
        console.log("Cable/TV Matches:", cable.rows);

        // 2. Gardening
        const garden = await pool.query(`
            SELECT supplier_name, description, amount 
            FROM brf_suppliers 
            WHERE 
                description ILIKE '%trädgård%' OR 
                description ILIKE '%mark%' OR 
                description ILIKE '%skötsel%' OR
                description ILIKE '%ute%' 
            LIMIT 10
        `);
        console.log("Gardening Matches:", garden.rows);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

run();
