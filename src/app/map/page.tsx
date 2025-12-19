
import CityMap3D from "@/components/map/CityMap3D";
import { getBrfOverviewList } from "@/lib/data";
import { MapBackButton } from "@/components/map-back-button";

export const dynamic = "force-dynamic";

export default async function MapPage() {
    const brfs = await getBrfOverviewList();
    return (
        <div className="h-screen w-full relative">
            <MapBackButton />
            <CityMap3D brfs={brfs} />
        </div>
    );
}
