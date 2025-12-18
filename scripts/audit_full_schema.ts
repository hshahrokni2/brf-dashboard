
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
        console.log("--- FULL DATABASE SCHEMA AUDIT ---");

        // 1. Get all tables
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        console.log(`Found ${tables.rows.length} tables.`);

        // 2. For each table, get columns and row count
        for (const row of tables.rows) {
            const tableName = row.table_name;
            console.log(`\n📦 TABLE: ${tableName}`);

            // Get Columns
            const cols = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [tableName]);

            console.log("   Columns:", cols.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));

            // Get Count
            const count = await pool.query(`SELECT COUNT(*) FROM "${tableName}"`);
            console.log("   Rows:", count.rows[0].count);

            // Preview one row (non-null dominant)
            const example = await pool.query(`SELECT * FROM "${tableName}" LIMIT 1`);
            if (example.rows.length > 0) {
                console.log("   Example Keys:", Object.keys(example.rows[0]).join(', '));
            }
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

run();
