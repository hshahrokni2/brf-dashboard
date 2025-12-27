"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Map, { NavigationControl, Popup, Source, Layer, MapRef } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { BrfOverview } from "@/types";
import { Badge } from "../ui/badge";
import { DrillDownPanel } from "@/components/drill-down-panel";
import { Search, X, Zap, Wind, Landmark, Users, MapPin } from "lucide-react";

// Energy Class Colors (North Modern Neon)
const ENERGY_COLORS: Record<string, string> = {
    A: "#10b981", // Emerald 500
    B: "#34d399", // Emerald 400
    C: "#84cc16", // Lime 500
    D: "#fbbf24", // Amber 400
    E: "#fb923c", // Orange 400
    F: "#ef4444", // Red 500
    G: "#dc2626", // Red 600
    Unknown: "#64748b", // Slate 500
};

const GRAYED_OUT_COLOR = "#1e293b"; // Slate 800 - dimmed

const ENERGY_BG_COLORS: Record<string, string> = {
    A: "bg-emerald-500",
    B: "bg-emerald-400",
    C: "bg-lime-500",
    D: "bg-amber-400",
    E: "bg-orange-400",
    F: "bg-red-500",
    G: "bg-red-600",
};

// Translation from Boverket technical field names to readable Swedish
const MEASURE_TRANSLATIONS: Record<string, string> = {
    "AtgForslagByteVarmepump": "Byta värmepump",
    "AtgForslagBegrTemp": "Sänka inomhustemperatur",
    "AtgForslagAnnanInst": "Annan installation",
    "AtgForslagAnnanVarme": "Annan värmeåtgärd",
    "AtgForslagAnnanVent": "Annan ventilationsåtgärd",
    "AtgForslagBehovstyrVent": "Behovsstyrd ventilation",
    "AtgForslagInstSolceller": "Installera solceller",
    "AtgForslagJustVarme": "Justera värmesystem",
    "AtgForslagNyVentil": "Nytt ventilationssystem",
    "AtgForslagEffektivBelys": "Effektivare belysning",
    "AtgForslagIsolTak": "Tilläggsisolera tak",
    "AtgForslagNyGivare": "Nya temperaturgivare",
    "AtgForslagStyrVarme": "Styra värmesystem",
    "AtgForslagTidstyrVent": "Tidsstyrd ventilation",
    "AtgForslagIsolFasad": "Tilläggsisolera fasad",
    "AtgForslagByteFonster": "Byta fönster",
    "AtgForslagIsolVind": "Tilläggsisolera vind",
    "AtgForslagFTXVent": "Installera FTX-ventilation",
};

interface FilterState {
    energyClass: string[];
    ventilationType: string[];
    lender: string[];
    supplier: string[];
    heatingType: string[];
    measure: string[];
    district: string[];
}

