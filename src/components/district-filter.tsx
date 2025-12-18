"use client";

import { DISTRICTS, District } from "@/lib/districts";
import { useRouter, useSearchParams } from "next/navigation";

export function DistrictFilter({ currentPath = "/benchmarking" }: { currentPath?: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedDistrict = searchParams.get('district');
    const selectedBrf = searchParams.get('brf');

    const handleDistrictChange = (district: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (district === "all") {
            params.delete('district');
        } else {
            params.set('district', district);
        }

        router.push(`${currentPath}?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-3">
            <label className="text-sm text-slate-400 font-medium">District:</label>
            <select
                value={selectedDistrict || "all"}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
            >
                <option value="all">All Districts</option>
                {DISTRICTS.map(district => (
                    <option key={district} value={district}>
                        {district}
                    </option>
                ))}
            </select>
        </div>
    );
}
