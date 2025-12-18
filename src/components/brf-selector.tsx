"use client";

import { useRouter } from "next/navigation";

export function BrfSelector({
    allBrfs,
    selectedBrfId
}: {
    allBrfs: Array<{ zelda_id: string; brf_name: string }>;
    selectedBrfId?: string | null;
}) {
    const router = useRouter();

    return (
        <select
            name="brf"
            defaultValue={selectedBrfId || ''}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
            onChange={(e) => {
                if (e.target.value) {
                    router.push(`/benchmarking?brf=${e.target.value}`);
                }
            }}
        >
            <option value="">-- Select a BRF to compare --</option>
            {allBrfs.map((brf) => (
                <option key={brf.zelda_id} value={brf.zelda_id}>
                    {brf.brf_name}
                </option>
            ))}
        </select>
    );
}