export default function CityMap3D({ brfs }: { brfs: BrfOverview[] }) {
    const mapRef = useRef<MapRef>(null);
    const searchParams = useSearchParams();
    const [hoverInfo, setHoverInfo] = useState<{ feature: any, x: number, y: number } | null>(null);
    const [selectedBrf, setSelectedBrf] = useState<BrfOverview | null>(null);

    // Filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilters, setActiveFilters] = useState<FilterState>({
        energyClass: [],
        ventilationType: [],
        lender: [],
        supplier: [],
        heatingType: [],
        measure: [],
        district: [],
    });
    const [showResults, setShowResults] = useState(false);

    // Build filter options from data
    const filterOptions = useMemo(() => {
        const energyClasses = [...new Set(brfs.map(b => b.energy_class).filter(Boolean))].sort() as string[];
        const ventilationTypes = [...new Set(
            brfs.flatMap(b => (b as any).ventilation_type ? [(b as any).ventilation_type] : [])
        )].filter(Boolean).sort() as string[];
        const lenders = [...new Set(
            brfs.flatMap(b => b.loans?.map(l => l.lender).filter(Boolean) || [])
        )].sort();
        // Get all suppliers from top_suppliers
        const suppliers = [...new Set(
            brfs.flatMap(b => b.top_suppliers?.map(s => s.name).filter(Boolean) || [])
        )].sort();
        // Get heating types
        const heatingTypes = [...new Set(
            brfs.map(b => b.heating_type).filter(Boolean)
        )].sort() as string[];
        // Get recommended measures
        const measures = [...new Set(
            brfs.flatMap(b => (b as any).recommended_measures || []).filter(Boolean)
        )].sort() as string[];
        const districts = [...new Set(brfs.map(b => b.district).filter(Boolean))].sort();
        return { energyClasses, ventilationTypes, lenders, suppliers, heatingTypes, measures, districts };
    }, [brfs]);

    // Build search index
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase();
        const results: { value: string; category: keyof FilterState; categoryLabel: string; count: number }[] = [];

        filterOptions.energyClasses.forEach(val => {
            if (val.toLowerCase().includes(query)) {
                results.push({
                    value: val, category: "energyClass", categoryLabel: "Energy Class",
                    count: brfs.filter(b => b.energy_class === val).length
                });
            }
        });
        filterOptions.ventilationTypes.forEach(val => {
            if (val.toLowerCase().includes(query)) {
                results.push({
                    value: val, category: "ventilationType", categoryLabel: "Ventilation",
                    count: brfs.filter(b => (b as any).ventilation_type?.includes(val)).length
                });
            }
        });
        filterOptions.lenders.forEach(val => {
            if (val.toLowerCase().includes(query)) {
                results.push({
                    value: val, category: "lender", categoryLabel: "Bank / Lender",
                    count: brfs.filter(b => b.loans?.some(l => l.lender === val)).length
                });
            }
        });
        // Add suppliers
        filterOptions.suppliers.forEach(val => {
            if (val.toLowerCase().includes(query)) {
                results.push({
                    value: val, category: "supplier", categoryLabel: "Supplier",
                    count: brfs.filter(b => b.top_suppliers?.some(s => s.name === val)).length
                });
            }
        });
        // Add heating types
        filterOptions.heatingTypes.forEach(val => {
            if (val.toLowerCase().includes(query)) {
                results.push({
                    value: val, category: "heatingType", categoryLabel: "Värmekälla",
                    count: brfs.filter(b => b.heating_type === val).length
                });
            }
        });
        // Add recommended measures - search by both technical name and translation
        filterOptions.measures.forEach(val => {
            const translated = MEASURE_TRANSLATIONS[val] || val;
            if (val.toLowerCase().includes(query) || translated.toLowerCase().includes(query)) {
                results.push({
                    value: val, category: "measure", categoryLabel: "Åtgärd",
                    count: brfs.filter(b => (b as any).recommended_measures?.includes(val)).length,
                    // Add displayValue for UI (use translated name)
                    displayValue: translated,
                } as any);
            }
        });
        filterOptions.districts.forEach(val => {
            if (val.toLowerCase().includes(query)) {
                results.push({
                    value: val, category: "district", categoryLabel: "District",
                    count: brfs.filter(b => b.district === val).length
                });
            }
        });
        return results.sort((a, b) => b.count - a.count).slice(0, 10);
    }, [searchQuery, filterOptions, brfs]);

    // Check if a BRF matches current filters
    const matchesBrf = (brf: BrfOverview): boolean => {
        const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0);
        if (!hasActiveFilters) return true;

        if (activeFilters.energyClass.length > 0 && !activeFilters.energyClass.includes(brf.energy_class)) return false;
        if (activeFilters.ventilationType.length > 0) {
            const brfVent = (brf as any).ventilation_type;
            if (!brfVent || !activeFilters.ventilationType.some(v => brfVent.includes(v))) return false;
        }
        if (activeFilters.lender.length > 0) {
            if (!brf.loans?.some(l => activeFilters.lender.includes(l.lender))) return false;
        }
        if (activeFilters.supplier.length > 0) {
            if (!brf.top_suppliers?.some(s => activeFilters.supplier.includes(s.name))) return false;
        }
        if (activeFilters.heatingType.length > 0 && !activeFilters.heatingType.includes(brf.heating_type || '')) return false;
        if (activeFilters.measure.length > 0) {
            const brfMeasures = (brf as any).recommended_measures || [];
            if (!activeFilters.measure.some(m => brfMeasures.includes(m))) return false;
        }
        if (activeFilters.district.length > 0 && !activeFilters.district.includes(brf.district)) return false;
        return true;
    };

    const addFilter = (category: keyof FilterState, value: string) => {
        setActiveFilters(prev => {
            if (prev[category].includes(value)) return prev;
            return { ...prev, [category]: [...prev[category], value] };
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
        setActiveFilters({ energyClass: [], ventilationType: [], lender: [], supplier: [], heatingType: [], measure: [], district: [] });
        setSearchQuery("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && searchResults.length > 0) {
            addFilter(searchResults[0].category, searchResults[0].value);
        }
        if (e.key === "Escape") {
            setSearchQuery("");
            setShowResults(false);
        }
    };

    const activeFilterCount = Object.values(activeFilters).flat().length;

    // Effect to handle URL-based navigation (Search-to-Zoom)
    useEffect(() => {
        const zeldaId = searchParams.get("zelda_id");
        if (zeldaId && mapRef.current) {
            const targetBrf = brfs.find(b => b.zelda_id === zeldaId);
            if (targetBrf && targetBrf.latitude && targetBrf.longitude) {
                setSelectedBrf(targetBrf);
                mapRef.current.flyTo({
                    center: [targetBrf.longitude, targetBrf.latitude],
                    zoom: 17,
                    pitch: 60,
                    essential: true,
                    duration: 2000
                });
            }
        }
    }, [searchParams, brfs]);

    // Auto-fly to matching buildings when filter changes
    useEffect(() => {
        const hasFilters = Object.values(activeFilters).some(arr => arr.length > 0);
        if (!hasFilters || !mapRef.current) return;

        // Find matching BRFs with geometry
        const matchingBrfs = (brfs as any[]).filter(b => b.geometry && matchesBrf(b));
        if (matchingBrfs.length === 0) return;

        // Calculate center of matching buildings
        const validCoords = matchingBrfs.filter(b => b.latitude && b.longitude);
        if (validCoords.length === 0) return;

        const avgLat = validCoords.reduce((sum, b) => sum + Number(b.latitude), 0) / validCoords.length;
        const avgLon = validCoords.reduce((sum, b) => sum + Number(b.longitude), 0) / validCoords.length;

        // Fly to center of filtered results
        mapRef.current.flyTo({
            center: [avgLon, avgLat],
            zoom: matchingBrfs.length === 1 ? 17 : 14,
            pitch: 60,
            essential: true,
            duration: 1500
        });
    }, [activeFilters]); // eslint-disable-line react-hooks/exhaustive-deps

    // Convert BRFs to GeoJSON - computed inline, not memoized
    const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0);
    const geojson = {
        type: "FeatureCollection",
        features: (brfs as any[])
            .filter((b) => b.geometry || (b.latitude && b.longitude))
            .map((b) => {
                const isMatching = matchesBrf(b);
                let geometry = b.geometry;

                // If missing geometry but has lat/lon, create an octagonal placeholder (cylinder-like)
                if (!geometry && b.latitude && b.longitude) {
                    const lat = parseFloat(b.latitude);
                    const lon = parseFloat(b.longitude);
                    // Create octagon (8 points) to approximate a cylinder
                    const radius = 0.0002; // Roughly 20m
                    const points = 8;
                    const coords = [];
                    for (let i = 0; i < points; i++) {
                        const angle = (i * 360) / points;
                        const rad = (angle * Math.PI) / 180;
                        // Adjust longitude for latitude (mercator-ish approximation for small scale)
                        const x = lon + (radius * Math.cos(rad)) / Math.cos(lat * Math.PI / 180);
                        const y = lat + (radius * Math.sin(rad));
                        coords.push([x, y]);
                    }
                    coords.push(coords[0]); // Close polygon

                    geometry = {
                        type: "Polygon",
                        coordinates: [coords]
                    };
                }

                return {
                    type: "Feature",
                    geometry: geometry,
                    properties: {
                        ...b,
                        height: b.height_m ? Number(b.height_m) : 25, // Slightly taller for markers
                        color: (hasActiveFilters && !isMatching)
                            ? GRAYED_OUT_COLOR
                            : (ENERGY_COLORS[b.energy_class] || ENERGY_COLORS.Unknown),
                        isMatching,
                        isPlaceholder: !b.geometry
                    },
                };
            }),
    };

    return (
        <div className="h-[600px] w-full relative rounded-lg overflow-hidden bg-slate-900">
            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: 18.0686,
                    latitude: 59.3293,
                    zoom: 13,
                    pitch: 60,
                    bearing: -20,
                }}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                onClick={(event) => {
                    const feature = event.features?.[0];
                    if (feature && feature.layer.id === 'brf-layer') {
                        const id = feature.properties?.zelda_id;
                        const originalBrf = brfs.find(b => b.zelda_id === id);
                        if (originalBrf) setSelectedBrf(originalBrf);
                    } else {
                        setSelectedBrf(null);
                    }
                }}
                onMouseMove={(event) => {
                    const { features, point } = event;
                    const hoveredFeature = features && features[0];
                    setHoverInfo(hoveredFeature && hoveredFeature.layer.id === 'brf-layer' ? { feature: hoveredFeature, x: point.x, y: point.y } : null);
                }}
                interactiveLayerIds={['brf-layer']}
            >
                <NavigationControl position="top-right" />

                <Source id="brfs-source" type="geojson" data={geojson as any}>
                    <Layer
                        id="brf-layer"
                        type="fill-extrusion"
                        paint={{
                            'fill-extrusion-color': ['get', 'color'],
                            'fill-extrusion-height': ['get', 'height'],
                            'fill-extrusion-base': 0,
                            'fill-extrusion-opacity': hasActiveFilters
                                ? ['case', ['get', 'isMatching'], 0.85, 0.25]
                                : 0.8,
                            'fill-extrusion-vertical-gradient': true,
                        }}
                    />
                </Source>

                {hoverInfo && (
                    <Popup
                        longitude={hoverInfo.feature.properties.longitude || 18.0}
                        latitude={hoverInfo.feature.properties.latitude || 59.3}
                        closeButton={false}
                        className="text-slate-900"
                        offset={20}
                    >
                        <div className="p-2 min-w-[200px]">
                            <h3 className="font-bold text-sm mb-1">{hoverInfo.feature.properties.brf_name}</h3>
                            <div className="flex gap-2 mb-2">
                                <Badge variant="outline" className="border-slate-300 text-slate-700">{hoverInfo.feature.properties.district}</Badge>
                                <Badge className={`${hoverInfo.feature.properties.color === '#ef4444' ? 'bg-red-500' : 'bg-green-500'} text-white`}>
                                    Class {hoverInfo.feature.properties.energy_class}
                                </Badge>
                            </div>
                            {hoverInfo.feature.properties.solidarity_percent && (
                                <div className="text-xs text-slate-400">
                                    Soliditet: <span className="text-slate-200 font-mono">{hoverInfo.feature.properties.solidarity_percent}%</span>
                                </div>
                            )}
                        </div>
                    </Popup>
                )}
            </Map>

            {/* Smart Search Filter Panel */}
            <div className="absolute top-4 left-4 z-40 w-72">
                <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="p-3 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
                        <h1 className="text-lg font-bold bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                            3D City Explorer
                        </h1>
                        <div className="flex flex-col gap-0.5">
                            <p className="text-xs text-slate-400">{geojson.features.length} of {brfs.length} Properties Visible</p>
                            {brfs.length - geojson.features.length > 0 && (
                                <p className="text-[10px] text-amber-500/80">
                                    {brfs.length - geojson.features.length} hidden (missing coordinates)
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Search Input */}
                    <div className="p-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
                                onFocus={() => setShowResults(true)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search: FTX, Handelsbanken, B..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-600 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                            />
                            {searchQuery && (
                                <button onClick={() => { setSearchQuery(""); setShowResults(false); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <X className="w-4 h-4 text-slate-400 hover:text-white" />
                                </button>
                            )}
                        </div>

                        {/* Search Results */}
                        {showResults && searchResults.length > 0 && (
                            <div className="mt-2 bg-slate-800 border border-slate-600 rounded-lg overflow-hidden">
                                {searchResults.map((result, i) => (
                                    <button
                                        key={`${result.category}-${result.value}`}
                                        onClick={() => addFilter(result.category, result.value)}
                                        className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-slate-700 text-left ${i === 0 ? 'bg-slate-700/50' : ''}`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-slate-100 truncate">{(result as any).displayValue || result.value}</div>
                                            <div className="text-xs text-slate-400">{result.categoryLabel}</div>
                                        </div>
                                        <Badge className="bg-slate-600 text-slate-300 text-xs">{result.count}</Badge>
                                    </button>
                                ))}
                                <div className="px-3 py-1.5 text-xs text-slate-500 bg-slate-800/50 border-t border-slate-700">
                                    Press Enter to select first result
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Active Filters */}
                    {activeFilterCount > 0 && (
                        <div className="p-3 bg-slate-800/30 border-t border-slate-700/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-400">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>
                                <button onClick={clearAllFilters} className="text-xs text-sky-400 hover:text-sky-300">Clear all</button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {Object.entries(activeFilters).map(([category, values]) =>
                                    values.map((value: string) => {
                                        // Translate measure values for display
                                        const displayVal = category === 'measure' ? (MEASURE_TRANSLATIONS[value] || value) : value;
                                        return (
                                            <button
                                                key={`${category}-${value}`}
                                                onClick={() => removeFilter(category as keyof FilterState, value)}
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all group ${category === 'energyClass'
                                                    ? `${ENERGY_BG_COLORS[value] || 'bg-slate-600'} text-white`
                                                    : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                                    }`}
                                            >
                                                <span>{displayVal}</span>
                                                <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {/* Quick Filters */}
                    {activeFilterCount === 0 && !searchQuery && (
                        <div className="p-3 border-t border-slate-700/50">
                            <div className="text-xs text-slate-500 mb-2">Quick filters:</div>
                            <div className="flex flex-wrap gap-1">
                                {filterOptions.energyClasses.map(ec => (
                                    <button
                                        key={ec}
                                        onClick={() => addFilter('energyClass', ec)}
                                        className={`w-7 h-7 rounded-md text-xs font-bold text-white ${ENERGY_BG_COLORS[ec] || 'bg-slate-600'} hover:ring-2 hover:ring-white/30 transition-all`}
                                    >
                                        {ec}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <DrillDownPanel brf={selectedBrf} onClose={() => setSelectedBrf(null)} />
        </div>
    );
}
