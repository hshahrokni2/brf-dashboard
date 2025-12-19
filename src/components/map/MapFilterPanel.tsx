"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { BrfOverview } from "@/types";
import { Search, X, Building2, Zap, Wind, Landmark, Users, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FilterState {
    energyClass: string[];
    ventilationType: string[];
    lender: string[];
    supplier: string[];
    district: string[];
}

interface SearchResult {
    value: string;
    category: keyof FilterState;
    categoryLabel: string;
    icon: React.ReactNode;
    matchCount: number;
}

interface MapFilterPanelProps {
    brfs: BrfOverview[];
    onFilterChange: (matchingIds: Set<string>) => void;
    filterOptions: {
        energyClasses: string[];
        ventilationTypes: string[];
        lenders: string[];
        suppliers: string[];
        districts: string[];
    };
}

const ENERGY_COLORS: Record<string, string> = {
    A: "bg-emerald-500",
    B: "bg-emerald-400",
    C: "bg-lime-500",
    D: "bg-amber-400",
    E: "bg-orange-400",
    F: "bg-red-500",
    G: "bg-red-600",
};

const CATEGORY_CONFIG: Record<keyof FilterState, { label: string; icon: React.ReactNode }> = {
    energyClass: { label: "Energy Class", icon: <Zap className="w-3 h-3" /> },
    ventilationType: { label: "Ventilation", icon: <Wind className="w-3 h-3" /> },
    lender: { label: "Bank / Lender", icon: <Landmark className="w-3 h-3" /> },
    supplier: { label: "Supplier", icon: <Users className="w-3 h-3" /> },
    district: { label: "District", icon: <MapPin className="w-3 h-3" /> },
};

export function MapFilterPanel({ brfs, onFilterChange, filterOptions }: MapFilterPanelProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilters, setActiveFilters] = useState<FilterState>({
        energyClass: [],
        ventilationType: [],
        lender: [],
        supplier: [],
        district: [],
    });
    const [showResults, setShowResults] = useState(false);

    // Build searchable index with match counts
    const searchIndex = useMemo(() => {
        const index: SearchResult[] = [];

        // Energy classes
        filterOptions.energyClasses.forEach(val => {
            const count = brfs.filter(b => b.energy_class === val).length;
            index.push({
                value: val,
                category: "energyClass",
                categoryLabel: "Energy Class",
                icon: <Zap className="w-3 h-3 text-amber-400" />,
                matchCount: count
            });
        });

        // Ventilation types
        filterOptions.ventilationTypes.forEach(val => {
            const count = brfs.filter(b => (b as any).ventilation_type?.includes(val)).length;
            index.push({
                value: val,
                category: "ventilationType",
                categoryLabel: "Ventilation",
                icon: <Wind className="w-3 h-3 text-sky-400" />,
                matchCount: count
            });
        });

        // Lenders
        filterOptions.lenders.forEach(val => {
            const count = brfs.filter(b => b.loans?.some(l => l.lender === val)).length;
            index.push({
                value: val,
                category: "lender",
                categoryLabel: "Bank / Lender",
                icon: <Landmark className="w-3 h-3 text-emerald-400" />,
                matchCount: count
            });
        });

        // Suppliers
        filterOptions.suppliers.forEach(val => {
            const count = brfs.filter(b => b.top_suppliers?.some(s => s.name === val)).length;
            index.push({
                value: val,
                category: "supplier",
                categoryLabel: "Supplier",
                icon: <Users className="w-3 h-3 text-purple-400" />,
                matchCount: count
            });
        });

        // Districts
        filterOptions.districts.forEach(val => {
            const count = brfs.filter(b => b.district === val).length;
            index.push({
                value: val,
                category: "district",
                categoryLabel: "District",
                icon: <MapPin className="w-3 h-3 text-rose-400" />,
                matchCount: count
            });
        });

        return index;
    }, [brfs, filterOptions]);

    // Search results based on query
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];

        const query = searchQuery.toLowerCase();
        return searchIndex
            .filter(item => item.value.toLowerCase().includes(query))
            .sort((a, b) => {
                // Prioritize exact matches
                const aExact = a.value.toLowerCase() === query;
                const bExact = b.value.toLowerCase() === query;
                if (aExact && !bExact) return -1;
                if (bExact && !aExact) return 1;
                // Then by match count
                return b.matchCount - a.matchCount;
            })
            .slice(0, 8);
    }, [searchQuery, searchIndex]);

    // Calculate matching BRFs
    useEffect(() => {
        const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0);

        if (!hasActiveFilters) {
            onFilterChange(new Set(brfs.map(b => b.zelda_id)));
            return;
        }

        const matchingIds = new Set<string>();

        for (const brf of brfs) {
            let matches = true;

            if (activeFilters.energyClass.length > 0) {
                if (!brf.energy_class || !activeFilters.energyClass.includes(brf.energy_class)) {
                    matches = false;
                }
            }

            if (matches && activeFilters.ventilationType.length > 0) {
                const brfVentilation = (brf as any).ventilation_type;
                if (!brfVentilation || !activeFilters.ventilationType.some(v => brfVentilation.includes(v))) {
                    matches = false;
                }
            }

            if (matches && activeFilters.lender.length > 0) {
                const hasLender = brf.loans?.some(l =>
                    activeFilters.lender.some(filterLender =>
                        l.lender?.toLowerCase().includes(filterLender.toLowerCase())
                    )
                );
                if (!hasLender) matches = false;
            }

            if (matches && activeFilters.supplier.length > 0) {
                const hasSupplier = brf.top_suppliers?.some(s =>
                    activeFilters.supplier.some(filterSupplier =>
                        s.name?.toLowerCase().includes(filterSupplier.toLowerCase())
                    )
                );
                if (!hasSupplier) matches = false;
            }

            if (matches && activeFilters.district.length > 0) {
                if (!activeFilters.district.includes(brf.district)) {
                    matches = false;
                }
            }

            if (matches) {
                matchingIds.add(brf.zelda_id);
            }
        }

        onFilterChange(matchingIds);
    }, [activeFilters, brfs, onFilterChange]);

    const addFilter = (result: SearchResult) => {
        setActiveFilters(prev => {
            const current = prev[result.category];
            if (current.includes(result.value)) return prev;
            return { ...prev, [result.category]: [...current, result.value] };
        });
        setSearchQuery("");
        setShowResults(false);
    };

    const removeFilter = (category: keyof FilterState, value: string) => {
        setActiveFilters(prev => ({
            ...prev,
            [category]: prev[category].filter(v => v !== value)
        }));
    };

    const clearAllFilters = () => {
        setActiveFilters({
            energyClass: [],
            ventilationType: [],
            lender: [],
            supplier: [],
            district: [],
        });
        setSearchQuery("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && searchResults.length > 0) {
            addFilter(searchResults[0]);
        }
        if (e.key === "Escape") {
            setSearchQuery("");
            setShowResults(false);
        }
    };

    const activeFilterCount = Object.values(activeFilters).flat().length;
    const matchingBrfCount = useMemo(() => {
        if (activeFilterCount === 0) return brfs.length;
        // Count will be calculated by the effect, for now show total
        return brfs.filter(brf => {
            let matches = true;
            if (activeFilters.energyClass.length > 0 && !activeFilters.energyClass.includes(brf.energy_class)) matches = false;
            if (activeFilters.district.length > 0 && !activeFilters.district.includes(brf.district)) matches = false;
            // Simplified count
            return matches;
        }).length;
    }, [activeFilters, brfs, activeFilterCount]);

    return (
        <div className="absolute top-4 left-4 z-40 w-80">
            {/* Main Search Card */}
            <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                {/* Title Header */}
                <div className="p-3 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
                    <h1 className="text-lg font-bold bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                        3D City Explorer
                    </h1>
                    <p className="text-xs text-slate-400">{brfs.length} Properties • Smart Search</p>
                </div>

                {/* Search Input */}
                <div className="p-3 border-b border-slate-700/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowResults(true);
                            }}
                            onFocus={() => setShowResults(true)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search: FTX, Handelsbanken, B..."
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-800/80 border border-slate-600 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => { setSearchQuery(""); setShowResults(false); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                                <X className="w-4 h-4 text-slate-400 hover:text-white" />
                            </button>
                        )}
                    </div>

                    {/* Search Results Dropdown */}
                    {showResults && searchResults.length > 0 && (
                        <div className="mt-2 bg-slate-800 border border-slate-600 rounded-lg overflow-hidden">
                            {searchResults.map((result, i) => (
                                <button
                                    key={`${result.category}-${result.value}`}
                                    onClick={() => addFilter(result)}
                                    className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-slate-700 text-left ${i === 0 ? 'bg-slate-700/50' : ''
                                        }`}
                                >
                                    {result.icon}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-slate-100 truncate">{result.value}</div>
                                        <div className="text-xs text-slate-400">{result.categoryLabel}</div>
                                    </div>
                                    <Badge className="bg-slate-600 text-slate-300 text-xs">
                                        {result.matchCount}
                                    </Badge>
                                </button>
                            ))}
                            {searchResults.length > 0 && (
                                <div className="px-3 py-1.5 text-xs text-slate-500 bg-slate-800/50 border-t border-slate-700">
                                    Press Enter to select first result
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Active Filters */}
                {activeFilterCount > 0 && (
                    <div className="p-3 bg-slate-800/30">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-400">
                                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} • {matchingBrfCount} buildings
                            </span>
                            <button
                                onClick={clearAllFilters}
                                className="text-xs text-sky-400 hover:text-sky-300"
                            >
                                Clear all
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {Object.entries(activeFilters).map(([category, values]) =>
                                values.map((value: string) => (
                                    <button
                                        key={`${category}-${value}`}
                                        onClick={() => removeFilter(category as keyof FilterState, value)}
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all group ${category === 'energyClass'
                                            ? `${ENERGY_COLORS[value] || 'bg-slate-600'} text-white`
                                            : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                            }`}
                                    >
                                        {CATEGORY_CONFIG[category as keyof FilterState]?.icon}
                                        <span>{value}</span>
                                        <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Quick Filters (collapsed by default when no active filters) */}
                {activeFilterCount === 0 && !searchQuery && (
                    <div className="p-3 border-t border-slate-700/50">
                        <div className="text-xs text-slate-500 mb-2">Quick filters:</div>
                        <div className="flex flex-wrap gap-1">
                            {filterOptions.energyClasses.slice(0, 7).map(ec => (
                                <button
                                    key={ec}
                                    onClick={() => addFilter({ value: ec, category: 'energyClass', categoryLabel: 'Energy', icon: null, matchCount: 0 })}
                                    className={`w-7 h-7 rounded-md text-xs font-bold text-white ${ENERGY_COLORS[ec] || 'bg-slate-600'} hover:ring-2 hover:ring-white/30 transition-all`}
                                >
                                    {ec}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
