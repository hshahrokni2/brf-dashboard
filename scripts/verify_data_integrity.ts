
import { getBrfOverviewList, searchBrfs } from './src/lib/data';
import { getLeaderboard } from './src/lib/analytics';

async function verify() {
    console.log("--- Verifying Search vs Overview Data ---");
    const searchResults = await searchBrfs("Fredriksdals Kanal");
    console.log(`Search Found: ${searchResults.length} results`);
    if (searchResults.length > 0) {
        console.log("First Result:", searchResults[0]);
    }

    const allBrfs = await getBrfOverviewList();
    console.log(`Total Brfs in Overview: ${allBrfs.length}`);

    if (searchResults.length > 0) {
        const target = allBrfs.find(b => b.zelda_id === searchResults[0].zelda_id);
        console.log("Found in Overview List:", !!target);
        if (target) {
            console.log("Coordinates:", target.latitude, target.longitude);
            console.log("Geometry exists:", !!target.geometry);
        } else {
            console.log("BRF MISSING from Overview List!");
        }
    }

    console.log("\n--- Verifying Analytics Data ---");
    const topSoliditet = await getLeaderboard('solidarity_percent', 'DESC', 5);
    console.log(`Top Soliditet Count: ${topSoliditet.length}`);
    if (topSoliditet.length > 0) console.log(topSoliditet[0]);

    process.exit(0);
}

verify();
