import { query } from "./src/lib/db";

async function inspectSchema() {
    try {
        // Check columns in buildings table
        const sql = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'buildings';
    `;
        const res = await query(sql);
        console.log("Buildings Table Columns:", res.rows);

        // Also check one row to see content of potential geo columns
        const sampleSql = `SELECT * FROM buildings LIMIT 1`;
        const sampleRes = await query(sampleSql);
        // console.log("Sample Row:", sampleRes.rows[0]); 
        // Don't log full row if huge, just keys
        if (sampleRes.rows.length > 0) {
            console.log("Sample Keys:", Object.keys(sampleRes.rows[0]));
        }
    } catch (err) {
        console.error(err);
    }
}

inspectSchema();
