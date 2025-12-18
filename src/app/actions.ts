"use server";

import { searchBrfs as dbSearch } from "@/lib/data";

export async function searchAction(term: string) {
    return await dbSearch(term);
}
