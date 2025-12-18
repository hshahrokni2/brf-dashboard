import { query } from './db';

export interface BrfFullDetail {
    // Basic Info
    zelda_id: string;
    brf_name: string;
    property_designation: string | null;
    district: string | null;
    address: string | null;

    // Property
    built_year: number | null;
    total_apartments: number | null;
    total_area_sqm: number | null;
    heating_type: string | null;

    // Energy Declaration
    energy_class: string | null;
    energy_kwh_per_sqm: number | null;

    // Financial Metrics
    solidarity_percent: number | null;
    debt_per_sqm: number | null;

    // Governance
    chairman: string | null;
    board_size: number | null;

    // Board Members
    board_members: Array<{
        name: string;
        role: string | null;
    }>;

    // Loans with percentiles
    loans: Array<{
        lender: string;
        amount: number | null;
        interest_rate: number | null;
        maturity_date: string | null;
        interest_percentile: number | null;
    }>;

    // Suppliers
    suppliers: Array<{
        company_name: string;
        service_type: string | null;
    }>;

    // Events
    events: Array<{
        event_type: string | null;
        description: string | null;
        year: number | null;
        cost: number | null;
    }>;

    // Detailed Costs with percentiles
    detailed_costs: Array<{
        category: string;
        amount: number;
        percentile: number | null;
    }>;

    // Percentiles (compared to all BRFs)
    percentiles: {
        solidarity: number | null;
        debt_per_sqm: number | null;
    };

    // Coordinates for map
    latitude: number | null;
    longitude: number | null;
}

