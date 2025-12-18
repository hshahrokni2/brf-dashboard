"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function CategorySelector({
    categories,
    currentPath = "/timeline"
}: {
    categories: string[];
    currentPath?: string;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedCategory = searchParams.get('category') || 'Heating';

    const handleCategoryChange = (category: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('category', category);
        router.push(`${currentPath}?${params.toString()}`);
    };

    return (
        <div>
            <label className="text-sm text-slate-400 font-medium mb-2 block">
                Select Cost Category:
            </label>
            <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
            >
                {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
        </div>
    );
}
