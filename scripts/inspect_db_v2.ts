import { createClient } from '@supabase/supabase-js'

// Need to parse connection string to get URL and Key? 
// No, connection string is for PG client. Supabase client needs URL and Anon Key.
// User provided:
// URL: aws-1-eu-north-1.pooler.supabase.com (Postgres)
// But REST API URL is usually https://<ref>.supabase.co
// The connection string is: postgresql://postgres.hhcpkquyinnkrfgghpue:aseP4ss!@aws-1-eu-north-1.pooler.supabase.com:5432/postgres
// So ref is likely `hhcpkquyinnkrfgghpue`
// URL: https://hhcpkquyinnkrfgghpue.supabase.co
// We need the ANON KEY. It was not provided in the prompt.
// Prompt said:
// "User: postgres.hhcpkquyinnkrfgghpue"
// "Password: aseP4ss!"

// If we don't have the Anon Key, we MUST use direct Postgres.
// The SSL error with `pg` usually means we need `ssl: { rejectUnauthorized: false }` OR we need to NOT use SSL if port 5432 (transaction pooler) but port 6543 (session pooler) requires it?
// Actually, `aws-1-eu-north-1.pooler.supabase.com` on 5432 usually requires SSL.
// Let's try PG again but logging the error detail.
// OR try port 6543 which is the session pooler if available.

// Let's stick to PG but debug the connection.
import { Pool } from 'pg';

const connectionString = "postgresql://postgres.hhcpkquyinnkrfgghpue:aseP4ss!@aws-1-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function inspect() {
    try {
        console.log("Connecting...");


        // Check for Auditor and Board info
        console.log("\n--- Governance / Board / Auditor ---");
        const tablesToCheck = ['brf_board_members', 'brf_governance', 'brf_events'];
        for (const t of tablesToCheck) {
            const cols = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '${t}'
            `);
            console.log(`\nTable: ${t}`);
            console.log(cols.rows.map(c => c.column_name));

            // Sample data
            const sample = await pool.query(`SELECT * FROM ${t} LIMIT 1`);
            console.log("Sample:", sample.rows[0]);
        }

        // Investigate "Crazy" Values
        console.log("\n--- Sanity Check: Metrics ---");

        // Check Debt/sqm stats
        const debtStats = await pool.query(`
            SELECT 
                MIN(debt_per_sqm_total), 
                MAX(debt_per_sqm_total), 
                AVG(debt_per_sqm_total),
                COUNT(*) as count
            FROM brf_metrics
        `);
        console.log("Debt/sqm Stats:", debtStats.rows[0]);

        // Check outliers for Debt
        const debtOutliers = await pool.query(`
            SELECT zelda_id, debt_per_sqm_total 
            FROM brf_metrics 
            ORDER BY debt_per_sqm_total DESC 
            LIMIT 5
        `);
        console.log("Top 5 Debt Outliers:", debtOutliers.rows);

        // Check Energy stats (from buildings)
        const energyStats = await pool.query(`
            SELECT 
                MIN(energy_performance_kwh_sqm), 
                MAX(energy_performance_kwh_sqm), 
                AVG(energy_performance_kwh_sqm),
                COUNT(*) as count
            FROM buildings
        `);
        console.log("Energy Stats:", energyStats.rows[0]);

        // Check outliers for Energy
        const energyOutliers = await pool.query(`
            SELECT zelda_id, energy_performance_kwh_sqm 
            FROM buildings 
            ORDER BY energy_performance_kwh_sqm DESC 
            LIMIT 5
        `);
        console.log("Top 5 Energy Outliers:", energyOutliers.rows);

        // Check if joins cause duplicates in a simple count query
        const joinCheck = await pool.query(`
            SELECT m.zelda_id, COUNT(b.id) as building_count
            FROM brf_metadata m
            LEFT JOIN buildings b USING (zelda_id)
            GROUP BY 1
            ORDER BY 2 DESC
            LIMIT 5
        `);
        console.log("Buildings per BRF (Join Risk):", joinCheck.rows);

    } catch (e) {
        console.error("Connection Failed:", e);
    } finally {
        await pool.end();
    }
}

inspect();
