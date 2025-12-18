import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const result = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'multi_year'
      ORDER BY ordinal_position
    `);

        return NextResponse.json({ columns: result.rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
