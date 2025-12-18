import { query } from './db';

export interface SupplierData {
    company_name: string;
    service_type: string | null;
    brf_count: number;
    total_brfs?: number;
    market_share?: number;
}

export interface SupplierByBrf {
    zelda_id: string;
    brf_name: string;
    company_name: string;
    service_type: string | null;
    contract_end: Date | null;
    notes: string | null;
}

// Normalize supplier names to merge variants
function normalizeSupplierName(name: string): string {
    if (!name) return name;

    const normalized = name
        .toLowerCase()
        .trim()
        // Remove common suffixes
        .replace(/\s+(ab|sweden|recycling|solutions?|förening(en)?|samfällighet(en)?|fastighetsförvaltning)/gi, '')
        // Normalize spelling variations
        .replace(/ragnsells?/gi, 'ragn-sells')
        .replace(/prezero|prozero/gi, 'prezero')
        .replace(/suez\s*recycling/gi, 'suez')
        // Remove special characters and extra spaces
        .replace(/[^a-zåäö0-9\s-]/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Capitalize first letter of each word
    return normalized.split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Get top suppliers across all service types - GROUPED BY COMPANY NAME with normalization
export async function getTopSuppliers(limit: number = 20): Promise<SupplierData[]> {
    const sql = `
        SELECT 
            company_name,
            STRING_AGG(DISTINCT service_type, ', ' ORDER BY service_type) as service_type,
            COUNT(DISTINCT zelda_id) as brf_count,
            (SELECT COUNT(DISTINCT zelda_id) FROM brf_suppliers) as total_brfs
        FROM brf_suppliers
        WHERE company_name IS NOT NULL
        GROUP BY company_name
        ORDER BY brf_count DESC, company_name
        LIMIT 100
    `;

    const result = await query(sql, []);

    // Post-process to normalize and merge similar names
    const normalizedMap = new Map<string, SupplierData>();

    for (const row of result.rows) {
        const normalizedName = normalizeSupplierName(row.company_name);
        const existing = normalizedMap.get(normalizedName);

        if (existing) {
            // Merge with existing
            existing.brf_count += parseInt(row.brf_count);
            // Combine service types
            const services = new Set([
                ...existing.service_type!.split(', '),
                ...row.service_type.split(', ')
            ]);
            existing.service_type = Array.from(services).sort().join(', ');
        } else {
            normalizedMap.set(normalizedName, {
                company_name: normalizedName,
                service_type: row.service_type,
                brf_count: parseInt(row.brf_count),
                total_brfs: parseInt(row.total_brfs),
                market_share: (parseInt(row.brf_count) / parseInt(row.total_brfs)) * 100
            });
        }
    }

    // Sort by brf_count and return top N
    return Array.from(normalizedMap.values())
        .sort((a, b) => b.brf_count - a.brf_count)
        .slice(0, limit);
}

// Get suppliers by service type (word-start pattern matching)
export async function getSuppliersByServiceType(serviceType: string): Promise<SupplierData[]> {
    // Use word-start matching: finds 'el' in 'El' but not in 'Telecom'
    const sql = `
        SELECT 
            company_name,
            service_type,
            COUNT(DISTINCT zelda_id) as brf_count
        FROM brf_suppliers
        WHERE (
            LOWER(service_type) = LOWER($1)
            OR LOWER(service_type) LIKE LOWER($1) || ' %'
            OR LOWER(service_type) LIKE LOWER($1) || '/%'
        )
          AND company_name IS NOT NULL
        GROUP BY company_name, service_type
        ORDER BY brf_count DESC
    `;

    const result = await query(sql, [serviceType]);
    return result.rows.map(row => ({
        company_name: row.company_name,
        service_type: row.service_type,
        brf_count: parseInt(row.brf_count)
    }));
}

// Get all service types
export async function getServiceTypes(): Promise<{ service_type: string; count: number }[]> {
    const sql = `
        SELECT 
            service_type,
            COUNT(*) as count
        FROM brf_suppliers
        WHERE service_type IS NOT NULL
        GROUP BY service_type
        ORDER BY count DESC
    `;

    const result = await query(sql, []);
    return result.rows.map(row => ({
        service_type: row.service_type,
        count: parseInt(row.count)
    }));
}

// Get suppliers for a specific BRF
export async function getSuppliersByBrf(zeldaId: string): Promise<SupplierByBrf[]> {
    const sql = `
        SELECT 
            s.zelda_id,
            m.brf_name,
            s.company_name,
            s.service_type,
            s.contract_end,
            s.notes
        FROM brf_suppliers s
        JOIN brf_metadata m USING (zelda_id)
        WHERE s.zelda_id = $1
        ORDER BY s.service_type, s.company_name
    `;

    const result = await query(sql, [zeldaId]);
    return result.rows;
}

// Get BRFs using a specific supplier
export async function getBrfsUsingSupplier(supplierName: string): Promise<SupplierByBrf[]> {
    const sql = `
        SELECT 
            s.zelda_id,
            m.brf_name,
            s.company_name,
            s.service_type,
            s.contract_end,
            s.notes
        FROM brf_suppliers s
        JOIN brf_metadata m USING (zelda_id)
        WHERE s.company_name ILIKE $1
        ORDER BY m.brf_name
    `;

    const result = await query(sql, [`%${supplierName}%`]);
    return result.rows;
}

// Get supplier statistics
export async function getSupplierStats() {
    const sql = `
        SELECT 
            COUNT(DISTINCT company_name) as total_suppliers,
            COUNT(DISTINCT zelda_id) as brfs_with_suppliers,
            COUNT(*) as total_records,
            COUNT(DISTINCT service_type) as service_types
        FROM brf_suppliers
        WHERE company_name IS NOT NULL
    `;

    const result = await query(sql, []);
    return result.rows[0];
}
