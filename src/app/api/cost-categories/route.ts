import { query } from '@/lib/db';

export async function GET() {
    try {
        const result = await query(`
            SELECT DISTINCT
                COALESCE(cn.normalized_category, d.category) as category,
                cn.category_group
            FROM brf_operating_costs_detail d
            LEFT JOIN category_normalization cn ON d.category = cn.original_category
            WHERE d.category IS NOT NULL
            ORDER BY category
        `);

        return Response.json(result.rows.map(r => ({
            category: r.category,
            group: r.category_group
        })));
    } catch (error: any) {
        console.error('Error fetching cost categories:', error);
        return Response.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}
