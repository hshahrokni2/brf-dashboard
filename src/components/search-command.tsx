"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, MapPin, Building2, Loader2, X } from "lucide-react";
import { searchAction } from "@/app/actions";
import { cn } from "@/lib/utils";

// Interface for search results based on data.ts return
interface SearchResult {
    zelda_id: string;
    brf_name: string;
    address: string;
    postal_code: string;
    district: string;
}

export function SearchCommand() {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [loading, setLoading] = React.useState(false);

    // Toggle on Command+K
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        const openEvent = () => setOpen(true);

        document.addEventListener("keydown", down);
        window.addEventListener("open-search", openEvent);
        return () => {
            document.removeEventListener("keydown", down);
            window.removeEventListener("open-search", openEvent);
        };
    }, []);

    // Debounced search
    React.useEffect(() => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await searchAction(query);
                setResults(data as SearchResult[]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm animate-in fade-in-0 flex items-start justify-center pt-[20vh]">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/10 relative">
                <Command className="bg-transparent" label="Global Search">
                    <div className="flex items-center border-b border-slate-800 px-3" cmdk-input-wrapper="">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-slate-400" />
                        <Command.Input
                            value={query}
                            onValueChange={setQuery}
                            placeholder="Search BRF, Address, or District..."
                            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin text-sky-500" />}
                        <button onClick={() => setOpen(false)} className="ml-2 text-slate-500 hover:text-slate-300">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
                        {!loading && results.length === 0 && query.length >= 2 && (
                            <div className="py-6 text-center text-sm text-slate-500">No results found.</div>
                        )}

                        {results.length > 0 && (
                            <Command.Group heading="Building Societies">
                                {results.map((item) => (
                                    <Command.Item
                                        key={item.zelda_id}
                                        value={`${item.brf_name} ${item.address}`}
                                        onSelect={() => {
                                            setOpen(false);
                                            // Navigation to Dashboard with Zelda ID parameter
                                            // This allows the map to read it and zoom
                                            const targetPath = window.location.pathname === '/map' ? '/map' : '/';
                                            router.push(`${targetPath}?zelda_id=${item.zelda_id}`);
                                        }}
                                        className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none bg-slate-900 data-[selected='true']:bg-sky-900/40 data-[selected='true']:text-sky-200 text-slate-300 transition-colors duration-150 group"
                                    >
                                        <Building2 className="mr-2 h-4 w-4 text-emerald-500/70" />
                                        <div className="flex flex-col">
                                            <span className="font-medium">{item.brf_name}</span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {item.address}, {item.district}
                                            </span>
                                        </div>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}
                    </Command.List>
                </Command>
            </div>
        </div>
    );
}
