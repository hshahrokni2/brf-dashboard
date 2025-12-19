"use client";

import { useState, useEffect, useMemo } from "react";
import { BrfOverview } from "@/types";
import { ChevronDown, ChevronUp, X, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Filter categories type
interface FilterState {
    energyClass: string[];
    ventilationType: string[];
    lender: string[];
    supplier: string[];
    district: string[];
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

export function MapFilterPanel({ brfs, onFilterChange, filterOptions }: MapFilterPanelProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [activeFilters, setActiveFilters] = useState<FilterState>({
        energyClass: [],
        ventilationType: [],
        lender: [],
        supplier: [],
        district: [],
    });
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        energyClass: true,
        ventilationType: false,
        lender: false,
        supplier: false,
        district: false,
    });

    // Calculate matching BRFs whenever filters change
    useEffect(() => {
        const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0);

        if (!hasActiveFilters) {
            // No filters = all buildings match
            onFilterChange(new Set(brfs.map(b => b.zelda_id)));
            return;
        }

        const matchingIds = new Set<string>();

        for (const brf of brfs) {
            let matches = true;

            // Energy class filter
            if (activeFilters.energyClass.length > 0) {
                if (!brf.energy_class || !activeFilters.energyClass.includes(brf.energy_class)) {
                    matches = false;
                }
            }

            // Ventilation filter (from buildings_detail or direct property)
            if (matches && activeFilters.ventilationType.length > 0) {
                const brfVentilation = (brf as any).ventilation_type;
                if (!brfVentilation || !activeFilters.ventilationType.some(v => brfVentilation.includes(v))) {
                    matches = false;
                }
            }

            // Lender filter (from loans array)
            if (matches && activeFilters.lender.length > 0) {
                const hasLender = brf.loans?.some(l =>
                    activeFilters.lender.some(filterLender =>
                        l.lender?.toLowerCase().includes(filterLender.toLowerCase())
                    )
                );
                if (!hasLender) matches = false;
            }

            // Supplier filter
            if (matches && activeFilters.supplier.length > 0) {
                const hasSupplier = brf.top_suppliers?.some(s =>
                    activeFilters.supplier.some(filterSupplier =>
                        s.name?.toLowerCase().includes(filterSupplier.toLowerCase())
                    )
                );
                if (!hasSupplier) matches = false;
            }

            // District filter
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

    const toggleFilter = (category: keyof FilterState, value: string) => {
        setActiveFilters(prev => {
            const current = prev[category];
            const updated = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
            return { ...prev, [category]: updated };
        });
    };

    const clearAllFilters = () => {
        setActiveFilters({
            energyClass: [],
            ventilationType: [],
            lender: [],
            supplier: [],
            district: [],
        });
    };

    const activeFilterCount = Object.values(activeFilters).flat().length;
    const matchingCount = useMemo(() => {
        if (activeFilterCount === 0) return brfs.length;
        // This is calculated in useEffect, but we can estimate here
        return "...";
    }, [activeFilterCount, brfs.length]);

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const renderFilterSection = (
        title: string,
        category: keyof FilterState,
        options: string[],
        colorMap?: Record<string, string>
    ) => (
        <div className="border-t border-slate-700/50 pt-3">
            <button
                onClick={() => toggleSection(category)}
                className="flex items-center justify-between w-full text-left mb-2"
            >
                <span className="text-sm font-medium text-slate-300">{title}</span>
                <div className="flex items-center gap-2">
                    {activeFilters[category].length > 0 && (
                        <Badge className="bg-sky-500/20 text-sky-400 text-xs">
                            {activeFilters[category].length}
                        </Badge>
                    )}
                    {expandedSections[category] ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                </div>
            </button>
            {expandedSections[category] && (
                <div className="flex flex-wrap gap-1.5">
                    {options.map(option => {
                        const isActive = activeFilters[category].includes(option);
                        const colorClass = colorMap?.[option] || "";
                        return (
                            <button
                                key={option}
                                onClick={() => toggleFilter(category, option)}
                                className={`px-2 py-1 text-xs rounded-md transition-all ${isActive
                                        ? colorClass
                                            ? `${colorClass} text-white ring-2 ring-white/30`
                                            : "bg-sky-500 text-white ring-2 ring-sky-300/30"
                                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
                                    }`}
                            >
                                {option}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );

    return (
        <div className="absolute top-4 left-4 z-40">
            {/* Collapsed button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg px-4 py-3 text-slate-200 hover:bg-slate-800 hover:border-sky-500 transition-all shadow-lg flex items-center gap-2"
                >
                    <Search className="w-4 h-4 text-sky-400" />
                    <span className="font-medium">Filter Buildings</span>
                    {activeFilterCount > 0 && (
                        <Badge className="bg-sky-500 text-white">{activeFilterCount}</Badge>
                    )}
                </button>
            )}

            {/* Expanded panel */}
            {isOpen && (
                <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl shadow-xl w-72 max-h-[80vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-sky-400" />
                                <h2 className="font-bold text-slate-100">Filter Map</h2>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-slate-700 rounded"
                            >
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                        <p className="text-xs text-slate-400">
                            Select criteria to highlight matching buildings
                        </p>
                    </div>

                    {/* Active filter count & clear */}
                    {activeFilterCount > 0 && (
                        <div className="px-4 py-2 bg-sky-500/10 border-b border-slate-700/50 flex items-center justify-between">
                            <span className="text-sm text-sky-400">
                                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                            </span>
                            <button
                                onClick={clearAllFilters}
                                className="text-xs text-slate-400 hover:text-white underline"
                            >
                                Clear all
                            </button>
                        </div>
                    )}

                    {/* Filter sections */}
                    <div className="p-4 space-y-3 overflow-y-auto flex-1">
                        {renderFilterSection("Energy Class", "energyClass", filterOptions.energyClasses, ENERGY_COLORS)}
                        {filterOptions.ventilationTypes.length > 0 &&
                            renderFilterSection("Ventilation", "ventilationType", filterOptions.ventilationTypes)}
                        {filterOptions.lenders.length > 0 &&
                            renderFilterSection("Bank / Lender", "lender", filterOptions.lenders)}
                        {filterOptions.suppliers.length > 0 &&
                            renderFilterSection("Supplier", "supplier", filterOptions.suppliers.slice(0, 15))}
                        {renderFilterSection("District", "district", filterOptions.districts)}
                    </div>
                </div>
            )}
        </div>
    );
}
