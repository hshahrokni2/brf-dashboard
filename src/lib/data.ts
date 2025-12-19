import { query } from "./db";

export async function getDistrictSummary() {
    const sql = `
    WITH brf_stats AS (
        SELECT 
            m.zelda_id,
            m.district,
            met.solidarity_percent,
            met.debt_per_sqm_total,
            AVG(b.energy_performance_kwh_sqm) as brf_energy
        FROM brf_metadata m
        JOIN brf_property p USING (zelda_id)
        LEFT JOIN brf_metrics met USING (zelda_id)
        LEFT JOIN buildings b USING (zelda_id)
        GROUP BY 1, 2, 3, 4
    )
    SELECT 
        district,
        COUNT(zelda_id)::int as brf_count,
        ROUND(AVG(solidarity_percent), 1)::float as avg_solidarity,
        ROUND(AVG(brf_energy), 0)::int as avg_energy,
        ROUND(AVG(debt_per_sqm_total), 0)::int as avg_debt_sqm
    FROM brf_stats
    WHERE district IS NOT NULL
    GROUP BY 1
    ORDER BY district
  `;

    const result = await query(sql);
    return result.rows;
}

export async function getBrfOverviewList() {
    const sql = `
    WITH building_aggs AS (
        SELECT 
            zelda_id,
            MAX(height_m) as height_m,
            AVG(energy_performance_kwh_sqm) as energy_performance_kwh_sqm,
            MIN(energy_class) as energy_class, -- 'A' is min char < 'G'
            (array_agg(geometry))[1] as geometry -- Fix: MAX(jsonb) fails, take first
        FROM buildings
        GROUP BY zelda_id
    ),
    history_clean AS (
        SELECT DISTINCT ON (zelda_id, data_year)
            zelda_id,
            data_year,
            soliditet_procent,
            skuldsattning_per_kvm_totalyta,
            arsavgift_per_kvm,
            -- Additional financial metrics
            nettoomsattning,
            arsresultat,
            sparande_per_kvm,
            yttre_fond
        FROM multi_year
        ORDER BY zelda_id, data_year, created_at DESC
    )
    SELECT
        m.zelda_id,
        m.brf_name,
        p.property_designation,
        CASE 
            WHEN p.postal_code LIKE '120%' OR p.address ILIKE '%Hammarby%' OR p.address ILIKE '%Sickla%' THEN 'Hammarby Sjöstad'
            WHEN p.postal_code LIKE '1154%' OR p.postal_code LIKE '1153%' OR p.address ILIKE '%Hjorthagen%' THEN 'Hjorthagen'
            WHEN p.postal_code LIKE '1152%' OR p.address ILIKE '%Djurgårdsstaden%' THEN 'Norra Djurgårdsstaden'
            ELSE 'Other'
        END as district,
        b.energy_class,
        b.energy_performance_kwh_sqm,
        met.solidarity_percent,
        met.debt_per_sqm_total,
        p.built_year,
        b.height_m,
        p.latitude,
        p.longitude,
        b.geometry,
        oc.electricity_cost,
        oc.heating_cost,
        oc.water_cost,
        g.auditor,
        g.auditor_firm,
        g.chairman,
        g.board_size,
        p.total_apartments,
        -- Get ventilation type from energy declarations
        (SELECT ed.ventilation_type FROM brf_energy_declarations ed WHERE ed.zelda_id = m.zelda_id LIMIT 1) as ventilation_type,
        (SELECT description FROM brf_events e WHERE e.zelda_id = m.zelda_id ORDER BY year DESC LIMIT 1) as latest_event_description,
        (SELECT year FROM brf_events e WHERE e.zelda_id = m.zelda_id ORDER BY year DESC LIMIT 1) as latest_event_year,
        (
            SELECT json_agg(json_build_object('name', s.company_name, 'category', s.service_type, 'spend', 0))
            FROM (
                SELECT company_name, service_type
                FROM brf_suppliers s 
                WHERE s.zelda_id = m.zelda_id 
                ORDER BY company_name
                LIMIT 5
            ) s
        ) as top_suppliers,
        (
            SELECT json_agg(json_build_object(
                'date', e.year,
                'description', e.description,
                'type', e.event_type,
                'cost', e.cost
            ) ORDER BY e.year DESC NULLS LAST)
            FROM brf_events e
            WHERE e.zelda_id = m.zelda_id
        ) as events,
        (
            SELECT json_agg(json_build_object(
                'lender', l.lender,
                'amount', l.original_amount,
                'outstanding', l.original_amount,
                'interest', l.interest_rate,
                'expiry', l.maturity_date
            ))
            FROM brf_loans l
            WHERE l.zelda_id = m.zelda_id
        ) as loans,
        (
            SELECT json_agg(json_build_object(
                'category', c.category,
                'amount', c.amount_current
            ) ORDER BY c.amount_current DESC)
            FROM brf_operating_costs_detail c
            WHERE c.zelda_id = m.zelda_id
        ) as detailed_costs,
        (
            SELECT json_agg(json_build_object(
                'year', h.data_year,
                'solidarity', h.soliditet_procent,
                'debt_sqm', h.skuldsattning_per_kvm_totalyta,
                'fee_sqm', h.arsavgift_per_kvm,
                -- Additional financial metrics
                'revenue', h.nettoomsattning,
                'result', h.arsresultat,
                'savings_sqm', h.sparande_per_kvm,
                'repair_fund', h.yttre_fond
            ) ORDER BY h.data_year)
            FROM history_clean h
            WHERE h.zelda_id = m.zelda_id
        ) as history,
        (
            SELECT json_agg(DISTINCT rm.measure_type)
            FROM brf_recommended_measures rm
            WHERE rm.zelda_id = m.zelda_id
        ) as recommended_measures
    FROM brf_metadata m
    JOIN brf_property p USING(zelda_id)
    LEFT JOIN brf_metrics met USING(zelda_id)
    LEFT JOIN building_aggs b USING(zelda_id)
    LEFT JOIN brf_operational_costs oc USING(zelda_id)
    LEFT JOIN brf_governance g USING(zelda_id)
    `;
    const result = await query(sql);
    return result.rows;
}

export async function searchBrfs(term: string) {
    if (!term || term.length < 2) return [];

    // Normalize search term
    const cleanTerm = term.replace(/[\s\-_]+/g, '%');

    // Search Name, Address, District, or Technical Features
    const sql = `
        SELECT
            m.zelda_id,
            m.brf_name,
            p.address,
            p.postal_code,
            CASE 
                WHEN p.postal_code LIKE '120%' THEN 'Hammarby Sjöstad'
                WHEN p.postal_code LIKE '1154%' OR p.postal_code LIKE '1153%' THEN 'Hjorthagen'
                WHEN p.postal_code LIKE '1152%' THEN 'Norra Djurgårdsstaden'
                ELSE 'Other'
            END as district
        FROM brf_metadata m
        JOIN brf_property p USING (zelda_id)
        WHERE 
            m.brf_name ILIKE $1 OR
            p.address ILIKE $1 OR
            p.property_designation ILIKE $1 OR
            p.postal_code ILIKE $1
        LIMIT 10
    `;

    const result = await query(sql, [`%${cleanTerm}%`]);
    return result.rows;
}
