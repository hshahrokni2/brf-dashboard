import { Pool } from 'pg';

const pool = new Pool({
    connectionString: "postgresql://postgres.hhcpkquyinnkrfgghpue:aseP4ss!@aws-1-eu-north-1.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

async function auditPhase10Data() {
    console.log('🔍 PHASE 10 DATA AUDIT\n');

    // 1. Check for district/area data
    console.log('1️⃣ DISTRICT DATA:');
    const districtCheck = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name IN ('brf_property', 'brf_metadata', 'buildings')
          AND column_name ILIKE '%district%' OR column_name ILIKE '%area%' OR column_name ILIKE '%stad%'
        ORDER BY table_name, column_name
    `);
    console.log('District-related columns:', districtCheck.rows);

    // Check sample values
    const districtSample = await pool.query(`
        SELECT zelda_id, address, city, postal_code
        FROM brf_property
        LIMIT 5
    `);
    console.log('\nSample address data:', districtSample.rows);

    // 2. Check supplier data
    console.log('\n2️⃣ SUPPLIER DATA:');
    const supplierSchema = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'brf_suppliers'
        ORDER BY ordinal_position
    `);
    console.log('Supplier table schema:', supplierSchema.rows);

    const supplierSample = await pool.query(`
        SELECT supplier_name, supplier_type, COUNT(*) as brf_count
        FROM brf_suppliers
        WHERE supplier_name IS NOT NULL
        GROUP BY supplier_name, supplier_type
        ORDER BY brf_count DESC
        LIMIT 20
    `);
    console.log('\nTop suppliers:', supplierSample.rows);

    // 3. Check financial data (loans)
    console.log('\n3️⃣ FINANCIAL DATA (Loans):');
    const loanSchema = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'brf_loans'
        ORDER BY ordinal_position
    `);
    console.log('Loan table schema:', loanSchema.rows);

    const loanStats = await pool.query(`
        SELECT 
            COUNT(DISTINCT zelda_id) as brfs_with_loans,
            COUNT(*) as total_loan_records,
            AVG(interest_rate) as avg_interest_rate,
            MIN(interest_rate) as min_interest,
            MAX(interest_rate) as max_interest
        FROM brf_loans
        WHERE interest_rate IS NOT NULL AND interest_rate > 0
    `);
    console.log('\nLoan statistics:', loanStats.rows[0]);

    // 4. Check multi-year cost data
    console.log('\n4️⃣ MULTI-YEAR COST DATA:');
    const multiYearCheck = await pool.query(`
        SELECT 
            data_year,
            COUNT(DISTINCT zelda_id) as brf_count
        FROM multi_year
        GROUP BY data_year
        ORDER BY data_year DESC
    `);
    console.log('BRFs per year:', multiYearCheck.rows);

    // Check if we have yearly cost breakdowns
    const yearlyCostCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'multi_year'
          AND (column_name ILIKE '%cost%' OR column_name ILIKE '%expense%')
        ORDER BY column_name
    `);
    console.log('\nCost-related columns in multi_year:', yearlyCostCheck.rows.map(r => r.column_name));

    // 5. Check avgift (monthly fee) data
    console.log('\n5️⃣ AVGIFT DATA:');
    const avgiftCheck = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE (table_name = 'brf_property' OR table_name = 'multi_year')
          AND (column_name ILIKE '%avgift%' OR column_name ILIKE '%fee%' OR column_name ILIKE '%charge%')
    `);
    console.log('Avgift-related columns:', avgiftCheck.rows);

    await pool.end();
}

auditPhase10Data().catch(console.error);
