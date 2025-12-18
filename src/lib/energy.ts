import { query } from './db';

// Energy Declaration interfaces
export interface EnergyDeclaration {
    zelda_id: string;
    brf_name: string;
    formular_id: number;
    property_designation: string | null;
    address: string | null;
    postal_code: string | null;
    city: string | null;
    energy_class: string;
    energy_kwh_per_sqm: number;
    primary_energy_2020: number | null;
    construction_year: number | null;
    heated_area_sqm: number | null;
    num_apartments: number | null;
    building_type: string | null;
    building_complexity: string | null;
    num_stairwells: number | null;
    basement_floors: number | null;
    ventilation_type: string | null;
    site_inspected: boolean | null;
    expert_qualification: string | null;
    district_heating_uppv: number | null;
    district_heating_vv: number | null;
    solar_kwh: number | null;
    heat_pump_ground: number | null;
    heat_pump_exhaust: number | null;
    valid_until: string | null;
}

export interface RecommendedMeasure {
    zelda_id: string;
    brf_name: string;
    measure_type: string;
    measure_name: string;
    estimated_energy_reduction_kwh: number | null;
    estimated_cost_factor: number | null;
    investment_level: 'Låg' | 'Medel' | 'Hög';
}

export interface EnergyClassDistribution {
    energy_class: string;
    count: number;
    color: string;
}

export interface VentilationDistribution {
    ventilation_type: string;
    count: number;
}

// Energy class colors
const ENERGY_CLASS_COLORS: Record<string, string> = {
    'A': '#22c55e',
    'B': '#22c55e',
    'C': '#84cc16',
    'D': '#eab308',
    'E': '#f97316',
    'F': '#ef4444',
    'G': '#dc2626',
};

// Get all energy declarations with BRF names
export async function getEnergyDeclarations(): Promise<EnergyDeclaration[]> {
    const sql = `
        SELECT 
            ed.zelda_id,
            m.brf_name,
            ed.formular_id,
            ed.property_designation,
            ed.address,
            ed.postal_code,
            ed.city,
            ed.energy_class,
            ed.energy_kwh_per_sqm,
            ed.primary_energy_2020,
            ed.construction_year,
            ed.heated_area_sqm,
            ed.num_apartments,
            ed.building_type,
            ed.building_complexity,
            ed.num_stairwells,
            ed.basement_floors,
            ed.ventilation_type,
            ed.site_inspected,
            ed.expert_qualification,
            ed.district_heating_uppv,
            ed.district_heating_vv,
            ed.solar_kwh,
            ed.heat_pump_ground,
            ed.heat_pump_exhaust,
            ed.valid_until
        FROM brf_energy_declarations ed
        JOIN brf_metadata m ON ed.zelda_id = m.zelda_id
        ORDER BY ed.energy_class, ed.energy_kwh_per_sqm
    `;

    const result = await query(sql, []);
    return result.rows;
}

// Get single BRF energy declaration with all 32 columns
export async function getEnergyDeclarationByBrf(zeldaId: string): Promise<EnergyDeclaration | null> {
    const sql = `
        SELECT 
            ed.*,
            m.brf_name
        FROM brf_energy_declarations ed
        JOIN brf_metadata m ON ed.zelda_id = m.zelda_id
        WHERE ed.zelda_id = $1
        ORDER BY ed.formular_id DESC
        LIMIT 1
    `;

    const result = await query(sql, [zeldaId]);
    return result.rows[0] || null;
}

// Get energy class distribution with colors
export async function getEnergyClassDistribution(): Promise<EnergyClassDistribution[]> {
    const sql = `
        SELECT 
            energy_class,
            COUNT(*) as count
        FROM brf_energy_declarations
        WHERE energy_class IS NOT NULL
        GROUP BY energy_class
        ORDER BY energy_class
    `;

    const result = await query(sql, []);
    return result.rows.map(row => ({
        energy_class: row.energy_class,
        count: parseInt(row.count),
        color: ENERGY_CLASS_COLORS[row.energy_class] || '#64748b'
    }));
}

