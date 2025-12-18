
import CityMap3D from "@/components/map/CityMap3D";
import { getBrfOverviewList } from "@/lib/data";
import { MapBackButton } from "@/components/map-back-button";

export default async function MapPage() {
    const brfs = await getBrfOverviewList();
    return (
        <div className="h-screen w-full relative">
            <MapBackButton />
            <div className="absolute top-4 left-4 z-50 bg-slate-900/80 p-4 rounded-xl border border-slate-700 backdrop-blur">
                <h1 className="text-xl font-bold bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">3D City Explorer</h1>
                <p className="text-xs text-slate-400">{brfs.length} Properties in Hammarby Sjöstad</p>
            </div>
            <CityMap3D brfs={brfs} />
        </div>
    );
}
