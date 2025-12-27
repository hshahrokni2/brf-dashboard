
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const total = await query('SELECT COUNT(*) FROM brf_metadata');
        const withGeom = await query('SELECT COUNT(*) FROM buildings WHERE geometry IS NOT NULL');
        const withCoords = await query('SELECT COUNT(*) FROM brf_property WHERE latitude IS NOT NULL AND longitude IS NOT NULL');

        // Check specifically for the new ones mentioned earlier
        const sampleCheck = await query(`
            SELECT m.brf_name, m.district, p.latitude, p.longitude, b.geometry IS NOT NULL as has_geometry
            FROM brf_metadata m
            LEFT JOIN brf_property p ON m.zelda_id = p.zelda_id
            LEFT JOIN buildings b ON m.zelda_id = b.zelda_id
            WHERE m.created_at > NOW() - INTERVAL '7 days'
            LIMIT 10
        `);

        return NextResponse.json({
            stats: {
                total: total.rows[0].count,
                withGeometry3D: withGeom.rows[0].count,
                withCoordinates: withCoords.rows[0].count,
            },
            recentParams: sampleCheck.rows
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