// Get ventilation type distribution
export async function getVentilationDistribution(): Promise<VentilationDistribution[]> {
    const sql = `
        SELECT 
            ventilation_type,
            COUNT(*) as count
        FROM brf_energy_declarations
        WHERE ventilation_type IS NOT NULL
        GROUP BY ventilation_type
        ORDER BY count DESC
    `;

    const result = await query(sql, []);
    return result.rows.map(row => ({
        ventilation_type: row.ventilation_type,
        count: parseInt(row.count)
    }));
}

// Get recommended measures for a BRF or all BRFs
export async function getRecommendedMeasures(zeldaId?: string): Promise<RecommendedMeasure[]> {
    const sql = `
        SELECT 
            rm.zelda_id,
            m.brf_name,
            rm.measure_type,
            rm.measure_name,
            rm.estimated_energy_reduction_kwh,
            rm.estimated_cost_factor,
            CASE 
                WHEN rm.estimated_cost_factor < 0.5 THEN 'Låg'
                WHEN rm.estimated_cost_factor < 1.0 THEN 'Medel'
                ELSE 'Hög'
            END as investment_level
        FROM brf_recommended_measures rm
        JOIN brf_metadata m ON rm.zelda_id = m.zelda_id
        ${zeldaId ? 'WHERE rm.zelda_id = $1' : ''}
        ORDER BY rm.estimated_energy_reduction_kwh DESC NULLS LAST
    `;

    const result = await query(sql, zeldaId ? [zeldaId] : []);
    return result.rows;
}

// Get aggregated savings potential
export async function getAggregatedSavingsPotential() {
    const sql = `
        SELECT 
            COUNT(DISTINCT rm.zelda_id) as brfs_with_measures,
            COUNT(*) as total_measures,
            SUM(rm.estimated_energy_reduction_kwh) as total_savings_kwh,
            COUNT(DISTINCT rm.measure_type) as unique_measure_types
        FROM brf_recommended_measures rm
        WHERE rm.estimated_energy_reduction_kwh IS NOT NULL
    `;

    const result = await query(sql, []);
    return result.rows[0];
}

// Get top measures by impact
export async function getTopMeasuresByImpact(limit: number = 10) {
    const sql = `
        SELECT 
            rm.measure_name,
            rm.measure_type,
            COUNT(*) as brf_count,
            SUM(rm.estimated_energy_reduction_kwh) as total_savings_kwh,
            AVG(rm.estimated_cost_factor) as avg_cost_factor
        FROM brf_recommended_measures rm
        WHERE rm.estimated_energy_reduction_kwh IS NOT NULL
        GROUP BY rm.measure_name, rm.measure_type
        ORDER BY total_savings_kwh DESC
        LIMIT $1
    `;

    const result = await query(sql, [limit]);
    return result.rows;
}

// Get energy leaderboard (best and worst performers)
export async function getEnergyLeaderboard(order: 'ASC' | 'DESC' = 'ASC', limit: number = 20) {
    const sql = `
        SELECT 
            ed.zelda_id,
            m.brf_name,
            ed.energy_class,
            ed.energy_kwh_per_sqm,
            ed.ventilation_type,
            ed.heated_area_sqm,
            ed.num_apartments,
            (SELECT COUNT(*) FROM brf_recommended_measures rm WHERE rm.zelda_id = ed.zelda_id) as measure_count
        FROM brf_energy_declarations ed
        JOIN brf_metadata m ON ed.zelda_id = m.zelda_id
        WHERE ed.energy_kwh_per_sqm IS NOT NULL
        ORDER BY ed.energy_kwh_per_sqm ${order}
        LIMIT $1
    `;

    const result = await query(sql, [limit]);
    return result.rows;
}
