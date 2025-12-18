// District names found in Stockholm area
export const DISTRICTS = [
    'Hjorthagen',
    'Norra Djurgårdsstaden',
    'Hammarby Sjöstad',
    'Sickla',
    'Henriksdal',
] as const;

export type District = typeof DISTRICTS[number];

// Normalize district names from database (case-insensitive, partial match)
export function normalizeDistrict(area?: string | null): District | null {
    if (!area) return null;

    const areaLower = area.toLowerCase();

    if (areaLower.includes('hjorthagen')) return 'Hjorthagen';
    if (areaLower.includes('norra djurgård') || areaLower.includes('djurgårdsstaden')) return 'Norra Djurgårdsstaden';
    if (areaLower.includes('hammarby') || areaLower.includes('sjöstad')) return 'Hammarby Sjöstad';
    if (areaLower.includes('sickla')) return 'Sickla';
    if (areaLower.includes('henriksdal')) return 'Henriksdal';

    return null;
}
