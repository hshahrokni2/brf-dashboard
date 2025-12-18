import { calculateSavingsPotential } from "@/lib/savings";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const zeldaId = searchParams.get('brfId');

    if (!zeldaId) {
        return Response.json({ error: 'brfId parameter required' }, { status: 400 });
    }

    try {
        const savings = await calculateSavingsPotential(zeldaId);
        return Response.json(savings);
    } catch (error: any) {
        console.error('Error calculating savings potential:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
