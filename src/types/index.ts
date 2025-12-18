export interface BrfMetadata {
    zelda_id: string;
    brf_name: string;
    organization_number: string;
    fiscal_year: number;
}

export interface BrfProperty {
    zelda_id: string;
    address: string;
    city: string;
    property_designation: string;
    built_year: number;
    total_apartments: number;
    total_area_sqm: number;
    latitude: number | null;
    longitude: number | null;
    postal_code?: string; // Inferred from requirements
}

export interface BrfMetrics {
    zelda_id: string;
    solidarity_percent: number | null;
    debt_per_sqm_total: number | null;
    interest_cost_per_sqm: number | null;
}

export interface BrfOperationalCosts {
    zelda_id: string;
    electricity_cost: number;
    heating_cost: number | null;
    water_cost: number | null;
    insurance_cost: number;
    waste_cost: number | null;
    cleaning_cost: number | null;
    // New fields
    auditor: string | null;
    primary_auditor_firm: string | null;
    total_apartments: number | null;
    heating_type: string | null;
    chairman: string | null;
    board_size: number | null;
    latest_event_description: string | null;
    latest_event_year: number | null;
    top_suppliers: Array<{ name: string, category: string, spend: number }> | null;
    total_operational_costs: number;
    maintenance_cost?: number; // Inferred from SQL query
}

export interface Building {
    zelda_id: string;
    fastighetsbeteckning: string;
    energy_class: string | null;
    energy_performance_kwh_sqm: number | null;
    fjarrvarme_kwh: number | null;
    building_year: number | null;
    atemp_sqm: number | null;
}

export interface BrfLoan {
    zelda_id: string;
    lender: string;
    amount: number;
    interest_rate: number;
    maturity_date: string;
}

export interface BrfSupplier {
    zelda_id: string;
    category: string;
    supplier_name: string;
    amount: number;
}

export interface BrfBoardMember {
    zelda_id: string;
    name: string;
    role: string;
    elected_year: number;
}

export interface BrfEvent {
    zelda_id: string;
    event_type: string;
    description: string;
    year: number;
    cost: number;
}

// Joined types for Views
export interface BrfSummary extends BrfMetadata {
    district: string;
    energy_class: string | null;
    solidarity_percent: number | null;
    debt_per_sqm_total: number | null;
    total_area_sqm: number;
}

export interface BrfOverview {
    zelda_id: string;
    brf_name: string;
    property_designation: string;
    district: string;
    energy_class: string;
    energy_performance_kwh_sqm: number | null; // Added
    solidarity_percent: number | null;
    debt_per_sqm_total: number | null;
    built_year: number | null;
    height_m: number | null; // Added
    latitude: number | null;
    longitude: number | null;
    address?: string; // Optional if not always present in fetch
    // New Detailed Fields
    auditor: string | null;
    primary_auditor_firm: string | null;
    total_apartments: number | null;
    heating_type: string | null;
    chairman: string | null;
    board_size: number | null;
    latest_event_description: string | null;
    latest_event_date: Date | string | null;
    top_suppliers: Array<{ name: string, category: string, spend: number }> | null;
    electricity_cost: number | null;
    heating_cost: number | null;
    water_cost: number | null;
    // Granular Costs
    site_leasehold_fee?: number;
    elevator_cost?: number;
    property_tax?: number;

    // Property Characteristics (Phase 8.3)
    land_ownership_type?: string | null;
    commercial_area_sqm?: number | null;
    garage_count?: number | null;
    year_of_renovation?: number | null;
    construction_method?: string | null;
    facade_material?: string | null;
    roof_type?: string | null;
    total_area_sqm?: number | null;
    residential_area_sqm?: number | null;
    number_of_buildings?: number | null;
    plot_area_sqm?: number | null;
    roof_area_sqm?: number | null;
    // History - Expanded Multi-Year Financial Data
    history: Array<{
        year: number;
        solidarity: number | null;
        debt_sqm: number | null;
        fee_sqm: number | null;
        // Additional financial metrics (Phase 8.1)
        revenue?: number | null;          // nettoomsattning
        result?: number | null;           // arsresultat
        savings_sqm?: number | null;      // sparande_per_kvm
        repair_fund?: number | null;      // yttre_fond
    }> | null;

    // New "Real Deal" Fields
    events: Array<{ date: string | null, description: string, type: string }> | null;

    // Loans (Phase 8.4 - Expanded)
    loans: Array<{
        lender: string;
        amount: number;
        outstanding?: number | null;
        interest: number;
        expiry: string | null;
        loan_type?: string | null;
        term_years?: number | null;
        collateral?: string | null;
        penalty?: number | null;
    }> | null;
    detailed_costs: Array<{ category: string, amount: number }> | null;

    // Building-Level Details (Complete Granularity)
    buildings_detail: Array<{
        building_id: number;
        address?: string | null;
        floors?: number | null;
        built_year?: number | null;
        last_renovation?: number | null;
        facade_condition?: string | null;
        facade_material?: string | null;
        window_type?: string | null;
        ventilation_type?: string | null;
        accessibility_features?: string | null;
        solar_panels?: boolean | null;
        energy_class?: string | null;
        heating_type?: string | null;
    }> | null;
    // Governance Metrics (Phase 8.5)
    antal_styrelsemoten?: number | null;  // Board meeting count
    revisionstyp?: string | null;         // Audit type
    firmateckningsratt?: string | null;   // Signing authority
    externa_konsulter?: string | null;    // External consultants
    board_election_year?: number | null;  // Last board election
}

export interface BrfComparisonData {
    zelda_id: string;
    brf_name: string;
    district: string;
    built_year?: number;
    solidarity_percent?: number;
    debt_sqm?: number;
    fee_sqm?: number;
    total_costs_sqm?: number;
    heating_cost?: number;
    water_cost?: number;
    electricity_cost?: number;
    waste_cost?: number;
    cleaning_cost?: number;
    elevator_cost?: number;
    property_tax?: number;
}