export async function getBrfFullDetail(zeldaId: string): Promise<BrfFullDetail | null> {
    // Get basic BRF info with energy data from brf_property (per backend handoff)
    const basicSql = `
        SELECT 
            m.zelda_id,
            m.brf_name,
            p.property_designation,
            m.district,
            p.address,
            p.built_year,
            p.total_apartments,
            p.total_area_sqm,
            p.heating_type,
            p.energy_class,
            p.energy_kwh_per_sqm,
            p.latitude,
            p.longitude,
            met.solidarity_percent,
            met.debt_per_sqm_total as debt_per_sqm,
            g.chairman,
            g.board_size
        FROM brf_metadata m
        LEFT JOIN brf_property p USING (zelda_id)
        LEFT JOIN brf_metrics met USING (zelda_id)
        LEFT JOIN brf_governance g USING (zelda_id)
        WHERE m.zelda_id = $1
    `;

    const basicResult = await query(basicSql, [zeldaId]);
    if (basicResult.rows.length === 0) return null;
    const basic = basicResult.rows[0];

    // Get board members - use full_name column
    let boardResult = { rows: [] as any[] };
    try {
        const boardSql = `
            SELECT full_name as name, role
            FROM brf_board_members
            WHERE zelda_id = $1
            ORDER BY 
                CASE role 
                    WHEN 'ordförande' THEN 1 
                    WHEN 'vice ordförande' THEN 2 
                    WHEN 'ledamot' THEN 3 
                    WHEN 'suppleant' THEN 4 
                    ELSE 5 
                END,
                full_name
            LIMIT 15
        `;
        boardResult = await query(boardSql, [zeldaId]);
    } catch (e) {
        console.log('Board members query failed', e);
    }

    // Get loans - use original_amount (outstanding_balance doesn't exist in live DB)
    let loansResult = { rows: [] as any[] };
    try {
        const loansSql = `
            WITH interest_ranks AS (
                SELECT interest_rate,
                       PERCENT_RANK() OVER (ORDER BY interest_rate ASC) as pct
                FROM brf_loans
                WHERE interest_rate IS NOT NULL
            )
            SELECT l.lender, l.original_amount as amount, l.interest_rate, l.maturity_date,
                   (SELECT (1 - pct) * 100 FROM interest_ranks WHERE interest_rate = l.interest_rate LIMIT 1) as interest_pct
            FROM brf_loans l
            WHERE l.zelda_id = $1
            ORDER BY l.interest_rate
        `;
        loansResult = await query(loansSql, [zeldaId]);
    } catch (e) {
        console.log('Loans query failed', e);
    }

    // Get suppliers - use company_name, service_type (per backend handoff)
    let suppliersResult = { rows: [] as any[] };
    try {
        const suppliersSql = `
            SELECT company_name, service_type
            FROM brf_suppliers
            WHERE zelda_id = $1
            ORDER BY service_type, company_name
        `;
        suppliersResult = await query(suppliersSql, [zeldaId]);
    } catch (e) {
        console.log('Suppliers query failed', e);
    }

    // Get events - use year and cost (per backend handoff)
    let eventsResult = { rows: [] as any[] };
    try {
        const eventsSql = `
            SELECT event_type, description, year, cost
            FROM brf_events
            WHERE zelda_id = $1
            ORDER BY year DESC NULLS LAST
            LIMIT 20
        `;
        eventsResult = await query(eventsSql, [zeldaId]);
    } catch (e) {
        console.log('Events query failed', e);
    }

    // Get detailed costs with percentiles
    let costsResult = { rows: [] as any[] };
    try {
        const costsSql = `
            WITH cost_ranks AS (
                SELECT category, amount_current,
                       PERCENT_RANK() OVER (PARTITION BY category ORDER BY amount_current ASC) as pct
                FROM brf_operating_costs_detail
                WHERE amount_current > 0
            )
            SELECT d.category, d.amount_current as amount,
                   (SELECT (1 - pct) * 100 FROM cost_ranks WHERE category = d.category AND amount_current = d.amount_current LIMIT 1) as percentile
            FROM brf_operating_costs_detail d
            WHERE d.zelda_id = $1 AND d.amount_current > 0
            ORDER BY d.amount_current DESC
            LIMIT 20
        `;
        costsResult = await query(costsSql, [zeldaId]);
    } catch (e) {
        console.log('Costs query failed', e);
    }

    // Calculate percentiles
    let pct: any = {};
    try {
        const percentilesSql = `
            WITH rankings AS (
                SELECT 
                    zelda_id,
                    PERCENT_RANK() OVER (ORDER BY solidarity_percent DESC) as solidarity_pct,
                    PERCENT_RANK() OVER (ORDER BY debt_per_sqm_total ASC) as debt_pct
                FROM brf_metrics
                WHERE solidarity_percent IS NOT NULL
            )
            SELECT * FROM rankings WHERE zelda_id = $1
        `;
        const percentilesResult = await query(percentilesSql, [zeldaId]);
        pct = percentilesResult.rows[0] || {};
    } catch (e) {
        console.log('Percentiles query failed', e);
    }

    return {
        zelda_id: basic.zelda_id,
        brf_name: basic.brf_name,
        property_designation: basic.property_designation,
        district: basic.district,
        address: basic.address,
        built_year: basic.built_year,
        total_apartments: basic.total_apartments,
        total_area_sqm: basic.total_area_sqm ? parseFloat(basic.total_area_sqm) : null,
        heating_type: basic.heating_type,
        energy_class: basic.energy_class,
        energy_kwh_per_sqm: basic.energy_kwh_per_sqm ? parseInt(basic.energy_kwh_per_sqm) : null,
        solidarity_percent: basic.solidarity_percent ? parseFloat(basic.solidarity_percent) : null,
        debt_per_sqm: basic.debt_per_sqm ? parseFloat(basic.debt_per_sqm) : null,
        chairman: basic.chairman,
        board_size: basic.board_size,
        latitude: basic.latitude ? parseFloat(basic.latitude) : null,
        longitude: basic.longitude ? parseFloat(basic.longitude) : null,
        board_members: boardResult.rows.map((m: any) => ({ name: m.name || 'Namn saknas', role: m.role })),
        loans: loansResult.rows.map((l: any) => ({
            lender: l.lender,
            amount: l.amount ? parseFloat(l.amount) : null,
            interest_rate: l.interest_rate ? parseFloat(l.interest_rate) : null,
            maturity_date: l.maturity_date,
            interest_percentile: l.interest_pct ? Math.round(parseFloat(l.interest_pct)) : null
        })),
        suppliers: suppliersResult.rows.map((s: any) => ({ company_name: s.company_name, service_type: s.service_type })),
        events: eventsResult.rows.map((e: any) => ({
            event_type: e.event_type,
            description: e.description,
            year: e.year,
            cost: e.cost ? parseFloat(e.cost) : null
        })),
        detailed_costs: costsResult.rows.map((c: any) => ({
            category: c.category,
            amount: parseFloat(c.amount),
            percentile: c.percentile ? Math.round(parseFloat(c.percentile)) : null
        })),
        percentiles: {
            solidarity: pct.solidarity_pct ? Math.round((1 - parseFloat(pct.solidarity_pct)) * 100) : null,
            debt_per_sqm: pct.debt_pct ? Math.round((1 - parseFloat(pct.debt_pct)) * 100) : null
        }
    };
}
