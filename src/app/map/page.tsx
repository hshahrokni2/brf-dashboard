
import CityMap3D from "@/components/map/CityMap3D";
import { getBrfOverviewList } from "@/lib/data";
import { MapBackButton } from "@/components/map-back-button";

export const dynamic = "force-dynamic";

export default async function MapPage() {
    const brfs = await getBrfOverviewList();
    return (
        <div className="h-screen w-full relative overflow-hidden">
            <MapBackButton />
            {/* Map container with explicit height */}
            <div className="h-full w-full [&>div]:!h-full">
                <CityMap3D brfs={brfs} />
            </div>
        </div>
    );
}
