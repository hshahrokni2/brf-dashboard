"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Map, { NavigationControl, Popup, Source, Layer, MapRef } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { BrfOverview } from "@/types";
import { Badge } from "../ui/badge";
import { DrillDownPanel } from "@/components/drill-down-panel";
import { MapFilterPanel } from "./MapFilterPanel";

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

const GRAYED_OUT_COLOR = "#1e293b"; // Slate 800 - very dark

export default function CityMap3D({ brfs }: { brfs: BrfOverview[] }) {
    const mapRef = useRef<MapRef>(null);
    const searchParams = useSearchParams();
    const [hoverInfo, setHoverInfo] = useState<{ feature: any, x: number, y: number } | null>(null);
    const [selectedBrf, setSelectedBrf] = useState<BrfOverview | null>(null);
    const [matchingIds, setMatchingIds] = useState<Set<string>>(new Set(brfs.map(b => b.zelda_id)));

    // Calculate filter options from BRF data
    const filterOptions = useMemo(() => {
        const energyClasses = [...new Set(brfs.map(b => b.energy_class).filter(Boolean))].sort() as string[];

        // Get ventilation types from buildings_detail or direct property
        const ventilationTypes = [...new Set(
            brfs.flatMap(b => {
                const fromDetail = b.buildings_detail?.map(bd => bd.ventilation_type).filter(Boolean) || [];
                const direct = (b as any).ventilation_type ? [(b as any).ventilation_type] : [];
                return [...fromDetail, ...direct];
            })
        )].filter(Boolean).sort() as string[];

        // Get unique lenders from loans
        const lenders = [...new Set(
            brfs.flatMap(b => b.loans?.map(l => l.lender).filter(Boolean) || [])
        )].sort();

        // Get unique suppliers
        const suppliers = [...new Set(
            brfs.flatMap(b => b.top_suppliers?.map(s => s.name).filter(Boolean) || [])
        )].sort();

        // Get districts
        const districts = [...new Set(brfs.map(b => b.district).filter(Boolean))].sort();

        return { energyClasses, ventilationTypes, lenders, suppliers, districts };
    }, [brfs]);

    const handleFilterChange = useCallback((ids: Set<string>) => {
        setMatchingIds(ids);
    }, []);

    // Effect to handle URL-based navigation (Search-to-Zoom)
    useEffect(() => {
        const zeldaId = searchParams.get("zelda_id");
        if (zeldaId && mapRef.current) {
            const targetBrf = brfs.find(b => b.zelda_id === zeldaId);
            if (targetBrf && targetBrf.latitude && targetBrf.longitude) {
                // Select it (opens panel)
                setSelectedBrf(targetBrf);

                // Fly to it
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

    // Convert BRFs to valid GeoJSON FeatureCollection with filter applied
    const geojson = useMemo(() => ({
        type: "FeatureCollection",
        features: (brfs as any[])
            .filter((b) => b.geometry) // Only used BRFs with geometry
            .map((b) => {
                const isMatching = matchingIds.has(b.zelda_id);
                return {
                    type: "Feature",
                    geometry: b.geometry, // Use the real Polygon/MultiPolygon from DB
                    properties: {
                        ...b,
                        // Use height from DB if available, parsed as float
                        height: b.height_m ? Number(b.height_m) : 20,
                        // Gray out non-matching buildings, keep energy color for matching
                        color: isMatching
                            ? (ENERGY_COLORS[b.energy_class] || ENERGY_COLORS.Unknown)
                            : GRAYED_OUT_COLOR,
                        isMatching,
                    },
                };
            }),
    }), [brfs, matchingIds]);

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
                        // FIX: Lookup the full BRF object from props using zelda_id
                        // preventing MapLibre serialization issues with complex JSON fields
                        const id = feature.properties?.zelda_id;
                        const originalBrf = brfs.find(b => b.zelda_id === id);

                        if (originalBrf) {
                            setSelectedBrf(originalBrf);
                        }
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
                            // Dim non-matching buildings
                            'fill-extrusion-opacity': [
                                'case',
                                ['get', 'isMatching'],
                                0.85,  // Matching buildings are prominent
                                0.25   // Non-matching are dimmed
                            ],
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

            {/* Filter Panel */}
            <MapFilterPanel
                brfs={brfs}
                onFilterChange={handleFilterChange}
                filterOptions={filterOptions}
            />

            <DrillDownPanel brf={selectedBrf} onClose={() => setSelectedBrf(null)} />
        </div>
    );
}
