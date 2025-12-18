import { query } from './db';

// Event interfaces
export interface BrfEvent {
    id: number;
    zelda_id: string;
    brf_name: string;
    district: string | null;
    event_type: string;
    description: string;
    year: number | null;
    cost: number | null;
}

export interface EventTypeCount {
    event_type: string;
    count: number;
    icon: string;
    color: string;
}

// Event type icons and colors
const EVENT_TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
    'fee_increase': { icon: '🔼', color: '#f97316' },
    'major_maintenance': { icon: '🔧', color: '#3b82f6' },
    'renovation': { icon: '🏗️', color: '#8b5cf6' },
    'refinancing': { icon: '💰', color: '#22c55e' },
    'new_loan': { icon: '🏦', color: '#06b6d4' },
    'contract_change': { icon: '📄', color: '#64748b' },
    'board_change': { icon: '👥', color: '#ec4899' },
    'other': { icon: '📌', color: '#94a3b8' },
};

// Get all events with filters
export async function getEvents(options?: {
    eventType?: string;
    zeldaId?: string;
    district?: string;
    year?: number;
    limit?: number;
}): Promise<BrfEvent[]> {
    let sql = `
        SELECT 
            e.id,
            e.zelda_id,
            m.brf_name,
            m.district,
            e.event_type,
            e.description,
            e.year,
            e.cost
        FROM brf_events e
        JOIN brf_metadata m ON e.zelda_id = m.zelda_id
        WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (options?.eventType) {
        sql += ` AND e.event_type = $${paramIndex++}`;
        params.push(options.eventType);
    }
    if (options?.zeldaId) {
        sql += ` AND e.zelda_id = $${paramIndex++}`;
        params.push(options.zeldaId);
    }
    if (options?.district) {
        sql += ` AND m.district = $${paramIndex++}`;
        params.push(options.district);
    }
    if (options?.year) {
        sql += ` AND e.year = $${paramIndex++}`;
        params.push(options.year);
    }

    sql += ` ORDER BY e.year DESC NULLS LAST, e.id DESC`;

    if (options?.limit) {
        sql += ` LIMIT $${paramIndex}`;
        params.push(options.limit);
    }

    const result = await query(sql, params);
    return result.rows;
}

// Get event type counts
export async function getEventTypeCounts(): Promise<EventTypeCount[]> {
    const sql = `
        SELECT 
            event_type,
            COUNT(*) as count
        FROM brf_events
        GROUP BY event_type
        ORDER BY count DESC
    `;

    const result = await query(sql, []);
    return result.rows.map(row => ({
        event_type: row.event_type,
        count: parseInt(row.count),
        icon: EVENT_TYPE_CONFIG[row.event_type]?.icon || '📌',
        color: EVENT_TYPE_CONFIG[row.event_type]?.color || '#94a3b8'
    }));
}

// Get events grouped by year
export async function getEventsByYear(): Promise<{ year: number; count: number }[]> {
    const sql = `
        SELECT 
            year,
            COUNT(*) as count
        FROM brf_events
        WHERE year IS NOT NULL AND year > 1900
        GROUP BY year
        ORDER BY year DESC
    `;

    const result = await query(sql, []);
    return result.rows.map(row => ({
        year: parseInt(row.year),
        count: parseInt(row.count)
    }));
}

// Get events with financial impact
export async function getEventsWithCost(limit: number = 20): Promise<BrfEvent[]> {
    const sql = `
        SELECT 
            e.id,
            e.zelda_id,
            m.brf_name,
            m.district,
            e.event_type,
            e.description,
            e.year,
            e.cost
        FROM brf_events e
        JOIN brf_metadata m ON e.zelda_id = m.zelda_id
        WHERE e.cost IS NOT NULL AND e.cost > 0
        ORDER BY e.cost DESC
        LIMIT $1
    `;

    const result = await query(sql, [limit]);
    return result.rows;
}

// Get recent fee increases
export async function getRecentFeeIncreases(limit: number = 10): Promise<BrfEvent[]> {
    const sql = `
        SELECT 
            e.id,
            e.zelda_id,
            m.brf_name,
            m.district,
            e.event_type,
            e.description,
            e.year,
            e.cost
        FROM brf_events e
        JOIN brf_metadata m ON e.zelda_id = m.zelda_id
        WHERE e.event_type = 'fee_increase'
        ORDER BY e.year DESC NULLS LAST
        LIMIT $1
    `;

    const result = await query(sql, [limit]);
    return result.rows;
}

// Get event stats
export async function getEventStats() {
    const sql = `
        SELECT 
            COUNT(*) as total_events,
            COUNT(DISTINCT zelda_id) as brfs_with_events,
            COUNT(DISTINCT event_type) as event_types,
            MIN(year) as earliest_year,
            MAX(year) as latest_year,
            SUM(CASE WHEN cost IS NOT NULL THEN cost ELSE 0 END) as total_cost
        FROM brf_events
    `;

    const result = await query(sql, []);
    return result.rows[0];
}
