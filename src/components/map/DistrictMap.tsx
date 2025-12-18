"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { BrfOverview } from "@/types";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

// Stockholm Centroid (approx)
const CENTER: [number, number] = [59.3293, 18.0686];
const ZOOM = 12;

// Energy Class Colors
const ENERGY_COLORS: Record<string, string> = {
    A: "#16a34a", // green-600
    B: "#22c55e", // green-500
    C: "#84cc16", // lime-500
    D: "#eab308", // yellow-500
    E: "#f97316", // orange-500
    F: "#ef4444", // red-500
    G: "#dc2626", // red-600
    Unknown: "#94a3b8", // slate-400
};

export default function DistrictMap({ brfs }: { brfs: BrfOverview[] }) {
    // Filter out BRFs without coordinates
    const validBrfs = brfs.filter((b) => b.latitude && b.longitude);

    return (
        <Card className="h-[500px] w-full overflow-hidden border-slate-200">
            <MapContainer center={CENTER} zoom={ZOOM} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {validBrfs.map((brf) => (
                    <CircleMarker
                        key={brf.zelda_id}
                        center={[brf.latitude!, brf.longitude!]}
                        radius={8}
                        fillOpacity={0.8}
                        pathOptions={{
                            color: "#fff",
                            weight: 1,
                            fillColor: ENERGY_COLORS[brf.energy_class] || ENERGY_COLORS.Unknown,
                        }}
                    >
                        <Popup>
                            <div className="space-y-2 min-w-[200px]">
                                <h3 className="font-bold text-sm">{brf.brf_name}</h3>
                                <div className="text-xs text-slate-500">{brf.address}</div>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="text-xs">
                                        Class {brf.energy_class || "?"}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                        {brf.built_year}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-xs mt-2">
                                    <div className="text-slate-500">Soliditet:</div>
                                    <div className="font-medium text-right">{brf.solidarity_percent ? `${brf.solidarity_percent}%` : "-"}</div>
                                    <div className="text-slate-500">Debt/m²:</div>
                                    <div className="font-medium text-right">{brf.debt_per_sqm_total ? `${Math.round(brf.debt_per_sqm_total).toLocaleString()} kr` : "-"}</div>
                                </div>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>
        </Card>
    );
}
